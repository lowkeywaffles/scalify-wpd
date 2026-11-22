# Reel: "Your website should show your latest posts" (9:16, 17.5 s)

`scalify-instagram-feed-reel.mp4` — 1080×1920, 30 fps, AAC 48 kHz, −13.4 LUFS, peak −2.2 dBFS. Shows the real
"Latest on Instagram" section of scalify's homepage (phone screenshots in `shots/`, taken from the site itself).

Rebuild: `node render.cjs render video_noaudio.mp4`, then cut the music
(`ffmpeg -ss 29.1 -t 17.5 -i music.mp3 -af "afade=t=in:d=0.15,afade=t=out:st=16.0:d=1.5,loudnorm=I=-14:TP=-1.5" -ar 48000 audio.wav`)
and mux the two. `node render.cjs stills 3.8,12.4 --guides` previews frames; `node render.cjs audit` checks the safe zone.
`music.mp3` is not in the repo (the licence doesn't allow sharing the track on its own): download it from the link in CREDITS.md.

## Caption
Your website should show your latest posts 👇 We just built it into ours: your newest reels on your own site, served from your own domain, with no Meta trackers on your visitors.

Want this on your site? DM us or WhatsApp +251 969 803 580.

#webdevelopment #webdesign #smallbusiness #websitedesign #addisababa
