#!/usr/bin/env python3
"""Place earshot bank sounds on a film's cue list (engine cues.json) and mix them, optionally over a music bed.

usage: python3 sfx_earshot.py cues.json DURATION out.wav [--bed music.wav] [--bed-db -14] [--map map.json]

Cue time = the moment on screen (contact, arrival, tap, hit). Alignment follows earshot's launch practice:
taps / pops / clicks lead the frame by ~10 ms (onset), whoosh peaks land ~40 ms after it, risers / swells /
reverse sounds put their PEAK on the cue (so they build into it), impacts and stings start on it.
"""
import argparse, json, subprocess, os, sys, numpy as np, soundfile as sf

SR = 48000
# cue type -> (bank id prefixes to rotate through, align: onset|peak, offset s, weight 0..1)
DEFAULT_MAP = {
    'whoosh':   (['whoosh_fast/crisp', 'whoosh_fast/tight', 'swish/soft', 'whoosh_fast/sleeve'], 'peak', .04, .55),
    'swoosh':   (['whoosh_big/thump_airy', 'whoosh_big/swell', 'pro_whoosh_big/'], 'peak', .05, .75),
    'pop':      (['ui_pop/soft', 'ui_pop/boop', 'pro_pop_in/', 'ui_pop/wide'], 'onset', -.01, .6),
    'tick':     (['pro_hover_tick/', 'hover_tick/'], 'onset', -.005, .35),
    'click':    (['pro_click/', 'click/soft', 'pro_tap/'], 'onset', -.01, .8),
    'chime':    (['pro_notify/', 'notify/'], 'onset', 0, .5),
    'success':  (['pro_notify/', 'mallet/'], 'onset', 0, .7),
    'glitch':   (['pro_glitch/', 'glitch/stutter'], 'onset', 0, .5),
    'scribble': (['swish/flick', 'swish/soft'], 'onset', 0, .25),
    'riser':    (['riser/swell', 'pro_riser/', 'reverse_swell/'], 'peak', 0, .7),
    'impact':   (['pro_impact/', 'impact/swell', 'logo_sting/soft_bloom'], 'onset', 0, .9),
    'implode':  (['reverse_swell/short', 'reverse_swell/breath'], 'peak', 0, .6),
    'shimmer':  (['pro_shimmer/', 'shimmer/m2'], 'onset', 0, .35),
}

def bank_ids():
    out = subprocess.run(['earshot', 'sfx', 'list'], capture_output=True, text=True, check=True).stdout.splitlines()
    return [l.split()[0] for l in out[2:] if l.strip()]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cues'); ap.add_argument('dur', type=float); ap.add_argument('out')
    ap.add_argument('--bed'); ap.add_argument('--bed-db', type=float, default=-14.0)
    ap.add_argument('--map', help='JSON overriding DEFAULT_MAP entries: {"pop": [["ui_pop/blip"], "onset", -0.01, 0.6]}')
    ap.add_argument('--takes', default='sfx_takes')
    a = ap.parse_args()
    M = dict(DEFAULT_MAP)
    if a.map: M.update({k: tuple(v) for k, v in json.load(open(a.map)).items()})
    ids = bank_ids(); os.makedirs(a.takes, exist_ok=True)
    N = int((a.dur + 2) * SR); mix = np.zeros((N, 2))
    count = {}; log = []
    for i, c in enumerate(sorted(json.load(open(a.cues)), key=lambda c: c['t'])):
        if c['type'] not in M: print('no mapping for', c['type'], file=sys.stderr); continue
        prefs, align, off, w = M[c['type']]
        pool = [x for p in prefs for x in ids if x == p or (p.endswith('/') and x.startswith(p))]
        if not pool: print('no bank sound for', prefs, file=sys.stderr); continue
        k = count.get(c['type'], 0); count[c['type']] = k + 1
        sid = pool[k % len(pool)]; seed = 1000 + i  # same id never repeats the same take
        f = f"{a.takes}/{i:03d}_{sid.replace('/', '_')}.wav"
        r = subprocess.run(['earshot', 'sfx', 'render', sid, '-o', f, '--seed', str(seed), '--json'], capture_output=True, text=True)
        if r.returncode: print('render failed', sid, r.stderr.strip(), file=sys.stderr); continue
        meta = json.loads(r.stdout)['meta']
        x, sr = sf.read(f, always_2d=True)
        if sr != SR: raise SystemExit('unexpected sample rate')
        if x.shape[1] == 1: x = np.repeat(x, 2, 1)
        anchor = meta['peak_s'] if align == 'peak' else meta['onset_s']
        start = c['t'] + off - anchor
        g = w * c.get('gain', 1)
        pan = ((i * 37) % 9 - 4) / 14
        s0 = int(round(start * SR))
        if s0 < 0: x = x[-s0:]; s0 = 0
        n = min(len(x), N - s0)
        mix[s0:s0 + n, 0] += x[:n, 0] * g * (1 - pan); mix[s0:s0 + n, 1] += x[:n, 1] * g * (1 + pan)
        log.append({'t': c['t'], 'type': c['type'], 'id': sid, 'seed': seed, 'start': round(start, 4), 'gain': g})
    if a.bed:
        b, sr = sf.read(a.bed, always_2d=True)
        if b.shape[1] == 1: b = np.repeat(b, 2, 1)
        if sr != SR: raise SystemExit('bed must be 48 kHz (ffmpeg -ar 48000)')
        n = min(len(b), N); mix[:n] += b[:n] * 10 ** (a.bed_db / 20) / max(1e-9, np.max(np.abs(b)))
    mix = mix[:int(a.dur * SR)]
    tail = int(1.0 * SR); mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2
    mix *= .89 / max(1e-9, np.max(np.abs(mix)))
    sf.write(a.out, mix, SR, subtype='PCM_24')
    json.dump(log, open(os.path.splitext(a.out)[0] + '.placements.json', 'w'), indent=1)
    print(f'wrote {a.out}: {len(log)} sounds from the earshot bank')

if __name__ == '__main__':
    main()
