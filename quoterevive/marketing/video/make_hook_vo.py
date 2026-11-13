"""Fetch voiceover lines (ElevenLabs, key injected by the environment proxy), fit each to its slot,
assemble vo_hook/vo_track.wav, then mix with vo_hook/music.wav (ducking) -> vo_hook/audio_hook.wav."""
import json, os, subprocess, wave, numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
SR = 44100; D = "vo_hook"; S = json.load(open(f"{D}/script.json"))
dur = lambda f: float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
def rd(f):
    w = wave.open(f); return np.frombuffer(w.readframes(w.getnframes()), "<i2").reshape(-1, 2).astype(float) / 32768
def wr(f, x):
    with wave.open(f, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes())

placement = []
for ln in S["lines"]:
    mp3 = f"{D}/{ln['id']}.mp3"
    if not os.path.exists(mp3):
        body = json.dumps({"text": ln["text"], "model_id": S["model_id"], "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35}})
        r = subprocess.run(["curl", "-sS", "-f", "-o", mp3, "-X", "POST", f"https://api.elevenlabs.io/v1/text-to-speech/{S['voice_id']}?output_format=mp3_44100_128",
                            "-H", "xi-api-key: placeholder", "-H", "Content-Type: application/json", "-d", body])
        if r.returncode: raise SystemExit(f"TTS failed for line {ln['id']}")
    t = f"{D}/{ln['id']}_t.wav"; f = f"{D}/{ln['id']}_f.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-ar", str(SR), "-ac", "2", t], check=True)
    slot = ln["end"] - ln["start"]; have = dur(t); tempo = max(1.0, min(1.22, have / slot))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", t, "-af", f"atempo={tempo:.3f}", f], check=True)
    print(f"line {ln['id']}: {have:.2f}s -> slot {slot:.2f}s, tempo x{tempo:.2f}, final {dur(f):.2f}s")
    placement.append([f, ln["start"]])
json.dump(placement, open(f"{D}/placement.json", "w"))

music = rd(f"{D}/music.wav"); n = len(music); track = np.zeros((n, 2))
for f, s in placement:
    x = rd(f); a = int(s * SR); e = min(n, a + len(x)); track[a:e] += x[: e - a]
wr(f"{D}/vo_track.wav", track)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/vo_track.wav", "-af",
    "highpass=f=90,acompressor=threshold=-22dB:ratio=3.5:attack=4:release=110,equalizer=f=3200:t=q:w=1:g=3,equalizer=f=220:t=q:w=1:g=-2,loudnorm=I=-16:TP=-2",
    "-ar", str(SR), "-ac", "2", f"{D}/vo_proc.wav"], check=True)
vo = rd(f"{D}/vo_proc.wav")[:n]; vo = np.pad(vo, ((0, n - len(vo)), (0, 0)))
g = np.ones(n); duck = 10 ** (-22 / 20); ramp = int(0.12 * SR)
for f, s in placement:
    a = max(0, int((s - 0.08) * SR)); e = min(n, int((s + dur(f) + 0.12) * SR)); g[a:e] = np.minimum(g[a:e], duck)
g = np.convolve(g, np.ones(ramp) / ramp, mode="same")
wr(f"{D}/mix_raw.wav", music * g[:, None] * 0.85 + vo)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{D}/mix_raw.wav", "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", str(SR), f"{D}/audio_hook.wav"], check=True)
for f, s in placement:
    a, e = int(s * SR), int((s + dur(f)) * SR)
    rv = 20 * np.log10(np.sqrt((vo[a:e] ** 2).mean()) + 1e-9); rb = 20 * np.log10(np.sqrt(((music[a:e] * g[a:e, None] * .9) ** 2).mean()) + 1e-9)
    print(os.path.basename(f)[:1], "voice above music by", round(rv - rb, 1), "dB")
print("wrote", f"{D}/audio_hook.wav", round(dur(f"{D}/audio_hook.wav"), 2), "s")
