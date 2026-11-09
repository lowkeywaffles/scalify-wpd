// Smoke + accessibility test (no Supabase needed). Usage: node e2e/smoke.mjs http://localhost:3100

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require("playwright"); } catch { return createRequire(process.execPath)("playwright"); } })();
const axeSrc = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const base = process.argv[2] ?? "http://localhost:3000";
const browser = await chromium.launch();
let failures = 0;
const fail = (m) => { failures++; console.log("FAIL", m); };

async function audit(page, label) {
  await page.addScriptTag({ content: axeSrc });
  const res = await page.evaluate(async () => await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] }));
  for (const v of res.violations) fail(`${label} axe ${v.id} (${v.impact}): ${v.nodes.length} node(s) e.g. ${v.nodes[0].target}`);
  if (!res.violations.length) console.log("ok  ", label, "axe: 0 violations");
}

for (const scheme of ["light", "dark"]) {
  for (const [vp, size] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: size, colorScheme: scheme });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const path of ["/", "/demo", "/guide", "/legal/privacy", "/legal/terms", "/legal/cookies", "/legal/refund", "/contact", "/login", "/signup"]) {
      const r = await page.goto(base + path, { waitUntil: "networkidle" });
      if (r.status() !== 200) fail(`${path} status ${r.status()}`);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (overflow) fail(`${path} horizontal overflow (${vp})`);
      if (vp === "desktop" || path === "/") await audit(page, `${scheme}/${vp} ${path}`);
    }
    const cookies = await ctx.cookies();
    if (cookies.length) fail(`cookies set without action: ${cookies.map((c) => c.name)}`);
    if (errors.length) fail(`console errors (${scheme}/${vp}): ${errors.join(" | ")}`);
    await ctx.close();
  }
}

// Demo flow: keyboard into queue, prepare + record follow-up
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"]);
const page = await ctx.newPage();
await page.goto(base + "/demo", { waitUntil: "networkidle" });
const csp = (await page.request.get(base + "/demo")).headers()["content-security-policy"] ?? "";
if (!csp.includes("nonce-") || csp.includes("script-src 'self' 'unsafe-inline'")) fail("CSP missing nonce"); else console.log("ok   CSP with nonce");
const before = await page.locator("ol > li").count();
await page.locator("ol > li button").first().focus();
await page.keyboard.press("Enter");
const dlg = page.getByRole("dialog");
await dlg.waitFor();
const msg = await dlg.locator("#fua-msg").inputValue();
if (!/^(Hey|Hi) \w+,.* the [a-z ]+ quot/.test(msg)) fail("message not personalised: " + msg); else console.log("ok   message:", msg.slice(0, 70) + "…");
await dlg.getByRole("button", { name: "Copy message" }).click();
const clip = await page.evaluate(() => navigator.clipboard.readText());
if (clip !== msg) fail("clipboard mismatch"); else console.log("ok   copied to clipboard");
const wa = await dlg.getByRole("link", { name: /Open WhatsApp/ }).getAttribute("href");
if (!wa.startsWith("https://wa.me/?text=")) fail("wa link " + wa); else console.log("ok   WhatsApp link prefilled");
await dlg.getByRole("button", { name: "I sent this follow-up" }).click();
await dlg.getByRole("button", { name: "Save follow-up" }).click();
await dlg.getByText("Recorded in the demo").waitFor();
await page.keyboard.press("Escape");
await page.waitForTimeout(400);
const after = await page.locator("ol > li").count();
if (after !== before - 1) fail(`queue should shrink ${before} -> ${after}`); else console.log(`ok   queue shrank ${before} -> ${after}`);
const focused = await page.evaluate(() => document.activeElement?.tagName);
if (focused !== "BUTTON") fail("focus lost after dialog close: " + focused); else console.log("ok   focus restored after dialog close");
await page.setViewportSize({ width: 390, height: 844 });
if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/demo-mobile.png` });

// App routes protected
const r = await page.goto(base + "/app/quotes");
if (!page.url().includes("/setup-required") && !page.url().includes("/login")) fail("app not protected: " + page.url()); else console.log("ok   /app redirected to", new URL(page.url()).pathname);
const wh = await page.request.post(base + "/api/webhooks/whop", { data: "{}" });
if (wh.status() !== 401) fail("webhook unsigned accepted " + wh.status()); else console.log("ok   unsigned webhook rejected 401");
const cron = await page.request.get(base + "/api/cron/reminders");
if (cron.status() !== 401) fail("cron unauth " + cron.status()); else console.log("ok   cron requires secret");

await browser.close();
console.log(failures ? `\n${failures} failure(s)` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
