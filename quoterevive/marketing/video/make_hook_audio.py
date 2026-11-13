"""Original Memphis/drift-phonk bed for the FIRST6 hook reel. Fully synthesised: no samples, no third-party audio.
Structure (140 BPM): 0–2.3 intro (crackle, filtered cowbell tease, riser) · 2.3 drop · 9.3 filter break + re-drop ·
13.3 offer section (lead doubles up) · 17.3 outro.  Output: vo_hook/music.wav (19.5 s, stereo)."""
import os, wave, numpy as np
SR = 44100; DUR = 19.5; N = int(SR * DUR); BPM = 140; B = 60 / BPM; T0 = 2.3
rng = np.random.default_rng(23); os.makedirs("vo_hook", exist_ok=True)
BUS = {k: np.zeros((N, 2)) for k in ("drums", "bass", "lead", "fx", "pad")}

def put(bus, sig, start, gain=1.0, pan=0.0):
    i = int(start * SR); j = min(N, i + len(sig))
    if i >= N or j <= i: return
    s = sig[: j - i] * gain
    BUS[bus][i:j, 0] += s * min(1, 1 - pan); BUS[bus][i:j, 1] += s * min(1, 1 + pan)
def env(n, a=0.003, d=0.2, s=0.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * (np.exp(-np.maximum(0, t - a) / d) * (1 - s) + s)
def noise(dur): return rng.standard_normal(int(dur * SR))
def lp(x, k): return np.convolve(x, np.ones(int(k)) / int(k), mode="same")
def hp(x, k): return x - lp(x, k)
def bp(x, lo_k, hi_k): return lp(hp(x, lo_k), hi_k)
def note(m): return 440 * 2 ** ((m - 69) / 12)
def fftconv(x, h):
    n = len(x) + len(h) - 1; L = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(h, L), L)[: len(x)]
def reverb(st, decay=1.4, mix=0.25, pre=0.02):
    ir_n = int(decay * SR); t = np.arange(ir_n) / SR
    out = np.zeros_like(st)
    for ch in range(2):
        ir = rng.standard_normal(ir_n) * np.exp(-t * 3.5 / decay) * (t > pre)
        ir = lp(ir, 6) / np.sqrt((ir ** 2).sum() + 1e-9) * 2.2
        out[:, ch] = fftconv(st[:, ch], ir)
    return st + out * mix
def delay(st, time, fb=0.42, mix=0.3):
    d = int(time * SR); y = st.copy(); buf = st.copy()
    for k in range(1, 6):
        y[d * k:] += np.roll(buf, 0)[: N - d * k] * (fb ** k) * mix * (1 if k % 2 else .85)
    return y

# ---------- instruments ----------
def k808(freq, dur=0.6, glide_from=None):
    n = int(dur * SR); t = np.arange(n) / SR
    f = freq * (1 + 2.6 * np.exp(-t * 55))
    if glide_from: f = glide_from + (f - glide_from) * np.minimum(1, t / 0.09)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(n, a=0.002, d=0.42, s=0.05)
    drive = np.tanh(3.2 * body) * 0.75 + np.tanh(9 * body) * 0.12          # distorted 808 with upper harmonics
    click = hp(noise(0.012), 3) * env(int(0.012 * SR), a=0.0003, d=0.003) * .5
    out = drive; out[: len(click)] += click
    return out
def kick():
    n = int(0.28 * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(52 * (1 + 7 * np.exp(-t * 80))) / SR
    return np.tanh(2.5 * np.sin(ph)) * env(n, a=0.001, d=0.09) + hp(noise(0.28), 4) * env(n, a=0.0005, d=0.008) * .6
def snare():
    n = int(0.32 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (185 * (1 + 1.5 * np.exp(-t * 60))) * t) * env(n, a=0.001, d=0.06)
    wire = bp(noise(0.32), 2, 7) * env(n, a=0.0005, d=0.11)
    clap = sum(np.roll(bp(noise(0.32), 2, 9) * env(n, a=0.0005, d=0.025), int(k * 0.009 * SR)) for k in range(3)) * .5
    return body * 0.9 + wire * 1.1 + clap
def hat(open_=False, vel=1.0):
    n = int((0.26 if open_ else 0.06) * SR)
    x = hp(noise(n / SR), 10)
    x = sum(np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) for f in (3200, 4700, 6100, 7900)) * 0.12 + x
    return hp(x, 14) * env(n, a=0.0004, d=0.10 if open_ else 0.022) * vel * .9
