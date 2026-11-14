"""Day 3 reel soundtrack (synthesised, no samples): slam hits in the hook, phonk drop at 2.3 s,
keyboard taps synced to on-screen typing, save chime, outro. Output: day3_audio.wav"""

import os, wave, numpy as np
SR = 44100; DUR = 17.0; N = int(SR * DUR); BPM = 140; B = 60 / BPM; T0 = 2.3
rng = np.random.default_rng(31)
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

BASS = [40, 40, 43, 43, 38, 38, 36, 35]                 # E E G G D D C B  (one per beat, 2-bar loop)
RIFF = [  # 16th grid, 2 bars (32 steps): midi or 0
    [64,0,0,67, 0,0,71,0, 0,67,0,0, 64,0,0,0,  62,0,0,66, 0,0,69,0, 0,66,0,0, 64,0,62,0],
    [64,0,0,67, 0,0,71,0, 72,0,71,0, 67,0,0,0,  62,0,0,66, 0,0,69,0, 71,0,69,0, 66,0,64,0]]
STEP = B / 4


# schedule mirrors day3.html
CH = 0.13
T = dict(start=3.0, f0=3.0, f1=4.35, f3=6.85, save=7.95, done=8.45, today=11.0, end=13.6)
FIELDS = [("Sara M.", T["f0"]), ("Website redesign", T["f1"]), ("2400", T["f3"])]
HITS = [.05, .62, .8, .98, 1.2, 1.38, 1.56]

def impact(big=False):
    n = int((1.0 if big else .45) * SR); t = np.arange(n) / SR
    ph = 2*np.pi*np.cumsum(48*(1+5*np.exp(-t*30)))/SR
    return np.tanh(3*np.sin(ph))*env(n, a=.001, d=.35 if big else .14) + lp(noise(n/SR), 3)*env(n, a=.0005, d=.03)*.8
def tap():
    n = int(.05*SR); return bp(noise(.05), 2, 6) * env(n, a=.0003, d=.007)
def chime():
    out = np.zeros(int(1.2*SR))
    for k, m in enumerate((76, 81, 88)):
        n = int(1.0*SR); t = np.arange(n)/SR; s = np.sin(2*np.pi*note(m)*t)*env(n, a=.002, d=.35)
        j = int(k*.07*SR); out[j:j+n] += s[:len(out)-j]
    return out

# hook: dark drone + slams + riser
n = int(T0*SR); t = np.arange(n)/SR
put("bass", (np.sin(2*np.pi*41.2*t)+.4*np.sin(2*np.pi*82.4*t))*np.clip(t/.3,0,1), 0, .3)
for i, h in enumerate(HITS): put("drums", impact(big=(i == 0)), h, .9 if i == 0 else .6, pan=(-.2 if i % 2 else .2))
rn = int(.7*SR); rt = np.arange(rn)/SR
put("fx", np.sin(2*np.pi*(200+2400*(rt/.7)**2.2)*rt)*(rt/.7)**2*.3 + hp(noise(.7),4)*(rt/.7)**2.4*.3, T0-.7, .8)
put("drums", impact(big=True), T0, 1.0); put("fx", lp(noise(.6),30)*env(int(.6*SR),d=.15), T0, .5)

# beat
step_i = 0; tt = T0
while tt < DUR - .02:
    beat = step_i // 4; sub = step_i % 4; bar = step_i % 32
    fade = 1.0 if tt < T["end"] else (1.15 if tt < DUR-1.2 else max(0, (DUR-tt)/1.2))
    calm = .75 if T["start"] <= tt < T["done"] else 1.0      # keep the typing audible
    if sub == 0:
        m = BASS[beat % 8]
        if beat % 2 == 0: put("bass", k808(note(m), .8), tt, .9*fade*calm); put("drums", kick(), tt, .65*fade)
        if beat % 4 in (1, 3): put("drums", snare(), tt, .55*fade*calm)
    put("drums", hat(open_=(bar % 16 == 14), vel=[1,.55,.8,.6][sub]), tt, .24*fade*calm, pan=.3 if sub % 2 else -.3)
    if bar in (28,29,30,31): put("drums", hat(vel=.7), tt+STEP/2, .18*fade, pan=.15)
    mm = RIFF[(step_i//32) % 2][bar]
    if mm and tt > T["done"]: put("lead", cowbell(note(mm)), tt, .4*fade, pan=.12)
    if mm and tt >= T["end"]: put("lead", cowbell(note(mm+12), .2), tt, .16*fade, pan=-.25)
    step_i += 1; tt += STEP

# keyboard taps exactly where letters appear
for txt, a in FIELDS:
    put("fx", tap(), a, .5)                                    # tap on field
    for k in range(len(txt)): put("fx", tap(), a + .25 + k*CH, .55, pan=(rng.random()-.5)*.3)
put("fx", tap(), T["save"], .7); put("fx", chime(), T["done"], .35)
for s_ in (T["today"], T["end"]):
    rn = int(.5*SR); rt = np.arange(rn)/SR
    put("fx", hp(noise(.5),5)*(rt/.5)**2*.3, s_-.5, .8); put("fx", lp(noise(.4),35)*env(int(.4*SR),d=.12), s_, .4)
put("pad", choir((40,52,59), 1.6, cut=22), T0, .26); put("pad", choir((36,48,55,60), 3.2, cut=26), T["end"], .22)

drums=BUS["drums"]; bass=BUS["bass"]; lead=BUS["lead"]; pad=BUS["pad"]; fx=BUS["fx"]
lead = reverb(delay(lead, B*.75, fb=.38, mix=.28), decay=1.3, mix=.22); pad = reverb(pad, decay=2.2, mix=.4)
g = np.ones(N); tt = T0
while tt < DUR:
    a = int(tt*SR); e = min(N, a+int(.14*SR)); g[a:e] = np.minimum(g[a:e], np.linspace(.5,1,e-a)**.8); tt += B
mix = drums*.85 + (bass*.9 + lead + pad)*g[:,None] + fx
mix = np.stack([lp(mix[:,0],2), lp(mix[:,1],2)],1)*.35 + mix*.65
mix = np.tanh(mix*1.3)*.92; mix *= min(1, .98/np.abs(mix).max())
with wave.open("day3_raw.wav","wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix,-1,1)*32767).astype("<i2").tobytes())
import subprocess
subprocess.run(["ffmpeg","-v","error","-y","-i","day3_raw.wav","-af","loudnorm=I=-14:TP=-1.2:LRA=9","-ar","44100","day3_audio.wav"],check=True)
print("wrote day3_audio.wav")
