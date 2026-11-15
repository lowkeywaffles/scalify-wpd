// Tests for the Scalify API functions with every outside service (Supabase, Whop, Telegram) faked.
import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";

process.env.SUPABASE_SERVICE_ROLE_KEY = "sb_secret_test";
process.env.OPERATOR_EMAILS = "boss@example.com, Second@Example.com";
process.env.WHOP_API_KEY = "whop_test";
process.env.BRIMFUL_WHOP_PLAN_ID = "plan_test";
process.env.BRIMFUL_WHOP_PRODUCT_ID = "prod_brim";
process.env.TELEGRAM_BOT_TOKEN = "123:abc";

/* ---------- fakes ---------- */
let calls = [], routes = [];
const on = (method, re, reply) => routes.push({ method, re, reply });
globalThis.fetch = async (url, init = {}) => {
  const method = init.method || "GET";
  calls.push({ method, url: String(url), body: init.body ? JSON.parse(init.body) : undefined, headers: init.headers || {} });
  const r = routes.find((x) => x.method === method && x.re.test(String(url)));
  if (!r) throw new Error(`unexpected fetch ${method} ${url}`);
  const out = typeof r.reply === "function" ? r.reply(String(url), init) : r.reply;
  const { status = 200, json = null, headers = {} } = out;
  return new Response(json == null || status === 204 ? null : JSON.stringify(json), { status, headers: { "content-type": "application/json", ...headers } });
};
beforeEach(() => { calls = []; routes = []; });

function req({ method = "GET", query = {}, body, headers = {} } = {}) {
  return { method, query, body, url: "/api/x", headers: { host: "scalify-wpd.vercel.app", "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}`, ...headers } };
}
function res() {
  const h = {};
  return { statusCode: 200, headers: h, body: "", setHeader(k, v) { h[k.toLowerCase()] = v; }, end(b) { this.body = b; this.json = b ? JSON.parse(b) : null; } };
}
const run = async (mod, r) => { const out = res(); await (await import(mod)).default(r, out); return out; };
const BRIM = { origin: "https://brimful.vercel.app" };
const SELF = { origin: "https://scalify-wpd.vercel.app" };
const KEY = "3f0c2b1a-9d8e-4c7b-a6f5-0123456789ab";
const SB = /yardudilkrhhhhtvgyuh\.supabase\.co\/rest\/v1\//;

/* ---------- store ---------- */
test("product info is public and shows card price when Whop is set up", async () => {
  const out = await run("../api/store/product.js", req({ query: { product: "brimful" }, headers: BRIM }));
  assert.equal(out.statusCode, 200);
  assert.equal(out.json.price_etb, 500);
  assert.deepEqual(out.json.card, { price_usd: 7, provider: "Whop" });
  assert.equal(out.headers["access-control-allow-origin"], "https://brimful.vercel.app");
  assert.equal((await run("../api/store/product.js", req({ query: { product: "nope" } }))).statusCode, 404);
});

test("orders need the age confirmation and an allowed origin", async () => {
  let out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "telebirr", payer_name: "Abebe", reference: "ABC123" } }));
  assert.equal(out.statusCode, 400);
  assert.equal(out.json.field, "age_ok");
  out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: { origin: "https://evil.example" }, body: { age_ok: true } }));
  assert.equal(out.statusCode, 403);
  assert.equal(calls.length, 0, "nothing reaches the database");
});

test("birr order is saved with the server's price, then an alert goes out", async () => {
  on("GET", /store_orders\?select=id&status=eq\.pending/, { json: [], headers: { "content-range": "0-0/3" } });
  on("POST", /rest\/v1\/store_orders$/, (u, i) => ({ status: 201, json: [{ id: KEY, status: "pending", ...JSON.parse(i.body) }] }));
  on("GET", /ops_settings/, { json: [{ value: { chat_id: 42 } }] });
  on("GET", /store_orders\?select=id,product/, { json: [{ id: KEY, product: "brimful", method: "telebirr", amount_etb: 500, amount_usd: null, status: "pending" }] });
  on("PATCH", /store_orders\?id=eq\..*notified_at=is\.null/, { json: [{ id: KEY }] });
  on("GET", /manual_payments\?select/, { json: [] });
  on("POST", /api\.telegram\.org\/bot123:abc\/sendMessage/, { json: { ok: true, result: {} } });
  const out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "telebirr", payer_name: " Abebe Kebede ", reference: "ab-12x9", age_ok: true, amount_etb: 1 } }));
  assert.equal(out.statusCode, 201);
  assert.equal(out.json.key, KEY);
  const ins = calls.find((c) => c.method === "POST" && /store_orders$/.test(c.url)).body;
  assert.deepEqual(ins, { product: "brimful", method: "telebirr", amount_etb: 500, payer_name: "Abebe Kebede", reference: "AB-12X9", age_confirmed: true });
  const tg = calls.find((c) => c.url.includes("sendMessage")).body;
  assert.equal(tg.chat_id, 42);
  assert.match(tg.text, /Brimful Plus, 500 ETB by Telebirr/);
  assert.doesNotMatch(tg.text, /Abebe|AB-12X9|3f0c/, "alerts never include names, references or keys");
});

