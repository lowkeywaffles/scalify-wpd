"""Original soundtrack for the QuoteRevive reel (synthesised, no third-party samples). Output: audio.wav (44 s, stereo)."""
import numpy as np, wave, sys
SR = 44100; DUR = 44.0; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))

def env(n, a=0.005, d=0.2, sustain=0.0, rel=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e *= np.exp(-np.maximum(0, t - a) / d) * (1 - sustain) + sustain
    if rel: e *= np.clip((n / SR - t) / rel, 0, 1)
    return e

def tone(freq, dur, harm=(1,), amps=None, **ek):
    n = int(dur * SR); t = np.arange(n) / SR
    amps = amps or [1 / (k) for k in range(1, len(harm) + 1)]
    s = sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in zip(harm, amps))
    return s * env(n, **ek)

def noise(dur): return rng.standard_normal(int(dur * SR))
def lowpass(x, k):  # simple moving-average lowpass
    return np.convolve(x, np.ones(k) / k, mode="same")
def note(m): return 440 * 2 ** ((m - 69) / 12)

# ---- Act 1: tension (0 – 13.15) ----
drone_end = 13.15
n = int(drone_end * SR); t = np.arange(n) / SR
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * t)
drone = (np.sin(2*np.pi*55*t) + 0.6*np.sin(2*np.pi*82.41*t) + 0.25*np.sin(2*np.pi*110.3*t)) * lfo
drone *= np.clip(t / 1.5, 0, 1) * np.clip((drone_end - t) / 0.3, 0, 1)
add(drone, 0, 0.16)
for k in np.arange(0.5, 12.9, 0.5):  # clock ticks
    tick = lowpass(noise(0.03), 3) * env(int(0.03 * SR), a=0.0005, d=0.006)
    add(tick, k, 0.35 if int(k * 2) % 2 == 0 else 0.22, pan=0.3 if int(k*2)%2 else -0.3)
add(tone(note(76), 0.5, (1, 2), d=0.18), 0.9, 0.22)          # message sent ding
add(tone(note(81), 0.5, (1, 2), d=0.18), 1.0, 0.18)
add(tone(note(64), 0.6, (1,), d=0.25), 1.6, 0.12)            # seen blip
for k in [2.15, 2.45, 2.75]:                                   # typing... blips
    add(tone(note(72), 0.08, (1,), d=0.03), k, 0.08)
add(tone(note(52), 1.2, (1, 2, 3), d=0.5), 3.1, 0.25)         # "never replied" low hit
for i, k in enumerate([5.0, 5.28, 5.56, 5.84, 6.12]):          # cards dropping
    add(lowpass(noise(0.12), 20) * env(int(0.12*SR), d=0.04), k, 0.5, pan=(-0.5 if i % 2 else 0.5))
add(tone(note(57), 1.5, (1, 2, 3, 4), d=0.6), 7.5, 0.25)      # "did you follow up?"
for k in [9.7, 10.8, 11.9]:                                    # cost hits
    hit = tone(45, 0.9, (1, 2), d=0.35) + 0.5 * lowpass(noise(0.9), 8) * env(int(0.9*SR), d=0.05)
    add(hit, k, 0.55)
# heartbeat accelerating
for k in [9.6, 10.3, 10.95, 11.5, 12.0, 12.4, 12.75]:
    add(tone(48, 0.25, (1,), d=0.08), k, 0.45); add(tone(46, 0.2, (1,), d=0.06), k + 0.18, 0.3)
# riser + impact
rn = int(0.75 * SR); rt = np.arange(rn) / SR
riser = np.sin(2 * np.pi * (200 + 1800 * (rt / 0.75) ** 2) * rt) * (rt / 0.75) ** 2 * 0.3 + lowpass(noise(0.75), 4) * (rt / 0.75) ** 2 * 0.25
add(riser, 12.4, 0.6)
boom = tone(42, 2.0, (1, 2), d=0.7) + lowpass(noise(2.0), 30) * env(int(2*SR), d=0.25) * 0.8
add(boom, 13.15, 0.8)
add(tone(note(84), 2.5, (1, 2, 3), d=1.2), 13.4, 0.12, pan=-0.2)   # sparkle on logo
add(tone(note(88), 2.5, (1, 2, 3), d=1.2), 13.55, 0.10, pan=0.2)

# ---- Act 2: engaging house groove (13.15 – 44) ----
bpm = 120; beat = 60 / bpm; bar = 4 * beat
T0 = 13.15            # reveal / impact
G0 = 16.3             # groove starts (step 1)
DROP = 33.2           # win section drop
END = 42.4

def saw(freq, dur, nh=14, cutoff=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, nh + 1):
        if freq * k > 12000: break
        out += np.sin(2 * np.pi * freq * k * t) / k * np.exp(-k / (2 + 10 * cutoff))
    return out
