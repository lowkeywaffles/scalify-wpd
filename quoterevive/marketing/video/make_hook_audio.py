"""Original phonk-style bed for the FIRST6 hook reel (synthesised, no third-party samples).
0–2.3 s: tense ticking + sub drone. 2.3 s: boom. Then 140 BPM: 808 bass, cowbell lead, hats, claps. Output: vo_hook/music.wav (19.5 s)."""
import os, wave, numpy as np
SR = 44100; DUR = 19.5; N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N); rng = np.random.default_rng(11)
os.makedirs("vo_hook", exist_ok=True)

def add(sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - max(0, pan)); R[i:j] += s * (1 + min(0, pan))
def env(n, a=0.005, d=0.2, sustain=0.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * (np.exp(-np.maximum(0, t - a) / d) * (1 - sustain) + sustain)
def tone(freq, dur, harm=(1,), amps=None, **ek):
    n = int(dur * SR); t = np.arange(n) / SR
    amps = amps or [1 / k for k in range(1, len(harm) + 1)]
    return sum(a * np.sin(2 * np.pi * freq * h * t) for h, a in zip(harm, amps)) * env(n, **ek)
def noise(dur): return rng.standard_normal(int(dur * SR))
def lowpass(x, k): return np.convolve(x, np.ones(k) / k, mode="same")
def note(m): return 440 * 2 ** ((m - 69) / 12)
def k808(freq, dur=0.55):
    n = int(dur * SR); t = np.arange(n) / SR
    f = freq * (1 + 3.0 * np.exp(-t * 40))                      # pitch drop
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.tanh(2.2 * np.sin(ph)) * env(n, a=0.002, d=0.28)      # saturated sub
    return s
def cowbell(freq, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sign(np.sin(2*np.pi*freq*t)) * .5 + np.sign(np.sin(2*np.pi*freq*1.48*t)) * .5)
    return lowpass(s, 6) * env(n, a=0.001, d=0.07)
def hat(dur=0.05, open_=False):
    n = int((0.22 if open_ else dur) * SR)
    x = noise(0.22 if open_ else dur)
    x = x - lowpass(x, 12)                                      # highpass-ish
    return x * env(n, a=0.0005, d=0.09 if open_ else 0.015)
def clap():
    n = int(0.25 * SR); x = noise(0.25) - lowpass(noise(0.25), 6)
    e = sum(np.roll(env(n, a=0.0005, d=0.02), int(k * 0.011 * SR)) for k in range(4)) + env(n, a=0.001, d=0.12) * .8
    return lowpass(x, 2) * e / 2.5

# ---- intro: 0 – 2.3 (ticks, sub drone, "seen" ding) ----
n = int(2.3 * SR); t = np.arange(n) / SR
drone = (np.sin(2*np.pi*41.2*t) + .5*np.sin(2*np.pi*82.4*t)) * (0.5 + .5*np.sin(2*np.pi*.9*t)) * np.clip(t/.4, 0, 1)
add(drone, 0, .22)
add(tone(note(76), .4, (1, 2), d=.15), .35, .2); add(tone(note(83), .4, (1, 2), d=.15), .43, .16)   # seen ding
for k in np.arange(0.6, 2.25, 0.165):                                                                # accelerating ticks
    add(lowpass(noise(.03), 3) * env(int(.03*SR), a=.0005, d=.006), k, .38, pan=.35 if int(k*6) % 2 else -.35)
rn = int(0.9 * SR); rt = np.arange(rn) / SR
riser = np.sin(2*np.pi*(180 + 2200*(rt/.9)**2)*rt) * (rt/.9)**2 * .28 + (noise(.9) - lowpass(noise(.9), 4)) * (rt/.9)**2.2 * .22
add(riser, 1.4, .7)

# ---- boom at 2.3 ----
add(k808(note(29), 1.2), 2.3, 1.0)
add(lowpass(noise(.6), 30) * env(int(.6*SR), d=.12), 2.3, .55)

# ---- beat: 140 BPM from 2.3 to 19.5 ----
bpm = 140; b = 60 / bpm; start = 2.3
# bass line (E minor phonk feel), one note per beat, pattern of 8 beats
bass = [40, 40, 43, 40, 38, 38, 36, 36]
lead = [[64,None,67,None,71,None,67,None],[64,None,67,None,72,71,67,None],[62,None,66,None,69,None,66,None],[60,None,64,None,67,None,64,62]]
i = 0; bar = 0
tt = start
while tt < DUR - .05:
    beat = i % 8
    if beat % 2 == 0: add(k808(note(bass[beat])), tt, .95)
    if beat in (2, 6): add(clap(), tt, .5)
    for h in range(2):                                                   # 8th hats, every 2nd 8th slightly open
        add(hat(open_=(beat % 4 == 3 and h == 1)), tt + h * b / 2, .22 if h else .3, pan=.25 if h else -.25)
    if tt > 5.5:                                                         # cowbell lead enters after hook
        m = lead[(i // 8) % 4][beat]
        if m: add(cowbell(note(m)), tt, .28, pan=.15); add(cowbell(note(m)), tt + .012, .12, pan=-.3)   # slight stereo
    if tt > 13.2 and beat % 2 == 1: add(cowbell(note(bass[beat] + 24), .14), tt + b/2, .14)          # offer: extra bounce
    i += 1; tt += b

# ---- lifts: 9.3 (fix) and 13.3 (offer) ----
for s_ in (9.3, 13.3, 17.3):
    rn = int(.6 * SR); rt = np.arange(rn) / SR
    add((noise(.6) - lowpass(noise(.6), 5)) * (rt/.6)**2 * .25, s_ - .6, .8)
    add(lowpass(noise(.5), 40) * env(int(.5*SR), d=.14), s_, .4)
# ---- pad under fix/offer (warm chords) ----
for s_, chord in ((9.3, (52, 55, 59, 64)), (13.3, (48, 52, 55, 60)), (17.3, (52, 55, 59, 62))):
    n2 = int(4.0 * SR); t2 = np.arange(n2) / SR
    pad = sum(np.sin(2*np.pi*note(m)*t2) * (1 + .03*np.sin(2*np.pi*5.5*t2 + m)) for m in chord) * np.clip(t2/.5, 0, 1) * np.clip((4.0 - t2)/.6, 0, 1)
    add(lowpass(pad, 10), s_, .09)

mix = np.stack([L, R], 1)
# soft limiter
mix = np.tanh(mix * 1.15) * .9
# gentle sidechain pump on every beat for phonk bounce
g = np.ones(N); tt = start; i = 0
while tt < DUR:
    a = int(tt * SR); e = min(N, a + int(.12 * SR)); g[a:e] = np.minimum(g[a:e], np.linspace(.55, 1, e - a)); tt += b
mix *= g[:, None]
with wave.open("vo_hook/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print("wrote vo_hook/music.wav", DUR, "s")
