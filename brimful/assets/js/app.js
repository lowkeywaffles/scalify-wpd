// Brimful app shell: routing, shared helpers, and the Jars + Jar detail screens.
import * as S from "./lib/store.js";
import { fmt, toMinor, toInput, quickAmounts, CURRENCIES, isCurrency, minorDigits } from "./lib/money.js";
import { clink, chime, buzz, confetti, paintGuilloche, applyVars, esc } from "./lib/fx.js";
import { fetchStatus } from "./lib/api.js";
import { challengesView, challengeView, splitView, settingsView, unlockView, installViews } from "./views.js";

const $ = (sel, root = document) => root.querySelector(sel);
const view = $("#view"), dlg = $("#dlg"), toastEl = $("#toast");

/* ---------- shared context handed to every screen ---------- */
export const app = {
  state: S.load(),
  commit(next) { app.state = next; if (!S.save(next)) toast("Couldn't save. Your browser's storage may be full or blocked."); syncChrome(); scheduleCloud(); },
  cur: () => app.state.settings.currency,
  money: (minor, o) => fmt(minor, app.state.settings.currency, o),
  reduced: () => matchMedia("(prefers-reduced-motion: reduce)").matches || app.state.settings.motion === "off",
  sound: () => app.state.settings.sound,
  toast, sheet, closeSheet, go, render, deposit, miniJar, celebrate, upsell, fieldError,
};

/* ---------- encrypted cloud backup (only when the user turned it on) ---------- */
let cloudT = null, cloudBusy = false;
function scheduleCloud() {
  if (!app.state.settings.cloud) return;
  clearTimeout(cloudT);
  cloudT = setTimeout(runCloud, 15000); // one upload after a burst of changes
}
async function runCloud() {
  cloudT = null;
  if (cloudBusy || !app.state.settings.cloud || !navigator.onLine) return;
  cloudBusy = true;
  try {
    const { backupNow } = await import("./lib/cloud.js");
    const r = await backupNow(app.state);
    if (r.ok && app.state.settings.cloud) { const s = structuredClone(app.state); s.settings.cloud.at = r.at; app.state = s; S.save(s); }
  } catch { /* try again after the next change */ } finally { cloudBusy = false; }
}
document.addEventListener("visibilitychange", () => { if (document.hidden && cloudT) { clearTimeout(cloudT); runCloud(); } });
addEventListener("online", () => { const c = app.state.settings.cloud; if (c && Date.now() - c.at > 3600_000) scheduleCloud(); });

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toastEl.classList.remove("on"), 3200);
}
function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }

/** Opens a form sheet. `onSubmit(formData, form)` returns true to close. */
function sheet(html, onSubmit) {
  dlg.innerHTML = `<form class="sheet" novalidate>${html}</form>`;
  applyVars(dlg); paintGuilloche(dlg);
  const form = $("form", dlg);
  form.addEventListener("submit", async (e) => { e.preventDefault(); if (!onSubmit || (await onSubmit(new FormData(form), form)) !== false) closeSheet(); });
  if (!dlg.open) dlg.showModal();
  return form;
}
function closeSheet() { if (dlg.open) dlg.close(); dlg.innerHTML = ""; }
dlg.addEventListener("click", (e) => { if (e.target === dlg || e.target.closest("[data-close]")) closeSheet(); });
dlg.addEventListener("close", () => { dlg.innerHTML = ""; });

/** Shows a field error next to its input and focuses it. */
function fieldError(form, name, msg) {
  const input = form.elements[name];
  const box = $(`[data-err="${name}"]`, form);
  if (box) box.textContent = msg;
  if (input?.setAttribute) { input.setAttribute("aria-invalid", "true"); input.focus(); }
  return false;
}

