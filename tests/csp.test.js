import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { csp, hashes, SOURCE } from "../tools/build-csp.mjs";

test("the public-page CSP in vercel.json matches the inline scripts (run node tools/build-csp.mjs after editing them)", () => {
  const rule = JSON.parse(readFileSync("vercel.json", "utf8")).headers.find((r) => r.source === SOURCE);
  const have = rule.headers.find((h) => h.key === "Content-Security-Policy").value;
  assert.equal(have, csp(hashes()));
  assert.ok(!/unsafe-inline[^;]*script|script-src[^;]*unsafe-/.test(have), "scripts must not be allowed with unsafe-inline/eval");
});
test("every page also gets the basic security headers", () => {
  const all = JSON.parse(readFileSync("vercel.json", "utf8")).headers.find((r) => r.source === "/(.*)").headers.map((h) => h.key);
  for (const k of ["X-Content-Type-Options", "Referrer-Policy", "X-Frame-Options", "Strict-Transport-Security"]) assert.ok(all.includes(k), k);
});
