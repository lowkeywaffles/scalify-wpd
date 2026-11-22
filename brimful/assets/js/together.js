// Save Together screens: a shared jar for up to 6 people, updated live.
// Creating a jar needs Plus; anyone with the invite link can join free (free members: 15 deposits per jar).
import * as S from "./lib/store.js";
import { fmt, toMinor, toInput, MAX_MINOR } from "./lib/money.js";
import { clink, confetti, buzz, esc } from "./lib/fx.js";
import { PRESETS, presetOf, COLORS, newKey, newToken, seal, open, inviteLink, parseInvite, api } from "./lib/together.js";

const $ = (s, r = document) => r.querySelector(s);
const POLL_MS = 4000;
const cache = new Map(); // jarId -> { meta, members: Map, entries: Map, cursor, me, error }
let poll = null, jar3d = null, liveId = null;

const membership = (app, id) => app.state.shared.find((m) => m.id === id);
const myName = (app) => app.state.settings.tgName || "";
const ago = (iso) => { const m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(iso).toLocaleDateString(); };
const initials = (n) => (String(n || "?").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2) || "?").toUpperCase();

function totals(c) {
  const by = new Map();
  let total = 0;
  for (const e of c.entries.values()) { total += e.amt; by.set(e.member, (by.get(e.member) ?? 0) + e.amt); }
  return { total, by };
}

/** Pulls changes (all on first call) and decrypts them. Returns entries that arrived from other people. */
async function sync(app, m) {
  const c = cache.get(m.id) ?? { meta: null, members: new Map(), entries: new Map(), cursor: null, me: null, error: null };
  const r = await api.sync(m, c.cursor);
  if (!r.ok) { c.error = r.body.code === "not_member" ? "removed" : r.body.code === "gone" || r.status === 404 ? "gone" : r.status === 0 ? "offline" : "error"; cache.set(m.id, c); return []; }
  c.error = null; c.me = r.body.me;
  const meta = await open(m.key, r.body.jar.meta);
  if (meta) c.meta = meta;
  c.members = new Map();
  for (const x of r.body.members) {
    const p = await open(m.key, x.profile);
    c.members.set(x.id, { id: x.id, name: p?.name || "Member", color: COLORS.includes(p?.color) ? p.color : COLORS[0], owner: x.owner, removed: x.removed });
  }
  const fresh = [];
  if (r.body.full) c.entries = new Map();
  for (const e of r.body.entries) {
    if (e.deleted) { c.entries.delete(e.id); continue; }
    if (c.entries.has(e.id)) continue;
    const d = await open(m.key, e.data);
    if (!d || !Number.isSafeInteger(d.amt) || d.amt <= 0 || d.amt > MAX_MINOR) continue;
    const item = { id: e.id, member: e.member_id, amt: d.amt, note: typeof d.note === "string" ? d.note.slice(0, 80) : "", at: e.created_at };
    c.entries.set(e.id, item);
    if (c.cursor && e.member_id !== m.member) fresh.push(item);
  }
  c.cursor = r.body.cursor;
  cache.set(m.id, c);
  return fresh;
}

