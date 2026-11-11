"""Mix ElevenLabs voiceover over audio.wav: music ducks ~10 dB during each VO line (smooth 120 ms ramps)."""
import json, subprocess, wave, numpy as np
SR = 44100
def rd(f):
    w = wave.open(f); return np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, 2).astype(float) / 32768
def wr(f, x):
    with wave.open(f, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
# VO with light processing (high-pass, compression, presence)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "vo/vo_track.wav", "-af",
    "highpass=f=90,acompressor=threshold=-22dB:ratio=3.5:attack=4:release=110,equalizer=f=3200:t=q:w=1:g=3,equalizer=f=220:t=q:w=1:g=-2,loudnorm=I=-16:TP=-2",
    "-ar", "44100", "-ac", "2", "vo/vo_proc.wav"], check=True)
music, vo = rd("audio.wav"), rd("vo/vo_proc.wav")
n = min(len(music), len(vo)); music, vo = music[:n], vo[:n]
g = np.ones(n); duck = 10 ** (-14 / 20); ramp = int(0.12 * SR)
for f, s in json.load(open("vo/placement.json")):
    a = max(0, int((s - 0.08) * SR)); e = min(n, int((s + dur(f) + 0.12) * SR))
    g[a:e] = np.minimum(g[a:e], duck)
# smooth the gain curve (moving average = ramps)
k = np.ones(ramp) / ramp
g = np.convolve(g, k, mode="same")
mix = music * g[:, None] * 0.9 + vo * 1.0
wr("audio_vo_raw.wav", mix)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "audio_vo_raw.wav", "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "44100", "audio_vo.wav"], check=True)
# report voice-over-music margin per line
for f, s in json.load(open("vo/placement.json")):
    a, e = int(s * SR), int((s + dur(f)) * SR)
    rv = 20 * np.log10(np.sqrt((vo[a:e] ** 2).mean()) + 1e-9); rb = 20 * np.log10(np.sqrt(((music[a:e] * g[a:e, None] * .9) ** 2).mean()) + 1e-9)
    print(f.split("/")[-1][:2], "voice above music by", round(rv - rb, 1), "dB")