test("card order creates a Whop checkout tagged with the licence key", async () => {
  on("GET", /store_orders\?select=id&status=eq\.pending/, { json: [], headers: { "content-range": "0-0/0" } });
  on("POST", /rest\/v1\/store_orders$/, (u, i) => ({ status: 201, json: [{ id: KEY, status: "pending", ...JSON.parse(i.body) }] }));
  on("POST", /api\.whop\.com\/api\/v1\/checkout_configurations/, { json: { id: "ch_1", purchase_url: "https://whop.com/checkout/ch_1" } });
  on("PATCH", /store_orders\?id=eq\./, { status: 204 });
  const out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "whop", age_ok: true } }));
  assert.equal(out.statusCode, 201);
  assert.equal(out.json.checkout_url, "https://whop.com/checkout/ch_1");
  const co = calls.find((c) => c.url.includes("checkout_configurations")).body;
  assert.equal(co.variant_id, "plan_test");
  assert.deepEqual(co.metadata, { brimful_key: KEY });
  assert.equal(calls.find((c) => c.method === "POST" && /store_orders$/.test(c.url)).body.amount_usd, 7);
});

test("card order is removed again if Whop fails", async () => {
  on("GET", /store_orders\?select=id&status=eq\.pending/, { json: [], headers: { "content-range": "0-0/0" } });
  on("POST", /rest\/v1\/store_orders$/, { status: 201, json: [{ id: KEY, status: "pending" }] });
  on("POST", /checkout_configurations/, { status: 500, json: { error: "x" } });
  on("DELETE", /store_orders\?id=eq\./, { status: 204 });
  const out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "whop", age_ok: true } }));
  assert.equal(out.statusCode, 502);
  assert.ok(calls.some((c) => c.method === "DELETE"));
});

test("status check confirms a pending card order with Whop (no webhook needed)", async () => {
  const created = new Date(Date.now() - 60_000).toISOString();
  on("GET", /store_orders\?select=id,status,method,review_note/, { json: [{ id: KEY, status: "pending", method: "whop", created_at: created, checked_at: null }] });
  on("PATCH", /store_orders\?id=eq\.[^&]+$/, { status: 204 });
  on("GET", /api\/v1\/payments\?/, { json: { data: [{ id: "pay_other", metadata: { brimful_key: "x" } }, { id: "pay_1", metadata: { brimful_key: KEY } }] } });
  on("GET", /api\/v1\/payments\/pay_1/, { json: { id: "pay_1", status: "paid", product_id: "prod_brim", refunded_at: null, metadata: { brimful_key: KEY } } });
  on("PATCH", /store_orders\?id=eq\..*status=eq\.pending&method=eq\.whop/, { json: [{ id: KEY, status: "approved" }] });
  on("GET", /ops_settings/, { json: [] });
  const out = await run("../api/store/order.js", req({ query: { product: "brimful", key: KEY }, headers: BRIM }));
  assert.equal(out.json.status, "active");
  const ap = calls.find((c) => c.method === "PATCH" && /method=eq\.whop/.test(c.url)).body;
  assert.equal(ap.reference, "pay_1");
});

test("a payment for another product or order never unlocks", async () => {
  const { paymentUnlocks } = await import("../api/_lib/whop.js");
  const good = { product_id: "prod_brim", status: "paid", refunded_at: null, metadata: { brimful_key: KEY } };
  assert.equal(paymentUnlocks(good, "prod_brim", KEY), true);
  assert.equal(paymentUnlocks({ ...good, product_id: "prod_AOn93RN2TsMSs" }, "prod_brim", KEY), false);
  assert.equal(paymentUnlocks({ ...good, status: "open" }, "prod_brim", KEY), false);
  assert.equal(paymentUnlocks({ ...good, refunded_at: "2026-11-15" }, "prod_brim", KEY), false);
  assert.equal(paymentUnlocks({ ...good, metadata: { brimful_key: "other" } }, "prod_brim", KEY), false);
});

