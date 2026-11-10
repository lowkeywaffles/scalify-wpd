# Risk register & verify-before-launch

This is an engineering checklist, not legal advice. Have a qualified lawyer review the legal pages for your jurisdiction and your customers' jurisdictions.

## Legal
| # | Risk | Status | Action |
|---|---|---|---|
| L1 | Legal pages written without a lawyer's review; operator is an unregistered individual in Ethiopia | Owner decision (no lawyer) | Review when revenue allows |
| L12 | No postal address shown — EU/UK consumer rules expect a geographic address for online sellers | Open | Consider a P.O. box / virtual address |
| L13 | Ethiopian rules to check: trade licence/TIN for online selling, Consumer Protection Proclamation No. 813/2013, Electronic Transactions Proclamation No. 1205/2020, PDPP No. 1321/2024 registration duties | Open | **Verify with a local adviser** |
| L14 | DPAs with Supabase/Vercel/Google not signed; whether Whop is merchant of record (who handles VAT/sales tax) unconfirmed | Open | Sign DPAs in dashboards; check Whop terms |
| L2 | Governing law/venue not chosen | Open | Needs your info |
| L3 | Liability cap and "as is" disclaimer may be unenforceable for consumers in EU/UK/AU etc. | Mitigated by "doesn't limit statutory rights" wording | Needs lawyer |
| L4 | Founding Access term ("as long as we operate, min. 24 months, 60 days' notice") is a binding promise | Confirmed by owner 2026-11-09 | — |
| L5 | 14-day no-questions refund window | Confirmed by owner 2026-11-09 | Honour it in Whop |
| L6 | Whop's role (merchant of record? who collects sales tax/VAT?) affects your tax duties and policy wording | Open | Verify in Whop docs/contract |
| L7 | Users store their customers' data → you are a processor; a DPA for business users may be expected (GDPR Art. 28) | Open | Needs lawyer; consider publishing a DPA |
| L9 | Support/privacy contact is a free Gmail address (scalifywpd@gmail.com) | Resolved for now | Move to a domain email when you buy a domain |
| L10 | Arabic/French/Spanish templates are machine-quality translations written by the developer | Open | **Native speaker review before marketing them** |
| L11 | Customer quote link exposes one quote to anyone holding the link (bearer token, 192-bit random) | Mitigated: off by default, noindex, revocable, rate-limited, minimal fields | — |
| L8 | Users contacting customers via WhatsApp/email must follow anti-spam laws and Meta's policies | Mitigated (no automation; terms put responsibility on user; opt-out flag) | — |

## Privacy
| # | Risk | Status | Action |
|---|---|---|---|
| P1 | Applicable laws: GDPR/UK GDPR (EU/UK users), CCPA/CPRA (thresholds likely not met at launch), Ethiopia Personal Data Protection Proclamation No. 1321/2024, others where users live | Policy drafted to cover rights generically | Needs lawyer; verify Ethiopian regulator and registration duties |
| P2 | International transfers (Supabase/Vercel US) | Open | Sign DPAs; choose EU Supabase region if serving EU mainly |
| P3 | Log retention at Vercel/Supabase unknown | Open | Verify and fill in Privacy Policy |
| P4 | Free-text notes/summaries may contain sensitive data | Mitigated by UI hints + terms ban | — |
| P5 | No cookie banner: justified because only strictly necessary + user-requested preference cookies | Verified by test (no cookies set on page load) | Re-check if you add any tool |
| P6 | Auth emails sent via Supabase default SMTP | Open | Configure custom SMTP; add to processors list |

## Accessibility
| # | Item | Status |
|---|---|---|
| A1 | axe-core WCAG 2.1 A/AA scan: 0 violations on 9 public pages, light+dark, desktop (+ home on mobile) | **Measured** |
| A2 | Signed-in app pages not scanned automatically (need a live Supabase) | **Needs manual testing** |
| A3 | Screen reader pass (NVDA/VoiceOver) on demo dialog, forms, pipeline | Needs manual testing |
| A4 | Contrast: all palette text pairs measured ≥ 5.6:1 | Measured |
| A5 | Keyboard: demo dialog opens/closes with focus restored (tested); full app keyboard pass | Partly tested |

## IP
| # | Item | Status |
|---|---|---|
| I1 | "QuoteRevive" name/domain not trademark-searched | **Open — search USPTO, EUIPO, WIPO, Ethiopian IPO before buying ads** |
| I2 | Logo is original; fonts OFL; icons ISC | OK |
| I3 | WhatsApp/Instagram/Whop names used only descriptively with non-affiliation notice; no logos | OK |
| I4 | Copyright line uses `[LEGAL BUSINESS NAME]` | Needs your info |

## Business
| # | Item | Status |
|---|---|---|
| B1 | Business registration/trade licence, tax registration where you operate (e.g. Ethiopia trade licence + TIN) | Needs your info |
| B2 | Display of business identity (required in EU/UK for online sellers) | Placeholders on /contact |
| B3 | Marketing claims: removed/avoided "recover lost revenue", "guaranteed", stats, testimonials. Priority score explicitly "not a prediction". | Done |
| B4 | No dark patterns: no countdowns, no fake scarcity, reject/cancel as easy as accept, price incl. note on tax shown before checkout | Done |

## Security
| # | Item | Status |
|---|---|---|
| S1 | RLS cross-tenant isolation not tested against a live database here | **Needs manual testing** (see LAUNCH_CHECKLIST §3) |
| S2 | Whop webhook signature format & membership endpoint taken from Whop docs on 2026-11-09; not tested against real Whop | **Needs manual testing in Whop sandbox** |
| S3 | Rate limiting is in-memory per instance (speed bump only) | Accepted for MVP; Supabase Auth has its own limits |
| S4 | CSP uses nonces for scripts; `style-src 'unsafe-inline'` kept for React style attributes/Next font CSS | Accepted, low risk |
| S5 | Service-role key used only in server files importing `server-only` | Verified by review |
| S6 | `npm audit` not reviewed | Run before launch |
