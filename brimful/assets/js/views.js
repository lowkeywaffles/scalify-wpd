// Screens: Challenges, Challenge detail, Split, Settings, Unlock. They get everything they need from `app`.
import * as S from "./lib/store.js";
import { toMinor, CURRENCIES } from "./lib/money.js";
import { CHALLENGE_TYPES, challengeProgress, shuffledOrder, envelopeAmounts, weekAmounts, daysInMonth, sum } from "./lib/challenges.js";
import { confetti, buzz, clink, esc } from "./lib/fx.js";
import { fetchProduct, createOrder, fetchStatus } from "./lib/api.js";
import { backupNow, fetchRestore, newCode, normalize, removeCloud } from "./lib/cloud.js";

const $ = (sel, root = document) => root.querySelector(sel);
const check = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 13 4 4L19 7"/></svg>`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ---------- Challenges list ---------- */
export function challengesView(app) {
  const { challenges, jars } = app.state;
  const cards = challenges.map((c) => {
    const p = challengeProgress(c), jar = jars.find((j) => j.id === c.jarId);
    return `<a class="chcard" href="#/challenge/${esc(c.id)}"><span class="eyebrow">${esc(CHALLENGE_TYPES[c.type].name)}</span>
      <h2>${esc(titleOf(c))}</h2>
      <p class="fine">Into <b>${esc(jar?.name ?? "a jar")}</b> · ${p.doneCount} of ${p.count} done · ${app.money(p.saved, { short: true })} of ${app.money(p.total, { short: true })}</p>
      <progress max="100" value="${Math.round(p.ratio * 100)}" aria-label="${Math.round(p.ratio * 100)}% complete"></progress></a>`;
  }).join("");
  return `<h1 tabindex="-1">Challenges</h1>
    <p class="lead">Small, repeatable steps that add up. Every step you tick drops its amount into one of your jars, and you can always un-tick it.</p>
    ${cards || `<div class="card empty"><h2>No challenge running</h2><p class="lead">Try the 100 envelopes: pick any envelope, save what's inside, repeat.</p></div>`}
    <button class="btn block" data-act="new-challenge">Start a challenge</button>`;
}
const titleOf = (c) => (c.type === "envelopes" ? `${c.config.count} envelopes` : c.type === "weeks52" ? `52 weeks · ${c.config.mode}` : `No-spend ${MONTHS[c.config.month - 1]} ${c.config.year}`);

function challengeSheet(app) {
  const { jars } = app.state;
  if (!jars.length) return app.sheet(`<h2 id="dlg-title">Create a jar first</h2><p>Challenges drop their savings into a jar, so you need one to start.</p><div class="row"><button type="button" class="btn ghost" data-close>Close</button><a class="btn" href="#/" data-close>Go to jars</a></div>`);
  if (!S.canAddChallenge(app.state)) return app.upsell("Free includes 1 challenge at a time", "Brimful Plus lets you run as many challenges as you like, plus unlimited jars, the paycheck splitter and all jar colours. One payment, no subscription.");
  const cur = app.cur(), now = new Date();
  const types = Object.entries(CHALLENGE_TYPES).map(([k, t], i) => `<label class="type"><input type="radio" name="type" value="${k}"${i === 0 ? " checked" : ""} data-change="ch-type"><span><b>${esc(t.name)}</b><small>${esc(t.blurb)}</small></span></label>`).join("");
  const form = app.sheet(`<h2 id="dlg-title">Start a challenge</h2>
    <fieldset class="types"><legend>Which one?</legend>${types}</fieldset>
    <div class="field"><label for="c-jar">Save into</label><select id="c-jar" name="jar" class="input">${jars.map((j) => `<option value="${esc(j.id)}">${esc(j.name)}</option>`).join("")}</select></div>
    <div data-for="envelopes" class="view">
      <div class="field"><label for="c-count">Number of envelopes</label><input id="c-count" name="count" class="input num" inputmode="numeric" value="100" data-input="ch-preview"><span class="err" data-err="count" role="alert"></span></div>
      <div class="field"><label for="c-target">Total to save (${cur})</label><input id="c-target" name="target" class="input num" inputmode="decimal" value="5050" data-input="ch-preview"><span class="hint">Classic is 100 envelopes adding up to 5,050. Change either number to fit your budget.</span><span class="err" data-err="target" role="alert"></span></div>
    </div>
    <div data-for="weeks52" class="view" hidden>
      <div class="field"><label for="c-mode">Pattern</label><select id="c-mode" name="mode" class="input" data-change="ch-preview"><option value="classic">Classic: starts small, grows each week</option><option value="reverse">Reverse: starts big, gets easier</option><option value="flat">Flat: the same every week</option></select></div>
      <div class="field"><label for="c-step">Step amount (${cur})</label><input id="c-step" name="step" class="input num" inputmode="decimal" value="10" data-input="ch-preview"><span class="hint">Classic week 1 saves one step, week 2 two steps, and so on.</span><span class="err" data-err="step" role="alert"></span></div>
    </div>
    <div data-for="nospend" class="view" hidden>
      <div class="field"><label for="c-month">Month</label><select id="c-month" name="month" class="input" data-change="ch-preview">${[0, 1, 2].map((k) => { const d = new Date(now.getFullYear(), now.getMonth() + k, 1); return `<option value="${d.getFullYear()}-${d.getMonth() + 1}">${MONTHS[d.getMonth()]} ${d.getFullYear()}</option>`; }).join("")}</select></div>
      <div class="field"><label for="c-perday">Bank per no-spend day (${cur}) <span class="hint">(optional)</span></label><input id="c-perday" name="perday" class="input num" inputmode="decimal" value="" placeholder="0" data-input="ch-preview"><span class="hint">Roughly what you'd have spent. Leave empty to just track the days.</span><span class="err" data-err="perday" role="alert"></span></div>
    </div>
    <p class="note" id="ch-preview" aria-live="polite"></p>
    <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Start</button></div>`,
  (fd, f) => {
    const cfg = readChallengeForm(app, fd, f, true);
    if (!cfg) return false;
    const r = S.addChallenge(app.state, { type: cfg.type, jarId: String(fd.get("jar")), config: cfg.config });
    app.commit(r.state);
    app.go(`#/challenge/${r.challenge.id}`);
  });
  previewChallenge(app, form);
}

