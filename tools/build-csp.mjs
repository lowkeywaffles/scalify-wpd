// Builds the Content-Security-Policy for the public Scalify pages and writes it into vercel.json.
// The pages have a few inline <script> blocks, so each is allowed by its SHA-256 hash instead of 'unsafe-inline'.
// Run `node tools/build-csp.mjs` after editing any inline script in index.html or products/index.html (tests fail if you forget).
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
export const PAGES = ["index.html", "products/index.html"];
export const SOURCE = "/((?!admin|api).*)";
export function hashes(root = ".") {
  const out = new Set();
  for (const f of PAGES) {
    for (const m of readFileSync(`${root}/${f}`, "utf8").matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type\s*=\s*["']?application\/(ld\+)?json/i.test(m[1])) continue; // data block, never executed
      out.add(`'sha256-${createHash("sha256").update(m[2]).digest("base64")}'`);
    }
  }
  return [...out].sort();
}
export const csp = (h) => ["default-src 'self'", `script-src 'self' ${h.join(" ")}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data:", "font-src 'self' data:", "connect-src 'self'", "frame-src 'none'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'", "upgrade-insecure-requests"].join("; ");
if (process.argv[1]?.endsWith("build-csp.mjs")) {
  const cfg = JSON.parse(readFileSync("vercel.json", "utf8"));
  cfg.headers = cfg.headers.filter((r) => r.source !== SOURCE);
  cfg.headers.splice(1, 0, { source: SOURCE, headers: [
    { key: "Content-Security-Policy", value: csp(hashes()) },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ] });
  const base = cfg.headers.find((r) => r.source === "/(.*)").headers.find((h) => h.key === "Permissions-Policy");
  base.value = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()";
  writeFileSync("vercel.json", JSON.stringify(cfg, null, 2) + "\n");
  console.log(`CSP written with ${hashes().length} script hashes`);
}
