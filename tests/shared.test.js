// Save Together API rules, with Supabase faked.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, test } from "node:test";

process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";

let calls = [], routes = [];
const on = (method, re, reply) => routes.push({ method, re, reply });
globalThis.fetch = async (url, init = {}) => {
  const method = init.method || "GET";
  calls.push({ method, url: String(url), body: init.body ? JSON.parse(init.body) : undefined });
  const r = routes.find((x) => x.method === method && x.re.test(String(url)));
  if (!r) throw new Error(`unexpected fetch ${method} ${url}`);
  const out = typeof r.reply === "function" ? r.reply(String(url), init) : r.reply;
  const { status = 200, json = null, headers = {} } = out;
  return new Response(json == null || status === 204 ? null : JSON.stringify(json), { status, headers: { "content-type": "application/json", ...headers } });
};
beforeEach(() => { calls = []; routes = []; });

const BRIM = { origin: "https://brimful.vercel.app" };
const JAR = "11111111-1111-4111-8111-111111111111", ME = "22222222-2222-4222-8222-222222222222", OTHER = "33333333-3333-4333-8333-333333333333";
const KEY = "3f0c2b1a-9d8e-4c7b-a6f5-0123456789ab", TOKEN = "t".repeat(43), C = "v1.AAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBB";
const sha = (v) => createHash("sha256").update(v).digest("hex");
function req({ method = "GET", query = {}, body, headers = {} } = {}) {
  return { method, query: { product: "brimful", ...query }, body, url: "/api/x", headers: { host: "scalify-wpd.vercel.app", "x-forwarded-for": `10.1.0.${Math.floor(Math.random() * 250)}`, ...BRIM, ...headers } };
}
function res() { const h = {}; return { statusCode: 200, headers: h, setHeader(k, v) { h[k.toLowerCase()] = v; }, end(b) { this.json = b ? JSON.parse(b) : null; } }; }
const run = async (r) => { const out = res(); await (await import("../api/store/shared.js")).default(r, out); return out; };
const asMe = { "x-member": ME, "x-token": TOKEN };
const jarExists = () => on("GET", /shared_jars\?select=id,meta/, { json: [{ id: JAR, meta: C, updated_at: "2026-11-16" }] });
const meIs = (owner = false) => on("GET", /shared_members\?select=id,is_owner,removed_at,token_hash/, { json: [{ id: ME, is_owner: owner, removed_at: null, token_hash: sha(TOKEN) }] });

test("creating a shared jar needs an active Plus licence", async () => {
  on("GET", /store_orders\?select=status/, { json: [{ status: "pending" }] });
  let out = await run(req({ method: "POST", body: { licence_key: KEY, meta: C, profile: C, token: TOKEN } }));
  assert.equal(out.statusCode, 402);
  assert.equal(out.json.code, "plus_required");
  assert.ok(!calls.some((c) => c.method === "POST"), "nothing created");
  routes = [];
  on("GET", /store_orders\?select=status/, { json: [{ status: "approved" }] });
  on("POST", /rest\/v1\/shared_jars$/, { status: 201, json: [{ id: JAR }] });
  on("POST", /rest\/v1\/shared_members$/, (u, i) => ({ status: 201, json: [{ id: ME, ...JSON.parse(i.body) }] }));
  out = await run(req({ method: "POST", body: { licence_key: KEY, meta: C, profile: C, token: TOKEN } }));
  assert.equal(out.statusCode, 201);
  const m = calls.find((c) => c.url.endsWith("shared_members")).body;
  assert.equal(m.is_owner, true);
  assert.equal(m.token_hash, sha(TOKEN), "only a hash of the device secret is stored");
  assert.ok(!JSON.stringify(calls).includes(TOKEN), "the raw secret never goes to the database");
});

test("plain text is refused: the server only accepts ciphertext", async () => {
  const out = await run(req({ method: "POST", body: { licence_key: KEY, meta: JSON.stringify({ name: "Car" }), profile: C, token: TOKEN } }));
  assert.equal(out.statusCode, 400);
});

test("a jar holds at most 6 people", async () => {
  jarExists();
  on("GET", /shared_members\?select=id,profile,is_owner,joined_at,removed_at/, { json: Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, removed_at: null })) });
  const out = await run(req({ method: "POST", query: { id: JAR, sub: "join" }, body: { profile: C, token: TOKEN } }));
  assert.equal(out.statusCode, 409);
  assert.equal(out.json.code, "full");
});

test("a removed slot frees a place", async () => {
  jarExists();
  on("GET", /shared_members\?select=id,profile,is_owner,joined_at,removed_at/, { json: Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, removed_at: i === 0 ? "2026-11-10" : null })) });
  on("POST", /rest\/v1\/shared_members$/, { status: 201, json: [{ id: OTHER }] });
  on("PATCH", /shared_jars\?id=eq\./, { status: 204 });
  const out = await run(req({ method: "POST", query: { id: JAR, sub: "join" }, body: { profile: C, token: TOKEN } }));
  assert.equal(out.statusCode, 201);
});