let clipN = 0;
function miniJar(style, p, i = 0) {
  const id = `mj${++clipN}`;
  const body = "M11 15h38q5 4 5 11v40q0 10-10 10H16Q6 76 6 66V26q0-7 5-11z";
  return `<svg class="mini st-${esc(style)}" viewBox="0 0 60 80" aria-hidden="true" data-vars="--p:${Math.max(0, Math.min(1, p)).toFixed(3)};--i:${i}"><defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs><rect class="lid" x="13" y="3" width="34" height="9" rx="3"/><g clip-path="url(#${id})"><rect class="fill" x="6" y="15" width="48" height="61"/></g><path class="glass" d="${body}"/><path class="shine" d="M13 31v28"/></svg>`;
}

function celebrate(before, after, name) {
  const hit = S.crossed(before, after);
  if (!hit.length) return;
  const top = hit[hit.length - 1];
  buzz(top === 1 ? [30, 40, 60] : 25);
  if (app.sound()) chime();
  confetti({ count: top === 1 ? 220 : 110 });
  toast(top === 1 ? `${name} is brimful. You did it!` : `${Math.round(top * 100)}% of the way on ${name}.`);
}

/** Adds (or with a negative amount, takes out) money. Returns false and explains if it can't. */
function deposit(jarId, amt, note = "") {
  const jar = app.state.jars.find((j) => j.id === jarId);
  if (!jar) return false;
  const before = S.progress(jar);
  try { app.commit(S.addEntry(app.state, jarId, amt, note).state); }
  catch (e) { toast(e.message === "below zero" ? "You can't take out more than is in the jar." : "That amount is too large."); return false; }
  buzz(10);
  celebrate(before, S.progress(app.state.jars.find((j) => j.id === jarId)), jar.name);
  return true;
}

function syncChrome() {
  const plus = S.isPlus(app.state);
  const plan = $("#plan");
  plan.textContent = plus ? "Plus" : app.state.license?.status === "pending" ? "Checking…" : "Free";
  plan.classList.toggle("jade", plus); plan.classList.toggle("brass", !plus);
  const st = app.state.settings, root = document.documentElement;
  if (st.theme === "system") delete root.dataset.theme; else root.dataset.theme = st.theme;
  if (st.motion === "off") root.dataset.motion = "off"; else delete root.dataset.motion;
}

/* ---------- Jars (home) ---------- */
function guessCurrency() {
  try {
    if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Addis_Ababa") return "ETB";
    const region = new Intl.Locale(navigator.language).maximize().region;
    const map = { US: "USD", GB: "GBP", ET: "ETB", KE: "KES", NG: "NGN", ZA: "ZAR", GH: "GHS", UG: "UGX", TZ: "TZS", EG: "EGP", AE: "AED", SA: "SAR", IN: "INR", PK: "PKR", PH: "PHP", ID: "IDR", CA: "CAD", AU: "AUD", BR: "BRL", MX: "MXN", TR: "TRY", JP: "JPY" };
    const euro = ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "FI", "GR"];
    return map[region] ?? (euro.includes(region) ? "EUR" : "USD");
  } catch { return "USD"; }
}
const currencyOptions = (sel) => CURRENCIES.map((c) => `<option value="${c}"${c === sel ? " selected" : ""}>${c}</option>`).join("");

