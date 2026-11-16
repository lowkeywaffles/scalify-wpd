// Landing page motion: one WebGL jar that fills as you scroll, a 3D envelope wall, tilting screenshots.
// Everything here is decoration. With reduced motion or no WebGL the page shows a static picture instead.
import { paintGuilloche } from "./lib/fx.js";
import { fetchProduct } from "./lib/api.js";

const $ = (s) => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";
paintGuilloche();
$("#yr").textContent = new Date().getFullYear();
const nav = $(".nav");
addEventListener("scroll", () => nav.classList.toggle("scrolled", scrollY > 8), { passive: true });

// envelope wall
const wall = $("#wall"), nums = [22, 35, 37, 54, 69, 25, 84, 29, 6, 32, 63, 81, 87, 38, 20, 90, 41, 2, 57, 49, 13, 76, 8, 95, 44, 61, 17, 70, 3, 52];
wall.innerHTML = nums.map((n) => `<div class="env"><i class="f"><span>${n}</span></i><i class="b">✓</i></div>`).join("");
const envs = [...wall.children];

// live price for the pricing card (falls back to the number in the page)
fetchProduct().then((r) => {
  if (!r.ok) return;
  if (r.body.price_etb) $("#plus-price").textContent = Number(r.body.price_etb).toLocaleString("en-US");
  if (r.body.card?.price_usd) $("#plus-usd").textContent = Number(r.body.card.price_usd).toLocaleString("en-US");
});

const TARGET = 2000;
function meter(p) {
  $("#meter-amt").textContent = `$${(Math.round((TARGET * p) / 10) * 10).toLocaleString("en-US")}`;
  $("#meter-pct").textContent = `${Math.round(p * 100)}%`;
  $("#meter-bar").style.width = `${p * 100}%`;
}

async function start() {
  const canvas = $("#herojar"), steps = [...document.querySelectorAll(".step")];
  let jar = null;
  try {
    const m = await import("./lib/jar3d.js");
    if (m.webglAvailable()) jar = m.createJar(canvas, { fill: 0, reduced, spin: !reduced, zoomOut: 1.22 });
  } catch { jar = null; }
  if (!jar) { canvas.hidden = true; $(".jarfallback").hidden = false; }

  const setFill = (p, animate = true) => { jar?.setFill(p, { animate }); meter(p); };
  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (reduced || !gsap || !ST) { setFill(0.62, false); envs.forEach((e, i) => e.classList.toggle("on", i % 3 === 0)); return; }
  gsap.registerPlugin(ST);

  // smooth scrolling (Lenis), driven by GSAP's ticker so there is one animation loop
  if (window.Lenis) {
    const lenis = new window.Lenis({ anchors: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // hero entrance
  gsap.from(".step.hero > *", { y: 46, opacity: 0, rotationX: -22, transformPerspective: 900, transformOrigin: "50% 100%", duration: 0.9, ease: "power3.out", stagger: 0.09 });
  gsap.from(canvas, { opacity: 0, scale: 0.86, duration: 1.1, ease: "power3.out", delay: 0.15 });
  setTimeout(() => setFill(0.06), 500);

  // each story step sets the jar's fill when it reaches the middle of the screen
  steps.forEach((el) => {
    const fill = Number(el.dataset.fill);
    ST.create({ trigger: el, start: "top 55%", end: "bottom 55%", onEnter: () => setFill(fill), onEnterBack: () => setFill(fill) });
    if (!el.classList.contains("hero")) gsap.from(el.children, { scrollTrigger: { trigger: el, start: "top 78%" }, y: 50, opacity: 0, rotationX: -25, transformPerspective: 900, transformOrigin: "50% 100%", duration: 0.8, ease: "power3.out", stagger: 0.08 });
  });
  // the jar turns and the camera leans in across the whole story
  if (jar) ST.create({ trigger: "#story", start: "top top", end: "bottom bottom", scrub: 0.6, onUpdate: (s) => jar.pose({ yaw: s.progress * Math.PI * 1.6, pull: Math.sin(s.progress * Math.PI) * 0.9 }) });

  // envelope wall: tilts into place and flips envelopes as it scrolls through
  gsap.fromTo(wall, { rotationX: 68, rotationZ: -34, y: 80 }, { rotationX: 46, rotationZ: -18, y: -30, ease: "none", scrollTrigger: { trigger: ".wall", start: "top bottom", end: "bottom top", scrub: 0.8 } });
  const order = [3, 14, 7, 22, 11, 26, 0, 18, 9, 28, 5, 20, 16, 24, 2, 12];
  ST.create({ trigger: ".wall", start: "top 80%", end: "bottom 30%", scrub: true, onUpdate: (s) => { const n = Math.round(s.progress * order.length); order.forEach((idx, k) => envs[idx].classList.toggle("on", k < n)); } });
  gsap.from(".chlist li", { scrollTrigger: { trigger: ".chlist", start: "top 82%" }, x: -40, opacity: 0, rotationY: 25, transformPerspective: 800, duration: 0.7, ease: "power3.out", stagger: 0.12 });

  // screenshots: fan out in 3D, straighten as they pass the middle
  const figs = gsap.utils.toArray("#fan figure");
  if (matchMedia("(min-width: 621px)").matches) {
    figs.forEach((f, i) => gsap.fromTo(f, { rotationY: (i - 1) * -34, rotationX: 14, z: i === 1 ? 0 : -160, y: 90 + i * 30 }, { rotationY: (i - 1) * -8, rotationX: 0, z: i === 1 ? 40 : -20, y: 0, ease: "none", scrollTrigger: { trigger: "#fan", start: "top 95%", end: "top 25%", scrub: 0.7 } }));
  }

  // cards and plans tip up as they arrive
  gsap.utils.toArray(".cards3 article, .plan").forEach((el, i) => gsap.from(el, { scrollTrigger: { trigger: el, start: "top 90%" }, y: 60, opacity: 0, rotationX: -30, transformPerspective: 900, transformOrigin: "50% 100%", duration: 0.8, ease: "power3.out", delay: (i % 4) * 0.07 }));
  gsap.utils.toArray(".band h2, .screens h2").forEach((el) => gsap.from(el, { scrollTrigger: { trigger: el, start: "top 88%" }, y: 40, opacity: 0, duration: 0.8, ease: "power3.out" }));

  // plans lean towards the pointer on desktop
  if (matchMedia("(pointer:fine)").matches) document.querySelectorAll(".plan").forEach((el) => {
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); gsap.to(el, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 9, rotationX: -((e.clientY - r.top) / r.height - 0.5) * 7, transformPerspective: 900, duration: 0.4 }); });
    el.addEventListener("pointerleave", () => gsap.to(el, { rotationY: 0, rotationX: 0, duration: 0.6 }));
  });
  addEventListener("load", () => ST.refresh());
}
if (window.gsap || document.readyState === "complete") start(); else addEventListener("load", start, { once: true });