test("webhook re-reads the payment from Whop and ignores the body's claims", async () => {
  on("GET", /api\/v1\/payments\/pay_9/, { json: { id: "pay_9", status: "open", product_id: "prod_brim", refunded_at: null, metadata: { brimful_key: KEY } } });
  on("GET", /store_orders\?select=id,status,method,reference/, { json: [{ id: KEY, status: "pending", method: "whop" }] });
  const out = await run("../api/hooks/whop.js", req({ method: "POST", body: { type: "payment.succeeded", data: { id: "pay_9", status: "paid" } } }));
  assert.equal(out.json.outcome, "ignored");
  assert.ok(!calls.some((c) => c.method === "PATCH"), "unpaid payment changes nothing");
});

test("backups: only well-formed ciphertext is stored, by hashed id", async () => {
  const id = "a".repeat(64);
  let out = await run("../api/store/backup.js", req({ method: "PUT", query: { id }, headers: BRIM, body: { data: "{\"jars\":[]}" } }));
  assert.equal(out.statusCode, 400, "plain JSON is refused");
  out = await run("../api/store/backup.js", req({ method: "GET", query: { id: "../etc" }, headers: BRIM }));
  assert.equal(out.statusCode, 404);
  on("GET", /brimful_backups\?select=id&id=eq/, { json: [{ id }] });
  on("POST", /brimful_backups\?on_conflict=id/, { status: 201 });
  out = await run("../api/store/backup.js", req({ method: "PUT", query: { id }, headers: BRIM, body: { data: "v1.AAAAAAAAAAAAAAAA.BBBBBBBBBBBBBBBBBBBB" } }));
  assert.equal(out.statusCode, 200);
});

/* ---------- admin ---------- */
test("admin sign-in by email code: non-operators get no code; cookies are HttpOnly + SameSite=Strict", async () => {
  let out = await run("../api/admin/session.js", req({ method: "POST", headers: SELF, body: { email: "someone@else.com" } }));
  assert.equal(out.statusCode, 200, "same answer for any email");
  assert.equal(calls.length, 0, "but no code is sent to non-operators");
  out = await run("../api/admin/session.js", req({ method: "POST", headers: { origin: "https://evil.example" }, body: { email: "boss@example.com" } }));
  assert.equal(out.statusCode, 403, "cross-site requests blocked");
  on("POST", /auth\/v1\/otp/, { json: {} });
  out = await run("../api/admin/session.js", req({ method: "POST", headers: SELF, body: { email: "Second@Example.com" } }));
  assert.equal(out.statusCode, 200);
  assert.equal(calls[0].body.create_user, false, "never creates accounts");
  on("POST", /auth\/v1\/verify/, { json: { access_token: "AT", refresh_token: "RT", expires_in: 3600, user: { email: "second@example.com", email_confirmed_at: "2026-01-01" } } });
  out = await run("../api/admin/session.js", req({ method: "POST", headers: SELF, body: { email: "second@example.com", code: "1234 5678" } }));
  assert.equal(out.statusCode, 200);
  assert.equal(calls.at(-1).body.token, "12345678");
  const cookies = out.headers["set-cookie"];
  assert.equal(cookies.length, 2);
  for (const c of cookies) { assert.match(c, /^__Host-/); assert.match(c, /HttpOnly/); assert.match(c, /Secure/); assert.match(c, /SameSite=Strict/); }
  routes = [];
  on("POST", /auth\/v1\/verify/, { status: 403, json: {} });
  out = await run("../api/admin/session.js", req({ method: "POST", headers: SELF, body: { email: "second@example.com", code: "00000000" } }));
  assert.equal(out.statusCode, 401, "wrong code refused");
});

test("admin data needs a valid operator session", async () => {
  on("GET", /auth\/v1\/user/, { status: 401, json: {} });
  let out = await run("../api/admin/payments.js", req({ headers: { cookie: "__Host-sc_at=bad" } }));
  assert.equal(out.statusCode, 401);
  routes = [];
  on("GET", /auth\/v1\/user/, { json: { email: "intruder@example.com", email_confirmed_at: "x" } });
  out = await run("../api/admin/payments.js", req({ headers: { cookie: "__Host-sc_at=other" } }));
  assert.equal(out.statusCode, 401, "a real Supabase user who isn't an operator is refused");
});