/* ---------------- list ---------------- */
export function togetherView(app) {
  const plus = S.isPlus(app.state), mine = app.state.shared;
  const cards = mine.map((m) => {
    const c = cache.get(m.id), meta = c?.meta, t = c ? totals(c) : null;
    const p = meta ? Math.min(1, t.total / meta.target) : 0;
    return `<a class="tg-card" href="#/shared/${m.id}" data-tgcard="${m.id}">
      <span class="tg-ico" aria-hidden="true">${presetOf(meta?.preset).icon}</span>
      <span class="tg-cardbody"><b>${meta ? esc(meta.name) : "Loading…"}</b>
        <span class="tg-meta num">${meta ? `${fmt(t.total, meta.currency, { short: true })} of ${fmt(meta.target, meta.currency, { short: true })}` : ""}</span>
        <span class="tg-bar"><i data-vars="--p:${p.toFixed(3)}"></i></span></span>
      <span class="tg-avs" aria-label="${c ? [...c.members.values()].filter((x) => !x.removed).length : 0} people">${c ? [...c.members.values()].filter((x) => !x.removed).slice(0, 4).map((x) => `<i data-vars="--c:${x.color}">${esc(initials(x.name))}</i>`).join("") : ""}</span></a>`;
  }).join("");
  const hero = `<section class="tg-hero" aria-labelledby="tg-h"><svg class="rosette" data-guilloche="9,4,6,4" aria-hidden="true"></svg>
      <span class="tg-badge">PLUS · SAVE TOGETHER</span>
      <h1 id="tg-h" tabindex="-1">Save <em>together.</em></h1>
      <p>One jar for two to six people. Everyone adds what they can, and the jar fills live on every phone.</p>
      <ul class="tg-feats"><li>Live coin drops when someone saves</li><li>See who added what</li><li>Locked with your invite link: not even we can read it</li></ul>
      ${plus ? `<button class="btn brass" data-act="tg-new">Start a shared jar</button>` : `<a class="btn brass" href="#/unlock">Unlock with Plus · $7 one-time</a><p class="tg-fine">Starting a shared jar needs Plus. Friends you invite join free.</p>`}
    </section>`;
  return `${hero}
    ${mine.length ? `<section aria-labelledby="tg-mine"><h2 id="tg-mine">Your shared jars</h2><div class="tg-list">${cards}</div></section>` : ""}
    <section class="panel" aria-labelledby="tg-join-h"><h2 id="tg-join-h">Got an invite link?</h2>
      <form id="tg-paste" novalidate class="view"><div class="field"><label for="tg-link">Paste the link someone sent you</label><input id="tg-link" name="link" class="input" autocomplete="off" spellcheck="false" placeholder="https://brimful.tech/app/#/join/…"><span class="err" data-err="link" role="alert"></span></div>
      <button class="btn ghost" type="button" data-act="tg-open-link">Open invite</button></form></section>`;
}

/* ---------------- one shared jar ---------------- */
export function sharedView(app, id) {
  if (!membership(app, id)) return null;
  return `<a class="back" href="#/together">← Save Together</a>
    <div id="tg-head"><h1 tabindex="-1">Loading…</h1></div>
    <div class="stage tg-stage"><svg class="rosette" data-guilloche="7,2,4,2" aria-hidden="true"></svg></div>
    <div id="tg-body" class="view" aria-live="polite"><p class="lead">Unlocking your shared jar…</p></div>`;
}

