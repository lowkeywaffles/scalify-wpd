// Everything Brimful knows lives in this one object, saved in the browser's localStorage on this device.
// Nothing here is sent to a server. See DATA_INVENTORY.md.
import { isCurrency, MAX_MINOR } from "./money.js";
import { challengeAmounts } from "./challenges.js";

export const STORAGE_KEY = "brimful:v1";
export const FREE_LIMITS = { jars: 2, challenges: 1 };
export const JAR_STYLES = ["brass", "silver", "rose", "jade", "ink", "sunset"];
export const FREE_STYLES = ["brass"];

const uid = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const now = () => Date.now();

export function emptyState() {
  return {
    v: 1,
    settings: { currency: "USD", theme: "system", motion: "auto", sound: true, onboarded: false, lang: "auto", cloud: null }, // cloud: { code, at } when encrypted backup is on
    jars: [],
    challenges: [],
    split: [], // [{ jarId, pct }]
    license: null, // { key, status: "pending"|"active"|"rejected"|"refunded", note, checkedAt, method? }
  };
}

/** Recovery code for the encrypted cloud backup: 4 groups of 5 base32 characters (100 random bits). */
export const CLOUD_CODE = /^[A-Z2-7]{5}(-[A-Z2-7]{5}){3}$/;

/* ---------- validation (used for saved data and for imported backups) ---------- */
const isStr = (v, max) => typeof v === "string" && v.length <= max;
const isInt = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;

function cleanJar(j) {
  if (!j || !isStr(j.id, 64) || !isStr(j.name, 60) || !j.name.trim() || !isInt(j.target, 1, MAX_MINOR)) return null;
  const entries = Array.isArray(j.entries) ? j.entries.filter((e) => e && isStr(e.id, 64) && isInt(e.t, 0, 4e12) && isInt(e.amt, -MAX_MINOR, MAX_MINOR) && e.amt !== 0).slice(0, 5000)
    .map((e) => ({ id: e.id, t: e.t, amt: e.amt, note: isStr(e.note, 80) ? e.note : "" })) : [];
  return {
    id: j.id, name: j.name.trim(), target: j.target, style: JAR_STYLES.includes(j.style) ? j.style : "brass",
    created: isInt(j.created, 0, 4e12) ? j.created : now(), deadline: isStr(j.deadline, 10) && /^\d{4}-\d{2}-\d{2}$/.test(j.deadline) ? j.deadline : "", entries,
  };
}

function cleanChallenge(c, jarIds) {
  if (!c || !isStr(c.id, 64) || !jarIds.has(c.jarId) || !c.config) return null;
  const k = c.config;
  let config = null;
  if (c.type === "envelopes" && isInt(k.count, 5, 200) && isInt(k.target, k.count, MAX_MINOR) && isInt(k.seed, 0, 2 ** 32)) config = { count: k.count, target: k.target, seed: k.seed };
  if (c.type === "weeks52" && ["classic", "reverse", "flat"].includes(k.mode) && isInt(k.step, 1, MAX_MINOR / 1500)) config = { mode: k.mode, step: k.step };
  if (c.type === "nospend" && isInt(k.year, 2020, 2100) && isInt(k.month, 1, 12) && isInt(k.perDay, 0, MAX_MINOR / 40)) config = { year: k.year, month: k.month, perDay: k.perDay };
  if (!config) return null;
  const out = { id: c.id, type: c.type, jarId: c.jarId, created: isInt(c.created, 0, 4e12) ? c.created : now(), config, done: {} };
  const n = challengeAmounts(out).length;
  if (c.done && typeof c.done === "object") for (const [i, entryId] of Object.entries(c.done)) if (isInt(Number(i), 0, n - 1) && isStr(entryId, 64)) out.done[Number(i)] = entryId;
  return out;
}

