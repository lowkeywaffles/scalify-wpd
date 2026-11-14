"""Layer Myinstants SFX onto day3_music.wav. Each effect's audible onset is aligned to the on-screen hit;
music dips ~6 dB under each effect for clarity. Output: day3_audio.wav (-14 LUFS)."""
import subprocess, wave, numpy as np
SR = 44100
def rd(f):
    w = wave.open(f); return np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, 2).astype(float) / 32768
music = rd("day3_music.wav"); N = len(music); sfx = np.zeros_like(music); g = np.ones(N)
# (file, on-screen hit time, gain, max length s)  — hit times from day3.html
CUES = [
    ("assets/sfx/vine-boom.wav",                         0.07, 0.85, 1.2),   # "STOP." lands
    ("assets/sfx/punch-gaming-sound-effect-hd_RzlG1GE.wav", 0.83, 0.55, 0.6), # "losing"
    ("assets/sfx/punch-gaming-sound-effect-hd_RzlG1GE.wav", 1.59, 0.55, 0.6), # "quoted."
    ("assets/sfx/capcut-explosion-sound.wav",            2.30, 0.40, 1.4),   # beat drop / phone in
    ("assets/sfx/ding-sound-effect_2.wav",               8.45, 0.45, 1.2),   # "Quote saved"
    ("assets/sfx/metal-gear-alert-sound-effect_XKoHReZ.wav", 11.30, 0.30, 1.0), # follow-up due today
]
for f, hit, gain, maxlen in CUES:
    x = rd(f); a = np.abs(x).max(1); peak = int(np.argmax(a > a.max() * 0.25))  # audible onset
    x = x[: int(maxlen * SR)]
    fade = int(0.15 * SR); x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    start = int(hit * SR) - peak
    if start < 0: x = x[-start:]; start = 0
    e = min(N, start + len(x)); sfx[start:e] += x[: e - start] * gain
    d0 = max(0, start); d1 = min(N, start + int(min(maxlen, .45) * SR)); g[d0:d1] = np.minimum(g[d0:d1], 10 ** (-6 / 20))
g = np.convolve(g, np.ones(int(.04 * SR)) / int(.04 * SR), mode="same")
mix = music * g[:, None] + sfx
mix = np.tanh(mix * 1.05) / np.tanh(1.05); mix *= min(1, .98 / np.abs(mix).max())
with wave.open("day3_mix_raw.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "day3_mix_raw.wav", "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "44100", "day3_audio.wav"], check=True)
print("wrote day3_audio.wav")
