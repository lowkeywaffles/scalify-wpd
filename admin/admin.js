// Scalify payments admin. All text from the database is inserted with textContent (never as HTML).
const $ = (s) => document.querySelector(s);
const ETB = (n) => `${Number(n).toLocaleString("en-US")} ETB`;
const USD = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number(n) % 1 ? 2 : 0 })}`;
const when = (s) => (s ? new Date(s).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Addis_Ababa" }) : "");
const METHOD = { telebirr: "Telebirr", boa: "Bank of Abyssinia", whop: "Card (Whop)" };
const SETUP_HELP = {
  SUPABASE_SERVICE_ROLE_KEY: "Database access. Copy it from the QuoteRevive project in Vercel (or Supabase → Project Settings → API keys).",
  OPERATOR_EMAILS: "Who can sign in here.",
  WHOP_API_KEY: "Card payments and FIRST6 counts. Copy it from the QuoteRevive project in Vercel.",
  BRIMFUL_WHOP_PLAN_ID: "The $7 Brimful Plus plan on Whop.",
  BRIMFUL_WHOP_PRODUCT_ID: "The Brimful Plus product on Whop.",
  TELEGRAM_BOT_TOKEN: "Payment alerts. Create a bot with @BotFather in Telegram and paste its token in Vercel as a Sensitive variable.",
};

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}

let toastT;
function toast(text, err = false) {
  const t = $("#toast");
  t.textContent = text;
  t.className = `toast on${err ? " err" : ""}`;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.className = "toast"), 5000);
}

async function api(path, init = {}) {
  try {
    const r = await fetch(path, { ...init, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(init.headers || {}) } });
    const body = await r.json().catch(() => ({}));
    if (r.status === 401 && path !== "/api/admin/session") showLogin();
    return { ok: r.ok, status: r.status, body };
  } catch {
    return { ok: false, status: 0, body: { error: "You're offline, or the server can't be reached." } };
  }
}

/* ---------- sign in ---------- */
function showLogin() {
  $("#app").hidden = true; $("#signout").hidden = true; $("#me").textContent = "";
  $("#login").hidden = false;
  stopAuto();
}
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = $("#login-msg"), btn = e.submitter || $("#login-form button");
  const email = $("#email").value.trim(), password = $("#password").value;
  if (!email || !password) { msg.textContent = "Enter your email and password."; return; }
  btn.disabled = true; msg.textContent = "";
  const r = await api("/api/admin/session", { method: "POST", body: JSON.stringify({ email, password }) });
  btn.disabled = false;
  if (!r.ok) { msg.textContent = r.body.error || "Couldn't sign in."; $("#password").focus(); return; }
  $("#password").value = "";
  start(r.body.email);
});
$("#signout").addEventListener("click", async () => { await api("/api/admin/session", { method: "DELETE" }); showLogin(); toast("Signed out."); });

/* ---------- data ---------- */
let data = null, filter = "all", autoT = null;
const stopAuto = () => { clearInterval(autoT); autoT = null; };

function start(email) {
  $("#login").hidden = true; $("#app").hidden = false; $("#signout").hidden = false;
  $("#me").textContent = email;
  load(); loadTelegram();
  stopAuto();
  autoT = setInterval(() => { if (!document.hidden && !document.activeElement?.matches("input")) load(true); }, 60_000);
}

async function load(quiet = false) {
  const r = await api("/api/admin/payments");
  if (!r.ok) { if (r.status !== 401) toast(r.body.error || "Couldn't load payments.", true); return; }
  data = r.body;
  if (!quiet) $("#me").textContent = data.me;
  render();
}
$("#refresh").addEventListener("click", () => load().then(() => toast("Up to date.")));

function rows() {
  const q = (data?.quoterevive ?? []).map((r) => ({ ...r, kind: "quoterevive", key: "quoterevive", name: r.product, sub: r.workspace }));
  const s = (data?.store ?? []).map((r) => ({ ...r, kind: "store", key: r.product, name: r.product_name, sub: null }));
  return [...q, ...s];
}
const amount = (r) => (r.amount_usd != null ? USD(r.amount_usd) : ETB(r.amount_etb));

function render() {
  const all = rows();
  const waiting = all.filter((r) => r.status === "pending").sort((a, b) => a.created_at.localeCompare(b.created_at));
  const done = all.filter((r) => r.status !== "pending" && (filter === "all" || r.key === filter)).sort((a, b) => (b.reviewed_at || b.created_at).localeCompare(a.reviewed_at || a.created_at));

  // setup checklist
  const todo = (data.missing ?? []).map((k) => h("li", {}, h("b", { class: "mono" }, k), " — ", SETUP_HELP[k] || ""));
  $("#setup-list").replaceChildren(...todo);
  $("#setup").hidden = todo.length === 0;

  // stats (this calendar month, Addis Ababa time is close enough for a summary)
  const month = new Date().toISOString().slice(0, 7);
  const paid = all.filter((r) => r.status === "approved" && (r.reviewed_at || r.created_at).slice(0, 7) === month);
  const etb = paid.reduce((n, r) => n + (r.amount_etb != null ? Number(r.amount_etb) : 0), 0);
  const usd = paid.reduce((n, r) => n + (r.amount_usd != null ? Number(r.amount_usd) : 0), 0);
  $("#stats").replaceChildren(
    h("div", { class: "stat" }, h("b", {}, String(waiting.length)), h("span", {}, "waiting for review")),
    h("div", { class: "stat" }, h("b", {}, ETB(etb)), h("span", {}, "approved this month (birr)")),
    h("div", { class: "stat" }, h("b", {}, USD(usd)), h("span", {}, "card payments this month")),
    data.first6 ? h("div", { class: "stat" }, h("b", {}, String(data.first6.left)), h("span", {}, "FIRST6 spots left")) : null,
  );

  $("#wait-n").textContent = String(waiting.length);
  $("#waiting").replaceChildren(...(waiting.length ? waiting.map(card) : [h("p", { class: "empty" }, "Nothing to check right now.")]));
  $("#done").replaceChildren(...(done.length ? done.slice(0, 120).map(card) : [h("p", { class: "empty" }, "No history yet.")]));
  document.title = waiting.length ? `(${waiting.length}) Payments admin · SCALIFY WPD` : "Payments admin · SCALIFY WPD";
}

function field(label, value, mono = false) {
  return h("div", {}, h("dt", {}, `${label}: `), h("dd", { class: mono ? "mono" : null }, value));
}

function card(r) {
  const id = `r-${r.id}`;
  const facts = [
    field("Method", METHOD[r.method] || r.method),
    field(r.status === "pending" ? "Amount expected" : "Amount", `${amount(r)}${r.promo_code ? ` (${r.promo_code})` : ""}`),
    r.payer_name ? field("From", r.payer_name) : null,
    r.reference ? field(r.method === "whop" ? "Whop receipt" : "Transaction ID", r.reference, true) : null,
    r.sub ? field("Workspace", r.sub) : null,
    r.kind === "store" ? field("Age check", r.age_confirmed ? "Buyer confirmed 18+ or parent/guardian OK" : "Not asked (older order)") : null,
    r.review_note ? field("Reason given", r.review_note) : null,
    r.reviewed_by ? field("Reviewed", `${when(r.reviewed_at)} by ${r.reviewed_by}`) : null,
  ];
  const acts = h("div", { class: "acts" });
  if (r.status === "pending" && r.method !== "whop") {
    const reason = h("input", { type: "text", id: `${id}-why`, maxlength: "300", placeholder: "e.g. No payment found with this ID", autocomplete: "off" });
    acts.append(
      h("button", { class: "btn", type: "button", onclick: (e) => review(e.currentTarget, r, "approve") }, "Money received: unlock"),
      h("div", { class: "reason" }, h("label", { for: `${id}-why` }, "Reason the buyer will see"), reason),
      h("button", { class: "btn ghost", type: "button", onclick: (e) => review(e.currentTarget, r, "reject", reason) }, "Not received"),
    );
  } else if (r.status === "approved") {
    acts.append(h("button", { class: "btn danger", type: "button", onclick: (e) => review(e.currentTarget, r, "refund") }, r.method === "whop" ? "Refund on Whop" : "Mark refunded"));
  }
  return h("article", { class: "item", "aria-labelledby": `${id}-h` },
    h("div", { class: "top" },
      h("span", {}, h("span", { class: "prod", id: `${id}-h` }, r.name), " ", h("span", { class: `badge ${r.status}` }, r.status === "approved" ? "approved" : r.status)),
      h("time", { class: "muted small", datetime: r.created_at }, when(r.created_at))),
    h("dl", {}, ...facts),
    acts.childElementCount ? acts : null);
}

async function review(btn, r, action, reasonEl) {
  const note = reasonEl?.value.trim() ?? "";
  if (action === "reject" && note.length < 3) { toast("Write a short reason first (the buyer sees it).", true); reasonEl.focus(); return; }
  if (action === "approve" && !confirm(`Unlock ${r.name}? Only do this if ${amount(r)} from ${r.payer_name} with ID ${r.reference} is in your ${METHOD[r.method]} history.`)) return;
  if (action === "refund" && !confirm(r.method === "whop" ? `Refund ${amount(r)} to the buyer's card through Whop? This can't be undone.` : `Mark this refunded? Their access ends. You still need to send ${amount(r)} back yourself.`)) return;
  btn.disabled = true;
  const res = await api("/api/admin/payments", { method: "POST", body: JSON.stringify({ kind: r.kind, id: r.id, action, note }) });
  btn.disabled = false;
  toast(res.ok ? res.body.message : res.body.error || "Couldn't do that.", !res.ok);
  await load(true);
}

document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => {
  filter = c.dataset.f;
  document.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
  render();
}));

/* ---------- Telegram ---------- */
async function loadTelegram() {
  const r = await api("/api/admin/telegram");
  const box = $("#tg-body");
  if (!r.ok) { box.replaceChildren(h("p", { class: "muted" }, r.body.error || "Couldn't check Telegram.")); return; }
  const t = r.body;
  if (!t.configured) {
    box.replaceChildren(
      h("p", {}, "Get a Telegram message for every new payment. Alerts say only the product, amount and method: never names or transaction IDs."),
      h("ol", {},
        h("li", {}, "In Telegram, open ", h("b", {}, "@BotFather"), ", send ", h("span", { class: "mono" }, "/newbot"), ", and follow the steps."),
        h("li", {}, "Copy the token it gives you. Don't share it in chats."),
        h("li", {}, "In Vercel → scalify-wpd → Settings → Environment Variables, add ", h("span", { class: "mono" }, "TELEGRAM_BOT_TOKEN"), " as a Sensitive variable, then redeploy."),
        h("li", {}, "Come back here and press Link Telegram.")));
    return;
  }
  if (t.linked) {
    box.replaceChildren(
      h("p", {}, `Alerts are on${t.bot ? ` (bot @${t.bot})` : ""}${t.linked_by ? `, linked by ${t.linked_by}` : ""}.`),
      h("div", { class: "acts" },
        h("button", { class: "btn ghost", type: "button", onclick: () => tg("test") }, "Send a test alert"),
        h("button", { class: "btn danger", type: "button", onclick: () => tg("unlink").then(loadTelegram) }, "Turn alerts off")));
    return;
  }
  box.replaceChildren(h("p", {}, "The bot is ready. Link it to your Telegram so alerts reach you."), h("button", { class: "btn", type: "button", onclick: startLink }, "Link Telegram"));
}
async function tg(action) {
  const r = await api("/api/admin/telegram", { method: "POST", body: JSON.stringify({ action }) });
  toast(r.ok ? r.body.message : r.body.error || "Couldn't do that.", !r.ok);
  return r;
}
async function startLink() {
  const r = await tg("start");
  if (!r.ok) return;
  $("#tg-body").replaceChildren(
    h("p", {}, "1. Open this link on the phone where you use Telegram, then press ", h("b", {}, "Start"), ":"),
    h("p", {}, h("a", { href: r.body.link, target: "_blank", rel: "noopener noreferrer" }, `t.me/${r.body.bot}`)),
    h("p", { class: "muted small" }, "Or send this message to the bot yourself:"),
    h("p", { class: "code mono" }, `/start ${r.body.code}`),
    h("p", {}, "2. Then come back and press:"),
    h("button", { class: "btn", type: "button", onclick: async () => { const f = await tg("finish"); if (f.ok) loadTelegram(); } }, "I pressed Start"),
    h("p", { class: "muted small" }, "The code works for 15 minutes."));
}

/* ---------- boot ---------- */
(async () => {
  const r = await api("/api/admin/session");
  if (r.ok) start(r.body.email); else showLogin();
})();
document.addEventListener("visibilitychange", () => { if (!document.hidden && data && !$("#app").hidden) load(true); });
