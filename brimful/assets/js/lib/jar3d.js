// The Brimful jar: a glass jar that fills with coins. WebGL via three.js (self-hosted subset bundle).
// Purely decorative: every number it shows is also in the page as text, and it is hidden from screen readers.
import * as T from "../../vendor/three.bundle.js";
import { rng } from "./challenges.js";

export const STYLE_COLORS = {
  brass: { coin: 0xdfa52c, lid: 0xb98a1e, glass: 0xbfe9d9 },
  silver: { coin: 0xd4dbe0, lid: 0x8b979f, glass: 0xcfe4f4 },
  rose: { coin: 0xf0a58e, lid: 0xb9684f, glass: 0xf8dcd2 },
  jade: { coin: 0x5fd0a6, lid: 0x1f7f5f, glass: 0xc9f0e0 },
  ink: { coin: 0x8fa3ff, lid: 0x2b3a8c, glass: 0xd5dcff },
  sunset: { coin: 0xff9b54, lid: 0xc2452d, glass: 0xffe0c4 },
};

const CAP = 330; // coins when the jar is full
const COIN_R = 0.23, COIN_H = 0.055;
const FLOOR = 0.1, PILE_TOP = 1.86, INNER_R = 0.72;

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

function softTexture(stops, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return t;
}

/** A tiny studio (soft boxes on a dark-to-warm backdrop) used only to give the metal something to reflect. */
function studioEnv(renderer) {
  const scene = new T.Scene();
  const c = document.createElement("canvas");
  c.width = 4; c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#fbf8ee"); grad.addColorStop(0.5, "#a3b0a4"); grad.addColorStop(1, "#4c5c52");
  g.fillStyle = grad; g.fillRect(0, 0, 4, 128);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  scene.add(new T.Mesh(new T.SphereGeometry(20, 24, 16), new T.MeshBasicMaterial({ map: tex, side: T.BackSide })));
  const box = (x, y, z, w, h, col) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: col })); m.position.set(x, y, z); m.lookAt(0, 0, 0); scene.add(m); };
  box(-8, 6, 6, 7, 9, 0xffffff); box(9, 3, 4, 4, 8, 0xfff0cf); box(0, 10, -6, 10, 4, 0xdff5ea);
  const pm = new T.PMREMGenerator(renderer);
  const env = pm.fromScene(scene, 0.04).texture;
  pm.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
  return env;
}

const GLASS_VERT = `varying vec3 vN; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }`;
const GLASS_FRAG = `uniform vec3 uTint; uniform float uBoost; varying vec3 vN; varying vec3 vP;
void main(){ vec3 n = normalize(vN); vec3 v = normalize(-vP); float ndv = abs(dot(n,v));
  float fres = pow(1.0 - ndv, 2.4);
  float band = smoothstep(0.50,0.58,n.x) * smoothstep(0.80,0.70,n.x) * smoothstep(-0.2,0.5,n.y+0.6);
  float thin = smoothstep(-0.78,-0.72,n.x) * smoothstep(-0.62,-0.68,n.x);
  vec3 col = mix(uTint, vec3(1.0), clamp(fres*0.9 + band*0.8 + thin*0.6, 0.0, 1.0));
  float a = 0.05 + fres*0.6 + band*0.34 + thin*0.2;
  gl_FragColor = vec4(col, clamp(a*uBoost, 0.0, 0.95)); }`;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ style?: string, fill?: number, reduced?: boolean, interactive?: boolean, onCoinLand?: () => void }} opts
 */