function readChallengeForm(app, fd, form, showErrors) {
  const type = String(fd.get("type")), cur = app.cur();
  const fail = (name, msg) => (showErrors ? app.fieldError(form, name, msg) : null) && null;
  if (type === "envelopes") {
    const count = Number(fd.get("count")), target = toMinor(String(fd.get("target") ?? ""), cur);
    if (!Number.isInteger(count) || count < 5 || count > 200) return fail("count", "Choose between 5 and 200 envelopes.");
    if (!target || target < count) return fail("target", "Enter a total, like 5050.");
    return { type, config: { count, target, seed: Math.floor(Math.random() * 2 ** 31) }, total: target };
  }
  if (type === "weeks52") {
    const step = toMinor(String(fd.get("step") ?? ""), cur), mode = String(fd.get("mode"));
    if (!step) return fail("step", "Enter a step amount above zero, like 10.");
    return { type, config: { mode, step }, total: sum(weekAmounts(mode, step)) };
  }
  const [year, month] = String(fd.get("month")).split("-").map(Number);
  const raw = String(fd.get("perday") ?? "").trim();
  const perDay = raw === "" ? 0 : toMinor(raw, cur);
  if (perDay === null) return fail("perday", "Enter an amount like 100, or leave it empty.");
  return { type, config: { year, month, perDay }, total: perDay * daysInMonth(year, month) };
}
function previewChallenge(app, form) {
  const fd = new FormData(form), type = String(fd.get("type"));
  form.querySelectorAll("[data-for]").forEach((el) => (el.hidden = el.dataset.for !== type));
  const cfg = readChallengeForm(app, fd, form, false), out = $("#ch-preview", form);
  if (!cfg) { out.textContent = "Fill in the numbers above to see your total."; return; }
  if (type === "envelopes") { const a = envelopeAmounts(cfg.config.count, cfg.config.target); out.textContent = `${cfg.config.count} envelopes from ${app.money(a[0], { short: true })} to ${app.money(a[a.length - 1], { short: true })}. Finish them all and you've saved ${app.money(cfg.total, { short: true })}.`; }
  else if (type === "weeks52") out.textContent = `52 weekly steps. Finish them all and you've saved ${app.money(cfg.total, { short: true })}.`;
  else out.textContent = cfg.total ? `Up to ${app.money(cfg.total, { short: true })} if every day is a no-spend day.` : "You'll track no-spend days without adding money to a jar.";
}

/* ---------- Challenge detail ---------- */
function tileLabel(app, c, i, amt, done) {
  const what = c.type === "envelopes" ? `Envelope ${i + 1}` : c.type === "weeks52" ? `Week ${i + 1}` : `Day ${i + 1}`;
  return `${what}${amt ? `, ${app.money(amt, { short: true })}` : ""}, ${done ? "done" : "not done"}`;
}
function tile(app, c, i, amt) {
  const done = Boolean(c.done[i]);
  const face = c.type === "envelopes" ? `<span>${i + 1}</span>` : c.type === "weeks52" ? `<span>W${i + 1}<small>${app.money(amt, { short: true })}</small></span>` : `<span>${i + 1}</span>`;
  return `<li><button class="tile${c.type === "envelopes" ? " envl" : ""}" data-act="step" data-i="${i}" aria-pressed="${done}" aria-label="${esc(tileLabel(app, c, i, amt, done))}">
    <span class="in"><span class="f">${face}</span><span class="b"><span>${check}${amt ? app.money(amt, { short: true }) : "Done"}</span></span></span></button></li>`;
}
function challengeHead(app, c) {
  const p = challengeProgress(c);
  return `<span class="big num">${app.money(p.saved, { short: true })}</span>
    <span class="sub">of ${app.money(p.total, { short: true })} · ${p.doneCount} of ${p.count} done</span>
    <progress max="100" value="${Math.round(p.ratio * 100)}" aria-label="${Math.round(p.ratio * 100)}% complete"></progress>`;
}
export function challengeView(app, id) {
  const c = app.state.challenges.find((x) => x.id === id);
  if (!c) return null;
  const p = challengeProgress(c), jar = app.state.jars.find((j) => j.id === c.jarId);
  let grid;
  if (c.type === "envelopes") grid = `<ul class="grid env">${shuffledOrder(p.count, c.config.seed).map((i) => tile(app, c, i, p.amounts[i])).join("")}</ul>`;
  else if (c.type === "weeks52") grid = `<ul class="grid weeks">${p.amounts.map((a, i) => tile(app, c, i, a)).join("")}</ul>`;
  else {
    const lead = (new Date(c.config.year, c.config.month - 1, 1).getDay() + 6) % 7; // Monday first
    grid = `<div class="dow" aria-hidden="true">${["M", "T", "W", "T", "F", "S", "S"].map((d) => `<span>${d}</span>`).join("")}</div>
      <ul class="grid days">${"<li><span class=\"tile blank\"></span></li>".repeat(lead)}${p.amounts.map((a, i) => tile(app, c, i, a)).join("")}</ul>`;
  }
  return `<a class="back" href="#/challenges">← Challenges</a>
    <h1 tabindex="-1">${esc(titleOf(c))}</h1>
    <section class="summary" id="ch-head" data-ch="${esc(c.id)}" aria-live="polite">${challengeHead(app, c)}</section>
    <p class="fine">Saving into <a href="#/jar/${esc(c.jarId)}"><b>${esc(jar?.name ?? "jar")}</b></a>. Tap a tile when you've put that money aside. Tap again to undo.</p>
    ${c.type === "envelopes" && !p.complete ? `<button class="btn brass block" data-act="draw">Draw an envelope for me</button>` : ""}
    ${grid}
    <div class="row"><button class="btn danger small" data-act="delete-challenge">End this challenge</button></div>`;
}