function shelfView() {
  const { jars } = app.state;
  if (!jars.length) {
    return `<h1 tabindex="-1">Start your first jar</h1>
      <div class="card empty">${miniJar("brass", 0.35)}
        <h2>What are you saving for?</h2>
        <p class="lead">Name a jar, set a target, and drop money in whenever you can. Brimful only keeps track: your money stays wherever you keep it.</p>
        <div class="field"><label for="cur0">Your currency</label><select id="cur0" class="input" data-change="currency">${currencyOptions(app.cur())}</select></div>
        <button class="btn" data-act="new-jar">Create a jar</button>
      </div>
      <p class="fine">Everything you enter is saved on this device only. No account, no bank login.</p>`;
  }
  const total = S.totalSaved(app.state), streak = S.weekStreak(app.state);
  const cards = jars.map((j, i) => {
    const bal = S.balance(j), p = S.progress(j), need = S.weeklyNeed(j, Date.now(), 10 ** minorDigits(app.cur()));
    return `<a class="jarcard" href="#/jar/${esc(j.id)}">${miniJar(j.style, p, i)}
      <div><h2>${esc(j.name)}</h2>
        <p class="amt num"><b>${app.money(bal, { short: true })}</b> of ${app.money(j.target, { short: true })}</p>
        <progress max="100" value="${Math.round(p * 100)}" aria-label="${esc(j.name)}: ${Math.round(p * 100)}% full"></progress>
        ${p >= 1 ? `<p class="need">Brimful. Goal reached.</p>` : need ? `<p class="need">${need.overdue ? "Past its date." : `${app.money(need.perWeek, { short: true })} a week gets you there by ${new Date(j.deadline + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}.`}</p>` : ""}
      </div></a>`;
  }).join("");
  return `<h1 tabindex="-1">Your jars</h1>
    <section class="summary" aria-label="Total saved">
      <svg class="rosette" data-guilloche="8,3,5,3" aria-hidden="true"></svg>
      <span class="eyebrow" data-vars="color:inherit;opacity:.7">Saved so far</span>
      <span class="big num">${app.money(total, { short: true })}</span>
      <span class="sub">across ${jars.length} jar${jars.length === 1 ? "" : "s"}</span>
      ${streak > 1 ? `<span class="pill">${streak}-week saving streak</span>` : ""}
    </section>
    <div class="shelf">${cards}</div>
    <button class="btn ghost block" data-act="new-jar">New jar</button>`;
}

function jarSheet(jar) {
  const plus = S.isPlus(app.state);
  if (!jar && !S.canAddJar(app.state)) return upsell("Free includes 2 jars", "Brimful Plus gives you unlimited jars, every challenge at once, the paycheck splitter and all jar colours. One payment, no subscription.");
  const styles = S.JAR_STYLES.map((s) => {
    const locked = !plus && !S.FREE_STYLES.includes(s) && jar?.style !== s;
    return `<label class="swatch st-${s}"><input type="radio" name="style" value="${s}"${(jar?.style ?? "brass") === s ? " checked" : ""}${locked ? " disabled" : ""}><span aria-hidden="true"></span><small>${s[0].toUpperCase() + s.slice(1)}${locked ? " · Plus" : ""}</small></label>`;
  }).join("");
  sheet(`<h2 id="dlg-title">${jar ? "Edit jar" : "New jar"}</h2>
    <div class="field"><label for="f-name">What's it for?</label><input id="f-name" name="name" class="input" maxlength="60" required value="${esc(jar?.name ?? "")}" placeholder="e.g. New phone" autocomplete="off"><span class="err" data-err="name" role="alert"></span></div>
    <div class="field"><label for="f-target">Target (${app.cur()})</label><input id="f-target" name="target" class="input num" inputmode="decimal" required value="${jar ? toInput(jar.target, app.cur()) : ""}" placeholder="e.g. 15000" autocomplete="off"><span class="err" data-err="target" role="alert"></span></div>
    <div class="field"><label for="f-deadline">By when? <span class="hint">(optional)</span></label><input id="f-deadline" name="deadline" class="input" type="date" value="${esc(jar?.deadline ?? "")}"><span class="hint">Add a date and Brimful works out a weekly amount.</span></div>
    <fieldset class="swatches"><legend>Coin colour</legend>${styles}</fieldset>
    <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${jar ? "Save" : "Create jar"}</button></div>`,
  (fd, form) => {
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return fieldError(form, "name", "Give your jar a name.");
    const target = toMinor(String(fd.get("target") ?? ""), app.cur());
    if (!target) return fieldError(form, "target", "Enter a target above zero, like 15000.");
    const patch = { name, target, deadline: String(fd.get("deadline") ?? ""), style: String(fd.get("style") ?? "brass") };
    if (jar) { app.commit(S.updateJar(app.state, jar.id, patch)); toast("Jar updated."); render(); }
    else { const r = S.addJar(app.state, patch); app.commit(r.state); go(`#/jar/${r.jar.id}`); }
  });
}

