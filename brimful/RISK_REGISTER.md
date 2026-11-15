# Brimful risk register

Not legal advice. Items marked "lawyer" or "you" stay open until someone does them. Updated 15 November 2026.

| ID | Area | Risk | Severity | Done in code | Remains | Owner |
|---|---|---|---|---|---|---|
| L1 | Legal | Legal pages are plain-language drafts, not reviewed by a lawyer | High | Rewritten to match the real data flows: card payments (Whop), 18+ confirmation, encrypted cloud backup, Telegram alerts, retention periods | Review for Ethiopia (seller) and for buyers abroad | lawyer |
| L2 | Legal/Tax | Payments go to a personal Telebirr account, a personal bank account and your personal Whop payouts; no registered business | High | Seller described honestly as an individual | Register the business and confirm tax duties (income tax, VAT threshold, receipts). Code can't do this | you + accountant |
| L3 | Legal | Ethiopia's Personal Data Protection Proclamation (No. 1321/2024), GDPR/UK GDPR for EU/UK visitors, US state laws may apply | Med | Minimal data; rights and contact listed; no tracking; database in the EU; the payments service runs in the US (Vercel free plan ignores the region setting) | Confirm any registration or representative duties | lawyer |
| L4 | Consumer | Refund promise (14 days, 5 business days, we pay fees) must actually be met | Med | Admin has "Mark refunded" (birr) and "Refund on Whop" (card, refunds through the Whop API) | Keep money available to refund birr payments on time | you |
| L5 | Finance rules | Could be mistaken for a financial service | Med | "Tracker only, not advice, doesn't hold money" on landing, app, terms and the Whop listing | Keep marketing consistent; never hold users' money | you |
| L6 | Consumer | Card buyers may see Whop's tax and their bank's foreign-transaction fee on top of $7 | Low | Disclosed next to the card button, on the landing page and in the terms | None | — |
| P1 | Privacy | Payer name and transaction ID stored (Supabase, EU) | Low | Server-only tables (RLS, no policies); IP not stored; rejected orders deleted after 180 days; unpaid card checkouts after 3 days (daily job) | Decide how long approved records are kept for tax, then add it to the daily job | you + accountant |
| P2 | Privacy | Your Telebirr QR, first name and bank account number are shown to anyone who opens the payment screen | Med | Shown only on the unlock screen | Switch to a business account when you register (L2) | you |
| P3 | Children | Ages 13 to 17 can use the app | Low | Every purchase needs "I'm 18+, or a parent/guardian agreed" (checked in the browser and again on the server, stored as yes/no); parents can ask for refunds | Purchases on the public Whop page don't show our checkbox: Whop's own terms apply there | you / lawyer |
| P4 | Privacy | Telegram alerts | Low | Alerts contain only product, amount and method: never names, transaction IDs or keys (tested) | None | — |
| S1 | Security | Plus is enforced in the browser; a technical user can bypass it | Low | Licence re-checked daily and revoked when refunded or rejected. A server account would not stop this either: all Plus features run on the device | Accepted for a $7 app | accepted |
| S2 | Security | A licence key or Whop receipt number can be shared | Low | Terms forbid it; one receipt can only ever back one key; keys can be revoked by refunding | Add device limits if abused | you |
| S3 | Fraud | Fake transaction IDs | Med | Manual check before unlocking; rate limits; duplicate IDs rejected; the admin asks you to confirm amount and ID first | Check each payment in your Telebirr/bank history | you |
| S4 | Security | Admin sign-in uses your QuoteRevive email and password (no second factor yet) | Med | Operator emails only; HttpOnly + SameSite=Strict cookies; same-origin check; 12-hour session limit; rate limits; one error message for every failure; noindex; strict CSP | Use a strong, unique password. Consider turning on Supabase MFA and adding it here | you |
| S5 | Security | The Whop webhook has no signing secret on Scalify | Low | The body is never trusted: the payment is re-read from Whop's API before anything changes, and must match the product and licence key | None | — |
| S6 | Security | New service holds the Supabase service-role key | Med | Server-only; never sent to browsers | Add it as a Sensitive variable; rotate if it ever leaks | you |
| D1 | Data loss | Data lives on the device; clearing the browser deletes it; iOS may evict storage for unused sites | Med | Optional encrypted cloud backup with a recovery code (AES-256-GCM in the browser; server stores ciphertext only); backup file export/import | A lost recovery code can't be recovered by anyone (by design) | accepted |
| A1 | Accessibility | No real-phone screen-reader test | Med | axe (WCAG 2.1 AA) passes on every screen incl. payment, backup, Amharic and admin, light and dark; keyboard tested | Test with TalkBack and VoiceOver on a real phone, zoom 200% | manual test |
| A2 | Language | Amharic translation is new and machine-assisted | Med | Full app UI, payment flow and errors in Amharic (Settings → Language; follows the phone's language) | Native speaker review; landing and legal pages are English only | native reviewer |
| I1 | IP | "Brimful" trademark | Med | Trademarkia (US) search: no BRIMFUL mark for software or finance; similar live marks BRIMFULL (citrus fruit, class 31) and BRIMFULITE (cosmetics, lights), unrelated goods. A budgeting app called "Brim" exists | EIPA (Ethiopia) and EUIPO not searched (no public search we could use); file your own mark if you invest in the brand | you / lawyer |
| I2 | IP | Third-party code and fonts | Low | Self-hosted; licences in THIRD_PARTY_LICENSES.md | Keep licence headers | you |
| B1 | Business | Card payments | Done | $7 one-time via Whop (in-app checkout unlocks automatically; public page whop.com/brimful-plus with receipt-number unlock) | — | — |
| B2 | Business | Payment alerts | Done in code | Telegram alerts from the Scalify admin | Create the bot and add TELEGRAM_BOT_TOKEN (see README) | you |
| B3 | Business | Payments service moved to scalify-wpd.vercel.app | Low | Falls back to the old QuoteRevive endpoint until the new one has its database key | Add the keys, then the old endpoint can be removed | you |
| T1 | Tech | No end-to-end purchase with real money yet | High | All flows tested with fakes; Whop checkout link creation tested live | One real 500 ETB purchase and one real $7 card purchase, then refund both from /admin | you |
| T2 | Tech | Old/low-end phones | Low | Slowed phone (Moto G4 profile, CPU 6×, ~1.6 Mbps): app first paint 0.7 s, landing 1.0 s; SVG fallback without WebGL | Try on a real low-end Android | manual test |

## Before you rely on it
- [ ] Add the 3 secret settings in Vercel (see the README "Payments admin" section)
- [ ] Link Telegram in /admin
- [ ] One real birr purchase and one real card purchase, approval and refund, end to end (T1)
- [ ] Lawyer/accountant look at L1 to L3
- [ ] Native Amharic review (A2)
- [ ] Screen-reader pass on a real phone (A1)