/** Returns a safe, complete state from untrusted input, or null if it isn't Brimful data at all. */
export function sanitize(raw) {
  if (!raw || typeof raw !== "object" || raw.v !== 1) return null;
  const s = emptyState();
  const st = raw.settings ?? {};
  if (isCurrency(st.currency)) s.settings.currency = st.currency;
  if (["system", "light", "dark"].includes(st.theme)) s.settings.theme = st.theme;
  if (["auto", "off"].includes(st.motion)) s.settings.motion = st.motion;
  s.settings.sound = st.sound !== false;
  s.settings.onboarded = st.onboarded === true;
  if (["auto", "en", "am"].includes(st.lang)) s.settings.lang = st.lang;
  if (st.cloud && isStr(st.cloud.code, 40) && CLOUD_CODE.test(st.cloud.code)) s.settings.cloud = { code: st.cloud.code, at: isInt(st.cloud.at, 0, 4e12) ? st.cloud.at : 0 };
  s.jars = (Array.isArray(raw.jars) ? raw.jars : []).map(cleanJar).filter(Boolean).slice(0, 200);
  const jarIds = new Set(s.jars.map((j) => j.id));
  s.challenges = (Array.isArray(raw.challenges) ? raw.challenges : []).map((c) => cleanChallenge(c, jarIds)).filter(Boolean).slice(0, 100);
  s.split = (Array.isArray(raw.split) ? raw.split : []).filter((r) => r && jarIds.has(r.jarId) && isInt(r.pct, 0, 100)).map((r) => ({ jarId: r.jarId, pct: r.pct }));
  const l = raw.license;
  if (l && isStr(l.key, 64) && /^[0-9a-f-]{36}$/.test(l.key) && ["pending", "active", "rejected", "refunded"].includes(l.status)) {
    s.license = { key: l.key, status: l.status, note: isStr(l.note, 300) ? l.note : "", checkedAt: isInt(l.checkedAt, 0, 4e12) ? l.checkedAt : 0 };
    if (["telebirr", "boa", "whop"].includes(l.method)) s.license.method = l.method;
  }
  return s;
}

/* ---------- persistence ---------- */
export function load(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return sanitize(JSON.parse(raw)) ?? emptyState();
  } catch { return emptyState(); }
}
export function save(state, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

/* ---------- derived values ---------- */
export const balance = (jar) => jar.entries.reduce((s, e) => s + e.amt, 0);
export const progress = (jar) => Math.max(0, Math.min(1, balance(jar) / jar.target));
export const isPlus = (state) => state.license?.status === "active";
export const canAddJar = (state) => isPlus(state) || state.jars.length < FREE_LIMITS.jars;
export const canAddChallenge = (state) => isPlus(state) || state.challenges.length < FREE_LIMITS.challenges;
export const totalSaved = (state) => state.jars.reduce((s, j) => s + Math.max(0, balance(j)), 0);

const dayKey = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const weekIndex = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return Math.floor((d.getTime() / 864e5 + 3) / 7); }; // weeks start Monday

/** Number of weeks in a row (ending this week or last week) with at least one deposit in any jar. */
export function weekStreak(state, at = now()) {
  const weeks = new Set(state.jars.flatMap((j) => j.entries.filter((e) => e.amt > 0).map((e) => weekIndex(e.t))));
  let w = weekIndex(at);
  if (!weeks.has(w)) w -= 1;
  let n = 0;
  while (weeks.has(w)) { n++; w--; }
  return n;
}

/** Amount to put aside per week to reach the target by the deadline (null if no deadline or already there). */
export function weeklyNeed(jar, at = now(), unit = 100) {
  if (!jar.deadline) return null;
  const left = jar.target - balance(jar);
  if (left <= 0) return null;
  const end = new Date(`${jar.deadline}T23:59:59`).getTime();
  const weeks = Math.max(1, Math.ceil((end - at) / (7 * 864e5)));
  return { perWeek: Math.min(left, Math.ceil(left / weeks / unit) * unit), weeks, overdue: end < at }; // rounded up to a whole unit
}

export const MILESTONES = [0.25, 0.5, 0.75, 1];
/** Milestones crossed when a jar moves from ratio a to ratio b. */
export const crossed = (a, b) => MILESTONES.filter((m) => a < m && b >= m);

/* ---------- actions (each returns a new state; callers save it) ---------- */
const clone = (s) => structuredClone(s);

