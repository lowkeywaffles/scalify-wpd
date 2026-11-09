# Test results, known limitations & launch checklist

## Test results (run 2026-11-09 in the build container)
- `npm run typecheck` — pass. `npm run lint` — pass (0 errors). `npm run build` — pass.
- `npm test` — 24/24 pass: follow-up rules (first/interval/expiry/stop-after-max/reset-on-reply/closed statuses), priority score, daily queue, message templates, WhatsApp/mailto encoding, dashboard maths (outstanding vs accepted, mixed currencies, archived excluded, rates), CSV parse/round-trip/formula-injection/row errors, quote validation, webhook signature (valid, tampered, stale, multi-sig).
- `npm run test:e2e` (production build, no Supabase) — pass: 9 public pages 200 + no horizontal scroll on mobile, **axe WCAG 2.1 AA 0 violations** light/dark, no cookies set on load, no console errors, CSP nonce present, demo flow (keyboard open → personalised message → copy → WhatsApp link → mark sent → queue updates → focus restored), `/app` protected, unsigned webhook 401, cron 401.
- **Not run:** anything requiring a live Supabase project or Whop account (acceptance criteria 1–5, 7–11, 14 against a real DB). Lighthouse not measured.

## Acceptance criteria status
| # | Criterion | Status |
|---|---|---|
| 1 | Sign up + onboarding | Built; **needs manual test with Supabase** |
| 2–4 | Create quote, persists, schedule follow-up | Built; needs manual test |
| 5 | Appears in daily queue | Logic unit-tested; needs manual test |
| 6 | Prepare + copy message | Tested (demo) |
| 7–8 | Record follow-up/response, status updates | Logic tested in demo; server path needs manual test |
| 9 | Dashboard maths | Unit-tested |
| 10 | Tenant isolation | RLS written; **must test with two accounts** |
| 11 | CSV import/export | Parser/validator tested; server path needs manual test |
| 12 | Mobile usable | Public pages tested at 390px; app pages need manual check |
| 13 | Demo has no real data | Yes – invented names, example.com emails |
| 14 | Whop | API + webhook implemented; manual provisioning documented; **sandbox test required** |
| 15 | Critical flows tested | Partly – see above |

## Known limitations (keep out of advertising)
- No email reminders (in-app only). No quote attachments. Single user per business. No AI messages.
- Rate limiting is per server instance.
- Reminder job runs once daily at 06:00 UTC; "today" is computed in UTC, so users far from UTC may see items appear a few hours early or late.
- Importing the same CSV twice creates duplicates (by design: never overwrites).
- Free limit (10) and plan limit (2,000) are enforced by a database trigger.

## Launch checklist
1. Fill every `[PLACEHOLDER]`; lawyer review of Privacy, Terms, Refund, Cookie pages.
2. Decide/confirm Founding Access term and refund window (`src/lib/offer.ts`).
3. **Isolation test:** create accounts A and B; as B, try `/app/quotes/<A's quote id>` (expect 404) and in the browser console call Supabase `from('quotes').select()` with B's session (expect only B's rows).
4. Run the full manual flow on a phone: signup → confirm email → onboarding → add quote → queue → follow-up → response → dashboard → import → export → delete account.
5. Whop sandbox: purchase → link → refund → confirm access revoked; replay a webhook → confirm "duplicate".
6. Configure custom SMTP, Supabase PITR/backups, sign Supabase + Vercel DPAs.
7. Trademark search "QuoteRevive"; register domain.
8. `npm audit`, Lighthouse on `/` and `/demo` (mobile).
9. Set `NEXT_PUBLIC_WHOP_CHECKOUT_URL` only when all the above pass.