function renderShared(app, id) {
  const m = membership(app, id), c = cache.get(id), head = $("#tg-head"), body = $("#tg-body");
  if (!m || !head || !body) return;
  if (c?.error === "removed" || c?.error === "gone") {
    head.innerHTML = `<h1 tabindex="-1">${c.error === "gone" ? "This jar was deleted" : "You're no longer in this jar"}</h1>`;
    body.innerHTML = `<p class="note warn">${c.error === "gone" ? "The person who made it deleted it." : "The person who made it removed you, or you left."} Your own Brimful jars aren't affected.</p><button class="btn ghost" data-act="tg-forget" data-id="${id}">Remove it from my list</button>`;
    return;
  }
  if (!c?.meta) { body.innerHTML = `<p class="note ${c?.error ? "bad" : ""}">${c?.error === "offline" ? "You're offline. Shared jars need a connection." : c?.error ? "Couldn't open this jar. Check your connection and try again." : "Unlocking…"}</p>`; return; }
  const meta = c.meta, cur = meta.currency, { total, by } = totals(c), p = Math.min(1, total / meta.target);
  const active = [...c.members.values()].filter((x) => !x.removed);
  const meOwner = c.me?.owner, plus = S.isPlus(app.state);
  head.innerHTML = `<p class="tg-badge"><span aria-hidden="true">${presetOf(meta.preset).icon}</span> SAVE TOGETHER <span class="tg-live" title="Updates live"><i></i>LIVE</span></p><h1 tabindex="-1">${esc(meta.name)}</h1>`;
  const left = c.me && !c.me.owner && !plus ? Math.max(0, c.me.free_limit - c.me.deposits_used) : null;
  const feed = [...c.entries.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60).map((e) => {
    const who = c.members.get(e.member);
    return `<li><span class="tg-av" data-vars="--c:${who?.color ?? COLORS[0]}" aria-hidden="true">${esc(initials(who?.name))}</span><div><div><b>${esc(e.member === m.member ? "You" : who?.name ?? "Someone")}</b> added <span class="num">${fmt(e.amt, cur)}</span>${e.note ? ` · ${esc(e.note)}` : ""}</div><div class="when">${ago(e.at)}</div></div>
      ${e.member === m.member ? `<button class="iconbtn" data-act="tg-unadd" data-id="${e.id}" aria-label="Remove your deposit of ${fmt(e.amt, cur)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>` : ""}</li>`;
  }).join("");
  body.innerHTML = `
    <div class="tg-total"><span class="num big">${fmt(total, cur)}</span><span class="num">of ${fmt(meta.target, cur)} · ${Math.round(p * 100)}%</span>
      <span class="tg-bar lg"><i data-vars="--p:${p.toFixed(3)}"></i></span></div>
    <div class="tg-quick" role="group" aria-label="Add to the shared jar">${[1000, 2500, 5000].map((v) => `<button class="btn brass" data-act="tg-quick" data-amt="${v}">${fmt(v, cur, { short: true, sign: true })}</button>`).join("")}<button class="btn wide" data-act="tg-add">Other amount</button></div>
    ${left !== null ? `<p class="note ${left <= 3 ? "warn" : ""}">${left} of ${c.me.free_limit} free deposits left. <a href="#/unlock">Plus</a> gives unlimited deposits ($7 one-time).</p>` : ""}
    <section class="panel" aria-labelledby="tg-people"><div class="row"><h2 id="tg-people">People (${active.length}/6)</h2>${active.length < 6 ? `<button class="btn ghost small" data-act="tg-invite">Invite</button>` : ""}</div>
      <ul class="tg-people">${active.map((x) => { const amt = by.get(x.id) ?? 0, share = total ? amt / total : 0; return `<li><span class="tg-av" data-vars="--c:${x.color}" aria-hidden="true">${esc(initials(x.name))}</span>
        <div class="tg-pinfo"><b>${esc(x.id === m.member ? `${x.name} (you)` : x.name)}${x.owner ? ` <small>made this jar</small>` : ""}</b><span class="tg-bar"><i data-vars="--p:${share.toFixed(3)};--c:${x.color}"></i></span></div>
        <span class="num">${fmt(amt, cur, { short: true })}<small>${Math.round(share * 100)}%</small></span>
        ${x.id === m.member ? `<button class="iconbtn" data-act="tg-rename" aria-label="Change your name in this jar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg></button>` : ""}
        ${meOwner && x.id !== m.member ? `<button class="iconbtn" data-act="tg-kick" data-id="${x.id}" aria-label="Remove ${esc(x.name)} from this jar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>` : ""}</li>`; }).join("")}</ul></section>
    <section class="panel" aria-labelledby="tg-feed"><h2 id="tg-feed">Activity</h2>${feed ? `<ul class="tg-feed">${feed}</ul>` : `<p class="fine">No deposits yet. Be the first coin in.</p>`}</section>
    <div class="row">${meOwner ? `<button class="btn ghost small" data-act="tg-edit">Edit jar</button><button class="btn danger small" data-act="tg-delete">Delete jar</button>` : `<button class="btn danger small" data-act="tg-leave">Leave jar</button>`}</div>
    <p class="fine">Locked with the invite link: names and amounts are encrypted on your phone before they're sent. Jars with no activity for 400 days are deleted.</p>`;
  import("./lib/fx.js").then((fx) => fx.applyVars(body));
  jar3d?.setFill(p, { animate: !app.reduced() });
}

async function mount3d(app) {
  const stage = $(".tg-stage");
  if (!stage) return;
  try {
    const m3 = await import("./lib/jar3d.js");
    if (m3.webglAvailable() && stage.isConnected) {
      const canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true"); stage.prepend(canvas);
      let last = 0;
      jar3d = m3.createJar(canvas, { style: "brass", fill: 0, reduced: app.reduced(), zoomOut: 1.12, onCoinLand: () => { const t = performance.now(); if (app.sound() && t - last > 70) { last = t; clink(0.7); } } });
    }
  } catch { jar3d = null; }
}