def adsr(n, a=.005, d=.1, s=.6, r=.05):
    t = np.arange(n) / SR; T = n / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    return e * np.clip((T - t) / r, 0, 1)
def bell(freq, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s_ = (np.sin(2*np.pi*freq*t) + .5*np.sin(2*np.pi*freq*2.76*t)*np.exp(-t*6) + .25*np.sin(2*np.pi*freq*5.4*t)*np.exp(-t*10))
    return s_ * np.exp(-t * 3.2) * np.clip(t / .002, 0, 1) * g
def echo(x, delay=.18, fb=.38, taps=4):
    out = x.copy(); d = int(delay * SR)
    for k in range(1, taps + 1):
        pad = np.zeros(d * k); out = out + np.concatenate([pad, x])[: len(x)] * fb ** k if len(x) > d * k else out
    return out

# sidechain envelope (ducks pad/bass on every kick from G0)
duck = np.ones(N)
k = G0
while k < END:
    i0 = int(k * SR); n_ = int(.42 * SR); tt = np.arange(n_) / SR
    seg = 1 - .65 * np.exp(-tt * 9)
    duck[i0:i0 + n_] = np.minimum(duck[i0:i0 + n_], seg[: max(0, min(n_, N - i0))])
    k += beat
music_L = np.zeros(N); music_R = np.zeros(N)
def addm(sig, start, gain=1.0, pan=0.0):
    i0 = int(start * SR); j0 = min(N, i0 + len(sig))
    if i0 >= N: return
    s_ = sig[: j0 - i0] * gain
    music_L[i0:j0] += s_ * (1 - max(0, pan)); music_R[i0:j0] += s_ * (1 + min(0, pan))

prog = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]   # Am F C G (emotive pop-house)
# pads: soft swell from reveal, full from groove, brighter after drop
nb = int((END + 1.6 - T0) / bar) + 1
for b in range(nb):
    t0 = T0 + b * bar
    if t0 > END + 0.5: break
    ch = prog[b % 4]
    bright = .55 if t0 < G0 else (.75 if t0 < DROP else 1.0)
    for m in ch + (ch[0] + 12,):
        sig = saw(note(m), bar + .25, nh=10, cutoff=bright) * adsr(int((bar + .25) * SR), a=.06, d=1.5, s=.7, r=.25)
        addm(sig, t0, .045 * (1.25 if t0 >= DROP else 1), pan=((m % 5) - 2) * .2)
    if t0 >= G0 - 0.01:   # offbeat house bass (root, octave stabs)
        for st in range(8):
            mm = ch[0] - 24 + (12 if st % 4 == 3 else 0)
            bs = saw(note(mm), .22, nh=8, cutoff=.5) * adsr(int(.22 * SR), a=.003, d=.08, s=.4, r=.04)
            addm(bs, t0 + st * beat + beat / 2, .23)
# lead hook (enters at step 2, doubled an octave up after the drop)
hook = [(0, 76), (.5, 79), (1, 81), (1.75, 79), (2, 76), (2.5, 74), (3, 76),
        (4, 72), (4.5, 74), (5, 76), (5.75, 79), (6, 81), (6.5, 79), (7, 76)]
