// Renders hook.html frame-by-frame (deterministic window.render(t)) and muxes vo_hook/audio_hook.wav.
const { chromium } = require("playwright"); const { spawn } = require("child_process"); const path = require("path");
const FPS = 30, DUR = 19.5, dir = __dirname, out = process.argv[2] || path.join(dir, "quoterevive-first6-hook-9x16.mp4");
(async () => {
  const ff = spawn("ffmpeg", ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-i", path.join(dir, "vo_hook/audio_hook.wav"),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-r", String(FPS),
    "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out], { stdio: ["pipe", "ignore", "inherit"] });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto("file://" + path.join(dir, "hook.html")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1000);
  const total = Math.round(FPS * DUR);
  for (let i = 0; i < total; i++) {
    await p.evaluate((t) => window.render(t), i / FPS);
    const buf = await p.screenshot({ type: "jpeg", quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 150 === 0) process.stdout.write(`frame ${i}/${total}\n`);
  }
  ff.stdin.end(); await b.close();
  ff.on("close", (code) => { console.log("ffmpeg exit", code, out); process.exit(code); });
})();
