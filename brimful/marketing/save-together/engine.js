/* Kinetic Launch Film engine — deterministic, frame-exact motion for 1080x1920.
   Every visual is a pure function of time: window.seek(t) puts the page in its
   exact state at t seconds. No CSS animations / transitions / rAF anywhere. */
(function () {
  const W = 1080, H = 1920;
  // UNIVERSAL social safe rectangle (TikTok + Reels + Shorts)
  const SAFE = { l: 120, t: 270, r: 840, b: 1248 };
  const CX = (SAFE.l + SAFE.r) / 2, CY = (SAFE.t + SAFE.b) / 2;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    linear: p => p,
    outCubic: p => 1 - Math.pow(1 - p, 3),
    inCubic: p => p * p * p,
    inOutCubic: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outQuint: p => 1 - Math.pow(1 - p, 5),
    outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inExpo: p => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10)),
    inOutExpo: p => p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
    outBack: (p, s = 1.70158) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
    // damped spring, overshoots then settles; p in 0..1 of its window
    // k = damping (higher = less bounce), f = oscillations across the window
    spring: (p, k = 5.5, f = 1.6) => p <= 0 ? 0 : p >= 1 ? 1 : 1 - Math.exp(-k * p) * Math.cos(Math.PI * 2 * f * p),
  };
  // progress of a window [a, a+d] eased
  const P = (t, a, d, fn = ease.outCubic) => fn(clamp((t - a) / d));
  // in-hold-out envelope 0..1..0
  const env = (t, a, inD, b, outD, fi = ease.outCubic, fo = ease.inCubic) =>
    t < b ? P(t, a, inD, fi) : 1 - P(t, b, outD, fo);

  function rng(seed) { // mulberry32
    let s = seed >>> 0;
    return () => { s += 0x6D2B79F5; let r = Math.imul(s ^ (s >>> 15), 1 | s); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
  }
  function h(tag, attrs = {}, parent) {
    const isSvg = ['svg', 'path', 'circle', 'ellipse', 'g', 'rect', 'line', 'polyline'].includes(tag);
    const e = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
    for (const k in attrs) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  const css = (e, o) => { for (const k in o) e.style[k] = o[k]; return e; };
  const tf = (e, s) => { e.style.transform = s; return e; };

  // ---------- Kinetic text ----------
  // Builds a line of word spans. words: ['Rent', {w:'calm.', accent:true}]
  function line(parent, words, o = {}) {
    const box = h('div', { class: 'kline ' + (o.cls || '') }, parent);
    css(box, { left: SAFE.l + 'px', width: (SAFE.r - SAFE.l) + 'px', top: (o.y - (o.size || 110) * .62) + 'px', fontSize: (o.size || 110) + 'px' });
    const spans = words.map(w => {
      const d = typeof w === 'string' ? { w } : w;
      const s = h('span', { class: 'kw ess' + (d.accent ? ' accent' : '') + (d.cls ? ' ' + d.cls : ''), text: d.w }, box);
      return s;
    });
    return { box, spans, o };
  }
  // shrink a line until it fits inside maxW (safe width minus padding)
  function fit(L, maxW = SAFE.r - SAFE.l - 30) {
    let fs = parseFloat(L.box.style.fontSize);
    L.box.style.whiteSpace = 'nowrap';
    const inner = () => L.spans.reduce((a, s) => a + s.offsetWidth, 0) + (L.spans.length - 1) * fs * .26;
    let guard = 0;
    while (inner() > maxW && guard++ < 60) { fs *= .97; L.box.style.fontSize = fs + 'px'; }
    return fs;
  }
  // word-by-word reveal: blur + rise + tilt, optional per-word override
  function reveal(L, t, a, o = {}) {
    const st = o.stagger ?? .09, d = o.dur ?? .55, dist = o.dist ?? 70;
    L.spans.forEach((s, i) => {
      const p = P(t, a + i * st, d, ease.outExpo);
      const blur = (1 - p) * (o.blur ?? 14);
      s.style.opacity = clamp(p * 1.6);
      s.style.filter = blur > .05 ? `blur(${blur}px)` : 'none';
      s.style.transform = `translateY(${(1 - p) * dist}px) rotate(${(1 - p) * (o.rot ?? -8)}deg) scale(${lerp(o.from ?? .86, 1, p)})`;
    });
  }
  function hideOut(L, t, a, o = {}) { // exit: blur up + fade (call after reveal)
    const st = o.stagger ?? .04, d = o.dur ?? .4;
    L.spans.forEach((s, i) => {
      const p = P(t, a + i * st, d, ease.inCubic);
      if (p <= 0) return;
      s.style.opacity = (parseFloat(s.style.opacity) || 1) * (1 - p);
      s.style.filter = `blur(${p * 16}px)`;
      s.style.transform += ` translateY(${-p * (o.dist ?? 50)}px) scale(${1 - p * .1})`;
    });
  }

  // ---------- Scribble underline ----------
  function scribble(parent, w, o = {}) {
    const svg = h('svg', { class: 'scribble', viewBox: `0 0 ${w} 40`, width: w, height: 40 }, parent);
    let d = `M 4 ${o.loop ? 22 : 24}`;
    const n = Math.max(3, Math.round(w / 70));
    for (let i = 1; i <= n; i++) {
      const x = (w - 8) * i / n + 4;
      d += o.loop ? ` q ${-(w / n) * .55} -26 ${-(w / n) * .1} -12 s ${(w / n) * .55} 6 ${(w / n) * .1} 12` : '';
      d += ` Q ${x - (w / n) / 2} ${i % 2 ? 34 : 14} ${x} ${24 + (i % 2 ? 2 : -2)}`;
    }
    const p = h('path', { d, fill: 'none', stroke: o.color || 'var(--accent)', 'stroke-width': o.sw || 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, svg);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
    return { svg, set: q => { p.style.strokeDashoffset = len * (1 - clamp(q)); } };
  }

  // ---------- Particle canvas (dissolves, confetti, sparkles) ----------
  const FX = { bursts: [] };
  // burst defined in time; drawn statelessly from its definition each frame
  function burst(def) { // {t, x, y, n, kind:'dust'|'confetti'|'spark', color(s), spread, speed, dir, life, seed, src:{x,y,w,h}}
    FX.bursts.push(def); return def;
  }
  function drawFX(ctx, t) {
    ctx.clearRect(0, 0, W, H);
    for (const b of FX.bursts) {
      const lt = t - b.t, life = b.life || 1.2;
      if (lt < 0 || lt > life + .4) continue;
      const r = rng(b.seed || 7);
      const cols = [].concat(b.color || ['#FF5B1F']);
      for (let i = 0; i < (b.n || 60); i++) {
        const delay = (b.stagger || 0) * r();
        const ox = b.src ? b.src.x + r() * b.src.w : b.x, oy = b.src ? b.src.y + r() * b.src.h : b.y;
        const ang = (b.dir ?? -Math.PI / 2) + (r() - .5) * (b.spread ?? Math.PI * 2);
        const sp = (b.speed || 600) * (.35 + r() * .85);
        const sz = (b.size || 6) * (.4 + r());
        const c = cols[Math.floor(r() * cols.length)];
        const spin = (r() - .5) * 14, wob = r() * 6.28;
        const tt = lt - delay; if (tt < 0) continue;
        const k = clamp(tt / life);
        const drag = (1 - Math.exp(-tt * 3.2)) / 3.2; // integrated velocity with drag
        let x = ox + Math.cos(ang) * sp * drag, y = oy + Math.sin(ang) * sp * drag + (b.grav || 0) * tt * tt;
        if (b.to) { // implode: swirl from source into a target point
          const q = ease.inCubic(k), sw = (1 - q) * 120 * (r() - .5);
          x = lerp(ox, b.to.x, q) + Math.cos(tt * 5 + wob) * sw; y = lerp(oy, b.to.y, q) + Math.sin(tt * 5 + wob) * sw;
        }
        if (b.kind === 'dust') { x += Math.sin(tt * 4 + wob) * 18 * k; y -= tt * 40; }
        const a = (b.to ? clamp((1 - k) / .12) * clamp(tt / .1) : 1 - ease.inCubic(k)) * (b.alpha ?? 1);
        if (a <= 0) continue;
        ctx.globalAlpha = a; ctx.fillStyle = c;
        ctx.save(); ctx.translate(x, y);
        if (b.kind === 'confetti') { ctx.rotate(spin * tt + wob); ctx.scale(1, Math.cos(tt * 9 + wob)); ctx.fillRect(-sz, -sz * .45, sz * 2, sz * .9); }
        else if (b.kind === 'spark') { const s = sz * (1 - k) * 1.6; ctx.rotate(spin * .1); star(ctx, s); }
        else { ctx.beginPath(); ctx.arc(0, 0, sz * (1 - k * .6), 0, 6.283); ctx.fill(); }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  function star(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill(); }

  // ---------- Pointer cursor (the hero pointer) ----------
  // keys: [{t, x, y} | {t, el:'#id', dx, dy}], taps: [t...], vis: [[a,b]...]
  const CUR = { keys: [], taps: [], vis: [] };
  function keyPos(k) {
    if (k.el) { const e = document.querySelector(k.el); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2 + (k.dx || 0), y: r.top + r.height / 2 + (k.dy || 0) }; }
    return { x: k.x, y: k.y };
  }
  function cursorAt(t) {
    const K = CUR.keys; if (!K.length) return null;
    if (t <= K[0].t) return keyPos(K[0]);
    for (let i = 0; i < K.length - 1; i++) {
      const a = K[i], b = K[i + 1];
      if (t >= a.t && t <= b.t) {
        const pa = keyPos(a), pb = keyPos(b), p = (b.ease || ease.inOutCubic)(clamp((t - a.t) / (b.t - a.t)));
        // arc the path slightly for a hand-thrown feel
        const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2, nx = -(pb.y - pa.y), ny = pb.x - pa.x, L = Math.hypot(nx, ny) || 1;
        const bend = (b.bend ?? .18) * Math.hypot(pb.x - pa.x, pb.y - pa.y);
        const cx = mx + nx / L * bend, cy = my + ny / L * bend, q = 1 - p;
        let x = q * q * pa.x + 2 * q * p * cx + p * p * pb.x, y = q * q * pa.y + 2 * q * p * cy + p * p * pb.y;
        if (b.idle) { x += Math.sin(t * 2.1) * 6; y += Math.cos(t * 1.7) * 8; }
        return { x, y };
      }
    }
    const last = keyPos(K[K.length - 1]);
    return { x: last.x + Math.sin(t * 2.1) * 6, y: last.y + Math.cos(t * 1.7) * 8 };
  }
  // Classic arrow; the key position is the tip (hotspot). Comet tail = tapered polygons along the recent path.
  const TAIL_N = 18, TAIL_DT = 0.012;
  function tailPath(pts, w0, pow) {
    const Ls = [], Rs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b.y - a.y), ny = b.x - a.x; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      const w = w0 / 2 * Math.pow(1 - i / (pts.length - 1), pow);
      Ls.push(`${pts[i].x + nx * w},${pts[i].y + ny * w}`); Rs.unshift(`${pts[i].x - nx * w},${pts[i].y - ny * w}`);
    }
    return 'M' + Ls.concat(Rs).join(' L') + 'Z';
  }
  function drawCursor(t) {
    const root = document.getElementById('cursor');
    const visible = CUR.vis.some(([a, b]) => t >= a && t <= b);
    root.style.display = visible ? 'block' : 'none';
    if (!visible) return;
    const p = cursorAt(t), p1 = cursorAt(t - 1 / 60);
    const vx = (p.x - p1.x) * 60, vy = (p.y - p1.y) * 60, v = Math.hypot(vx, vy);
    // tail trails from the arrow body (a little behind the tip), visible only when moving fast
    const pts = []; for (let i = 0; i <= TAIL_N; i++) { const q = cursorAt(t - i * TAIL_DT); pts.push({ x: q.x + 10, y: q.y + 16 }); }
    const Wt = CUR.tailWidth || 22, show = clamp((v - 150) / 1100);
    const [tail, core] = root.querySelectorAll('.tail path');
    tail.setAttribute('d', tailPath(pts, Wt, .9)); tail.style.opacity = .5 * show;
    core.setAttribute('d', tailPath(pts, Wt * .4, 1.3)); core.style.opacity = .9 * show;
    // press on tap + slight lean into horizontal motion
    let press = 1;
    for (const tp of CUR.taps) { const q = clamp((t - tp + .06) / .26); if (q > 0 && q < 1) press = Math.min(press, 1 - Math.sin(q * Math.PI) * .2); }
    const lean = clamp(vx / 2600, -1, 1) * 9;
    root.querySelector('.ptr').style.transform = `translate(${p.x}px, ${p.y}px) rotate(${lean}deg) scale(${press})`;
    // tap ripples at the tip
    root.querySelectorAll('.ripple').forEach((rp, i) => {
      const tp = CUR.taps[i]; const q = clamp((t - tp) / .55);
      if (q <= 0 || q >= 1) { rp.style.opacity = 0; return; }
      const c = cursorAt(tp);
      rp.style.opacity = (1 - q) * .9;
      rp.style.transform = `translate(${c.x - 60}px, ${c.y - 60}px) scale(${.3 + ease.outCubic(q) * 1.4})`;
    });
  }
  function buildCursor() {
    const root = h('div', { id: 'cursor' }, document.getElementById('stage'));
    CUR.taps.forEach(() => h('div', { class: 'ripple' }, root));
    const svg = h('svg', { class: 'tail', width: W, height: H, viewBox: `0 0 ${W} ${H}` }, root);
    h('path', { fill: CUR.tailColor || 'var(--accent)' }, svg); h('path', { fill: CUR.tailCore || '#FFFFFF' }, svg);
    const ptr = h('div', { class: 'ptr' }, root);
    ptr.innerHTML = `<svg width="60" height="76" viewBox="0 0 30 38"><path d="M3 2 L3 30 L10 24 L14.8 35 L19.6 32.9 L14.9 22.3 L24.4 22.3 Z" fill="${CUR.fill || '#FFFFFF'}" stroke="${CUR.stroke || '#1A120C'}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  }

  // ---------- Safe-zone audit ----------
  function effOpacity(e) {
    let o = 1;
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
      o *= parseFloat(cs.opacity);
    }
    return o;
  }
  function audit(tol = 0) {
    const out = [];
    document.querySelectorAll('.ess').forEach(e => {
      if (effOpacity(e) < .12) return;
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      if (r.left < SAFE.l - tol || r.top < SAFE.t - tol || r.right > SAFE.r + tol || r.bottom > SAFE.b + tol)
        out.push({ el: (e.id || e.className.baseVal || e.className) + ' "' + (e.textContent || '').trim().slice(0, 30) + '"', box: [r.left, r.top, r.right, r.bottom].map(Math.round) });
    });
    return out;
  }

  // ---------- Film / scene timeline ----------
  const FILM = { scenes: [], cues: [], duration: 0, update: [] };
  function scene(name, start, end, build, update) {
    const root = h('div', { class: 'scene', 'data-name': name }, document.getElementById('world'));
    const s = { name, start, end, root, update };
    build && build(root, s);
    FILM.scenes.push(s); FILM.duration = Math.max(FILM.duration, end);
    return s;
  }
  function cue(t, type, gain = 1) { FILM.cues.push({ t, type, gain }); }
  let fxCtx;
  function seek(t) {
    for (const f of FILM.update) f(t); // global layers (bg, camera, props)
    for (const s of FILM.scenes) {
      const on = t >= s.start && t < s.end;
      s.root.style.display = on ? 'block' : 'none';
      if (on) s.update(t - s.start, t, s);
    }
    drawFX(fxCtx, t);
    drawCursor(t);
  }
  function init() {
    fxCtx = document.getElementById('fx').getContext('2d');
    buildCursor();
    // resolve element-anchored bursts by visiting their moment once
    for (const b of FX.bursts) if (b._el) { seek(b.t); const r = document.querySelector(b._el).getBoundingClientRect(); b.x = r.left + r.width / 2; b.y = r.top + r.height / 2; }
    if (/guides=1/.test(location.search)) document.body.classList.add('guides');
    window.FILM_INFO = { duration: FILM.duration, cues: FILM.cues, scenes: FILM.scenes.map(s => ({ name: s.name, start: s.start, end: s.end })) };
  }

  window.seek = seek;
  window.E = { W, H, SAFE, CX, CY, clamp, lerp, ease, P, env, rng, h, css, tf, line, fit, reveal, hideOut, scribble, burst, FX, CUR, audit, scene, cue, FILM, init };
})();
