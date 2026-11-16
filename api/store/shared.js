// Brimful "Save Together": shared savings jars for up to 6 people, end-to-end encrypted.
// The server only ever sees ciphertext (jar name, target, member names, amounts, notes are encrypted in the browser
// with a key kept in the invite link's #fragment). It enforces the rules that don't need the contents:
//   * creating a jar needs an active Brimful Plus licence
//   * at most 6 active members per jar
//   * members without Plus can add up to 15 deposits per jar (they can always view and remove their own)
//   * only the member who added a deposit can remove it; only the owner can remove others or delete the jar
// Members prove who they are with a random device secret (we store only its SHA-256).
//
// Routes (rewritten from /api/store/:product/shared/...):
//   POST   /shared                         create a jar          {licence_key, meta, profile, token}
//   GET    /shared/:id?since=ISO           live sync            headers X-Member, X-Token
//   PATCH  /shared/:id                     owner edits meta / member edits own profile   {meta?|profile?}
//   DELETE /shared/:id                     owner deletes the jar
//   POST   /shared/:id/join                join from an invite  {profile, token, licence_key?}
//   POST   /shared/:id/entries             add a deposit        {data, licence_key?}
//   DELETE /shared/:id/entries/:entryId    remove own deposit
//   DELETE /shared/:id/members/:memberId   leave (self) or remove a member (owner)
import { createHash } from "node:crypto";
import { db } from "../_lib/db.js";
import { body, cors, handler, ipOf, rateLimit, send, UUID } from "../_lib/http.js";

export const LIMITS = { members: 6, freeDeposits: 15, entriesPerJar: 5000 };
const CIPHER = /^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/;
const isCipher = (v, max) => typeof v === "string" && v.length >= 16 && v.length <= max && CIPHER.test(v);
const isToken = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(v);
const sha = (v) => createHash("sha256").update(v).digest("hex");
const now = () => new Date().toISOString();

async function plusActive(key) {
  if (typeof key !== "string" || !UUID.test(key)) return false;
  const r = await db(`store_orders?select=status&id=eq.${key}&product=eq.brimful`);
  return r.ok && r.data?.[0]?.status === "approved";
}

async function jarOf(id) {
  const r = await db(`shared_jars?select=id,meta,updated_at&id=eq.${id}`);
  return r.ok ? r.data?.[0] ?? null : undefined;
}
async function activeMembers(jarId) {
  const r = await db(`shared_members?select=id,profile,is_owner,joined_at,removed_at&jar_id=eq.${jarId}&order=joined_at.asc`);
  return r.ok ? r.data : null;
}
/** The calling member, checked against their device secret. */
async function auth(req, jarId) {
  const id = String(req.headers["x-member"] || ""), token = String(req.headers["x-token"] || "");
  if (!UUID.test(id) || !isToken(token)) return null;
  const r = await db(`shared_members?select=id,is_owner,removed_at,token_hash&id=eq.${id}&jar_id=eq.${jarId}`);
  const m = r.ok ? r.data?.[0] : null;
  if (!m || m.removed_at || m.token_hash !== sha(token)) return null;
  return m;
}
const touch = (jarId) => db(`shared_jars?id=eq.${jarId}`, { method: "PATCH", body: { updated_at: now() }, prefer: "return=minimal" });