function upsell(title, text) {
  sheet(`<h2 id="dlg-title">${esc(title)}</h2><p>${esc(text)}</p>
    <div class="row"><button type="button" class="btn ghost" data-close>Not now</button><a class="btn brass" href="#/unlock" data-close>See Brimful Plus</a></div>`);
}

/* ---------- Jar detail (keeps one WebGL jar alive while you add money) ---------- */
let jar3d = null, lastClink = 0;
function disposeJar() { jar3d?.dispose(); jar3d = null; }

function jarBody(j) {
  const bal = S.balance(j), p = S.progress(j), need = S.weeklyNeed(j, Date.now(), 10 ** minorDigits(app.cur())), quick = quickAmounts(j.target, app.cur());
  const hist = [...j.entries].reverse().slice(0, 60).map((e) => `<li><div><div>${e.amt > 0 ? "Added" : "Took out"}${e.note ? ` · ${esc(e.note)}` : ""}</div><div class="when">${new Date(e.t).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div></div>
      <span class="num ${e.amt > 0 ? "plus" : "minus"}">${app.money(e.amt, { sign: true })}</span>
      <button class="iconbtn" data-act="undo-entry" data-id="${esc(e.id)}" aria-label="Remove this entry of ${app.money(Math.abs(e.amt))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></li>`).join("");
  return `<div class="figure"><span class="big num" id="jar-amt">${app.money(bal, { short: true })}</span>
      <span class="of num">of ${app.money(j.target, { short: true })} · ${Math.floor(p * 100)}%</span></div>
    <progress max="100" value="${Math.round(p * 100)}" aria-label="${Math.round(p * 100)}% of target"></progress>
    <ul class="miles" aria-label="Milestones">${S.MILESTONES.map((m) => `<li class="${p >= m ? "on" : ""}">${m * 100}%<span class="sr">${p >= m ? " reached" : " not reached yet"}</span></li>`).join("")}</ul>
    ${p >= 1 ? `<p class="note">This jar is brimful. Time to enjoy it, or raise the target and keep going.</p>` : need ? `<p class="lead">${need.overdue ? "The date has passed. Edit the jar to set a new one." : `Put aside ${app.money(need.perWeek, { short: true })} a week for ${need.weeks} week${need.weeks === 1 ? "" : "s"} to reach it on time.`}</p>` : ""}
    <div class="quick" role="group" aria-label="Quick add">${quick.map((q) => `<button class="btn brass" data-act="quick" data-amt="${q}">${app.money(q, { short: true, sign: true })}</button>`).join("")}</div>
    <div class="row"><button class="btn" data-act="add-custom" data-vars="flex:2">Add another amount</button><button class="btn ghost" data-act="take-out" data-vars="flex:1"${bal <= 0 ? " disabled" : ""}>Take out</button></div>
    <section class="panel" aria-labelledby="hist-h"><h2 id="hist-h">History</h2>
      ${hist ? `<ul class="hist">${hist}</ul>` : `<p class="fine">Nothing yet. Add your first amount above.</p>`}</section>
    <div class="row"><button class="btn ghost small" data-act="share">Share progress</button><button class="btn ghost small" data-act="edit-jar">Edit jar</button><button class="btn danger small" data-act="delete-jar">Delete</button></div>`;
}

function refreshJar(id, animate = true) {
  const j = app.state.jars.find((x) => x.id === id);
  if (!j) return go("#/");
  $("#jarbody").innerHTML = jarBody(j);
  applyVars(view);
  jar3d?.setFill(S.progress(j), { animate });
  const mini = $(".stage .mini");
  if (mini) mini.style.setProperty("--p", S.progress(j).toFixed(3));
}