/* ---------- Split (paycheck stuffing) ---------- */
export function splitView(app) {
  const { jars } = app.state, plus = S.isPlus(app.state);
  if (!plus) {
    return `<h1 tabindex="-1">Split</h1>
      <p class="lead">Got paid, or got pocket money? Type the amount once and Brimful shares it between your jars by the percentages you choose.</p>
      <div class="panel"><h2>Part of Brimful Plus</h2><p class="fine">Plus also includes unlimited jars, every challenge at once and all jar colours. One payment, no subscription.</p>
        <a class="btn brass" href="#/unlock">Get Plus · $7 one-time</a></div>`;
  }
  if (!jars.length) return `<h1 tabindex="-1">Split</h1><div class="card empty"><h2>No jars yet</h2><p class="lead">Create a jar first, then come back to split money between your jars.</p><a class="btn" href="#/">Go to jars</a></div>`;
  const saved = new Map(app.state.split.map((r) => [r.jarId, r.pct]));
  const rows = jars.map((j) => `<div class="splitrow"><label for="sp-${esc(j.id)}"><b>${esc(j.name)}</b><div class="share num" data-share="${esc(j.id)}">—</div></label>
      <span class="pct"><input class="input num" inputmode="numeric" id="sp-${esc(j.id)}" data-jar="${esc(j.id)}" data-input="split" value="${saved.get(j.id) ?? 0}" aria-label="Percent for ${esc(j.name)}"><span aria-hidden="true">%</span></span>
      <input type="range" min="0" max="100" step="5" value="${saved.get(j.id) ?? 0}" data-jar="${esc(j.id)}" data-input="split-range" aria-label="Percent for ${esc(j.name)}, slider"></div>`).join("");
  return `<h1 tabindex="-1">Split</h1>
    <p class="lead">Type what came in, set a percentage for each jar, and split it in one tap. Your percentages are remembered.</p>
    <form class="panel" id="splitform" novalidate>
      <div class="field"><label for="sp-amt">Amount received (${app.cur()})</label><input id="sp-amt" name="amt" class="input num" inputmode="decimal" autocomplete="off" placeholder="e.g. 8000" data-input="split"><span class="err" data-err="amt" role="alert"></span></div>
      ${rows}
      <p class="note" id="sp-left" aria-live="polite"></p>
      <button class="btn block" data-act="do-split" type="button">Split it</button>
    </form>`;
}
function readSplit(app) {
  const form = $("#splitform");
  const rows = [...form.querySelectorAll("input[data-input='split'][data-jar]")].map((i) => ({ jarId: i.dataset.jar, pct: Math.max(0, Math.min(100, Math.round(Number(i.value) || 0))) }));
  const amount = toMinor(form.elements.amt.value, app.cur());
  const total = rows.reduce((s, r) => s + r.pct, 0);
  return { form, rows, amount, total };
}
function updateSplit(app) {
  const { form, rows, amount, total } = readSplit(app);
  const parts = new Map((amount && total <= 100 ? S.splitAmount(amount, rows) : []).map((p) => [p.jarId, p.amt]));
  form.querySelectorAll("[data-share]").forEach((el) => { el.textContent = parts.has(el.dataset.share) ? app.money(parts.get(el.dataset.share), { sign: true }) : "—"; });
  const left = $("#sp-left");
  left.className = `note${total > 100 ? " bad" : ""}`;
  left.textContent = total > 100 ? `That's ${total}%. Bring the total down to 100% or less.` : total === 100 ? "All of it is shared out." : `${100 - total}% stays unallocated${amount ? ` (${app.money(amount - [...parts.values()].reduce((s, n) => s + n, 0))})` : ""}.`;
}

/* ---------- Settings ---------- */
const ago = (t) => {
  if (!t) return "not yet";
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString();
};
function cloudPanel(app) {
  const c = app.state.settings.cloud;
  if (c) return `<div class="cloud on"><h3 class="label">Cloud backup: on</h3>
    <p class="fine" id="cloud-at" aria-live="polite">Encrypted on this device before upload. Last backed up: ${ago(c.at)}.</p>
    <div class="row"><button class="btn ghost small" data-act="cloud-now">Back up now</button><button class="btn ghost small" data-act="cloud-code">Show recovery code</button><button class="btn ghost small" data-act="cloud-off">Turn off</button></div></div>`;
  return `<div class="cloud"><h3 class="label">Cloud backup (optional)</h3>
    <p class="fine">Keep an encrypted copy online, so you can get your jars back on a new phone with a recovery code. No account and no email. The copy is locked with your code before it leaves this device, so nobody else can read it, including us.</p>
    <div class="row"><button class="btn ghost small" data-act="cloud-on">Turn on cloud backup</button><button class="btn ghost small" data-act="cloud-restore">Restore with a recovery code</button></div></div>`;
}

