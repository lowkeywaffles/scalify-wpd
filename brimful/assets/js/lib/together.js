// Save Together: encryption and server calls for shared jars.
// Everything a person types (jar name, target, their name, amounts, notes) is encrypted here with AES-256-GCM, using a
// random key that travels only inside the invite link's #fragment. The server stores ciphertext it cannot read.
import { BASE } from "./api.js";

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (u) => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u) => b64(u).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64url = (s) => unb64(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));

export const PRESETS = [
  { id: "apartment", icon: "🏠", name: "Apartment" }, { id: "car", icon: "🚗", name: "Car" },
  { id: "wedding", icon: "💍", name: "Wedding" }, { id: "trip", icon: "✈️", name: "Trip" },
  { id: "home", icon: "🔑", name: "House deposit" }, { id: "emergency", icon: "🛟", name: "Emergency fund" },
  { id: "baby", icon: "🍼", name: "Baby" }, { id: "gift", icon: "🎁", name: "Group gift" },
  { id: "business", icon: "💼", name: "Business" }, { id: "custom", icon: "✨", name: "Something else" },
];
export const presetOf = (id) => PRESETS.find((p) => p.id === id) ?? PRESETS[PRESETS.length - 1];
export const COLORS = ["#D8A531", "#0C6A4E", "#C2577A", "#3D7DD8", "#8A5CD0", "#E07A3A"];

export const newKey = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
export const newToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const keyCache = new Map();
async function aes(key) {
  if (!keyCache.has(key)) keyCache.set(key, crypto.subtle.importKey("raw", unb64url(key), "AES-GCM", false, ["encrypt", "decrypt"]));
  return keyCache.get(key);
}
export async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aes(key), enc.encode(JSON.stringify(obj))));
  return `v1.${b64(iv)}.${b64(ct)}`;
}
export async function open(key, data) {
  try {
    const [v, iv, ct] = String(data).split(".");
    if (v !== "v1") return null;
    return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aes(key), unb64(ct))));
  } catch { return null; } // unreadable or tampered: ignored
}

/** Invite link: the key is after the #, so it never reaches any server. */
export const inviteLink = (jarId, key) => `${location.origin}/app/#/join/${jarId}.${key}`;
export function parseInvite(text) {
  const m = String(text).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})/i);
  return m ? { id: m[1].toLowerCase(), key: m[2] } : null;
}

async function call(path, init = {}, member) {
  const headers = { ...(init.body ? { "Content-Type": "application/json" } : {}), ...(member ? { "X-Member": member.member, "X-Token": member.token } : {}) };
  try {
    const r = await fetch(`${BASE}/shared${path}`, { ...init, headers, cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
    const body = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "You're offline. Shared jars need a connection." } };
  }
}
const j = (method, data) => ({ method, body: JSON.stringify(data) });

export const api = {
  create: (data) => call("", j("POST", data)),
  preview: (id) => call(`/${id}/preview`),
  join: (id, data) => call(`/${id}/join`, j("POST", data)),
  sync: (m, since) => call(`/${m.id}${since ? `?since=${encodeURIComponent(since)}` : ""}`, {}, m),
  editMeta: (m, meta) => call(`/${m.id}`, j("PATCH", { meta }), m),
  editProfile: (m, profile) => call(`/${m.id}`, j("PATCH", { profile }), m),
  remove: (m) => call(`/${m.id}`, { method: "DELETE" }, m),
  add: (m, data, licence_key) => call(`/${m.id}/entries`, j("POST", { data, licence_key }), m),
  unadd: (m, entryId) => call(`/${m.id}/entries/${entryId}`, { method: "DELETE" }, m),
  kick: (m, memberId) => call(`/${m.id}/members/${memberId}`, { method: "DELETE" }, m),
};