async function mountJar(j) {
  const stage = $(".stage");
  let ok = false;
  try {
    const m = await import("./lib/jar3d.js");
    if (m.webglAvailable() && stage.isConnected) {
      const canvas = document.createElement("canvas");
      canvas.setAttribute("aria-hidden", "true");
      stage.prepend(canvas);
      jar3d = m.createJar(canvas, { style: j.style, fill: 0, reduced: app.reduced(), zoomOut: 1.12, onCoinLand: () => { const t = performance.now(); if (app.sound() && t - lastClink > 70) { lastClink = t; clink(0.7); } } });
      jar3d.setFill(S.progress(j), { animate: !app.reduced() });
      ok = true;
    }
  } catch { ok = false; }
  if (!ok && stage.isConnected) stage.insertAdjacentHTML("beforeend", `<div class="fallback">${miniJar(j.style, S.progress(j))}</div>`), applyVars(stage);
}

function jarView(id) {
  const j = app.state.jars.find((x) => x.id === id);
  if (!j) return null;
  return `<a class="back" href="#/">← All jars</a>
    <h1 tabindex="-1">${esc(j.name)}</h1>
    <div class="stage"><svg class="rosette" data-guilloche="7,2,4,2" aria-hidden="true"></svg></div>
    <div id="jarbody" class="view" data-jar="${esc(j.id)}">${jarBody(j)}</div>`;
}

function amountSheet(jarId, takeOut) {
  const j = app.state.jars.find((x) => x.id === jarId);
  sheet(`<h2 id="dlg-title">${takeOut ? "Take money out" : "Add money"}</h2>
    <div class="field"><label for="f-amt">Amount (${app.cur()})</label><input id="f-amt" name="amt" class="input num" inputmode="decimal" required autocomplete="off" placeholder="0"><span class="err" data-err="amt" role="alert"></span>
      ${takeOut ? `<span class="hint">In the jar now: ${app.money(S.balance(j))}</span>` : ""}</div>
    <div class="field"><label for="f-note">Note <span class="hint">(optional)</span></label><input id="f-note" name="note" class="input" maxlength="80" autocomplete="off" placeholder="${takeOut ? "e.g. Bus fare" : "e.g. Birthday money"}"></div>
    <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn${takeOut ? " danger" : ""}">${takeOut ? "Take out" : "Add to jar"}</button></div>`,
  (fd, form) => {
    const amt = toMinor(String(fd.get("amt") ?? ""), app.cur());
    if (!amt) return fieldError(form, "amt", "Enter an amount above zero, like 250.");
    if (takeOut && amt > S.balance(j)) return fieldError(form, "amt", `You can take out up to ${app.money(S.balance(j))}.`);
    if (deposit(jarId, takeOut ? -amt : amt, String(fd.get("note") ?? ""))) refreshJar(jarId);
  });
}

/* ---------- actions (one click handler for the whole app) ---------- */
const currentJarId = () => $("#jarbody")?.dataset.jar;
const actions = {
  "new-jar": () => jarSheet(null),
  "edit-jar": () => jarSheet(app.state.jars.find((j) => j.id === currentJarId())),
  quick: (el) => { const id = currentJarId(); if (deposit(id, Number(el.dataset.amt))) refreshJar(id); },
  "add-custom": () => amountSheet(currentJarId(), false),
  "take-out": () => amountSheet(currentJarId(), true),
  "undo-entry": (el) => {
    const id = currentJarId();
    try { app.commit(S.removeEntry(app.state, id, el.dataset.id)); refreshJar(id); toast("Entry removed."); }
    catch { toast("Can't remove that one: the jar would drop below zero."); }
  },
  "delete-jar": () => {
    const j = app.state.jars.find((x) => x.id === currentJarId());
    sheet(`<h2 id="dlg-title">Delete “${esc(j.name)}”?</h2><p>This removes the jar, its history and any challenges linked to it from this device. It can't be undone.</p>
      <div class="row"><button type="button" class="btn ghost" data-close>Keep it</button><button class="btn danger">Delete jar</button></div>`,
    () => { app.commit(S.removeJar(app.state, j.id)); toast("Jar deleted."); go("#/"); });
  },
  share: async () => { const { shareSheet } = await import("./share.js"); shareSheet(app, app.state.jars.find((j) => j.id === currentJarId())); },
};
installViews(app, (more) => Object.assign(actions, more));

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (el && !el.disabled) { actions[el.dataset.act]?.(el, e); }
});
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-change]");
  if (!el) return;
  if (el.dataset.change === "currency" && isCurrency(el.value)) { const s = structuredClone(app.state); s.settings.currency = el.value; app.commit(s); if (!el.closest("dialog")) render(); }
  else actions[`change:${el.dataset.change}`]?.(el, e);
});
document.addEventListener("input", (e) => { const el = e.target.closest("[data-input]"); if (el) actions[`input:${el.dataset.input}`]?.(el, e); });

