// Node port of brimful/marketing/teaser/render.py (this machine has Playwright for Node only).
//   node render.cjs stills 1.5,8.2 [--guides]   -> stills/
//   node render.cjs audit                        -> safe-zone check of every .ess element
//   node render.cjs render out.mp4               -> silent 1080x1920 30 fps MP4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const FPS = 30, html = path.resolve(__dirname, 'film.html');

async function open(guides) {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--force-color-profile=srgb', '--hide-scrollbars'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.goto('file://' + html + (guides ? '?guides=1' : ''));
  await p.waitForFunction('window.READY === true', null, { timeout: 60000 });
  return { b, p };
}

(async () => {
  const [cmd, arg] = process.argv.slice(2);
  const { b, p } = await open(process.argv.includes('--guides'));
  const dur = await p.evaluate('window.FILM_INFO.duration');
  if (cmd === 'stills') {
    fs.mkdirSync(path.join(__dirname, 'stills'), { recursive: true });
    for (const t of arg.split(',').map(Number)) {
      await p.evaluate(`seek(${t})`);
      await p.screenshot({ path: path.join(__dirname, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`) });
    }
  } else if (cmd === 'audit') {
    const bad = [];
    for (let k = 0; k <= dur * 15; k++) { const t = k / 15; await p.evaluate(`seek(${t})`); for (const v of await p.evaluate('E.audit()')) bad.push([t.toFixed(2), v.el, v.box]); }
    console.log(bad.length ? bad.slice(0, 20).map((x) => 'VIOLATION ' + JSON.stringify(x)).join('\n') : 'SAFE-ZONE AUDIT: PASS');
    if (bad.length) process.exitCode = 1;
  } else if (cmd === 'render') {
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), arg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = 0; f < Math.round(dur * FPS); f++) {
      await p.evaluate(`seek(${f / FPS})`);
      if (!ff.stdin.write(await p.screenshot({ type: 'jpeg', quality: 92 }))) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
    console.log(arg, dur + ' s');
  }
  await b.close();
})();