async function openShared(app, id) {
  const m = membership(app, id);
  if (!m) return;
  liveId = id;
  await mount3d(app);
  await sync(app, m);
  if (liveId !== id) return;
  renderShared(app, id);
  const c = cache.get(id);
  if (c?.meta) jar3d?.setFill(Math.min(1, totals(c).total / c.meta.target), { animate: !app.reduced() });
  poll = setInterval(async () => {
    if (document.hidden || !navigator.onLine || liveId !== id) return;
    const before = cache.get(id), p0 = before?.meta ? totals(before).total / before.meta.target : 0;
    const fresh = await sync(app, m);
    if (liveId !== id) return;
    if (fresh.length || cache.get(id)?.error) renderShared(app, id);
    if (fresh.length) {
      const c2 = cache.get(id), who = c2.members.get(fresh[fresh.length - 1].member)?.name ?? "Someone";
      app.toast(`${who} added ${fmt(fresh.reduce((s, e) => s + e.amt, 0), c2.meta.currency)} 🪙`);
      buzz(15);
      const p1 = totals(c2).total / c2.meta.target;
      if (p0 < 1 && p1 >= 1) confetti({ count: 220 });
    }
  }, POLL_MS);
}

/* ---------------- join from an invite ---------------- */
export function joinView(app) {
  const inv = parseInvite(location.hash);
  if (!inv) return `<h1 tabindex="-1">Invite link not recognised</h1><p class="lead">Ask for the link again, and paste it whole.</p><a class="btn" href="#/together">Back</a>`;
  if (membership(app, inv.id)) { setTimeout(() => app.go(`#/shared/${inv.id}`)); return `<p class="lead">Opening…</p>`; }
  return `<a class="back" href="#/together">← Save Together</a><div id="tg-join"><h1 tabindex="-1">You're invited</h1><p class="lead">Unlocking the invite…</p></div>`;
}

async function loadJoin(app) {
  const inv = parseInvite(location.hash), box = $("#tg-join");
  if (!inv || !box) return;
  const r = await api.preview(inv.id);
  if (!box.isConnected) return;
  if (!r.ok) { box.innerHTML = `<h1 tabindex="-1">Can't open this invite</h1><p class="note bad">${r.status === 404 ? "This shared jar doesn't exist any more." : esc(r.body.error ?? "Try again in a moment.")}</p>`; return; }
  const meta = await open(inv.key, r.body.jar.meta), owner = r.body.owner_profile ? await open(inv.key, r.body.owner_profile) : null;
  if (!meta) { box.innerHTML = `<h1 tabindex="-1">This link is incomplete</h1><p class="note bad">The part after the # is missing or changed, so the jar can't be unlocked. Ask for the link again.</p>`; return; }
  const full = r.body.members >= r.body.max, plus = S.isPlus(app.state);
  box.innerHTML = `<section class="tg-hero sm"><svg class="rosette" data-guilloche="9,4,6,4" aria-hidden="true"></svg><span class="tg-badge">${presetOf(meta.preset).icon} SAVE TOGETHER</span>
    <h1 tabindex="-1">${owner?.name ? `${esc(owner.name)} invited you to <em>${esc(meta.name)}</em>` : `Join <em>${esc(meta.name)}</em>`}</h1>
    <p class="num">Goal: ${fmt(meta.target, meta.currency)} · ${r.body.members} of ${r.body.max} people</p></section>
    ${full ? `<p class="note bad">This jar is full (${r.body.max} people).</p>` : `<form id="tg-joinform" novalidate class="view panel">
      <div class="field"><label for="tg-name">Your name (only people in this jar see it)</label><input id="tg-name" name="name" class="input" maxlength="30" autocomplete="nickname" value="${esc(myName(app))}"><span class="err" data-err="name" role="alert"></span></div>
      ${plus ? `<p class="fine">You have Plus: unlimited deposits.</p>` : `<p class="fine">Joining is free. Free members can add up to 15 deposits to a shared jar and always see it update live. Plus ($7 one-time) gives unlimited deposits and lets you start your own shared jars.</p>`}
      <p class="fine">Your name and deposits are encrypted with this jar's link, so only people with the link can read them. <a href="/legal/privacy">Privacy</a></p>
      <button class="btn brass block" type="button" data-act="tg-join" data-id="${inv.id}">Join this jar</button><p class="err" id="tg-join-err" role="alert"></p></form>`}`;
  import("./lib/fx.js").then((fx) => { fx.applyVars(box); fx.paintGuilloche(box); });
}