def cowbell(freq, dur=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    a = np.sign(np.sin(2 * np.pi * freq * t)); b = np.sign(np.sin(2 * np.pi * freq * 1.44 * t + .3))
    x = bp(a * .55 + b * .45, 2, 40)
    return np.tanh(2.2 * x) * env(n, a=0.0008, d=0.11, s=0.02)
def choir(ms, dur, cut=14):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for m in ms:
        for det in (-7, 0, 7):
            f = note(m) * 2 ** (det / 1200)
            saw = 2 * ((f * t + rng.random()) % 1) - 1
            out += saw * (1 + .04 * np.sin(2 * np.pi * (5 + rng.random()) * t))
    out = lp(out, cut) + bp(out, 3, 9) * .35                                   # dark + formant-ish band
    return out / (len(ms) * 3) * env(n, a=0.03, d=0.9, s=0.35) * np.clip((dur - t) / 0.3, 0, 1)

# ---------- composition ----------
BASS = [40, 40, 43, 43, 38, 38, 36, 35]                 # E E G G D D C B  (one per beat, 2-bar loop)
RIFF = [  # 16th grid, 2 bars (32 steps): midi or 0
    [64,0,0,67, 0,0,71,0, 0,67,0,0, 64,0,0,0,  62,0,0,66, 0,0,69,0, 0,66,0,0, 64,0,62,0],
    [64,0,0,67, 0,0,71,0, 72,0,71,0, 67,0,0,0,  62,0,0,66, 0,0,69,0, 71,0,69,0, 66,0,64,0]]
STEP = B / 4

# intro: vinyl crackle, filtered cowbell tease, ticks, riser
put("fx", lp(noise(DUR), 60) * .08 + (rng.random(N) < 0.0012) * rng.standard_normal(N) * .6 * env(N, d=1e9), 0, .9)   # crackle (whole track)
teaser = np.zeros(int(T0 * SR))
for i, m in enumerate(RIFF[0][:16]):
    if m: s = cowbell(note(m) / 2, .4); j = int(i * STEP * SR); teaser[j:j + len(s)] += s[: len(teaser) - j] * .5
teaser = lp(teaser, 30) * np.linspace(.3, 1, len(teaser))
put("lead", teaser, 0.3, .55)
n = int(T0 * SR); t = np.arange(n) / SR
put("bass", (np.sin(2 * np.pi * 41.2 * t) + .4 * np.sin(2 * np.pi * 82.4 * t)) * (.5 + .5 * np.sin(2 * np.pi * .8 * t)) * np.clip(t / .4, 0, 1), 0, .25)
for k in np.arange(0.6, 2.25, 0.165): put("drums", hp(noise(.03), 3) * env(int(.03 * SR), a=.0005, d=.006), k, .4, pan=.35 if int(k * 6) % 2 else -.35)
rn = int(1.0 * SR); rt = np.arange(rn) / SR
put("fx", np.sin(2 * np.pi * (160 + 2600 * (rt) ** 2.2) * rt) * rt ** 2 * .3 + hp(noise(1.0), 4) * rt ** 2.4 * .35, T0 - 1.0, .8)
for k in range(1, 9): put("drums", snare(), T0 - 0.52 + k * 0.065, .25 + k * .05, pan=(k % 2 - .5) * .4)        # snare roll into drop

# drop grid
step_i = 0; tt = T0; prev_bass = None
while tt < DUR - 0.02:
    beat = step_i // 4; sub = step_i % 4; bar_step = step_i % 32
    sec = "break" if 9.3 <= tt < 9.3 + 2 * B else ("offer" if tt >= 13.3 else "main")
    strength = 1.0 if tt < 17.9 else max(0, 1 - (tt - 17.9) / 1.4)
    if sub == 0:
        m = BASS[beat % 8]
        if beat % 2 == 0 or sec == "offer":
            put("bass", k808(note(m), 0.9 if beat % 2 == 0 else .45, glide_from=prev_bass and note(prev_bass) * 1.0), tt, .95 * strength); prev_bass = m
            put("drums", kick(), tt, .7 * strength)
        if beat % 4 in (1, 3): put("drums", snare(), tt, .62 * strength)
    if sec != "break" or step_i % 8 == 0:
        v = [1, .55, .8, .6][sub] * (1 + .1 * rng.standard_normal())
        put("drums", hat(open_=(bar_step % 16 == 14), vel=v), tt, .28 * strength, pan=.3 if sub % 2 else -.3)
        if bar_step in (28, 29, 30, 31) and sec != "break":                     # 32nd roll at bar end
            put("drums", hat(vel=.7), tt + STEP / 2, .22 * strength, pan=.15)
    m = RIFF[(step_i // 32) % 2][bar_step]
    if m and sec != "break":
        put("lead", cowbell(note(m)), tt, .42 * strength, pan=.12)
        if sec == "offer": put("lead", cowbell(note(m + 12), .22), tt, .18 * strength, pan=-.25)   # octave double
    step_i += 1; tt += STEP

# break at 9.3: choir stab + filter sweep fx, then re-drop impact at 9.3 + 2 beats
put("pad", choir((52, 59, 64, 67), 2 * B + .2, cut=18), 9.3, .32)
put("fx", lp(noise(.5), 35) * env(int(.5 * SR), d=.16), 9.3 + 2 * B, .55)
# choir stabs on section starts (phonk "chant" feel)
for s_, ch in ((T0, (40, 52, 59)), (5.6, (38, 50, 57)), (13.3, (36, 48, 55, 60)), (17.3, (40, 52, 59, 64))):
    put("pad", choir(ch, 1.6, cut=22), s_, .26)
# dark pad under fix/offer
for s_, ch in ((9.3 + 2 * B, (52, 55, 59)), (13.3, (48, 52, 55)), (17.3, (52, 55, 59))):
    put("pad", choir(ch, 3.8, cut=30), s_, .1)

# ---------- mix ----------
drums = BUS["drums"]; bass = BUS["bass"]; lead = BUS["lead"]; pad = BUS["pad"]; fx = BUS["fx"]
lead = reverb(delay(lead, B * .75, fb=.38, mix=.28), decay=1.3, mix=.22)
pad = reverb(pad, decay=2.2, mix=.4)
drums_rv = drums.copy(); drums_rv[:, :] = reverb(drums * np.array([[.5, .5]]), decay=.9, mix=.18)
mix = drums * .85 + drums_rv * .3 + bass * .9 + lead + pad + fx
# sidechain pump on each beat (lead/pad/bass duck under kick)
g = np.ones(N); tt = T0
while tt < DUR:
    a = int(tt * SR); e = min(N, a + int(.14 * SR)); g[a:e] = np.minimum(g[a:e], np.linspace(.5, 1, e - a) ** .8); tt += B
mix = (drums * .85 + drums_rv * .3) + (bass * .9 + lead + pad) * g[:, None] + fx
# glue: soft saturation + lo-fi tilt (slight high roll-off) + brickwall-ish limiter
mix = np.stack([lp(mix[:, 0], 2), lp(mix[:, 1], 2)], 1) * .35 + mix * .65
mix = np.tanh(mix * 1.35) * .92
peak = np.abs(mix).max(); mix *= min(1, .98 / peak)
with wave.open("vo_hook/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
print("wrote vo_hook/music.wav", DUR, "s · peak", round(float(peak), 2))