export function createJar(canvas, opts = {}) {
  const reduced = Boolean(opts.reduced);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = T.SRGBColorSpace;

  const scene = new T.Scene();
  scene.environment = studioEnv(renderer);
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
  const camBase = new T.Vector3(0, 1.75, 7.6);
  camera.position.copy(camBase);
  const look = new T.Vector3(0, 1.12, 0);
  camera.lookAt(look);

  scene.add(new T.HemisphereLight(0xffffff, 0x20362c, 0.9));
  const key = new T.DirectionalLight(0xfff3d6, 2.2); key.position.set(3.5, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(0xbfe9d9, 1.1); rim.position.set(-4, 3, -3); scene.add(rim);

  const jar = new T.Group();
  scene.add(jar);
  let colors = STYLE_COLORS[opts.style] ?? STYLE_COLORS.brass;

  // glass body
  const profile = [[0.0, 0.0], [0.9, 0.0], [0.99, 0.05], [1.0, 0.16], [1.0, 1.5], [0.97, 1.68], [0.84, 1.9], [0.74, 1.98], [0.74, 2.16], [0.78, 2.19], [0.78, 2.22]].map(([x, y]) => new T.Vector2(x, y));
  const glassMat = new T.ShaderMaterial({ uniforms: { uTint: { value: new T.Color(colors.glass) }, uBoost: { value: 1 } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: T.DoubleSide });
  const glass = new T.Mesh(new T.LatheGeometry(profile, 72), glassMat);
  glass.renderOrder = 3;
  jar.add(glass);

  // lid
  const lidMat = new T.MeshStandardMaterial({ color: colors.lid, metalness: 0.95, roughness: 0.32 });
  const lid = new T.Group();
  const lidTop = new T.Mesh(new T.CylinderGeometry(0.83, 0.83, 0.2, 56), lidMat);
  const lidRing = new T.Mesh(new T.TorusGeometry(0.83, 0.035, 10, 56), lidMat); lidRing.rotation.x = Math.PI / 2; lidRing.position.y = -0.08;
  const lidKnob = new T.Mesh(new T.CylinderGeometry(0.5, 0.56, 0.05, 40), lidMat); lidKnob.position.y = 0.12;
  lid.add(lidTop, lidRing, lidKnob);
  const LID_Y = 2.3;
  lid.position.y = LID_Y;
  jar.add(lid);

  // coins
  const coinMat = new T.MeshStandardMaterial({ color: colors.coin, metalness: 0.9, roughness: 0.27, envMapIntensity: 1.25 });
  const coins = new T.InstancedMesh(new T.CylinderGeometry(COIN_R, COIN_R, COIN_H, 22), coinMat, CAP);
  coins.instanceMatrix.setUsage(T.DynamicDrawUsage);
  coins.frustumCulled = false;
  coins.renderOrder = 1;
  jar.add(coins);

  // where each coin rests: a loose heap that climbs the jar
  const rand = rng(20261115);
  const rest = Array.from({ length: CAP }, (_, i) => {
    const y = FLOOR + (i / CAP) * (PILE_TOP - FLOOR) + (rand() - 0.5) * 0.05;
    const r = Math.sqrt(rand()) * INNER_R * (y > 1.6 ? 0.86 : 1), a = rand() * Math.PI * 2;
    const flat = i < 16 ? 0.1 : 0.34;
    return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, rx: (rand() - 0.5) * flat * 2, rz: (rand() - 0.5) * flat * 2, ry: rand() * 6.28 };
  });
  const live = rest.map((p) => ({ y: p.y, vy: 0, s: 0, spin: 0, state: 0, delay: 0 })); // state: 0 hidden, 1 falling, 2 resting, 3 leaving
  const dummy = new T.Object3D();
  function place(i) {
    const p = rest[i], l = live[i];
    dummy.position.set(p.x, l.y, p.z);
    dummy.rotation.set(p.rx + l.spin, p.ry, p.rz + l.spin * 0.6);
    dummy.scale.setScalar(l.s);
    dummy.updateMatrix();
    coins.setMatrixAt(i, dummy.matrix);
  }
  for (let i = 0; i < CAP; i++) place(i);
  coins.instanceMatrix.needsUpdate = true;

  // ground shadow + glow when full
  const shadow = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: softTexture([[0, "rgba(0,0,0,.42)"], [0.55, "rgba(0,0,0,.12)"], [1, "rgba(0,0,0,0)"]]), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.01;
  scene.add(shadow);
  const glow = new T.Mesh(new T.PlaneGeometry(5.5, 5.5), new T.MeshBasicMaterial({ map: softTexture([[0, "rgba(255,214,110,.55)"], [0.5, "rgba(255,214,110,.14)"], [1, "rgba(255,214,110,0)"]]), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
  glow.position.set(0, 1.1, -1.2);
  scene.add(glow);

  let count = 0, animating = 0, lidLift = 0, lidTarget = 0, lidHold = 0;
  let yaw = -0.35, yawVel = 0, dragging = false, lastX = 0, pointerTilt = 0, extraYaw = 0, camPull = 0;
  let visible = true, running = false, disposed = false, lastT = 0, needsFrame = true;

  function setCount(target, animate) {
    target = Math.max(0, Math.min(CAP, target));
    if (target === count) return;
    if (!animate || reduced) {
      for (let i = 0; i < CAP; i++) { const l = live[i]; l.state = i < target ? 2 : 0; l.s = i < target ? 1 : 0; l.y = rest[i].y; l.spin = 0; l.vy = 0; place(i); }
      coins.instanceMatrix.needsUpdate = true;
      count = target; needsFrame = true;
      return;
    }
    if (target > count) {
      const n = target - count, gap = Math.min(0.045, 1.3 / n);
      for (let k = 0; k < n; k++) {
        const l = live[count + k];
        l.state = 1; l.s = 1; l.y = 3.0 + (k % 5) * 0.14; l.vy = 0; l.spin = 2.5 + (k % 3); l.delay = k * gap;
      }
      lidTarget = 1; lidHold = n * gap + 0.9;
    } else {
      const n = count - target, gap = Math.min(0.02, 0.5 / n);
      for (let k = 0; k < n; k++) { const l = live[count - 1 - k]; l.state = 3; l.vy = 5 + (k % 4); l.delay = k * gap; }
      lidTarget = 1; lidHold = n * gap + 0.7;
    }
    count = target;
    animating = 1;
    start();
  }

  function step(dt) {
    let busy = false, changed = false;
    for (let i = 0; i < CAP; i++) {
      const l = live[i];
      if (l.state === 1) {
        busy = true;
        if (l.delay > 0) { l.delay -= dt; l.s = 0; place(i); changed = true; continue; }
        l.s = 1; l.vy -= 16 * dt; l.y += l.vy * dt; l.spin *= 0.94;
        if (l.y <= rest[i].y) {
          l.y = rest[i].y;
          if (l.vy < -2.2) { l.vy = -l.vy * 0.22; opts.onCoinLand?.(); } else { l.state = 2; l.vy = 0; l.spin = 0; }
        }
        place(i); changed = true;
      } else if (l.state === 3) {
        busy = true;
        if (l.delay > 0) { l.delay -= dt; continue; }
        l.y += l.vy * dt; l.vy += 6 * dt; l.s = Math.max(0, l.s - dt * 2.2); l.spin += dt * 9;
        if (l.s <= 0) { l.state = 0; l.y = rest[i].y; l.spin = 0; }
        place(i); changed = true;
      }
    }
    if (changed) coins.instanceMatrix.needsUpdate = true;
    if (lidHold > 0) { busy = true; lidHold -= dt; if (lidHold <= 0) lidTarget = 0; }
    const lidPrev = lidLift;
    lidLift += (lidTarget - lidLift) * Math.min(1, dt * 7);
    if (Math.abs(lidLift - lidTarget) > 0.002) busy = true;
    if (lidPrev !== lidLift) { lid.position.set(lidLift * 0.55, LID_Y + lidLift * 0.5, 0); lid.rotation.z = -lidLift * 0.42; }
    animating = busy ? 1 : 0;
  }

  function frame(t) {
    running = false;
    if (disposed) return;
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (animating) step(dt);
    if (!dragging) { yaw += yawVel * dt; yawVel *= 0.93; if (!reduced && opts.spin !== false) yaw += dt * 0.12; }
    jar.rotation.y = yaw + extraYaw;
    jar.rotation.x = pointerTilt * 0.12;
    camera.position.set(camBase.x, camBase.y + camPull * 0.5, camBase.z - camPull * 1.1);
    camera.lookAt(look);
    const full = count >= CAP;
    glow.material.opacity += ((full ? 0.9 : 0) - glow.material.opacity) * Math.min(1, dt * 3);
    renderer.render(scene, camera);
    needsFrame = false;
    if (visible && (animating || dragging || Math.abs(yawVel) > 0.01 || (!reduced && opts.spin !== false) || Math.abs(glow.material.opacity - (full ? 0.9 : 0)) > 0.01)) start();
  }
  function start() { if (!running && !disposed && visible) { running = true; requestAnimationFrame(frame); } }

  function resize() {
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole jar in view on tall or narrow canvases
    camera.fov = w / h < 0.8 ? 30 + (0.8 - w / h) * 26 : 30;
    camera.updateProjectionMatrix();
    needsFrame = true; start();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { lastT = performance.now(); start(); } }, { threshold: 0.01 });
  io.observe(canvas);
  const onVis = () => { visible = !document.hidden; if (visible) { lastT = performance.now(); start(); } };
  document.addEventListener("visibilitychange", onVis);

  // drag to spin
  const down = (e) => { if (opts.interactive === false) return; dragging = true; lastX = e.clientX; canvas.setPointerCapture?.(e.pointerId); start(); };
  const move = (e) => {
    if (dragging) { const dx = e.clientX - lastX; lastX = e.clientX; yaw += dx * 0.012; yawVel = dx * 0.6; }
    else { const r = canvas.getBoundingClientRect(); pointerTilt = ((e.clientY - r.top) / r.height - 0.5) * (reduced ? 0 : 1); }
  };
  const up = () => { dragging = false; };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  if (opts.interactive !== false) canvas.style.touchAction = "pan-y";

  resize();
  if (opts.fill) setCount(Math.round(opts.fill * CAP), false);

  return {
    /** fill 0..1 */
    setFill(ratio, { animate = true } = {}) {
      const r = Math.max(0, Math.min(1, ratio || 0));
      setCount(r > 0 ? Math.max(1, Math.round(r * CAP)) : 0, animate);
    },
    setStyle(name) {
      colors = STYLE_COLORS[name] ?? STYLE_COLORS.brass;
      coinMat.color.setHex(colors.coin); lidMat.color.setHex(colors.lid); glassMat.uniforms.uTint.value.setHex(colors.glass);
      needsFrame = true; start();
    },
    /** extra rotation and camera push-in, used by scroll-driven scenes */
    pose({ yaw: y = 0, pull = 0 } = {}) { extraYaw = y; camPull = pull; start(); },
    render() { lastT = performance.now(); frame(lastT); },
    get busy() { return Boolean(animating); },
    dispose() {
      disposed = true; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      scene.environment?.dispose(); renderer.dispose();
    },
  };
}