/* ---------------- create / invite sheets ---------------- */
function createSheet(app) {
  const cur = app.state.settings.currency || "USD";
  app.sheet(`<h2 id="dlg-title">Start a shared jar</h2>
    <fieldset class="tg-presets"><legend class="label">What are you saving for together?</legend>
      ${PRESETS.map((p, i) => `<label><input type="radio" name="preset" value="${p.id}"${i === 0 ? " checked" : ""} data-change="tg-preset"><span><b aria-hidden="true">${p.icon}</b>${p.name}</span></label>`).join("")}</fieldset>
    <div class="field"><label for="tg-jn">Jar name</label><input id="tg-jn" name="name" class="input" maxlength="40" value="Apartment" data-input="tg-name-touch"><span class="err" data-err="name" role="alert"></span></div>
    <div class="field"><label for="tg-tg">Goal (${esc(cur)})</label><input id="tg-tg" name="target" class="input num" inputmode="decimal" placeholder="e.g. 5000"><span class="err" data-err="target" role="alert"></span></div>
    <div class="field"><label for="tg-me">Your name (shown to people in the jar)</label><input id="tg-me" name="me" class="input" maxlength="30" autocomplete="nickname" value="${esc(myName(app))}"><span class="err" data-err="me" role="alert"></span></div>
    <p class="fine">Up to 6 people. Everything is encrypted with the invite link before it leaves your phone.</p>
    <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn brass">Create and invite</button></div>`,
  async (fd, form) => {
    const name = String(fd.get("name") ?? "").trim(), me = String(fd.get("me") ?? "").trim(), target = toMinor(String(fd.get("target") ?? ""), cur);
    if (!name) return app.fieldError(form, "name", "Give the jar a name.");
    if (!target || target <= 0) return app.fieldError(form, "target", "Enter a goal above zero, like 5000.");
    if (!me) return app.fieldError(form, "me", "Add your name so the others know who's saving.");
    const key = newKey(), token = newToken(), color = COLORS[0];
    const r = await api.create({ licence_key: app.state.license?.key, meta: await seal(key, { name, target, currency: cur, preset: String(fd.get("preset")) }), profile: await seal(key, { name: me, color }), token });
    if (!r.ok) { app.toast(r.body.error ?? "Couldn't create the jar."); return false; }
    const s = structuredClone(app.state);
    s.shared.push({ id: r.body.jar_id, key, member: r.body.member_id, token, joinedAt: Date.now() });
    s.settings.tgName = me;
    app.commit(s);
    app.go(`#/shared/${r.body.jar_id}`);
    setTimeout(() => inviteSheet(app, r.body.jar_id), 400);
  });
}

function inviteSheet(app, id) {
  const m = membership(app, id);
  if (!m) return;
  const link = inviteLink(m.id, m.key);
  app.sheet(`<h2 id="dlg-title">Invite people</h2>
    <p>Send this link to the people saving with you. Anyone with it can open and join the jar, so share it privately.</p>
    <p class="key" id="tg-linktext">${esc(link)}</p>
    <div class="row"><button type="button" class="btn" data-act="tg-copy">Copy link</button>${navigator.share ? `<button type="button" class="btn brass" data-act="tg-share">Share…</button>` : ""}</div>
    <div class="row"><button type="button" class="btn ghost" data-close>Done</button></div>`);
}

function amountSheet(app, id) {
  const c = cache.get(id), cur = c?.meta?.currency ?? "USD";
  app.sheet(`<h2 id="dlg-title">Add to ${esc(c?.meta?.name ?? "the jar")}</h2>
    <div class="field"><label for="tg-amt">Amount (${esc(cur)})</label><input id="tg-amt" name="amt" class="input num" inputmode="decimal" autofocus><span class="err" data-err="amt" role="alert"></span></div>
    <div class="field"><label for="tg-note">Note <span class="hint">(optional)</span></label><input id="tg-note" name="note" class="input" maxlength="80" placeholder="e.g. Birthday money"></div>
    <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn brass">Add to jar</button></div>`,
  async (fd, form) => {
    const amt = toMinor(String(fd.get("amt") ?? ""), cur);
    if (!amt || amt <= 0) return app.fieldError(form, "amt", "Enter an amount above zero.");
    return addDeposit(app, id, amt, String(fd.get("note") ?? "").trim());
  });
}