test("wrong device secret = not a member", async () => {
  jarExists();
  on("GET", /shared_members\?select=id,is_owner,removed_at,token_hash/, { json: [{ id: ME, is_owner: false, removed_at: null, token_hash: sha("someone-else".padEnd(40, "x")) }] });
  const out = await run(req({ query: { id: JAR }, headers: asMe }));
  assert.equal(out.statusCode, 401);
});

test("free members get 15 deposits, then need Plus; Plus licence lets them continue", async () => {
  jarExists(); meIs(false);
  on("GET", /shared_entries\?select=id&member_id=eq\./, { json: [], headers: { "content-range": "0-0/15" } });
  on("GET", /shared_entries\?select=id&jar_id=eq\./, { json: [], headers: { "content-range": "0-0/40" } });
  on("GET", /store_orders\?select=status/, { json: [] });
  let out = await run(req({ method: "POST", query: { id: JAR, sub: "entries" }, headers: asMe, body: { data: C } }));
  assert.equal(out.statusCode, 402);
  routes = routes.filter((r) => !/store_orders/.test(String(r.re)));
  on("GET", /store_orders\?select=status/, { json: [{ status: "approved" }] });
  on("POST", /rest\/v1\/shared_entries$/, { status: 201, json: [{ id: OTHER, member_id: ME, data: C, created_at: "2026-11-16" }] });
  on("PATCH", /shared_jars\?id=eq\./, { status: 204 });
  out = await run(req({ method: "POST", query: { id: JAR, sub: "entries" }, headers: asMe, body: { data: C, licence_key: KEY } }));
  assert.equal(out.statusCode, 201);
});

test("you can only remove your own deposits", async () => {
  jarExists(); meIs(true);
  on("PATCH", /shared_entries\?id=eq\..*member_id=eq\./, { json: [] });
  const out = await run(req({ method: "DELETE", query: { id: JAR, sub: "entries", subid: OTHER }, headers: asMe }));
  assert.equal(out.statusCode, 403, "even the owner can't remove someone else's deposit");
  assert.match(calls.find((c) => c.method === "PATCH").url, new RegExp(`member_id=eq\\.${ME}`));
});

test("only the owner can delete the jar or remove others; members can leave", async () => {
  jarExists(); meIs(false);
  let out = await run(req({ method: "DELETE", query: { id: JAR }, headers: asMe }));
  assert.equal(out.statusCode, 403);
  out = await run(req({ method: "DELETE", query: { id: JAR, sub: "members", subid: OTHER }, headers: asMe }));
  assert.equal(out.statusCode, 403);
  on("PATCH", /shared_members\?id=eq\./, { json: [{ id: ME }] });
  on("PATCH", /shared_jars\?id=eq\./, { status: 204 });
  out = await run(req({ method: "DELETE", query: { id: JAR, sub: "members", subid: ME }, headers: asMe }));
  assert.equal(out.statusCode, 200, "leaving is always allowed");
});

test("live sync returns only ciphertext and changes since the cursor", async () => {
  jarExists(); meIs(false);
  on("GET", /shared_members\?select=id,profile/, { json: [{ id: ME, profile: C, is_owner: false, removed_at: null }] });
  on("GET", /shared_entries\?select=id,member_id,data/, { json: [{ id: OTHER, member_id: ME, data: C, created_at: "x", deleted_at: null }] });
  on("GET", /shared_entries\?select=id&member_id=eq\./, { json: [], headers: { "content-range": "0-0/3" } });
  const out = await run(req({ query: { id: JAR, since: "2026-11-16T10:00:00.000Z" }, headers: asMe }));
  assert.equal(out.statusCode, 200);
  assert.equal(out.json.me.deposits_used, 3);
  assert.equal(out.json.entries[0].data, C);
  assert.match(calls.find((c) => /shared_entries\?select=id,member_id/.test(c.url)).url, /changed_at=gt\./);
});

test("any member can change their own name (profile), and only their own", async () => {
  jarExists(); meIs(false);
  on("PATCH", /shared_members\?id=eq\./, { status: 204 });
  on("PATCH", /shared_jars\?id=eq\./, { status: 204 });
  let out = await run(req({ method: "PATCH", query: { id: JAR }, body: { profile: C }, headers: asMe }));
  assert.equal(out.statusCode, 200);
  const p = calls.find((c) => c.method === "PATCH" && /shared_members/.test(c.url));
  assert.match(p.url, new RegExp(`id=eq\\.${ME}$`), "updates the caller's own row");
  assert.deepEqual(p.body, { profile: C });
  out = await run(req({ method: "PATCH", query: { id: JAR }, body: { profile: "not cipher" }, headers: asMe }));
  assert.equal(out.statusCode, 400);
});

test("Brimful's own addresses may call the API from a browser; others may not", async () => {
  jarExists(); meIs(false);
  for (const origin of ["https://www.brimful.tech", "https://brimful.tech", "https://brimful.vercel.app"]) {
    const out = await run(req({ method: "OPTIONS", query: { id: JAR }, headers: { origin } }));
    assert.equal(out.headers["access-control-allow-origin"], origin, origin);
  }
  const out = await run(req({ method: "OPTIONS", query: { id: JAR }, headers: { origin: "https://evil.example" } }));
  assert.equal(out.headers["access-control-allow-origin"], undefined);
});
