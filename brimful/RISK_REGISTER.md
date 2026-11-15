# Brimful risk register

Not legal advice. Items marked "lawyer" or "you" are open until done.

| ID | Area | Risk | Severity | Done in code | Remains | Owner |
|---|---|---|---|---|---|---|
| L1 | Legal | Legal pages are plain-language drafts, not reviewed by a lawyer | High | Pages match actual data flows and checkout | Review for Ethiopia (seller) and for users abroad | lawyer |
| L2 | Legal/Tax | Payments go to a personal Telebirr and bank account; no registered business | High | Seller described honestly as an individual | Register the business / confirm tax duties (income tax, VAT threshold, receipts) | you + accountant |
| L3 | Legal | Ethiopia's Personal Data Protection Proclamation, GDPR/UK GDPR (EU/UK visitors), US state laws may apply | Med | Minimal data; rights and contact listed; no tracking | Confirm registration/representative duties | lawyer |
| L4 | Consumer | Refund promise (14 days, 5 business days, we pay fees) must actually be met | Med | Policy + "Mark refunded" in admin | Have funds and a routine to refund on time | you |
| L5 | Finance rules | Could be mistaken for a financial service | Med | Clear "tracker only, not advice, doesn't hold money" on landing, app, terms | Keep marketing consistent; never hold users' money | you |
| P1 | Privacy | Payer name + transaction ID stored (Supabase, EU) | Low | Server-only table (RLS, no policies); IP not stored | Delete records when no longer needed for tax | you |
| P2 | Privacy | Your Telebirr QR, name and bank account number are public to anyone who opens the payment screen | Med | Served only on the unlock screen | Accept, or switch to a business account | you |
| P3 | Children | Ages 13 to 17 can use it and might pay | Med | 13+ stated; "ask a parent" at checkout and in terms; app collects no personal data | Decide whether to refuse payments from minors | you / lawyer |
| S1 | Security | Plus is enforced in the browser; a technical user can bypass it | Low | Accepted for a low-priced app | None | accepted |
| S2 | Security | Licence key can be shared | Low | Terms forbid it; keys can be cancelled by marking refunded | Add device limits if abused | you |
| S3 | Fraud | Fake transaction IDs | Med | Manual check before unlocking; rate limits; duplicate IDs rejected | Check each payment in Telebirr/bank history | you |
| S4 | Security | CSP is strict (no inline scripts/styles) but hosted headers depend on `vercel.json` | Low | Verified on the live site | Re-check after config changes | you |
| D1 | Data loss | Data is only on the device; clearing the browser deletes it; iOS may evict storage for unused sites | High | Warnings in app and FAQ; backup export/import | Consider optional encrypted cloud backup later | you |
| A1 | Accessibility | Automated axe checks pass; no full screen-reader test | Med | Semantic HTML, labels, focus, reduced-motion, text alternatives | Test with TalkBack/VoiceOver/NVDA, zoom 200% | manual test |
| A2 | Accessibility | English only | Med | - | Add Amharic | you |
| I1 | IP | "Brimful" not trademark-searched in registries; apps named "Brim" exist | Med | Quick web search found no "Brimful" app | Search EIPA (Ethiopia), USPTO, EUIPO before spending on the brand | you / lawyer |
| I2 | IP | Third-party code and fonts | Low | Self-hosted; licences in THIRD_PARTY_LICENSES.md | Keep licence headers | you |
| B1 | Business | Card payments not available; only Ethiopian buyers can pay | Med | Stated on pricing and unlock | Create a Whop product and connect it | you |
| B2 | Business | Operator must check the payments page daily (no notification) | Med | 24-hour promise in copy | Add an email/Telegram alert | you |
| B3 | Business | Brimful payments depend on the QuoteRevive deployment being up | Low | Free features work offline regardless | Split out if it grows | you |
| T1 | Tech | No end-to-end purchase test with real money yet | Med | API and UI tested with a test order | Do one real 500 ETB purchase and refund | you |
| T2 | Tech | WebGL on very old phones | Low | SVG fallback; "Reduced" motion setting | Test on low-end Android | manual test |

## Before launch
- [ ] One real purchase, approval and refund, end to end
- [ ] Lawyer/accountant look at L1 to L3
- [ ] Trademark search (I1)
- [ ] Screen-reader pass (A1)
- [ ] Decide price (default 500 ETB)