export default handler(["GET", "POST", "PATCH", "DELETE"], async (req, res) => {
  const allowed = cors(req, res, "GET, POST, PATCH, DELETE", "Content-Type, X-Member, X-Token");
  if (req.method === "OPTIONS") return send(res, 204);
  if (!allowed) return send(res, 403, { error: "Not allowed" });
  if (req.query.product !== "brimful") return send(res, 404, { error: "Unknown product" });
  const ip = ipOf(req);
  if (!rateLimit(`shared:${ip}`, 900, 3600_000)) return send(res, 429, { error: "Too many requests. Slow down a little." });
  const id = String(req.query.id || ""), sub = String(req.query.sub || ""), subId = String(req.query.subid || "");

  /* ---------- create ---------- */
  if (!id) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    if (!rateLimit(`sharednew:${ip}`, 10, 3600_000)) return send(res, 429, { error: "Too many new jars. Try again later." });
    const b = await body(req);
    if (!b || !isCipher(b.meta, 4000) || !isCipher(b.profile, 1000) || !isToken(b.token)) return send(res, 400, { error: "Invalid request." });
    if (!(await plusActive(b.licence_key))) return send(res, 402, { error: "Creating a shared jar is part of Brimful Plus.", code: "plus_required" });
    const j = await db("shared_jars", { method: "POST", body: { meta: b.meta }, prefer: "return=representation" });
    const jar = j.ok ? j.data?.[0] : null;
    if (!jar) return send(res, 500, { error: "Couldn't create the jar. Try again." });
    const m = await db("shared_members", { method: "POST", body: { jar_id: jar.id, token_hash: sha(b.token), profile: b.profile, is_owner: true }, prefer: "return=representation" });
    if (!m.ok || !m.data?.[0]) { await db(`shared_jars?id=eq.${jar.id}`, { method: "DELETE", prefer: "return=minimal" }); return send(res, 500, { error: "Couldn't create the jar. Try again." }); }
    return send(res, 201, { jar_id: jar.id, member_id: m.data[0].id });
  }
  if (!UUID.test(id)) return send(res, 404, { error: "This shared jar doesn't exist." });
  const jar = await jarOf(id);
  if (jar === undefined) return send(res, 503, { error: "Can't reach shared jars right now." });
  if (!jar) return send(res, 404, { error: "This shared jar doesn't exist any more.", code: "gone" });

  /* ---------- join ---------- */
  if (sub === "join") {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    if (!rateLimit(`sharedjoin:${ip}`, 20, 3600_000)) return send(res, 429, { error: "Too many tries. Wait a bit." });
    const b = await body(req);
    if (!b || !isCipher(b.profile, 1000) || !isToken(b.token)) return send(res, 400, { error: "Invalid request." });
    const members = await activeMembers(id);
    if (!members) return send(res, 503, { error: "Can't reach shared jars right now." });
    if (members.filter((m) => !m.removed_at).length >= LIMITS.members) return send(res, 409, { error: `This jar already has ${LIMITS.members} people, the most it can hold.`, code: "full" });
    const m = await db("shared_members", { method: "POST", body: { jar_id: id, token_hash: sha(b.token), profile: b.profile }, prefer: "return=representation" });
    if (!m.ok || !m.data?.[0]) return send(res, 500, { error: "Couldn't join. Try again." });
    await touch(id);
    return send(res, 201, { member_id: m.data[0].id });
  }

  /* ---------- invite preview (still only ciphertext; the link's key decrypts it in the browser) ---------- */
  if (sub === "preview" && req.method === "GET") {
    const members = await activeMembers(id);
    if (!members) return send(res, 503, { error: "Can't reach shared jars right now." });
    const active = members.filter((m) => !m.removed_at);
    return send(res, 200, { jar: { id, meta: jar.meta }, members: active.length, max: LIMITS.members, owner_profile: active.find((m) => m.is_owner)?.profile ?? null });
  }

  const me = await auth(req, id);
  if (!me) return send(res, 401, { error: "You're not a member of this jar (or you were removed).", code: "not_member" });

  /* ---------- live sync ---------- */
  if (req.method === "GET" && !sub) {
    const since = typeof req.query.since === "string" && !Number.isNaN(Date.parse(req.query.since)) ? new Date(req.query.since).toISOString() : null;
    const cursor = now();
    const [members, entries, mine] = await Promise.all([
      activeMembers(id),
      db(`shared_entries?select=id,member_id,data,created_at,deleted_at,changed_at&jar_id=eq.${id}${since ? `&changed_at=gt.${encodeURIComponent(since)}` : "&deleted_at=is.null"}&order=created_at.asc&limit=5000`),
      db(`shared_entries?select=id&member_id=eq.${me.id}&limit=1`, { count: true }),
    ]);
    if (!members || !entries.ok) return send(res, 503, { error: "Can't reach shared jars right now." });
    return send(res, 200, {
      jar: { id, meta: jar.meta },
      me: { id: me.id, owner: me.is_owner, deposits_used: mine.count ?? 0, free_limit: LIMITS.freeDeposits },
      members: members.map((m) => ({ id: m.id, profile: m.profile, owner: m.is_owner, removed: Boolean(m.removed_at) })),
      entries: entries.data.map((e) => ({ id: e.id, member_id: e.member_id, data: e.deleted_at ? null : e.data, created_at: e.created_at, deleted: Boolean(e.deleted_at) })),
      cursor, full: !since,
    });
  }

  /* ---------- edit jar / own profile ---------- */
  if (req.method === "PATCH" && !sub) {
    const b = await body(req);
    if (b?.meta !== undefined) {
      if (!me.is_owner) return send(res, 403, { error: "Only the person who made this jar can edit it." });
      if (!isCipher(b.meta, 4000)) return send(res, 400, { error: "Invalid request." });
      await db(`shared_jars?id=eq.${id}`, { method: "PATCH", body: { meta: b.meta, updated_at: now() }, prefer: "return=minimal" });
    }
    if (b?.profile !== undefined) {
      if (!isCipher(b.profile, 1000)) return send(res, 400, { error: "Invalid request." });
      await db(`shared_members?id=eq.${me.id}`, { method: "PATCH", body: { profile: b.profile }, prefer: "return=minimal" });
      await touch(id);
    }
    return send(res, 200, { ok: true });
  }

  /* ---------- delete jar ---------- */
  if (req.method === "DELETE" && !sub) {
    if (!me.is_owner) return send(res, 403, { error: "Only the person who made this jar can delete it." });
    const r = await db(`shared_jars?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
    return r.ok ? send(res, 200, { ok: true }) : send(res, 503, { error: "Couldn't delete right now." });
  }

  /* ---------- deposits ---------- */
  if (sub === "entries" && req.method === "POST" && !subId) {
    if (!rateLimit(`sharedadd:${me.id}`, 120, 3600_000)) return send(res, 429, { error: "That's a lot of deposits at once. Wait a little." });
    const b = await body(req);
    if (!b || !isCipher(b.data, 2000)) return send(res, 400, { error: "Invalid request." });
    const [mine, all] = await Promise.all([db(`shared_entries?select=id&member_id=eq.${me.id}&limit=1`, { count: true }), db(`shared_entries?select=id&jar_id=eq.${id}&limit=1`, { count: true })]);
    if ((all.count ?? 0) >= LIMITS.entriesPerJar) return send(res, 409, { error: "This jar has reached its deposit limit." });
    if ((mine.count ?? 0) >= LIMITS.freeDeposits && !me.is_owner && !(await plusActive(b.licence_key)))
      return send(res, 402, { error: `You've used your ${LIMITS.freeDeposits} free deposits in shared jars. Get Brimful Plus to keep adding.`, code: "plus_required" });
    const r = await db("shared_entries", { method: "POST", body: { jar_id: id, member_id: me.id, data: b.data }, prefer: "return=representation" });
    if (!r.ok || !r.data?.[0]) return send(res, 500, { error: "Couldn't save that deposit. Try again." });
    await touch(id);
    const e = r.data[0];
    return send(res, 201, { entry: { id: e.id, member_id: e.member_id, data: e.data, created_at: e.created_at, deleted: false } });
  }
  if (sub === "entries" && req.method === "DELETE" && UUID.test(subId)) {
    const r = await db(`shared_entries?id=eq.${subId}&jar_id=eq.${id}&member_id=eq.${me.id}&deleted_at=is.null`, { method: "PATCH", body: { deleted_at: now(), changed_at: now(), data: "v1.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAA==" }, prefer: "return=representation" });
    if (!r.ok) return send(res, 503, { error: "Couldn't remove it right now." });
    if (!r.data?.length) return send(res, 403, { error: "You can only remove deposits you added." });
    await touch(id);
    return send(res, 200, { ok: true });
  }

  /* ---------- members ---------- */
  if (sub === "members" && req.method === "DELETE" && UUID.test(subId)) {
    if (subId !== me.id && !me.is_owner) return send(res, 403, { error: "Only the person who made this jar can remove others." });
    if (subId === me.id && me.is_owner) return send(res, 409, { error: "You made this jar. Delete it instead, or keep it." });
    const r = await db(`shared_members?id=eq.${subId}&jar_id=eq.${id}&removed_at=is.null`, { method: "PATCH", body: { removed_at: now(), token_hash: "0".repeat(64) }, prefer: "return=representation" });
    if (!r.ok || !r.data?.length) return send(res, 404, { error: "Member not found." });
    await touch(id);
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: "Not found" });
});