// gentle 3D tilt on jar cards for mouse users
document.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse" || app.reduced()) return;
  const card = e.target.closest?.(".jarcard");
  document.querySelectorAll(".jarcard").forEach((c) => { if (c !== card) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); } });
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
  card.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 8}deg`);
}, { passive: true });

/* ---------- router ---------- */
let first = true;
function render() {
  disposeJar();
  closeSheet();
  const [, route = "", id = ""] = location.hash.match(/^#\/([a-z]*)\/?([\w-]*)/) ?? [];
  let html = null, tab = "jars";
  if (route === "jar") html = jarView(id);
  else if (route === "challenges") { html = challengesView(app); tab = "challenges"; }
  else if (route === "challenge") { html = challengeView(app, id); tab = "challenges"; }
  else if (route === "split") { html = splitView(app); tab = "split"; }
  else if (route === "settings") { html = settingsView(app); tab = "settings"; }
  else if (route === "unlock") { html = unlockView(app); tab = "settings"; }
  if (html === null) html = shelfView();
  view.innerHTML = `<div class="view">${html}</div>`;
  applyVars(view); paintGuilloche(view);
  document.querySelectorAll(".tabs a").forEach((a) => (a.dataset.tab === tab ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  if (route === "jar") { const j = app.state.jars.find((x) => x.id === id); if (j) mountJar(j); }
  document.dispatchEvent(new CustomEvent("brimful:view", { detail: { route, id } }));
  window.scrollTo(0, 0);
  const inner = view.firstElementChild;
  if (window.gsap && !app.reduced()) {
    window.gsap.fromTo(inner, { opacity: 0, y: 26, rotationX: -9, transformPerspective: 1000 }, { opacity: 1, y: 0, rotationX: 0, duration: 0.55, ease: "power3.out", clearProps: "transform,opacity" });
    const items = inner.querySelectorAll(".jarcard, .chcard, .panel, .summary, .tile");
    if (items.length && items.length <= 120) window.gsap.from(items, { opacity: 0, y: 18, rotationX: -18, transformPerspective: 800, duration: 0.5, ease: "power3.out", stagger: { amount: Math.min(0.5, items.length * 0.04) }, clearProps: "transform,opacity" });
  }
  if (!first) $("h1", view)?.focus({ preventScroll: true });
  first = false;
}
addEventListener("hashchange", render);

/* ---------- start ---------- */
if (!app.state.settings.onboarded) {
  const s = structuredClone(app.state);
  if (!s.jars.length) s.settings.currency = guessCurrency();
  s.settings.onboarded = true;
  app.commit(s);
}
syncChrome();
const boot = () => render();
if (window.gsap || document.readyState === "complete") boot(); else addEventListener("load", boot, { once: true });

// Once a day (when online), confirm the licence is still valid. Nothing else is sent.
(async () => {
  const l = app.state.license;
  if (!l || !navigator.onLine || (l.status !== "pending" && Date.now() - l.checkedAt < 864e5)) return;
  const r = await fetchStatus(l.key);
  if (!r.ok || !r.body.status) return;
  const s = structuredClone(app.state);
  s.license = { ...l, status: r.body.status, note: r.body.note ?? "", checkedAt: Date.now() };
  const was = l.status;
  app.commit(s);
  if (was !== "active" && r.body.status === "active") { toast("Brimful Plus is unlocked. Thank you!"); confetti(); render(); }
})();

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});
