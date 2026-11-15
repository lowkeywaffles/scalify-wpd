// Regenerates the product screenshots and icons used on the landing page from the real app.
// Run: python3 -m http.server 4173 &   then   node tools/make-images.cjs
const { chromium } = require("playwright"); const path = require("path"); const fs = require("fs");
const out = path.join(__dirname, "..", "assets", "img"), tmp = process.argv[2] || "/tmp";
const day = 864e5, now = Date.now();
const E = (id, d, amt, note = "") => ({ id, t: now - d * day, amt, note });
const seed = (theme) => ({ v: 1, settings: { currency: "ETB", theme, motion: "auto", sound: false, onboarded: true },
  jars: [
    { id: "j1", name: "New phone", target: 1500000, style: "brass", created: now - 40 * day, deadline: "2027-02-28", entries: [E("a", 30, 300000, "Envelope 30"), E("b", 21, 250000, "Birthday money"), E("c", 14, 180000), E("d", 7, 120000, "Week 12"), E("e", 1, 80000, "Skipped takeaway")] },
    { id: "j2", name: "Trip to Lalibela", target: 800000, style: "jade", created: now - 30 * day, deadline: "", entries: [E("f", 20, 200000), E("g", 8, 160000)] },
    { id: "j3", name: "Emergency fund", target: 2000000, style: "rose", created: now - 25 * day, deadline: "", entries: [E("h", 9, 500000), E("i", 2, 150000)] }],
  challenges: [{ id: "c1", type: "envelopes", jarId: "j1", created: now - 30 * day, config: { count: 100, target: 505000, seed: 11 }, done: Object.fromEntries([3, 8, 15, 21, 29, 34, 40, 47, 52, 58, 61, 66, 73, 80, 88, 93].map((i) => [i, "x" + i])) }],
  split: [], license: { key: "00000000-0000-4000-8000-000000000000", status: "active", note: "", checkedAt: now } });
(async () => {
  const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const shots = [["light", "#/", "screen-shelf"], ["light", "#/jar/j1", "screen-jar"], ["light", "#/challenge/c1", "screen-envelopes"], ["dark", "#/jar/j2", "screen-jar-dark"]];
  for (const [theme, hash, name] of shots) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, colorScheme: theme });
    const p = await ctx.newPage();
    await p.addInitScript((s) => { localStorage.setItem("brimful:v1", JSON.stringify(s)); }, seed(theme));
    await p.goto("http://127.0.0.1:4173/app/" + hash); await p.waitForSelector("h1"); await p.waitForTimeout(hash.includes("jar") ? 4200 : 1500);
    await p.evaluate(() => { document.querySelector(".tabs").hidden = true; });
    await p.screenshot({ path: path.join(tmp, name + ".png") }); await ctx.close();
  }
  const p = await b.newPage({ viewport: { width: 512, height: 512 } });
  const svg = fs.readFileSync(path.join(out, "icon.svg"), "utf8");
  for (const [size, name, pad] of [[192, "icon-192", 0], [512, "icon-512", 0], [180, "icon-180", 0], [512, "icon-maskable-512", 1]]) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<body style="margin:0;background:#0F251E;display:grid;place-items:center;height:100vh"><div style="width:${pad ? 78 : 100}%;height:${pad ? 78 : 100}%">${svg}</div></body>`);
    await p.screenshot({ path: path.join(out, name + ".png") });
  }
  await b.close(); console.log("done");
})();
