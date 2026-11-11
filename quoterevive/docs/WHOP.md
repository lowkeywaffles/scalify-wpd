# Whop integration

Checked against Whop's OpenAPI spec (https://api.whop.com/api/v1/openapi.json) on 2026-11-10.

## Status (2026-11-11)
LIVE on whop.com (business `biz_sCSqNQY6t26aFx`, product `prod_AOn93RN2TsMSs`). Verified with real money:
tagged checkout -> activation, store purchase -> link by `pay_` receipt, refund -> automatic revoke.

`WHOP_TEST_PRICE_USD` (server-only, 1–39) temporarily overrides the checkout price for a live test. It is set to 39 (normal);
delete it in Vercel when convenient. Store-page purchases auto-activate when the Whop email matches a confirmed QuoteRevive login
(migration 0003); otherwise buyers paste their `pay_…` receipt number on the Access page.

## How a purchase works
1. A signed-in user opens **Access** → **Buy Founding Access**.
2. The server creates a Whop *checkout configuration* (`POST /api/v1/checkout_configurations`) for the $39 one-time plan, with
   `metadata.qr_business_id = <their QuoteRevive business id>` and `redirect_url = /app/billing?checkout=done`, then redirects to its `purchase_url`.
3. The buyer pays on Whop (Whop may show local currency via adaptive pricing and adds any tax).
4. Whop sends `payment.succeeded` / `membership.activated` to `/api/webhooks/whop`. The handler:
   - verifies the Standard Webhooks signature (5-minute tolerance) and ignores duplicate `webhook-id`s;
   - **re-reads** the payment/membership from the Whop API (the webhook body is never trusted);
   - checks product, `paid` status and the `qr_business_id` tag, then activates the entitlement.
5. `membership.updated` re-checks status (`active`/`trialing`/`completed` keep access). `refund.created`/`refund.updated`
   revoke access once the payment shows `refunded_at`.
6. If the Whop API can't be reached the handler returns 502 so Whop retries.

Fallbacks: buyers who bought from the store page directly (no tag) can paste their `mem_` ID on the Access page,
and `supabase/manual_provisioning.sql` activates anyone by email.

## Setup (repeat separately for sandbox and for live whop.com — nothing carries over)
1. **Product + plan:** product "QuoteRevive Founding Access" with a **one-time $39** pricing option. Note the product ID (`prod_…`). A plan ID is optional: without it the app asks Whop for the product's $39 one-time option.
2. **Company API key** (Developer → API keys → Create API key) with scopes:
   `checkout_configuration:create`, `member:basic:read`, `payment:basic:read`.
3. **Webhook** (Developer → Webhooks): URL `https://YOUR-DOMAIN/api/webhooks/whop`; events
   `payment.succeeded`, `membership.activated`, `membership.updated`, `refund.created`, `refund.updated`. Copy the `ws_…` secret.
4. **Vercel env vars (Production):**
   | Name | Sandbox | Live |
   |---|---|---|
   | `WHOP_API_BASE` | `https://sandbox-api.whop.com` | `https://api.whop.com` |
   | `WHOP_ACCOUNT_ID` | sandbox `biz_…` | live `biz_…` |
   | `WHOP_PRODUCT_ID` | sandbox `prod_…` | live `prod_…` |
   | `WHOP_PLAN_ID` (optional) | leave empty | leave empty |
   | `WHOP_API_KEY` (Sensitive) | sandbox key | live key |
   | `WHOP_WEBHOOK_SECRET` (Sensitive) | sandbox `ws_…` | live `ws_…` |
5. Redeploy. The Buy button appears only when all of these are set.

## Test checklist
- Buy with a test card → redirected to Access → refresh → "Founding Access is active".
- Whop dashboard → Developer → Webhooks / API logs: deliveries return HTTP 200.
- Refund in Whop → Access returns to free within a minute or two.
- Re-send a webhook from Whop → handled as duplicate.
