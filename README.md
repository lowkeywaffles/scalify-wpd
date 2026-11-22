# SCALIFY WPD website

One-page site for SCALIFY WPD (Web Production & Design).

- Plain HTML, CSS and a small script in `index.html`. No build step, no dependencies, no trackers.
- Animations respect `prefers-reduced-motion`.
- Placeholder details (email, address, policy terms) are marked with the lime highlight and must be replaced before launch.

Open `index.html` in a browser to preview.

## Payments admin (`/admin`) and store API (`/api`)

One page to review payments for every product: <https://scalify-wpd.vercel.app/admin>.
Sign in with a one-time code sent to your email; only emails in `OPERATOR_EMAILS` get a code.

- QuoteRevive birr payments: approve (unlocks the workspace, and takes a FIRST6 spot on Whop when the code was used), reject with a reason, or mark refunded.
- Brimful: birr orders (approve / reject / refund) and card orders through Whop (unlocked automatically; "Refund on Whop" refunds through the Whop API).
- Telegram alerts for new payments (product, amount and method only).

The API is plain Node functions in `api/` with no dependencies. Database changes: `quoterevive/supabase/migrations/0006_unified_payments.sql`.
Tests: `npm test` (every outside service is faked).

### Settings in Vercel (project scalify-wpd, Production)

Already set: `OPERATOR_EMAILS`, `WHOP_ACCOUNT_ID`, `BRIMFUL_WHOP_PRODUCT_ID`, `BRIMFUL_WHOP_PLAN_ID`.

You add these yourself as **Sensitive** variables (never paste them into a chat), then redeploy:

| Name | Where to get it |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Same value as in the QuoteRevive project (or Supabase → Project Settings → API keys → secret key) |
| `WHOP_API_KEY` | Same value as in the QuoteRevive project |
| `TELEGRAM_BOT_TOKEN` | Telegram → @BotFather → /newbot. Then open /admin → Telegram alerts → Link Telegram |
| `INSTAGRAM_TOKEN` | Optional, for the "Latest on Instagram" homepage section. Meta app → Use cases → Instagram API → API setup with Unified login → Generate access tokens (starts with `EAA`). Check its expiry under the configuration's Preview and replace it before then. Without it the section stays hidden |

Optional: `CRON_SECRET` (protects the daily cleanup job), `STORE_BRIMFUL_PRICE_ETB` (default 500), `STORE_BRIMFUL_PRICE_USD` (default 7; also change the Whop plan).

Whop: product `prod_F3ycmJcCSw4PY` (public page <https://whop.com/brimful-plus/>), plan `plan_ykUXLcnzH8nNo` ($7 one-time),
webhook `hook_c5OwpqJi3Qhz9` → `/api/hooks/whop` (payment and refund events; the body is never trusted, every payment is re-read from Whop).