async function addDeposit(app, id, amt, note = "") {
  const m = membership(app, id), c = cache.get(id);
  if (!m || !c?.meta) return false;
  const r = await api.add(m, await seal(m.key, { amt, note }), S.isPlus(app.state) ? app.state.license.key : undefined);
  if (!r.ok) {
    if (r.body.code === "plus_required") { app.sheet(`<h2 id="dlg-title">Free deposits used</h2><p>${esc(r.body.error)}</p><p class="fine">You can still see the jar update live.</p><div class="row"><button type="button" class="btn ghost" data-close>Not now</button><a class="btn brass" href="#/unlock" data-close>Get Plus · $7 one-time</a></div>`); return false; }
    app.toast(r.body.error ?? "Couldn't add that."); return false;
  }
  const p0 = totals(c).total / c.meta.target;
  c.entries.set(r.body.entry.id, { id: r.body.entry.id, member: m.member, amt, note, at: r.body.entry.created_at });
  if (c.me) c.me.deposits_used += 1;
  renderShared(app, id);
  if (app.sound()) clink();
  buzz(20);
  const p1 = totals(c).total / c.meta.target;
  if (p0 < 1 && p1 >= 1) { confetti({ count: 240 }); app.toast("You filled it together! 🎉"); } else app.toast(`Added ${fmt(amt, c.meta.currency)}. Everyone sees it now.`);
  return true;
}