export function addJar(state, { name, target, style = "brass", deadline = "" }) {
  const s = clone(state);
  const jar = cleanJar({ id: uid(), name, target, style, deadline, created: now(), entries: [] });
  if (!jar) throw new Error("invalid jar");
  s.jars.push(jar);
  return { state: s, jar };
}
export function updateJar(state, id, patch) {
  const s = clone(state);
  const i = s.jars.findIndex((j) => j.id === id);
  if (i < 0) return state;
  const next = cleanJar({ ...s.jars[i], ...patch });
  if (!next) throw new Error("invalid jar");
  s.jars[i] = next;
  return s;
}
export function removeJar(state, id) {
  const s = clone(state);
  s.jars = s.jars.filter((j) => j.id !== id);
  s.challenges = s.challenges.filter((c) => c.jarId !== id);
  s.split = s.split.filter((r) => r.jarId !== id);
  return s;
}
/** amt > 0 deposits, amt < 0 takes money out. A jar can't go below zero. */
export function addEntry(state, jarId, amt, note = "") {
  const s = clone(state);
  const jar = s.jars.find((j) => j.id === jarId);
  if (!jar || !Number.isSafeInteger(amt) || amt === 0) throw new Error("invalid entry");
  if (balance(jar) + amt < 0) throw new Error("below zero");
  if (Math.abs(balance(jar) + amt) > MAX_MINOR) throw new Error("too large");
  const entry = { id: uid(), t: now(), amt, note: String(note).slice(0, 80) };
  jar.entries.push(entry);
  return { state: s, entry };
}
export function removeEntry(state, jarId, entryId) {
  const s = clone(state);
  const jar = s.jars.find((j) => j.id === jarId);
  if (!jar) return state;
  const e = jar.entries.find((x) => x.id === entryId);
  if (!e) return state;
  if (balance(jar) - e.amt < 0) throw new Error("below zero");
  jar.entries = jar.entries.filter((x) => x.id !== entryId);
  for (const c of s.challenges) for (const [i, id] of Object.entries(c.done)) if (id === entryId) delete c.done[i];
  return s;
}
export function addChallenge(state, { type, jarId, config }) {
  const s = clone(state);
  const ch = cleanChallenge({ id: uid(), type, jarId, config, created: now(), done: {} }, new Set(s.jars.map((j) => j.id)));
  if (!ch) throw new Error("invalid challenge");
  s.challenges.push(ch);
  return { state: s, challenge: ch };
}
export function removeChallenge(state, id) {
  const s = clone(state);
  s.challenges = s.challenges.filter((c) => c.id !== id);
  return s;
}
/** Ticks or un-ticks one step of a challenge. Ticking deposits its amount into the linked jar; un-ticking removes that deposit. */
export function toggleStep(state, challengeId, index) {
  const ch = state.challenges.find((c) => c.id === challengeId);
  if (!ch) return { state, change: 0 };
  const amounts = challengeAmounts(ch);
  if (!(index >= 0 && index < amounts.length)) return { state, change: 0 };
  if (ch.done[index]) {
    const s = ch.done[index] === "none" ? clone(state) : removeEntry(state, ch.jarId, ch.done[index]);
    delete s.challenges.find((c) => c.id === challengeId).done[index];
    return { state: s, change: -amounts[index] };
  }
  const label = ch.type === "envelopes" ? `Envelope ${index + 1}` : ch.type === "weeks52" ? `Week ${index + 1}` : `No-spend day ${index + 1}`;
  if (amounts[index] === 0) {
    const s = clone(state);
    s.challenges.find((c) => c.id === challengeId).done[index] = "none";
    return { state: s, change: 0 };
  }
  const { state: s, entry } = addEntry(state, ch.jarId, amounts[index], label);
  s.challenges.find((c) => c.id === challengeId).done[index] = entry.id;
  return { state: s, change: amounts[index] };
}

/** Splits `amount` between jars by percentage. Rounding leftovers go to the first jar so nothing is lost. */
export function splitAmount(amount, rows) {
  const active = rows.filter((r) => r.pct > 0);
  const totalPct = active.reduce((s, r) => s + r.pct, 0);
  if (!active.length || totalPct > 100 || !Number.isSafeInteger(amount) || amount <= 0) return [];
  const parts = active.map((r) => ({ jarId: r.jarId, amt: Math.floor((amount * r.pct) / 100) }));
  const assigned = Math.floor((amount * totalPct) / 100);
  parts[0].amt += assigned - parts.reduce((s, p) => s + p.amt, 0);
  return parts.filter((p) => p.amt > 0);
}

/** Backup file contents. The licence key is included so a restore keeps Plus. */
export function exportData(state) {
  // The cloud recovery code stays on the device: it never goes into a backup file or the cloud copy.
  const settings = { ...state.settings, cloud: null };
  return JSON.stringify({ app: "brimful", exported: new Date().toISOString(), ...state, settings }, null, 2);
}
export function importData(text) {
  let raw;
  try { raw = JSON.parse(text); } catch { return null; }
  if (raw?.app !== "brimful") return null;
  return sanitize(raw);
}
