#!/usr/bin/env python3
"""Render a seek(t)-driven HTML film to MP4, plus stills and a safe-zone audit.

  python3 render.py film.html --stills 1.5,8.2 [--guides]   # preview frames -> stills/
  python3 render.py film.html --audit                        # check .ess elements vs safe zone
  python3 render.py film.html --render out.mp4 [--workers 2] # scene-by-scene MP4 + concat
"""
import argparse, json, os, subprocess, sys, pathlib, concurrent.futures as cf
from playwright.sync_api import sync_playwright

FPS = 30

def open_page(pw, html, guides=False):
    b = pw.chromium.launch(executable_path='/usr/bin/google-chrome',
                           args=['--allow-file-access-from-files', '--disable-web-security', '--force-color-profile=srgb', '--hide-scrollbars'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920}, device_scale_factor=1)
    url = pathlib.Path(html).resolve().as_uri() + ('?guides=1' if guides else '')
    pg.goto(url)
    pg.wait_for_function('window.READY === true', timeout=60000)
    return b, pg

def info(html):
    with sync_playwright() as pw:
        b, pg = open_page(pw, html)
        i = pg.evaluate('window.FILM_INFO'); b.close(); return i

def stills(html, times, guides, outdir='stills'):
    os.makedirs(outdir, exist_ok=True)
    with sync_playwright() as pw:
        b, pg = open_page(pw, html, guides)
        for t in times:
            pg.evaluate(f'seek({t})')
            pg.screenshot(path=f'{outdir}/t{t:06.2f}.png')
        b.close()

def audit(html, step=1/15):
    bad = []
    with sync_playwright() as pw:
        b, pg = open_page(pw, html)
        dur = pg.evaluate('window.FILM_INFO.duration')
        n = int(dur / step)
        for k in range(n + 1):
            t = round(k * step, 4)
            pg.evaluate(f'seek({t})')
            v = pg.evaluate('E.audit()')
            for x in v: bad.append((t, x))
        b.close()
    return bad

def render_range(html, a, b_, out):
    tmp = out[:-4] + '.part.mp4'
    n0, n1 = round(a * FPS), round(b_ * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp], stdin=subprocess.PIPE)
    with sync_playwright() as pw:
        br, pg = open_page(pw, html)
        for f in range(n0, n1):
            pg.evaluate(f'seek({f / FPS})')
            ff.stdin.write(pg.screenshot(type='jpeg', quality=92))
        br.close()
    ff.stdin.close()
    if ff.wait() != 0: raise RuntimeError('ffmpeg failed ' + out)
    os.replace(tmp, out)
    return out

def render(html, out, workers=2):
    fi = info(html)
    dur = fi['duration']
    # segment at scene starts so each file is one scene's worth of frames
    pts = sorted(set([0.0] + [s['start'] for s in fi['scenes']] + [dur]))
    pts = [p for p in pts if p <= dur]
    segs = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1) if pts[i + 1] - pts[i] > 1e-6]
    os.makedirs('segs', exist_ok=True)
    files = [f'segs/seg{i:02d}.mp4' for i in range(len(segs))]
    todo = [(a, b, f) for (a, b), f in zip(segs, files) if not os.path.exists(f)]  # delete a seg file to re-render just that scene
    with cf.ProcessPoolExecutor(workers) as ex:
        list(ex.map(render_range, [html] * len(todo), [x[0] for x in todo], [x[1] for x in todo], [x[2] for x in todo]))
    with open('segs/list.txt', 'w') as fh:
        for f in files: fh.write(f"file '{os.path.basename(f)}'\n")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'segs/list.txt', '-c', 'copy', out], check=True)
    json.dump(fi['cues'], open('cues.json', 'w'))
    return out, fi

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('html'); ap.add_argument('--stills'); ap.add_argument('--guides', action='store_true')
    ap.add_argument('--audit', action='store_true'); ap.add_argument('--render'); ap.add_argument('--workers', type=int, default=2)
    ap.add_argument('--fresh', action='store_true', help='re-render every segment')
    a = ap.parse_args()
    if a.stills: stills(a.html, [float(x) for x in a.stills.split(',')], a.guides)
    if a.audit:
        bad = audit(a.html)
        if not bad: print('SAFE-ZONE AUDIT: PASS (every essential element inside the safe rect at every sampled frame)')
        else:
            seen = {}
            for t, x in bad: seen.setdefault(x['el'], []).append((t, x['box']))
            for k, v in seen.items(): print(f'VIOLATION {k}: {len(v)} frames, first t={v[0][0]} box={v[0][1]} last t={v[-1][0]}')
            sys.exit(1)
    if a.render:
        if a.fresh: subprocess.run('rm -rf segs', shell=True)
        print(render(a.html, a.render, a.workers)[0])
