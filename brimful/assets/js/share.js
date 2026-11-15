// Share card: a 1080×1350 picture of a jar's progress, drawn on this device. The amount is off by default.
import * as S from "./lib/store.js";
import { guilloche, esc } from "./lib/fx.js";
import { STYLE_HEX } from "./lib/styles.js";

async function draw(canvas, app, jar, showAmount) {
  const W = 1080, H = 1350, g = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  try { await Promise.all([document.fonts.load('700 96px "Bricolage"'), document.fonts.load('500 40px "Instrument"')]); } catch { /* fallback fonts are fine */ }
  const c = STYLE_HEX[jar.style] ?? STYLE_HEX.brass, p = S.progress(jar);
  g.fillStyle = "#0B1B15"; g.fillRect(0, 0, W, H);
  // banknote rosettes
  g.save(); g.translate(W - 520, -260); g.scale(9, 9); g.strokeStyle = "rgba(216,165,49,.35)"; g.lineWidth = 0.12; g.stroke(new Path2D(guilloche({ R: 8, r: 3, d: 5 }))); g.restore();
  g.save(); g.translate(-380, H - 620); g.scale(8, 8); g.strokeStyle = "rgba(60,199,150,.22)"; g.lineWidth = 0.12; g.stroke(new Path2D(guilloche({ R: 9, r: 4, d: 6, turns: 4 }))); g.restore();
  // jar
  const jx = W / 2, top = 330, bw = 420, bh = 560;
  const body = new Path2D();
  body.moveTo(jx - bw / 2 + 40, top); body.lineTo(jx + bw / 2 - 40, top);
  body.quadraticCurveTo(jx + bw / 2, top + 40, jx + bw / 2, top + 110); body.lineTo(jx + bw / 2, top + bh - 80);
  body.quadraticCurveTo(jx + bw / 2, top + bh, jx + bw / 2 - 80, top + bh); body.lineTo(jx - bw / 2 + 80, top + bh);
  body.quadraticCurveTo(jx - bw / 2, top + bh, jx - bw / 2, top + bh - 80); body.lineTo(jx - bw / 2, top + 110);
  body.quadraticCurveTo(jx - bw / 2, top + 40, jx - bw / 2 + 40, top); body.closePath();
  g.save(); g.clip(body);
  g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(jx - bw / 2, top, bw, bh);
  const level = top + bh - bh * p;
  // coins: rows of ellipses up to the fill level
  let row = 0;
  for (let y = top + bh - 16; y > level; y -= 26, row++) {
    for (let x = jx - bw / 2 - 20 + (row % 2) * 34; x < jx + bw / 2 + 40; x += 68) {
      g.beginPath(); g.ellipse(x + ((row * 13) % 17), y, 38, 15, ((row + x) % 5) * 0.05 - 0.1, 0, 6.3);
      g.fillStyle = c.coin; g.fill(); g.strokeStyle = c.edge; g.lineWidth = 3; g.stroke();
    }
  }
  g.restore();
  g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 6; g.stroke(body);
  g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(jx - bw / 2 + 44, top + 150); g.lineTo(jx - bw / 2 + 44, top + 380); g.stroke();
  g.fillStyle = c.lid; g.beginPath(); g.roundRect(jx - 170, top - 62, 340, 62, 18); g.fill();
  // text
  g.textAlign = "center"; g.fillStyle = "#E9F1EA";
  g.font = '600 30px "JBMono", monospace'; g.fillStyle = "#D8A531"; g.fillText("B R I M F U L", jx, 150);
  g.fillStyle = "#E9F1EA"; g.font = '700 84px "Bricolage", sans-serif';
  let name = jar.name; while (g.measureText(name).width > W - 160 && name.length > 4) name = name.slice(0, -2); if (name !== jar.name) name += "…";
  g.fillText(name, jx, 250);
  g.font = '700 150px "Bricolage", sans-serif'; g.fillStyle = "#D8A531"; g.fillText(`${Math.floor(p * 100)}%`, jx, 1080);
  g.font = '500 44px "Instrument", sans-serif'; g.fillStyle = "#C6D3CB";
  g.fillText(p >= 1 ? "Brimful. Goal reached." : "of the way there", jx, 1150);
  if (showAmount) { g.font = '500 40px "JBMono", monospace'; g.fillText(`${app.money(S.balance(jar), { short: true })} of ${app.money(jar.target, { short: true })}`, jx, 1215); }
  g.font = '500 30px "Instrument", sans-serif'; g.fillStyle = "#7F958A"; g.fillText("brimful.vercel.app", jx, 1295);
}

export function shareSheet(app, jar) {
  const form = app.sheet(`<h2 id="dlg-title">Share your progress</h2>
    <div class="sharewrap"><canvas id="sharecv" role="img" aria-label="Share card: ${esc(jar.name)}, ${Math.floor(S.progress(jar) * 100)}% full"></canvas>
      <label class="check"><input type="checkbox" id="share-amt"><span>Show the amounts on the card</span></label></div>
    <p class="fine">The picture is made on your phone. Nothing is uploaded unless you share it yourself.</p>
    <div class="row"><button type="button" class="btn ghost" data-close>Close</button><button class="btn" id="share-go" type="button">Save or share</button></div>`);
  const cv = form.querySelector("#sharecv"), box = form.querySelector("#share-amt");
  const paint = () => draw(cv, app, jar, box.checked);
  paint();
  box.addEventListener("change", paint);
  form.querySelector("#share-go").addEventListener("click", () => cv.toBlob(async (blob) => {
    if (!blob) return app.toast("Couldn't make the picture.");
    const file = new File([blob], "brimful-progress.png", { type: "image/png" });
    try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "My Brimful jar" }); return; } } catch (e) { if (e?.name === "AbortError") return; }
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "brimful-progress.png" });
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    app.toast("Picture saved.");
  }, "image/png"));
}
