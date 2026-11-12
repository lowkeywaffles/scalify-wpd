# Scalify Studio: risk register

| # | Risk | Status / mitigation |
|---|---|---|
| 1 | **Shared Supabase project with QuoteRevive.** A bug or a leaked service-role key affects both. | Separate tables, RLS on everything, tokens encrypted. Move Studio to its own project if you upgrade Supabase or free a slot. |
| 2 | **Shared Auth users.** A Studio member is also an auth user in QuoteRevive (no QuoteRevive data until they onboard). Sign-in emails come from the "QuoteRevive" sender. | Accepted for an internal tool. The magic-link email template shows a code and is not used by QuoteRevive. |
| 3 | Account pre-registration. Someone could sign up in QuoteRevive with a founder's email before the founder does. | On first Studio sign-in, the server replaces any password on an unconfirmed account before confirming it. |
| 4 | **Meta platform rules.** Development-mode apps and the API can change. Excessive or automated posting can get an account restricted. | Own accounts only, under 100 posts a day, no engagement automation. Read Meta Platform Terms and Instagram Community Guidelines. |
| 5 | **TikTok** is not automated: posting is manual, with a reminder. | Applying for the Content Posting API audit is possible later (needs a public privacy policy and ToS, a demo video, and review). |
| 6 | **Gemini free tier**: Google may use prompts to improve its products, with human review. Quotas are small and change without notice. | UI warning. Never enter personal data. Templates are the fallback. Rate-limited to 20 requests per member per hour. |
| 7 | AI captions can be wrong or overclaim. | The system prompt forbids invented stats, testimonials and fake urgency. A human must review before scheduling. |
| 8 | **Copyright and music**: reels with unlicensed music or free-tier ElevenLabs voices. | Use only licensed audio. Upgrade ElevenLabs before commercial use. |
| 9 | Hashtag limit (5) is based on Instagram's Dec-2025 announcement. Some reports say 3. | Enforced at 5. The assistant suggests 3–5. |
| 10 | Supabase free plan pauses after 7 days of inactivity, and the 50 MB file limit applies. | Scheduled posts keep the project active. Keep reels under 50 MB. |
| 11 | Rate limiting is in-memory per instance. | Supabase also rate-limits OTP emails. Acceptable for under 10 users. |
| 12 | No automated end-to-end test against a real Instagram account yet. | Do a manual test after the Meta app is set up: publish one image, one carousel, one reel. |
