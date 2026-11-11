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

# ---- Act 2: uplifting groove (13.15 – 44) ----
bpm = 120; beat = 60 / bpm
prog = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
start2 = 13.15
for bar in range(16):
    t0 = start2 + bar * 4 * beat
    if t0 > 43: break
    ch = prog[bar % 4]
    for m in ch:  # warm pad
        pad = tone(note(m), 4 * beat + 0.3, (1, 2, 3, 4), amps=[1, .35, .18, .08], a=0.25, d=9, sustain=0.6, rel=0.4)
        add(pad, t0, 0.055, pan=(m % 3 - 1) * 0.3)
    add(tone(note(ch[0] - 24), 4 * beat, (1, 2), a=0.01, d=1.5, sustain=0.3, rel=0.2), t0, 0.18)  # bass
    if t0 >= 16.2:  # pluck arpeggio from step 1
        seq = [ch[0], ch[1], ch[2], ch[1] + 12, ch[2], ch[1], ch[0] + 12, ch[2]]
        for i, m in enumerate(seq):
            add(tone(note(m + 12), 0.4, (1, 2, 3), amps=[1, .4, .15], d=0.12), t0 + i * beat / 2, 0.07, pan=(-0.4 if i % 2 else 0.4))
groove_end = 42.4
k = 16.3
while k < groove_end:  # kick
    n_k = int(0.3 * SR); tk = np.arange(n_k) / SR
    kick = np.sin(2 * np.pi * (50 + 110 * np.exp(-tk * 30)) * tk) * np.exp(-tk * 9)
    add(kick, k, 0.55); k += beat
k = 21.6 + beat / 2
while k < groove_end:  # hats
    hat = np.diff(noise(0.05), prepend=0) * env(int(0.05 * SR), a=0.0005, d=0.012)
    add(hat, k, 0.10, pan=0.25); k += beat
k = 27.0 + beat
while k < groove_end:  # claps on 2 & 4
    clap = lowpass(noise(0.15), 3) * env(int(0.15 * SR), a=0.001, d=0.05)
    add(clap, k, 0.22, pan=-0.15); k += 2 * beat
for k in [16.3, 21.6, 27.0, 33.2, 38.8]:  # whooshes on scene changes
    wn = int(0.6 * SR); wt = np.arange(wn) / SR
    w = lowpass(noise(0.6), 6) * np.sin(np.pi * wt / 0.6) ** 2
    add(w, k - 0.35, 0.28, pan=0.0)
for k in np.arange(17.1, 19.1, 0.11):  # typing clicks (form)
    add(lowpass(noise(0.02), 2) * env(int(0.02*SR), d=0.004), k, 0.12)
add(tone(note(79), 0.4, (1, 2), d=0.12), 19.9, 0.2); add(tone(note(84), 0.5, (1, 2), d=0.15), 20.0, 0.18)   # saved pop
for i in range(4): add(tone(note(72 + i * 2), 0.3, (1, 2), d=0.1), 22.0 + i * 0.35, 0.12)              # queue rows
for k in np.arange(28.4, 31.2, 0.09):  # message typing
    add(lowpass(noise(0.02), 2) * env(int(0.02*SR), d=0.004), k, 0.08)
add(tone(note(76), 0.5, (1, 2), d=0.15), 31.5, 0.2); add(tone(note(83), 0.6, (1, 2), d=0.2), 32.0, 0.2)    # sent
for i, m in enumerate([72, 76, 79, 84, 88]):  # win sparkle
    add(tone(note(m), 1.2, (1, 2, 3), d=0.4), 35.25 + i * 0.06, 0.16, pan=(i - 2) * 0.2)
add(lowpass(noise(0.4), 4) * env(int(0.4*SR), d=0.1), 35.25, 0.35)
# final chord swell + fade
for m in (48, 60, 64, 67, 72):
    add(tone(note(m), 5.0, (1, 2, 3), amps=[1, .3, .1], a=0.4, d=20, sustain=0.7, rel=1.6), 39.0, 0.07)

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
