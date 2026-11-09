// Full signed-in flow against a REAL deployment + Supabase project.
// Requires "Confirm email" to be OFF temporarily (test accounts can't receive email).
// Usage: node e2e/full-app.mjs https://your-site SUPABASE_URL PUBLISHABLE_KEY
// Creates two throwaway accounts and deletes them through the app at the end.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require("playwright"); } catch { return createRequire(process.execPath)("playwright"); } })();
const { createClient } = require("@supabase/supabase-js");

const [base, sbUrl, sbKey] = process.argv.slice(2);
const stamp = Date.now();
const A = { email: `qr-e2e-a-${stamp}@example.com`, password: `TestPass-${stamp}-a` };
const B = { email: `qr-e2e-b-${stamp}@example.com`, password: `TestPass-${stamp}-b` };
const today = new Date().toISOString().slice(0, 10);
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
let failures = 0;
const ok = (m) => console.log("ok  ", m);
const fail = (m) => { failures++; console.log("FAIL", m); };
const check = (cond, m) => (cond ? ok(m) : fail(m));
const vis = async (loc) => { try { await loc.first().waitFor({ state: "visible", timeout: 10000 }); return true; } catch { return false; } };

const browser = await chromium.launch();

async function account(creds, viewport) {
  const ctx = await browser.newContext({ viewport });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => fail(`page error: ${e.message}`));
  await page.goto(`${base}/signup`);
  await page.getByLabel("Email", { exact: true }).fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create free account" }).click();
  await page.getByRole("status").or(page.getByRole("alert")).first().waitFor();
  await page.goto(`${base}/login`);
  await page.getByLabel("Email", { exact: true }).fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app/, { timeout: 20000 });
  return { ctx, page };
}