for b in range(0, 12, 2):
    t0 = 21.6 + b * bar / 2 * 1.0
    t0 = 21.6 + (b // 2) * 2 * bar
    if t0 > END - 0.5: break
    for off, m in hook:
        ts = t0 + off * beat
        if ts > END: break
        dur = .45 if off % 1 == 0 else .3
        ld = saw(note(m), dur, nh=12, cutoff=.85) * adsr(int(dur * SR), a=.004, d=.12, s=.5, r=.06)
        ld = echo(np.concatenate([ld, np.zeros(int(.8 * SR))]), delay=beat * .75, fb=.3, taps=3)
        addm(ld, ts, .055, pan=.15)
        if ts >= DROP:
            addm(echo(np.concatenate([bell(note(m + 12), .5, .8), np.zeros(int(.6*SR))]), beat*.75, .25, 2), ts, .05, pan=-.25)
# apply sidechain to music bus
music_L *= duck; music_R *= duck
L[:] += music_L; R[:] += music_R

# drums
def kick():
    n_ = int(.32 * SR); tk = np.arange(n_) / SR
    return np.sin(2 * np.pi * (48 + 140 * np.exp(-tk * 32)) * tk) * np.exp(-tk * 8) + .3 * lowpass(noise(.32), 2) * np.exp(-tk * 120)
K = kick(); k = G0
while k < END:
    add(K, k, .62); k += beat
k = G0 + beat / 4
while k < END:  # 16th hats with accent on offbeat
    idx = int(round((k - G0) / (beat / 4))) % 4
    if k >= 21.6 or idx == 2:
        h = np.diff(noise(.04), prepend=0) * env(int(.04 * SR), a=.0004, d=.01 if idx != 2 else .03)
        add(h, k, .09 if idx == 2 else .045, pan=.3 if idx % 2 else -.1)
    k += beat / 4
k = 21.6 + beat
while k < END:  # claps on 2 & 4 (layered)
    c = lowpass(noise(.18), 3) * env(int(.18 * SR), a=.001, d=.06)
    add(c, k, .26, pan=-.1); add(c, k + .012, .12, pan=.25); k += 2 * beat
# build into the drop: snare roll + riser + cut
roll_t = 31.2
for i_ in range(32):
    tt = roll_t + i_ * (2.0 / 32)
    sn = lowpass(noise(.08), 3) * env(int(.08 * SR), a=.001, d=.025)
    add(sn, tt, .05 + .18 * (i_ / 32), pan=.0)
rn = int(2.0 * SR); rt = np.arange(rn) / SR
add(lowpass(noise(2.0), 3) * (rt / 2) ** 2 * .5 + np.sin(2*np.pi*(300 + 2200*(rt/2)**2)*rt) * (rt/2)**2 * .12, roll_t, .5)
# drop impact
add(tone(40, 1.5, (1, 2), d=.5) + lowpass(noise(1.5), 25) * env(int(1.5*SR), d=.2) * .6, DROP, .6)
# whooshes on cuts
for k in [16.3, 21.6, 27.0, 33.2, 38.8]:
    wn = int(.55 * SR); wt = np.arange(wn) / SR
    w = lowpass(noise(.55), 5) * np.sin(np.pi * wt / .55) ** 3
    add(w, k - .32, .3, pan=-.4); add(w[::-1] * .6, k - .32, .3, pan=.4)

# ---- success sounds ----
def chime(notes, start, gap=.07, g=.22, pan=0):
    for i_, m in enumerate(notes):
        b_ = np.concatenate([bell(note(m), 1.4), np.zeros(int(.6 * SR))])
        add(echo(b_, .11, .32, 3), start + i_ * gap, g, pan=pan + (i_ - len(notes) / 2) * .15)
for k in np.arange(17.1, 19.1, 0.11):  # form typing (soft keys)
    add(lowpass(noise(.018), 2) * env(int(.018 * SR), d=.004), k, .1)
add(lowpass(noise(.05), 2) * env(int(.05*SR), d=.01), 19.55, .35)          # button press
chime([79, 84, 88], 19.9, gap=.06, g=.2)                                 # "saved" — bright triad
for i_ in range(4): add(bell(note(76 + [0, 3, 5, 7][i_]), .4, .9), 22.0 + i_ * .35, .1, pan=-.3 + i_ * .2)  # queue rows
for k in np.arange(28.4, 31.2, 0.085):
    add(lowpass(noise(.018), 2) * env(int(.018 * SR), d=.004), k, .07)
wn = int(.5 * SR); wt = np.arange(wn) / SR
add(np.sin(2*np.pi*(500 + 1600*(wt/.5)**1.5)*wt) * np.sin(np.pi*wt/.5)**2 * .5, 31.5, .2)   # "sent" swoosh up
chime([84, 91], 32.0, gap=.09, g=.22)                                      # sent ding-ding
add(lowpass(noise(.05), 2) * env(int(.05*SR), d=.01), 34.95, .4)          # accept tap
chime([72, 76, 79, 84, 88, 91], 35.25, gap=.055, g=.22)                    # QUOTE WON — rising sparkle
add(tone(note(36), 1.2, (1, 2), d=.45), 35.25, .45)                         # sub hit under the win
sh = lowpass(noise(1.4), 1); sht = np.arange(len(sh)) / SR
add(np.diff(sh, prepend=0) * np.exp(-sht * 3) * .5, 35.3, .25)            # shimmer
for i_ in range(10):  # counter ticks as accepted value counts up
    add(bell(note(96), .08, .6), 36.0 + i_ * .14, .05)
# outro: final chord + reverse swell + logo hit
for m in (45, 57, 60, 64, 69, 72):
    sig = saw(note(m), 5.0, nh=9, cutoff=.7) * adsr(int(5.0 * SR), a=.3, d=3, s=.75, r=1.8)
    add(sig, 39.0, .045, pan=((m % 5) - 2) * .2)
add(tone(note(33), 3.0, (1, 2), d=1.2), 40.2, .35)
chime([81, 88, 93], 40.2, gap=.08, g=.18)

# master: fade in/out, soft clip, normalise
fade = np.clip(t_all / 0.15, 0, 1) * np.clip((DUR - t_all) / 1.2, 0, 1)
L *= fade; R *= fade
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix /= np.max(np.abs(mix)) / 0.89
with wave.open(sys.argv[1] if len(sys.argv) > 1 else "audio.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("ok", mix.shape)
