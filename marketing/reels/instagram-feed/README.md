# Reel: "Bet you never scroll to the bottom of a website…" (9:16, 18.5 s)

`scalify-instagram-feed-reel.mp4` — 1080×1920, 30 fps, AAC 48 kHz, −14.1 LUFS, peak −1.5 dBFS, voice-over ≥13 dB above the music on every line. Curiosity hook, then the reveal at 8 s lands on the music's drop. Shows the real
"Latest on Instagram" section of scalify's homepage (phone screenshots in `shots/`, taken from the site itself).

Rebuild: `node render.cjs render video_noaudio.mp4`, then cut the music
(`ffmpeg -ss 24.05 -t 18.5 -i music.mp3 -af "afade=t=in:d=0.15,afade=t=out:st=17.0:d=1.5,loudnorm=I=-14:TP=-1.5" -ar 48000 audio.wav`)
make the voice (`vo.py`, see its header), mix it over the music with ducking (filter in the git history of this README's commit), and mux. `node render.cjs stills 3.8,12.4 --guides` previews frames; `node render.cjs audit` checks the safe zone.
`music.mp3` is not in the repo (the licence doesn't allow sharing the track on its own): download it from the link in CREDITS.md.

## Caption
Bet you never scroll to the bottom of a website… so we hid something there 👀 Plot twist: it's our Instagram. Our newest reels, right on our own site, served from our own domain, with no Meta trackers on our visitors.

Want this on your site? DM us or WhatsApp +251 969 803 580.

#webdevelopment #webdesign #smallbusiness #websitedesign #addisababa