test("approving a FIRST6 birr payment also takes a Whop spot; refunds of card orders go through Whop first", async () => {
  on("GET", /auth\/v1\/user/, { json: { email: "boss@example.com", email_confirmed_at: "x" } });
  on("POST", /rpc\/admin_review_manual_payment/, { json: { ok: true, promo_code: "FIRST6" } });
  on("GET", /promo_codes\/promo_IOC4zrQD2TMN/, { json: { stock: 5, uses: 0, status: "active" } });
  on("PATCH", /promo_codes\/promo_IOC4zrQD2TMN/, { json: {} });
  let out = await run("../api/admin/payments.js", req({ method: "POST", headers: { ...SELF, cookie: "__Host-sc_at=ok1" }, body: { kind: "quoterevive", id: KEY, action: "approve" } }));
  assert.equal(out.statusCode, 200);
  assert.equal(calls.find((c) => c.method === "PATCH" && c.url.includes("promo_codes")).body.stock, 4);
  assert.equal(calls.find((c) => c.url.includes("rpc/")).body.p_by, "boss@example.com");

  routes = []; calls = [];
  on("GET", /auth\/v1\/user/, { json: { email: "boss@example.com", email_confirmed_at: "x" } });
  on("GET", /store_orders\?select=id,method,status,reference/, { json: [{ id: KEY, method: "whop", status: "approved", reference: "pay_7" }] });
  on("POST", /payments\/pay_7\/refund/, { status: 422, json: {} });
  out = await run("../api/admin/payments.js", req({ method: "POST", headers: { ...SELF, cookie: "__Host-sc_at=ok2" }, body: { kind: "store", id: KEY, action: "refund" } }));
  assert.equal(out.statusCode, 502);
  assert.ok(!calls.some((c) => c.method === "PATCH"), "order not marked refunded when Whop refused");
});

test("reject needs a reason; card orders can't be approved by hand", async () => {
  on("GET", /auth\/v1\/user/, { json: { email: "boss@example.com", email_confirmed_at: "x" } });
  let out = await run("../api/admin/payments.js", req({ method: "POST", headers: { ...SELF, cookie: "__Host-sc_at=ok3" }, body: { kind: "store", id: KEY, action: "reject", note: "no" } }));
  assert.equal(out.statusCode, 400);
  on("GET", /store_orders\?select=id,method,status,reference/, { json: [{ id: KEY, method: "whop", status: "pending", reference: null }] });
  out = await run("../api/admin/payments.js", req({ method: "POST", headers: { ...SELF, cookie: "__Host-sc_at=ok3" }, body: { kind: "store", id: KEY, action: "approve" } }));
  assert.equal(out.statusCode, 409);
});

test("missing settings give a clear 503 instead of a crash", async () => {
  const saved = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const out = await run("../api/store/order.js", req({ query: { product: "brimful", key: KEY }, headers: BRIM }));
    assert.equal(out.statusCode, 503);
    assert.equal(out.json.missing, "SUPABASE_SERVICE_ROLE_KEY");
  } finally { process.env.SUPABASE_SERVICE_ROLE_KEY = saved; }
});

test("Whop store purchase: a receipt number gives exactly one licence key", async () => {
  on("GET", /api\/v1\/payments\/pay_store1/, { json: { id: "pay_store1", status: "paid", product_id: "prod_brim", refunded_at: null, metadata: null, total: 7 } });
  on("GET", /store_orders\?select=id,status&method=eq\.whop&reference=eq\.pay_store1/, { json: [] });
  on("POST", /rest\/v1\/store_orders$/, (u, i) => ({ status: 201, json: [{ id: KEY, ...JSON.parse(i.body) }] }));
  let out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "whop_claim", payment_id: "pay_store1" } }));
  assert.equal(out.statusCode, 200);
  assert.equal(out.json.key, KEY);
  const ins = calls.find((c) => c.method === "POST" && /store_orders$/.test(c.url)).body;
  assert.equal(ins.reference, "pay_store1");
  assert.equal(ins.status, "approved");
  assert.equal(ins.amount_usd, 7);

  routes = []; calls = [];
  on("GET", /api\/v1\/payments\/pay_otherqr1/, { json: { id: "pay_otherqr1", status: "paid", product_id: "prod_AOn93RN2TsMSs", refunded_at: null } });
  out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "whop_claim", payment_id: "pay_otherqr1" } }));
  assert.equal(out.statusCode, 404, "a QuoteRevive receipt can't unlock Brimful");
  assert.ok(!calls.some((c) => c.method === "POST" && /store_orders/.test(c.url)));

  routes = []; calls = [];
  on("GET", /api\/v1\/payments\/pay_store1/, { json: { id: "pay_store1", status: "paid", product_id: "prod_brim", refunded_at: null, metadata: null } });
  on("GET", /store_orders\?select=id,status&method=eq\.whop&reference=eq\.pay_store1/, { json: [{ id: KEY, status: "approved" }] });
  out = await run("../api/store/order.js", req({ method: "POST", query: { product: "brimful" }, headers: BRIM, body: { method: "whop_claim", payment_id: "pay_store1" } }));
  assert.equal(out.json.key, KEY, "claiming again returns the same key, never a second one");
  assert.ok(!calls.some((c) => c.method === "POST" && /store_orders/.test(c.url)));
});
