# Instagram marketing package

Angle: **"You sent the quote. They never replied. Did you ever follow up?"**
Rules: show the real product (the /demo workspace, fictional data). No earnings claims, testimonials, user counts or "recover $X". Label demo footage "Demo – fictional data". Don't use WhatsApp/Instagram logos in creatives; descriptive mentions only.

## Link-in-bio flow
Bio link → `/?utm_source=instagram` (UTMs are fine in URLs; we run no analytics, so count signups in Supabase instead) → hero CTA "Start recovering quotes" → signup (free, 10 quotes) → onboarding → *Today* queue → *Access* → Whop checkout. Secondary: "See how it works" → `/demo` (no sign-up).

## 15-second Reel
| Time | Visual | On-screen text | VO / caption |
|---|---|---|---|
| 0–3s | Phone: chat thread, last message "Here's your quote 👍", sent 12 days ago | "You sent the quote." | — |
| 3–5s | Zoom on no reply | "They never replied." | — |
| 5–7s | Cut to QuoteRevive *Today* queue (demo) | "Did you ever follow up?" | — |
| 7–12s | Tap quote → Friendly tone → message appears → Copy | "Ready in seconds" | — |
| 12–15s | Logo + "Free to start" | QuoteRevive | Link in bio |

## 30-second Reel
0–4s hook (as above) · 4–9s problem: three quotes buried across apps · 9–15s add quote in QuoteRevive · 15–22s *Today* queue with priority factors visible ("overdue", "expires in 3d") · 22–27s Follow-up assistant: switch tones, Open WhatsApp, "I sent this follow-up" · 27–30s "Follow up at the right time. Free to start. Link in bio." Small text: "Demo – fictional data. You send messages yourself."

## Ad scripts
1. **Hook:** "How many quotes did you send last month that nobody answered?" **Body:** "QuoteRevive lists them and tells you who to follow up with today — with the message ready." **CTA:** "Try the free demo."
2. **Hook:** "Following up feels awkward. Forgetting costs more." **Body:** "Pick a tone — friendly, professional, short or final check-in — edit, send from your own WhatsApp." **CTA:** "Start free."
3. **Hook:** "Not a CRM. One job." **Body:** "Track sent quotes, see who's gone quiet, follow up on time. $39 one-time Founding Access, no subscription." **CTA:** "Link in bio."

## Captions
1. You sent the quote. They never replied. Did you ever follow up? 👀 QuoteRevive shows who to nudge today. Free to start — link in bio.
2. Quotes don't always say no. Sometimes they just get buried. Keep every quote in one list and follow up on time.
3. Friendly. Professional. Concise. Final check-in. Four ways to follow up without feeling pushy — you edit, you send.
4. Printers, makers, freelancers, fixers: what's sitting in your "sent" folder? 📂 Try the demo — no sign-up.
5. Founding Access: $39 once. No subscription, no renewal, 14-day refund. Built for small businesses that quote.

## Carousel concepts
1. **"The 4 follow-ups"** – slide per tone with the exact template text, last slide: "Prepare yours in QuoteRevive."
2. **"Where quotes go to die"** – WhatsApp, email, DMs, notebook… → slide 5: one list, ordered by urgency.
3. **"What the priority score looks at"** – age, expiry, value, last contact; "It ranks urgency. It doesn't predict sales."

## Screenshot set (capture from /demo, fictional data)
1. Today queue (mobile 1080×1920) 2. Follow-up assistant with Friendly tone 3. Timeline 4. Dashboard tiles 5. Pipeline view 6. CSV import preview with a row error. Capture: Playwright at 390×844, deviceScaleFactor 3, light and dark.

## 9:16 visual spec
1080×1920, safe zone 1080×1420 centred (top 250px / bottom 250px clear for UI). Background #17181c, headline Instrument Serif 96px #f7f4ee, accent #8aa4ff, UI screenshot at 860px wide with 32px radius, max 7 words of headline, small "Demo – fictional data" label 28px #a5a7ae.

## 1:1 visual spec
1080×1080, 80px margin. Headline top-left (Instrument Serif 84px), product crop bottom-right bleeding off edge, logo bottom-left 56px. Light variant: bg #f7f4ee, text #17181c, accent #2348e0.