/* ---------------- wiring ---------------- */
export function installTogether(app, register) {
  document.addEventListener("brimful:view", ({ detail }) => {
    clearInterval(poll); poll = null; liveId = null; jar3d?.dispose(); jar3d = null;
    if (detail.route === "shared") openShared(app, detail.id);
    if (detail.route === "join") loadJoin(app);
    if (detail.route === "together") Promise.all(app.state.shared.map((m) => (cache.get(m.id)?.meta ? null : sync(app, m)))).then(() => {
      if (location.hash.startsWith("#/together")) { const v = document.getElementById("view").firstElementChild; if (v) { v.innerHTML = togetherView(app); import("./lib/fx.js").then((fx) => { fx.applyVars(v); fx.paintGuilloche(v); }); } }
    });
  });
  register({
    "tg-new": () => (S.isPlus(app.state) ? createSheet(app) : app.go("#/unlock")),
    "change:tg-preset": (el) => { const n = el.form.elements.name, p = presetOf(el.value); if (!n.dataset.touched) n.value = p.id === "custom" ? "" : p.name; },
    "input:tg-name-touch": (el) => { el.dataset.touched = "1"; },
    "tg-invite": () => inviteSheet(app, liveId),
    "tg-copy": async () => { try { await navigator.clipboard.writeText($("#tg-linktext").textContent); app.toast("Invite link copied."); } catch { app.toast("Press and hold the link to copy it."); } },
    "tg-share": async () => { try { await navigator.share({ title: "Save with me on Brimful", text: "Join my shared jar on Brimful:", url: $("#tg-linktext").textContent }); } catch { /* cancelled */ } },
    "tg-quick": (el) => addDeposit(app, liveId, Number(el.dataset.amt)),
    "tg-add": () => amountSheet(app, liveId),
    "tg-unadd": async (el) => {
      const m = membership(app, liveId), r = await api.unadd(m, el.dataset.id);
      if (!r.ok) return app.toast(r.body.error ?? "Couldn't remove it.");
      cache.get(liveId)?.entries.delete(el.dataset.id); renderShared(app, liveId); app.toast("Your deposit was removed.");
    },
    "tg-kick": (el) => app.sheet(`<h2 id="dlg-title">Remove this person?</h2><p>They lose access to the jar. Deposits they already added stay in the total.</p><div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn danger">Remove</button></div>`,
      async () => { const r = await api.kick(membership(app, liveId), el.dataset.id); if (!r.ok) { app.toast(r.body.error ?? "Couldn't remove them."); return false; } await sync(app, membership(app, liveId)); renderShared(app, liveId); app.toast("Removed."); }),
    "tg-leave": () => app.sheet(`<h2 id="dlg-title">Leave this shared jar?</h2><p>You'll stop seeing it. Deposits you added stay in the total. You'd need a new invite to come back.</p><div class="row"><button type="button" class="btn ghost" data-close>Stay</button><button class="btn danger">Leave</button></div>`,
      async () => { const m = membership(app, liveId), r = await api.kick(m, m.member); if (!r.ok) { app.toast(r.body.error ?? "Couldn't leave."); return false; } forget(app, m.id); app.toast("You left the jar."); app.go("#/together"); }),
    "tg-delete": () => app.sheet(`<h2 id="dlg-title">Delete this shared jar for everyone?</h2><p>The jar, its members and all deposits are deleted for everyone. This can't be undone.</p><label class="check"><input type="checkbox" name="sure"><span>Yes, delete it for everyone.</span></label><span class="err" data-err="sure" role="alert"></span><div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn danger">Delete</button></div>`,
      async (fd, form) => { if (!fd.get("sure")) return app.fieldError(form, "sure", "Tick the box to confirm."); const m = membership(app, liveId), r = await api.remove(m); if (!r.ok) { app.toast(r.body.error ?? "Couldn't delete it."); return false; } forget(app, m.id); app.toast("Shared jar deleted."); app.go("#/together"); }),
    "tg-edit": () => {
      const c = cache.get(liveId), meta = c.meta;
      app.sheet(`<h2 id="dlg-title">Edit shared jar</h2>
        <div class="field"><label for="tg-en">Name</label><input id="tg-en" name="name" class="input" maxlength="40" value="${esc(meta.name)}"></div>
        <div class="field"><label for="tg-et">Goal (${esc(meta.currency)})</label><input id="tg-et" name="target" class="input num" inputmode="decimal" value="${toInput(meta.target, meta.currency)}"><span class="err" data-err="target" role="alert"></span></div>
        <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn brass">Save</button></div>`,
      async (fd, form) => {
        const target = toMinor(String(fd.get("target") ?? ""), meta.currency), name = String(fd.get("name") ?? "").trim() || meta.name;
        if (!target || target <= 0) return app.fieldError(form, "target", "Enter a goal above zero.");
        const m = membership(app, liveId), next = { ...meta, name, target }, r = await api.editMeta(m, await seal(m.key, next));
        if (!r.ok) { app.toast(r.body.error ?? "Couldn't save."); return false; }
        c.meta = next; renderShared(app, liveId); app.toast("Saved. Everyone sees the change.");
      });
    },
    "tg-rename": () => {
      const c = cache.get(liveId), m = membership(app, liveId), mine = c?.members.get(m.member);
      if (!mine) return;
      app.sheet(`<h2 id="dlg-title">Your name in this jar</h2>
        <div class="field"><label for="tg-rn">Your name (only people in this jar see it)</label><input id="tg-rn" name="name" class="input" maxlength="30" autocomplete="nickname" value="${esc(mine.name)}"><span class="err" data-err="name" role="alert"></span></div>
        <div class="row"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn brass">Save</button></div>`,
      async (fd, form) => {
        const name = String(fd.get("name") ?? "").trim().slice(0, 30);
        if (!name) return app.fieldError(form, "name", "Add your name so the others know who's saving.");
        const r = await api.editProfile(m, await seal(m.key, { name, color: mine.color }));
        if (!r.ok) { app.toast(r.body.error ?? "Couldn't save."); return false; }
        mine.name = name;
        const s = structuredClone(app.state); s.settings.tgName = name; app.commit(s);
        renderShared(app, liveId); app.toast("Saved. Everyone sees your new name.");
      });
    },
    "tg-forget": (el) => { forget(app, el.dataset.id); app.go("#/together"); },
    "tg-open-link": () => {
      const form = $("#tg-paste"), inv = parseInvite(form.elements.link.value);
      if (!inv) return app.fieldError(form, "link", "That doesn't look like a Brimful invite link. Paste the whole link.");
      location.hash = `#/join/${inv.id}.${inv.key}`;
    },
    "tg-join": async (el) => {
      const form = $("#tg-joinform"), name = form.elements.name.value.trim(), inv = parseInvite(location.hash);
      if (!name) return app.fieldError(form, "name", "Add your name so the others know who's saving.");
      el.disabled = true;
      const token = newToken();
      const color = COLORS[(Math.floor(Math.random() * (COLORS.length - 1)) + 1) % COLORS.length];
      const r = await api.join(inv.id, { profile: await seal(inv.key, { name, color }), token });
      el.disabled = false;
      if (!r.ok) { $("#tg-join-err").textContent = r.body.error ?? "Couldn't join. Try again."; return; }
      const s = structuredClone(app.state);
      s.shared.push({ id: inv.id, key: inv.key, member: r.body.member_id, token, joinedAt: Date.now() });
      s.settings.tgName = name;
      app.commit(s);
      app.toast("You're in! Add your first coin.");
      app.go(`#/shared/${inv.id}`);
    },
  });
}

function forget(app, id) {
  const s = structuredClone(app.state);
  s.shared = s.shared.filter((m) => m.id !== id);
  app.commit(s);
  cache.delete(id);
}
export const _test = { totals };
