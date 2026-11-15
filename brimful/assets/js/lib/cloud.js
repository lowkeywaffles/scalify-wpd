// Optional encrypted cloud backup. Everything happens in your browser:
//   recovery code (100 random bits) --PBKDF2--> AES-256-GCM key --> encrypts your backup
//   recovery code --SHA-256--> lookup id (the server stores the ciphertext under this id)
// The server never sees the code or the key, so nobody but you can read the backup. Lose the code and the
// cloud copy can't be opened by anyone, including us.
import { CLOUD_CODE, exportData, importData } from "./store.js";
import { deleteBackup, getBackup, putBackup } from "./api.js";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf) => {
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); // chunked: big backups would overflow the stack
  return btoa(s);
};
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const s = Array.from(bytes, (b) => ALPHA[b & 31]).join(""); // 256 is a multiple of 32, so this is unbiased
  return s.match(/.{5}/g).join("-");
}
/** Accepts what people type: lowercase, spaces, missing dashes, 0/1/8 for O/I/B. */
export function normalize(input) {
  const raw = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/0/g, "O").replace(/1/g, "I").replace(/8/g, "B");
  if (raw.length !== 20) return null;
  const code = raw.match(/.{5}/g).join("-");
  return CLOUD_CODE.test(code) ? code : null;
}

export async function lookupId(code) {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(`brimful-backup-id:v1:${code}`));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function keyFor(code) {
  const base = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode("brimful-backup-key:v1"), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
export async function seal(code, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await keyFor(code), enc.encode(text));
  return `v1.${b64(iv)}.${b64(ct)}`;
}
export async function open(code, data) {
  const [v, iv, ct] = String(data).split(".");
  if (v !== "v1" || !iv || !ct) throw new Error("format");
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await keyFor(code), unb64(ct)));
}

/** Uploads an encrypted copy of the current state. */
export async function backupNow(state) {
  const code = state.settings.cloud?.code;
  if (!code) return { ok: false, error: "Cloud backup is off." };
  const data = await seal(code, exportData(state));
  if (data.length > 700000) return { ok: false, error: "Your data is too large for cloud backup. Use Download a backup instead." };
  const r = await putBackup(await lookupId(code), data);
  return r.ok ? { ok: true, at: Date.now() } : { ok: false, error: r.body.error || "Couldn't back up right now." };
}

/** Downloads and decrypts the backup for a recovery code. */
export async function fetchRestore(code) {
  const r = await getBackup(await lookupId(code));
  if (!r.ok) return { ok: false, error: r.status === 404 ? "No backup found for this recovery code. Check it and try again." : r.body.error || "Couldn't reach the backup right now." };
  try {
    const state = importData(await open(code, r.body.data));
    return state ? { ok: true, state, updatedAt: r.body.updated_at } : { ok: false, error: "That backup is damaged." };
  } catch {
    return { ok: false, error: "That recovery code doesn't open this backup." };
  }
}

export async function removeCloud(code) {
  const r = await deleteBackup(await lookupId(code));
  return r.ok || r.status === 404;
}
