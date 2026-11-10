# QuoteRevive

> Stop letting unanswered quotes become lost opportunities.

A focused quote follow-up workspace for small businesses. Record quotes, see who to follow up with today, prepare a personal message, send it from your own WhatsApp or email, and track the outcome.

## Stack
Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS v4 · Supabase (Postgres, Auth, Row Level Security) · Zod · Vitest · Playwright + axe-core (smoke/a11y) · Vercel.

Notes on prompt deviations: forms use React 19 `useActionState` + Zod on the server, not React Hook Form (fewer dependencies, same validation). UI components are hand-built on Tailwind rather than generated with shadcn/ui.

## Quick start
```bash
cd quoterevive
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # http://localhost:3000  (the /demo page works without Supabase)
```

### Supabase
1. Create a project at supabase.com (choose a region close to your users and note it in the Privacy Policy).
2. SQL editor → run `supabase/migrations/0001_init.sql`.
3. Auth → URL configuration: Site URL = your domain; add `https://YOUR-DOMAIN/auth/confirm` and `https://YOUR-DOMAIN/auth/callback` to redirect URLs.
   Auth → Email Templates — change the link in these templates so email links work in any browser (e.g. Gmail's in-app browser):
   - Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/app/onboarding`
   - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`
   - Change email address: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email_change&next=/app/settings`
4. Auth → Email: keep "Confirm email" ON. Set up custom SMTP before launch (Supabase's built-in sender is rate-limited and for testing only).
5. Copy URL, anon key and service-role key into env vars. **The service-role key is server-only.**

### Environment variables
| Name | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | Supabase client (RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | both | Absolute URLs in auth emails, sitemap |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Webhooks, cron, entitlement writes, account deletion |
| `WHOP_API_KEY`, `WHOP_ACCOUNT_ID`, `WHOP_PRODUCT_ID`, `WHOP_PLAN_ID`, `WHOP_WEBHOOK_SECRET`, `WHOP_API_BASE` | server | Checkout + purchase verification (see docs/WHOP.md) |
| `CRON_SECRET` | server | Protects `/api/cron/reminders` (Vercel sends it automatically as a Bearer token) |

## Scripts
```bash
npm run lint && npm run typecheck && npm test   # unit tests (business rules, CSV, validation, webhook signatures)
npm run build && npm start &                    # then:
npm run test:e2e                                # smoke + axe WCAG 2.1 AA scan, light/dark, desktop/mobile
```

## Deploy (Vercel)
1. Import the repo in Vercel, set **Root Directory = `quoterevive`**.
2. Add all env vars (Production + Preview). Generate `CRON_SECRET` with `openssl rand -hex 32`.
3. `vercel.json` schedules the daily reminder job (06:00 UTC).
4. Add your custom domain, then update `NEXT_PUBLIC_SITE_URL` and the Supabase redirect URLs.

## Whop
See `docs/WHOP.md` (setup, webhook, manual provisioning fallback) and `docs/WHOP_LISTING.md` (listing copy).

## Architecture
- `src/lib/` — pure, tested domain logic: `engine.ts` (follow-up rules + Recovery Priority Score), `templates.ts`, `metrics.ts`, `csv.ts`, `validation.ts`, `webhook.ts`.
- `src/app/app/actions.ts` — every write is a server action: validates with Zod, checks the session, then queries through the user's RLS-scoped client. The service-role client is used only for entitlements, webhooks, cron and account deletion.
- `supabase/migrations/` — schema, RLS policies, free/paid quote limits enforced in the database.
- `src/middleware.ts` — per-request CSP nonce, session refresh, `/app` protection.

## Replacing placeholders
Search for `[` in `src/app/(site)` (legal pages, contact page, footer) and replace `[LEGAL BUSINESS NAME]`, `[REGISTERED ADDRESS]`, etc. Offer terms live in one place: `src/lib/offer.ts`. Brand colours are CSS variables at the top of `src/app/globals.css`.

## Before you launch
See `docs/LAUNCH_CHECKLIST.md` and `RISK_REGISTER.md`.