export function settingsView(app) {
  const st = app.state.settings, l = app.state.license, plus = S.isPlus(app.state);
  const seg = (name, opts, val) => `<div class="seg" role="radiogroup" aria-label="${name}">${opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}"${v === val ? " checked" : ""} data-change="setting"><span>${t}</span></label>`).join("")}</div>`;
  return `<h1 tabindex="-1">Settings</h1>
    <section class="panel" aria-labelledby="s-plan"><h2 id="s-plan">${plus ? "Brimful Plus is active" : "You're on Free"}</h2>
      <p class="fine">${plus ? "Thank you for supporting Brimful. Keep your licence key somewhere safe so you can restore Plus on a new device." : l?.status === "pending" ? "We're checking your payment. Plus unlocks as soon as it's confirmed." : "Free includes 2 jars and 1 challenge at a time, with the brass coin colour."}</p>
      <a class="btn ${plus ? "ghost" : "brass"} small" href="#/unlock" data-vars="justify-self:start">${plus ? "Licence details" : l?.status === "pending" ? "Payment status" : "Get Plus · $7 one-time"}</a></section>
    <section class="panel" aria-labelledby="s-app" data-install><h2 id="s-app">Get the app</h2>
      <p class="fine">Add Brimful to your home screen so it opens like an app, full screen and offline. Free, no app store.</p>
      <button class="btn ghost small" type="button" data-act="install" data-vars="justify-self:start">Add to home screen</button></section>
    <section class="panel" aria-labelledby="s-look"><h2 id="s-look">Look and feel</h2>
      <div class="setting"><div><span class="label" id="l-cur">Currency</span><p>Changing this relabels your amounts. It doesn't convert them.</p></div><select class="input" data-vars="width:auto" aria-labelledby="l-cur" data-change="currency">${CURRENCIES.map((c) => `<option${c === st.currency ? " selected" : ""}>${c}</option>`).join("")}</select></div>
      <div class="setting"><span class="label">Theme</span>${seg("theme", [["system", "Auto"], ["light", "Light"], ["dark", "Dark"]], st.theme)}</div>
      <div class="setting"><div><span class="label">3D motion</span><p>Turn off to stop coins falling, tilting and flipping.</p></div>${seg("motion", [["auto", "On"], ["off", "Reduced"]], st.motion)}</div>
      <div class="setting"><div><span class="label" id="l-snd">Coin sounds</span><p>A soft clink when money lands.</p></div><label class="switch"><input type="checkbox" name="sound"${st.sound ? " checked" : ""} data-change="setting" aria-labelledby="l-snd"><span></span></label></div></section>
    <section class="panel" aria-labelledby="s-data"><h2 id="s-data">Your data</h2>
      <p class="fine">Everything is stored in this browser on this device. If you clear your browser data or lose your phone, it's gone unless you have a backup.</p>
      ${cloudPanel(app)}
      <h3 class="label">Backup file</h3>
      <div class="row"><button class="btn ghost small" data-act="export">Download a backup</button><label class="btn ghost small" for="imp">Restore a backup file</label><input id="imp" class="sr" type="file" accept="application/json,.json" data-change="import"></div>
      <button class="btn danger small" data-act="wipe" data-vars="justify-self:start">Delete everything on this device</button></section>
    <section class="panel" aria-labelledby="s-about"><h2 id="s-about">About</h2>
      <p class="fine">Brimful is a tracker. It doesn't hold, move or invest money, and nothing here is financial advice. Made by SCALIFY WPD, Addis Ababa.</p>
      <nav class="legal" aria-label="Legal"><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/refund">Refunds</a><a href="/legal/cookies">Storage &amp; cookies</a><a href="/legal/accessibility">Accessibility</a></nav>
      <p class="fine">Version 1.0 · Help: skelifywpd@gmail.com</p></section>`;
}

/* ---------- Unlock (Brimful Plus) ---------- */
let product = null, pollTimer = null;
const AGE_BOX = `<label class="check"><input type="checkbox" name="age_ok"><span>I'm 18 or older, or a parent or guardian has agreed to this purchase.</span></label><span class="err" data-err="age_ok" role="alert"></span>`;
export function unlockView(app) {
  const l = app.state.license, status = l?.status;
  const perks = `<ul><li>Unlimited jars</li><li>Run every challenge at the same time</li><li>Split: share money between jars in one tap</li><li>All six coin colours</li></ul>`;
  const keyBox = l ? `<div class="field"><span class="label">Your licence key</span><div class="key" id="lic-key">${esc(l.key)}</div><button class="btn ghost small" type="button" data-act="copy-key" data-vars="justify-self:start">Copy key</button><span class="hint">Save this somewhere safe. It restores Plus on another device or after clearing your browser. Cloud backup (in Settings) keeps it for you too.</span></div>` : "";
  if (status === "active") return `<a class="back" href="#/settings">← Settings</a><h1 tabindex="-1">Brimful Plus</h1>
    <div class="plus-hero"><svg class="rosette" data-guilloche="9,4,6,4" aria-hidden="true"></svg><h2>Plus is active</h2>${perks}</div>
    <section class="panel">${keyBox}<p class="fine">Refunds: within 14 days of paying, email skelifywpd@gmail.com with this key. See the <a href="/legal/refund">refund policy</a>.</p></section>`;
  if (status === "pending") {
    const card = l.method === "whop";
    return `<a class="back" href="#/settings">← Settings</a><h1 tabindex="-1">${card ? "Finishing your card payment" : "Checking your payment"}</h1>
    <p class="note warn" id="pay-state" aria-live="polite">${card
      ? "As soon as Whop confirms your card payment, Plus unlocks here. This usually takes a few seconds after you pay."
      : "We check every payment by hand, usually within 24 hours. This page updates by itself, and Plus unlocks as soon as it's confirmed."}</p>
    <section class="panel">${keyBox}<div class="row"><button class="btn" data-act="check-pay">Check now</button>${card ? `<button class="btn ghost" type="button" data-act="cancel-card">I didn't pay: choose again</button>` : ""}</div></section>`;
  }
  return `<a class="back" href="#/settings">← Settings</a><h1 tabindex="-1">Brimful Plus</h1>
    <div class="plus-hero"><svg class="rosette" data-guilloche="9,4,6,4" aria-hidden="true"></svg>
      <span class="price num" id="price">…</span><h2>Pay once. Keep it.</h2>${perks}</div>
    ${status === "rejected" ? `<p class="note bad">We couldn't confirm your last payment${l.note ? `: ${esc(l.note)}` : "."} You can send the details again below, or email skelifywpd@gmail.com.</p>` : ""}
    ${status === "refunded" ? `<p class="note warn">Your earlier purchase was refunded, so this device is back on Free. Your jars are all still here.</p>` : ""}
    <section class="panel" id="paypanel" aria-labelledby="pay-h"><h2 id="pay-h">How to pay</h2><p class="fine" id="pay-load">Loading payment details…</p></section>
    <section class="panel" aria-labelledby="res-h"><h2 id="res-h">Already bought it?</h2>
      <form id="restore" novalidate class="view"><div class="field"><label for="r-key">Licence key or Whop receipt number</label><input id="r-key" name="key" class="input num" autocomplete="off" spellcheck="false" placeholder="xxxxxxxx-xxxx-… or pay_…" aria-describedby="r-hint"><span class="hint" id="r-hint">Bought Plus on Whop's website? Paste the receipt number from Whop's email (it starts with pay_).</span><span class="err" data-err="key" role="alert"></span></div>
      <button class="btn ghost" type="button" data-act="restore">Restore Plus</button></form></section>
    <p class="fine">Brimful is free to use without Plus, and your existing jars are never locked. <a href="/legal/terms">Terms</a> · <a href="/legal/refund">14-day refund</a> · <a href="/legal/privacy">Privacy</a></p>`;
}

async function loadPay(app) {
  const panel = $("#paypanel");
  if (!panel) return;
  const r = product ? { ok: true, body: product } : await fetchProduct();
  if (!panel.isConnected) return;
  if (!r.ok) { $("#pay-load").textContent = "You need to be online to buy Plus. Check your connection and open this page again."; $("#price").textContent = "Brimful Plus"; return; }
  product = r.body;
  const etb = `${Number(product.price_etb).toLocaleString("en-US")} ETB`;
  const usdN = product.card?.price_usd ?? 7, usd = `$${usdN}`;
  const card = Boolean(product.card), first = card ? "whop" : "telebirr";
  $("#price").innerHTML = `${usd} <small>one-time · no subscription</small>`;
  const m = product.methods;
  const opt = (v, label) => `<label><input type="radio" name="method" value="${v}"${v === first ? " checked" : ""} data-change="pay-method"><span>${label}</span></label>`;
  panel.innerHTML = `<h2 id="pay-h">How to pay</h2>
    <form id="payform" novalidate class="view">
      <div class="seg" role="radiogroup" aria-label="Payment method">${card ? opt("whop", "Card") : ""}${opt("telebirr", "Telebirr")}${opt("boa", "Bank transfer")}</div>
      ${card ? `<div class="paybox" data-m="whop"><dl><dt>Price</dt><dd class="num">${usd} USD, one-time</dd><dt>Paid through</dt><dd>Whop secure checkout (cards; other options Whop offers in your country)</dd></dl>
        <p class="fine">Whop may add sales tax or VAT where the law requires it, and your bank may charge a foreign-transaction fee. Whop shows the final total before you pay. Plus unlocks automatically after payment.</p></div>` : ""}
      <div class="paybox" data-m="telebirr"${first === "telebirr" ? "" : " hidden"}><img src="/assets/img/pay-telebirr.jpg" width="150" height="149" alt="Telebirr QR code to pay ${esc(m.telebirr.accountName)}"><dl><dt>1. Send exactly</dt><dd class="num">${etb}</dd><dt>To (Telebirr)</dt><dd>${esc(m.telebirr.accountName)}</dd><dt>How</dt><dd>Scan the code in the Telebirr app</dd></dl><p class="fine">Paying in Ethiopia? The local price is ${etb}.</p></div>
      <div class="paybox" data-m="boa" hidden><dl><dt>1. Send exactly</dt><dd class="num">${etb}</dd><dt>Bank</dt><dd>${esc(m.boa.label)}</dd><dt>Account number</dt><dd class="num" id="acct">${esc(m.boa.accountNumber)}</dd><dt>Account name</dt><dd>${esc(m.boa.accountName)}</dd></dl><button class="btn ghost small" type="button" data-act="copy-acct">Copy account number</button></div>
      <div data-local${card ? " hidden" : ""}><p class="label">2. Tell us it's sent</p>
      <div class="field"><label for="p-name">Name the payment came from</label><input id="p-name" name="payer_name" class="input" maxlength="120" autocomplete="name"><span class="err" data-err="payer_name" role="alert"></span></div>
      <div class="field"><label for="p-ref">Transaction ID</label><input id="p-ref" name="reference" class="input num" maxlength="60" autocomplete="off" spellcheck="false"><span class="hint">From the Telebirr SMS or your bank receipt, e.g. CK12AB34CD.</span><span class="err" data-err="reference" role="alert"></span></div>
      <label class="check"><input type="checkbox" name="confirm"><span>I have already sent the payment.</span></label><span class="err" data-err="confirm" role="alert"></span></div>
      ${AGE_BOX}
      <p class="fine">By continuing you agree to the <a href="/legal/terms">terms</a>.</p>
      <button class="btn brass block" type="button" data-act="submit-pay" id="pay-go">${card ? "Continue to secure checkout" : "Submit for checking"}</button>
      <p class="fine" data-local${card ? " hidden" : ""}>We use your name and transaction ID only to match your payment (see <a href="/legal/privacy">privacy</a>). We never ask for your PIN or password.</p>
      <p class="fine" data-card${card ? "" : " hidden"}>Whop handles your card details; we never see them. We only learn that a payment for your licence key went through (see <a href="/legal/privacy">privacy</a>).</p>
      <p class="err" id="pay-err" role="alert"></p>
    </form>`;
}

function setPollFor(app) {
  clearInterval(pollTimer);
  const l = app.state.license;
  if (l?.status !== "pending") return;
  const fast = l.method === "whop" && Date.now() - l.checkedAt < 10 * 60_000;
  pollTimer = setInterval(() => { if (!document.hidden && navigator.onLine) checkLicence(app, true); }, fast ? 5000 : 30000);
}

async function checkLicence(app, quiet) {
  const l = app.state.license;
  if (!l) return;
  const r = await fetchStatus(l.key);
  if (!r.ok || !r.body.status) { if (!quiet) app.toast(r.status === 404 ? "We can't find that licence key." : r.body.error ?? "Couldn't check right now."); return; }
  const s = structuredClone(app.state);
  s.license = { ...l, status: r.body.status, note: r.body.note ?? "", checkedAt: r.body.status === "pending" ? l.checkedAt : Date.now() };
  if (r.body.method) s.license.method = r.body.method;
  app.commit(s);
  if (r.body.status === "active") { clearInterval(pollTimer); confetti({ count: 200 }); buzz([30, 40, 60]); app.toast("Brimful Plus is unlocked. Thank you!"); app.render(); }
  else if (r.body.status !== "pending") { clearInterval(pollTimer); app.render(); }
  else if (!quiet) app.toast(l.method === "whop" ? "Not confirmed yet. If you finished paying, give it a few seconds." : "Still being checked. We'll unlock it as soon as it's confirmed.");
}

/* ---------- wire up ---------- */
export function installViews(app, register) {
  document.addEventListener("brimful:view", ({ detail }) => {
    clearInterval(pollTimer);
    if (detail.route === "unlock") {
      loadPay(app);
      setPollFor(app);
      if (app.state.license?.status === "pending" && /[?&]paid=1/.test(location.hash)) checkLicence(app, true);
    }
    if (detail.route === "split" && $("#splitform")) updateSplit(app);
  });

  register({
    "new-challenge": () => challengeSheet(app),
    "change:ch-type": (el) => previewChallenge(app, el.form),
    "change:ch-preview": (el) => previewChallenge(app, el.form),
    "input:ch-preview": (el) => previewChallenge(app, el.form),
    step: (el) => {
      const id = $("#ch-head").dataset.ch, i = Number(el.dataset.i);
      const before = app.state.challenges.find((c) => c.id === id);
      const jar = app.state.jars.find((j) => j.id === before.jarId), p0 = S.progress(jar);
      let r;
      try { r = S.toggleStep(app.state, id, i); } catch { return app.toast("Can't undo that one: the jar would drop below zero. Add money back to the jar first."); }
      app.commit(r.state);
      const c = app.state.challenges.find((x) => x.id === id), done = Boolean(c.done[i]), p = challengeProgress(c);
      el.setAttribute("aria-pressed", String(done));
      el.setAttribute("aria-label", tileLabel(app, c, i, p.amounts[i], done));
      el.classList.remove("pick");
      $("#ch-head").innerHTML = challengeHead(app, c);
      buzz(10);
      if (done && app.sound()) clink(0.8);
      if (done && p.complete) { confetti({ count: 220 }); app.toast("Challenge complete. Every step done!"); }
      else app.celebrate(p0, S.progress(app.state.jars.find((j) => j.id === c.jarId)), jar.name);
      if (!done) app.toast("Undone. That amount came back out of the jar.");
    },
    draw: () => {
      const c = app.state.challenges.find((x) => x.id === $("#ch-head").dataset.ch), p = challengeProgress(c);
      const open = p.amounts.map((_, i) => i).filter((i) => !c.done[i]);
      if (!open.length) return;
      const i = open[Math.floor(Math.random() * open.length)];
      document.querySelectorAll(".tile.pick").forEach((t) => t.classList.remove("pick"));
      const el = $(`.tile[data-i="${i}"]`);
      el.classList.add("pick");
      el.scrollIntoView({ block: "center", behavior: app.reduced() ? "auto" : "smooth" });
      el.focus({ preventScroll: true });
      app.toast(`Envelope ${i + 1}: put aside ${app.money(p.amounts[i], { short: true })}, then tap it.`);
    },
    "delete-challenge": () => {
      const id = $("#ch-head").dataset.ch;
      app.sheet(`<h2 id="dlg-title">End this challenge?</h2><p>The challenge is removed, but everything you've already saved stays in the jar.</p><div class="row"><button type="button" class="btn ghost" data-close>Keep going</button><button class="btn danger">End challenge</button></div>`,
        () => { app.commit(S.removeChallenge(app.state, id)); app.toast("Challenge ended. Your savings are still in the jar."); app.go("#/challenges"); });
    },

    "input:split": () => { const f = $("#splitform"); f.querySelectorAll("input[type=range]").forEach((r) => { const n = f.querySelector(`input[data-input='split'][data-jar="${r.dataset.jar}"]`); r.value = Math.max(0, Math.min(100, Number(n.value) || 0)); }); updateSplit(app); },
    "input:split-range": (el) => { $(`#splitform input[data-input='split'][data-jar="${el.dataset.jar}"]`).value = el.value; updateSplit(app); },
    "do-split": () => {
      const { form, rows, amount, total } = readSplit(app);
      if (!amount) return app.fieldError(form, "amt", "Enter the amount you received, like 1500.");
      if (total > 100) return app.toast("Percentages add up to more than 100%.");
      const parts = S.splitAmount(amount, rows);
      if (!parts.length) return app.toast("Give at least one jar a percentage.");
      let s = app.state;
      const before = new Map(s.jars.map((j) => [j.id, S.progress(j)]));
      for (const p of parts) s = S.addEntry(s, p.jarId, p.amt, "Split").state;
      s.split = rows.filter((r) => r.pct > 0);
      app.commit(s);
      if (app.sound()) clink();
      buzz(20);
      const hit = s.jars.find((j) => S.crossed(before.get(j.id), S.progress(j)).length);
      if (hit) app.celebrate(before.get(hit.id), S.progress(hit), hit.name); else app.toast(`Shared between ${parts.length} jar${parts.length === 1 ? "" : "s"}.`);
      app.go("#/");
    },

    "change:setting": (el) => {
      const s = structuredClone(app.state);
      if (el.name === "sound") s.settings.sound = el.checked; else s.settings[el.name] = el.value;
      app.commit(s);
    },
    export: () => {
      const url = URL.createObjectURL(new Blob([S.exportData(app.state)], { type: "application/json" }));
      const a = Object.assign(document.createElement("a"), { href: url, download: `brimful-backup-${new Date().toISOString().slice(0, 10)}.json` });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      app.toast("Backup downloaded. Keep it somewhere safe.");
    },
    "change:import": async (el) => {
      const file = el.files?.[0];
      el.value = "";
      if (!file) return;
      if (file.size > 5e6) return app.toast("That file is too large to be a Brimful backup.");
      const next = S.importData(await file.text());
      if (!next) return app.toast("That isn't a Brimful backup file.");
      app.sheet(`<h2 id="dlg-title">Restore this backup?</h2><p>It contains ${next.jars.length} jar${next.jars.length === 1 ? "" : "s"} and ${next.challenges.length} challenge${next.challenges.length === 1 ? "" : "s"}. It will <b>replace</b> everything currently on this device.</p><div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Replace and restore</button></div>`,
        () => { if (!next.license && app.state.license) next.license = app.state.license; next.settings.onboarded = true; app.commit(next); app.toast("Backup restored."); app.go("#/"); });
    },
    wipe: () => app.sheet(`<h2 id="dlg-title">Delete everything?</h2><p>All jars, history, challenges and settings will be removed from this device. This can't be undone. Download a backup first if you might want them back.</p>
      <label class="check"><input type="checkbox" name="sure"><span>Yes, delete all my Brimful data on this device.</span></label><span class="err" data-err="sure" role="alert"></span>
      ${app.state.settings.cloud ? `<label class="check"><input type="checkbox" name="cloud" checked><span>Also delete my cloud backup.</span></label>` : ""}
      <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn danger">Delete everything</button></div>`,
      async (fd, form) => {
        if (!fd.get("sure")) return app.fieldError(form, "sure", "Tick the box to confirm.");
        const cloud = app.state.settings.cloud;
        if (cloud && fd.get("cloud") && !(await removeCloud(cloud.code))) { app.toast("Couldn't reach the cloud backup to delete it. Check your connection and try again."); return false; }
        const keep = app.state.license;
        const fresh = S.emptyState(); fresh.settings.onboarded = true; fresh.settings.currency = app.cur(); fresh.license = keep; // the purchase stays valid
        if (cloud && !fd.get("cloud")) fresh.settings.cloud = cloud; // kept on purpose: it will be overwritten by the next backup
        app.commit(fresh); app.toast("Everything was deleted from this device."); app.go("#/");
      }),

    "change:pay-method": (el) => {
      const card = el.value === "whop";
      document.querySelectorAll(".paybox").forEach((b) => (b.hidden = b.dataset.m !== el.value));
      document.querySelectorAll("#payform [data-local]").forEach((b) => (b.hidden = card));
      document.querySelectorAll("#payform [data-card]").forEach((b) => (b.hidden = !card));
      $("#pay-go").textContent = card ? "Continue to secure checkout" : "Submit for checking";
    },
    "copy-acct": async () => { try { await navigator.clipboard.writeText($("#acct").textContent); app.toast("Account number copied."); } catch { app.toast("Press and hold the number to copy it."); } },
    "copy-key": async () => { try { await navigator.clipboard.writeText($("#lic-key").textContent); app.toast("Licence key copied."); } catch { app.toast("Press and hold the key to copy it."); } },
    "submit-pay": async (el) => {
      const form = $("#payform"), fd = new FormData(form), method = String(fd.get("method"));
      form.querySelectorAll("[data-err]").forEach((e) => (e.textContent = ""));
      $("#pay-err").textContent = "";
      let data;
      if (method === "whop") data = { method };
      else {
        const payer_name = String(fd.get("payer_name") ?? "").trim(), reference = String(fd.get("reference") ?? "").trim().toUpperCase();
        if (payer_name.length < 2) return app.fieldError(form, "payer_name", "Enter the name the payment came from.");
        if (!/^[A-Z0-9-]{4,60}$/.test(reference)) return app.fieldError(form, "reference", "Enter the transaction ID from your SMS or receipt (letters and numbers).");
        if (!fd.get("confirm")) return app.fieldError(form, "confirm", "Tick the box to confirm you've sent the payment.");
        data = { method, payer_name, reference };
      }
      if (!fd.get("age_ok")) return app.fieldError(form, "age_ok", "Please confirm you're 18 or older, or that a parent or guardian agreed.");
      const label = el.textContent;
      el.disabled = true; el.textContent = method === "whop" ? "Opening checkout…" : "Sending…";
      const r = await createOrder({ ...data, age_ok: true });
      if (!r.ok || !r.body.key) {
        el.disabled = false; el.textContent = label;
        if (r.body.field && form.elements[r.body.field]) return app.fieldError(form, r.body.field, r.body.error);
        $("#pay-err").textContent = r.body.error ?? "Something went wrong. Please try again.";
        return;
      }
      const s = structuredClone(app.state);
      s.license = { key: r.body.key, status: "pending", note: "", checkedAt: Date.now(), method };
      app.commit(s);
      if (method === "whop" && /^https:\/\/([a-z0-9-]+\.)*whop\.com\//.test(r.body.checkout_url || "")) { location.assign(r.body.checkout_url); return; }
      app.render();
    },
    "cancel-card": () => app.sheet(`<h2 id="dlg-title">Choose another way to pay?</h2><p>Only do this if you didn't finish paying on Whop. If you did pay, press Check now instead, or email skelifywpd@gmail.com with your licence key.</p><div class="row"><button type="button" class="btn ghost" data-close>Go back</button><button class="btn">Choose again</button></div>`,
      () => { const s = structuredClone(app.state); s.license = null; app.commit(s); app.render(); }),
    "check-pay": () => checkLicence(app, false),

    "cloud-on": () => {
      const code = newCode();
      app.sheet(`<h2 id="dlg-title">Your recovery code</h2>
        <p>Write this down or save it in your password manager. You need it to restore on another device.</p>
        <p class="key num" id="new-code">${code}</p>
        <button type="button" class="btn ghost small" data-act="copy-code" data-vars="justify-self:start">Copy code</button>
        <p class="fine">If you lose this code, nobody can open the backup, not even us. Backups you don't update for 400 days are deleted.</p>
        <label class="check"><input type="checkbox" name="saved"><span>I've saved my recovery code somewhere safe.</span></label><span class="err" data-err="saved" role="alert"></span>
        <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Turn on backup</button></div>`,
        async (fd, form) => {
          if (!fd.get("saved")) return app.fieldError(form, "saved", "Save the code first, then tick the box.");
          const s = structuredClone(app.state); s.settings.cloud = { code, at: 0 };
          const r = await backupNow(s);
          if (!r.ok) { app.toast(r.error); return false; }
          s.settings.cloud.at = r.at; app.commit(s); app.toast("Cloud backup is on. It updates by itself after changes."); app.render();
        });
    },
    "copy-code": async () => { try { await navigator.clipboard.writeText($("#new-code").textContent); app.toast("Recovery code copied."); } catch { app.toast("Press and hold the code to copy it."); } },
    "cloud-now": async (el) => {
      el.disabled = true;
      const r = await backupNow(app.state);
      el.disabled = false;
      if (!r.ok) return app.toast(r.error);
      const s = structuredClone(app.state); s.settings.cloud.at = r.at; app.commit(s);
      $("#cloud-at").textContent = `Encrypted on this device before upload. Last backed up: ${ago(r.at)}.`;
      app.toast("Backed up.");
    },
    "cloud-code": () => app.sheet(`<h2 id="dlg-title">Recovery code</h2><p class="key num" id="new-code">${esc(app.state.settings.cloud.code)}</p><button type="button" class="btn ghost small" data-act="copy-code" data-vars="justify-self:start">Copy code</button><p class="fine">Anyone with this code can open your backup. Don't share it.</p><div class="row"><button type="button" class="btn" data-close>Done</button></div>`),
    "cloud-off": () => app.sheet(`<h2 id="dlg-title">Turn off cloud backup?</h2><p>The online copy is deleted. Your jars on this device stay as they are.</p><div class="row"><button type="button" class="btn ghost" data-close>Keep it on</button><button class="btn danger">Turn off and delete copy</button></div>`,
      async () => {
        if (!(await removeCloud(app.state.settings.cloud.code))) { app.toast("Couldn't reach the backup to delete it. Try again when you're online."); return false; }
        const s = structuredClone(app.state); s.settings.cloud = null; app.commit(s); app.toast("Cloud backup is off and the online copy was deleted."); app.render();
      }),
    "cloud-restore": () => app.sheet(`<h2 id="dlg-title">Restore from cloud backup</h2>
      <div class="field"><label for="rc-code">Recovery code</label><input id="rc-code" name="code" class="input num" autocomplete="off" spellcheck="false" placeholder="XXXXX-XXXXX-XXXXX-XXXXX"><span class="err" data-err="code" role="alert"></span></div>
      <p class="fine">This replaces everything currently on this device.</p>
      <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Restore</button></div>`,
      async (fd, form) => {
        const code = normalize(fd.get("code"));
        if (!code) return app.fieldError(form, "code", "That doesn't look like a recovery code. It has 20 letters and numbers.");
        const r = await fetchRestore(code);
        if (!r.ok) return app.fieldError(form, "code", r.error);
        const next = r.state;
        if (!next.license && app.state.license) next.license = app.state.license;
        next.settings.onboarded = true; next.settings.cloud = { code, at: Date.now() };
        app.commit(next);
        app.toast(`Restored ${next.jars.length} jar${next.jars.length === 1 ? "" : "s"}. Cloud backup stays on with this code.`);
        app.go("#/");
      }),
    restore: async () => {
      const form = $("#restore"), raw = form.elements.key.value.trim();
      let r, key;
      if (/^pay_/i.test(raw)) {
        r = await createOrder({ method: "whop_claim", payment_id: "pay_" + raw.slice(4) });
        if (!r.ok) return app.fieldError(form, "key", r.body.error ?? "Couldn't check right now.");
        key = r.body.key;
      } else {
        key = raw.toLowerCase();
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(key)) return app.fieldError(form, "key", "Paste your licence key (36 characters with dashes) or your Whop receipt number (starts with pay_).");
        r = await fetchStatus(key);
        if (!r.ok) return app.fieldError(form, "key", r.status === 404 ? "We can't find that key. Check it and try again." : r.body.error ?? "Couldn't check right now.");
      }
      const s = structuredClone(app.state);
      s.license = { key, status: r.body.status, note: r.body.note ?? "", checkedAt: Date.now() };
      if (r.body.method) s.license.method = r.body.method;
      app.commit(s);
      if (r.body.status === "active") { confetti({ count: 200 }); app.toast("Brimful Plus restored."); }
      app.render();
    },
  });
}