try {
  // ---------- Account A (mobile) ----------
  const { page } = await account(A, { width: 390, height: 844 });
  ok("A signed up + signed in");
  await page.goto(`${base}/app`);
  await page.waitForURL(/onboarding/);
  ok("new user sent to onboarding");
  await page.getByLabel("1. Business name").fill("E2E Test Studio");
  await page.getByLabel(/2\. Industry/).selectOption("Printing & signage");
  await page.getByLabel("3. Currency").fill("usd");
  await page.getByLabel(/4\. Typical quote value/).fill("500");
  await page.getByLabel("Email", { exact: true }).check();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await page.waitForURL(`${base}/app`, { timeout: 15000 });
  check(await vis(page.getByText("E2E Test Studio")), "onboarding saved (business name shown on dashboard)");
  check(await vis(page.getByText("No quotes yet")), "empty state on dashboard");

  // Create quote
  await page.goto(`${base}/app/quotes/new`);
  await page.getByLabel("Customer name").fill("Test Customer Sarah");
  await page.getByLabel("Job or project").fill("website");
  await page.getByLabel(/Customer WhatsApp/).fill("+1 555 010 0000");
  await page.getByLabel("Quote amount").fill("1200");
  await page.getByLabel(/Date sent/).fill(daysAgo(6));
  await page.getByLabel(/Next follow-up/).fill(today);
  await page.getByRole("button", { name: "Save quote" }).click();
  await page.waitForURL(/\/app\/quotes\/[0-9a-f-]{36}/, { timeout: 15000 });
  const quoteUrl = page.url().split("?")[0];
  check(await vis(page.getByText(/Quote saved/)), "quote created");
  await page.reload();
  check(await vis(page.getByRole("heading", { name: "Test Customer Sarah" })), "quote persists after refresh");

  // Queue
  await page.goto(`${base}/app/queue`);
  check(await vis(page.getByText("Test Customer Sarah")), "quote appears in today's queue");
  await page.getByText("Test Customer Sarah").click();
  await page.waitForURL(/#follow-up/);
  const msg = await page.locator("#fua-msg").inputValue();
  check(/^Hey Test, just checking in about the website quotation/.test(msg), `message prepared: "${msg.slice(0, 60)}…"`);
  await page.getByRole("button", { name: "Copy message" }).click();
  check((await page.evaluate(() => navigator.clipboard.readText())) === msg, "message copied");
  const wa = await page.getByRole("link", { name: /Open WhatsApp/ }).getAttribute("href");
  check(wa.startsWith("https://wa.me/15550100000?text="), "WhatsApp link has phone + text");

  // Record follow-up
  await page.getByRole("button", { name: "I sent this follow-up" }).click();
  await page.getByRole("button", { name: "Save follow-up" }).click();
  await page.getByText("Follow-up recorded.").waitFor({ timeout: 15000 });
  await page.reload();
  check(await vis(page.getByText("Follow-up recorded")), "follow-up in timeline");
  check(await vis(page.getByText("Awaiting response")), "status moved to Awaiting response");
  await page.goto(`${base}/app/queue`);
  check(await vis(page.getByText("All caught up")), "quote left the queue after follow-up (rescheduled)");

  // Record response: accepted
  await page.goto(quoteUrl);
  await page.getByRole("button", { name: "Record customer response" }).click();
  await page.getByLabel(/What did they say/).fill("Said yes to the quote");
  await page.getByLabel("New status").selectOption("accepted");
  await page.getByRole("checkbox", { name: /A follow-up helped/ }).check();
  await page.getByRole("button", { name: "Save response" }).click();
  await page.getByText("Saved.").waitFor({ timeout: 15000 });
  await page.reload();
  check(await vis(page.getByText("Accepted")), "status Accepted");

  // Dashboard maths
  await page.goto(`${base}/app`);
  const tile = (label) => page.locator("dl > div").filter({ hasText: label }).locator("dd").first().innerText();
  check((await tile("Accepted quote value")).includes("1,200"), "dashboard accepted value = $1,200");
  check((await tile("Outstanding quote value")).includes("$0"), "dashboard outstanding = $0");
  check((await tile("Acceptance rate")) === "100%", "acceptance rate 100%");
  check((await tile("Follow-ups completed")) === "1", "follow-ups completed = 1");

  // Edit quote
  await page.goto(quoteUrl);
  await page.getByText("Edit quote details").click();
  await page.getByLabel("Private notes").fill("edited note");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Quote saved.").waitFor();
  ok("quote edited");

  // CSV import (1 good, 1 bad)
  await page.goto(`${base}/app/import`);
  const csv = `Client,Project,Amount,Date Sent\nImported Ana,Banner,"2,000",${daysAgo(20)}\n,Bad row,abc,02/01/2026\n`;
  await page.getByLabel("1. Choose a CSV file").setInputFiles({ name: "q.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  check(await vis(page.getByText("1 row ready · 1 with errors")), "import preview shows row-level errors");
  await page.getByRole("button", { name: "Import 1 valid row" }).click();
  await page.getByText(/Imported 1 new quotes/).waitFor({ timeout: 15000 });
  ok("CSV import");

  // Quotes list + pipeline + export
  await page.goto(`${base}/app/quotes`);
  check(await vis(page.getByText("Imported Ana")), "imported quote in list");
  await page.getByRole("button", { name: "pipeline" }).click();
  check(await vis(page.getByRole("region", { name: /Accepted: 1/ })), "pipeline view groups by status");
  const exp = await page.request.get(`${base}/api/export`);
  const body = await exp.text();
  check(exp.status() === 200 && body.includes("Test Customer Sarah") && body.includes("Imported Ana"), "CSV export contains both quotes");
  const json = await (await page.request.get(`${base}/api/export?format=json`)).json();
  check(json.quotes.length === 2 && json.activities.length >= 3, "JSON export complete");

  // Settings
  await page.goto(`${base}/app/settings`);
  await page.getByLabel("Days between follow-ups (reminder frequency)").fill("4");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.getByText("Settings saved.").waitFor();
  ok("settings saved");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGNQ9nhAEmIY1TCqYfhqAAA7tksQoDvfIgAAAABJRU5ErkJggg==", "base64");
  await page.locator('input[type=file]').setInputFiles({ name: "a.png", mimeType: "image/png", buffer: png });
  await page.getByText("Photo updated.").waitFor({ timeout: 15000 });
  check(await vis(page.getByRole("img", { name: "Your profile photo" })), "avatar uploaded");
  await page.getByRole("button", { name: "Remove photo" }).click();
  await page.getByText("Photo removed.").waitFor({ timeout: 15000 });
  ok("avatar removed");

  // Access page
  await page.goto(`${base}/app/billing`);
  check(await vis(page.getByText(/free trial workspace: up to 10 quotes \(2 used\)/)), "access page shows free usage 2/10");

  // ---------- Direct database checks with A's session ----------
  const sbA = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
  await sbA.auth.signInWithPassword(A);
  const { data: bizA } = await sbA.from("businesses").select("id").single();
  const ent = await sbA.from("entitlements").insert({ business_id: bizA.id, source: "manual", status: "active" });
  check(!!ent.error, "user cannot grant themselves paid access (RLS)");
  const rows = Array.from({ length: 8 }, (_, i) => ({ business_id: bizA.id, customer_name: `Bulk ${i}`, title: "t", amount: 1, currency: "USD", status: "sent" }));
  const bulk = await sbA.from("quotes").insert(rows);
  check(!bulk.error, "can fill up to 10 quotes");
  const over = await sbA.from("quotes").insert({ business_id: bizA.id, customer_name: "Eleventh", title: "t", amount: 1, currency: "USD", status: "sent" });
  check(over.error && over.error.message.includes("FREE_LIMIT"), "11th quote blocked by free limit");

  // ---------- Account B + isolation ----------
  const b = await account(B, { width: 1280, height: 900 });
  await b.page.goto(`${base}/app/onboarding`);
  await b.page.getByRole("button", { name: "Skip for now" }).click();
  await b.page.waitForURL(`${base}/app`);
  ok("B skipped onboarding");
  await b.page.goto(`${base}/app/quotes`);
  check(await vis(b.page.getByText("No quotes yet")), "B sees none of A's quotes in the list");
  await b.page.goto(quoteUrl);
  // Next.js streams /app pages (loading skeleton), so a not-found renders with HTTP 200; check the content instead.
  check(await vis(b.page.getByRole("heading", { name: "Page not found" })) && !(await b.page.getByText("Test Customer Sarah").count()), "B opening A's quote URL sees 'Page not found' and no data");
  const sbB = createClient(sbUrl, sbKey, { auth: { persistSession: false } });
  await sbB.auth.signInWithPassword(B);
  const seen = await sbB.from("quotes").select("id");
  check(seen.data?.length === 0, "B's direct database query returns 0 of A's quotes");
  const steal = await sbB.from("quotes").update({ notes: "hacked" }).eq("business_id", bizA.id).select();
  check((steal.data ?? []).length === 0, "B cannot modify A's quotes");
  const inject = await sbB.from("quotes").insert({ business_id: bizA.id, customer_name: "x", title: "x", amount: 1, currency: "USD", status: "sent" });
  check(!!inject.error, "B cannot insert into A's business");

  // ---------- Delete quote, then both accounts via the UI ----------
  await page.goto(quoteUrl);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await page.waitForURL(/deleted=1/);
  ok("quote deleted");
  for (const [p, label] of [[page, "A"], [b.page, "B"]]) {
    await p.goto(`${base}/app/settings`);
    await p.getByLabel("Type DELETE to confirm").fill("DELETE");
    await p.getByRole("button", { name: "Delete my account" }).click();
    await p.waitForURL(/account_deleted=1/, { timeout: 20000 });
    ok(`account ${label} deleted`);
  }
  const gone = await createClient(sbUrl, sbKey, { auth: { persistSession: false } }).auth.signInWithPassword(A);
  check(!!gone.error, "deleted account can no longer sign in");
} catch (e) {
  fail(`crashed: ${e.message.split("\n")[0]}`);
}
await browser.close();
console.log(failures ? `\n${failures} failure(s)` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
