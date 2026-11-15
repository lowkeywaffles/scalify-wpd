// Small delights: coin sounds, confetti, haptics, banknote-style line art. All optional and all local.

let audio = null;
/** A short metallic "clink", synthesised (no audio files). Only ever called after a tap. */
export function clink(strength = 1) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const t = audio.currentTime;
    const out = audio.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.09 * strength, t + 0.004);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    out.connect(audio.destination);
    for (const [f, type] of [[2140 + Math.random() * 500, "sine"], [3410 + Math.random() * 700, "triangle"], [5270, "sine"]]) {
      const o = audio.createOscillator();
      o.type = type; o.frequency.setValueAtTime(f, t);
      o.connect(out); o.start(t); o.stop(t + 0.34);
    }
  } catch { /* sound is optional */ }
}
/** Rising three-note chime for milestones. */
export function chime() {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const t = audio.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.09);
      g.gain.exponentialRampToValueAtTime(0.07, t + i * 0.09 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.5);
      o.connect(g); g.connect(audio.destination); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.55);
    });
  } catch { /* optional */ }
}
export const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch { /* optional */ } };

/** Confetti burst drawn on a temporary full-screen canvas. Skipped when motion is reduced. */
export function confetti({ colors = ["#D8A531", "#0C6A4E", "#F6E7BF", "#3CC796", "#FFFFFF"], count = 140, origin = [0.5, 0.42] } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off") return;
  const c = document.createElement("canvas");
  c.className = "confetti"; c.setAttribute("aria-hidden", "true");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  document.body.appendChild(c);
  const g = c.getContext("2d");
  const parts = Array.from({ length: count }, () => {
    const a = Math.random() * Math.PI * 2, v = 5 + Math.random() * 11;
    return { x: origin[0] * c.width, y: origin[1] * c.height, vx: Math.cos(a) * v * dpr, vy: (Math.sin(a) * v - 7) * dpr, w: (5 + Math.random() * 7) * dpr, h: (3 + Math.random() * 5) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5, col: colors[(Math.random() * colors.length) | 0], coin: Math.random() < 0.25 };
  });
  let frames = 0;
  (function tick() {
    g.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.34 * dpr; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      g.save(); g.translate(p.x, p.y); g.rotate(p.r);
      g.globalAlpha = Math.max(0, 1 - frames / 150);
      g.fillStyle = p.col;
      if (p.coin) { g.beginPath(); g.ellipse(0, 0, p.w * 0.7, p.w * 0.7 * Math.abs(Math.cos(p.r * 2)), 0, 0, 6.3); g.fill(); } else g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      g.restore();
    }
    if (++frames < 150) requestAnimationFrame(tick); else c.remove();
  })();
}

/**
 * Guilloché rosette: the looping line pattern engraved on banknotes. Returns an SVG path string.
 * Different (R, r, d) values give different flowers.
 */
export function guilloche({ R = 5, r = 3, d = 5, size = 100, turns = 3, steps = 720 } = {}) {
  const k = (R - r) / r, scale = size / 2 / (Math.abs(R - r) + d);
  let path = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2 * turns;
    const x = ((R - r) * Math.cos(t) + d * Math.cos(k * t)) * scale + size / 2;
    const y = ((R - r) * Math.sin(t) - d * Math.sin(k * t)) * scale + size / 2;
    path += `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return path + "Z";
}
/** Fills every <svg data-guilloche="R,r,d,turns"> on the page with its rosette. */
export function paintGuilloche(root = document) {
  root.querySelectorAll("svg[data-guilloche]").forEach((svg) => {
    if (svg.dataset.done) return;
    const [R, r, d, turns] = svg.dataset.guilloche.split(",").map(Number);
    svg.setAttribute("viewBox", "0 0 100 100");
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", guilloche({ R, r, d, turns: turns || 3 }));
    p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "0.25");
    svg.appendChild(p); svg.dataset.done = "1";
  });
}

/** CSP-safe way to set CSS custom properties from markup: <div data-vars="--p:0.4;--i:2">. */
export function applyVars(root = document) {
  root.querySelectorAll("[data-vars]").forEach((el) => {
    for (const pair of el.dataset.vars.split(";")) { const i = pair.indexOf(":"); if (i > 0) el.style.setProperty(pair.slice(0, i).trim(), pair.slice(i + 1).trim()); }
  });
}

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
