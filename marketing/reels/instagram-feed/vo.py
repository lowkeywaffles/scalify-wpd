# Voice-over with Kokoro (Apache-2.0). Setup: python3 -m venv tts && tts/bin/pip install kokoro-onnx soundfile; get kokoro-v1.0.int8.onnx
# and voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0) into kmodel/. Run: tts/bin/python vo.py . af_heart
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
k = Kokoro("kmodel/kokoro.onnx", "kmodel/voices.bin")
LINES = [  # (start s, window end s, text)
 (0.05, 2.25, "Bet you never scroll to the bottom of a website..."),
 (2.30, 3.75, "so we hid something there."),
 (4.00, 7.30, "Keep watching. Almost there..."),
 (7.90, 9.70, "Plot twist: it's our Instagram."),
 (9.75, 12.45, "No Meta trackers. It loads straight from our own site."),
 (12.55, 15.20, "Oh, and... light or dark. Your call."),
 (15.45, 18.20, "Want this on your site? DM us."),
]
out_dir = sys.argv[1]; voice = sys.argv[2]
SR = 24000; mix = np.zeros(int(18.5 * SR)); log = []
for i, (a, b, text) in enumerate(LINES):
    speed = 1.1
    while True:
        y, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
        nz = np.where(np.abs(y) > 0.01)[0]; y = y[max(0, nz[0] - 240): nz[-1] + 2400]  # trim silence
        if len(y) / sr <= (b - a) or speed >= 1.25: break
        speed = round(speed + 0.05, 2)
    s0 = int(a * SR); mix[s0:s0 + len(y)] += y[: len(mix) - s0]
    log.append({"line": text, "start": a, "dur": round(len(y) / sr, 2), "window": round(b - a, 2), "speed": speed})
sf.write(f"{out_dir}/vo.wav", mix / max(1e-9, np.abs(mix).max()) * 0.9, SR)
json.dump(log, open(f"{out_dir}/vo.json", "w"), indent=1); print(json.dumps(log, indent=1))
