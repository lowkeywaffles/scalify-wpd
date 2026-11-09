# Whop integration

Verified against docs.whop.com on 2026-11-09 (webhooks follow the Standard Webhooks spec; `GET /api/v1/memberships/{id}`; membership statuses `active`, `trialing` and `completed` grant access). **Re-check before launch, test in Whop sandbox (`WHOP_API_BASE=https://sandbox-api.whop.com`).**

## Flow
1. Buyer pays **$39 one-time** on Whop (create a one-time plan — *not* recurring).
2. Buyer signs up / signs in to QuoteRevive → **Access** page → pastes their Whop membership ID (`mem_…`).
3. Server calls Whop API with `WHOP_API_KEY`, checks `product_id === WHOP_PRODUCT_ID` and status grants access, ensures the membership isn't linked to another account, then writes `entitlements` with the service role.
4. Webhook `/api/webhooks/whop`: verifies signature + 5-min timestamp tolerance, de-duplicates by `webhook-id`, re-reads membership from the API, and sets linked entitlements `active`/`revoked`. `refund.*` events always revoke. Failed API verification returns 502 so Whop retries.
5. Never trusted: checkout redirects, query strings, client flags.

## Setup
- Whop dashboard → create product + one-time $39 plan → copy product ID (`prod_…`) and the checkout link.
- Developer → API key with `member:basic:read` → `WHOP_API_KEY`.
- Webhooks → URL `https://YOUR-DOMAIN/api/webhooks/whop`, events: `membership.activated`, `membership.updated`, `payment.succeeded`, `refund.created`, `refund.updated` → copy `ws_…` secret → `WHOP_WEBHOOK_SECRET`.
- VERIFY in sandbox: where the membership ID lives in each event's `data` (the handler checks `data.membership_id`, `data.membership.id`, then `data.id`) and that refunds move the membership out of a granting status.

## Manual provisioning (fallback, works today)
1. Confirm the payment in the Whop dashboard.
2. Run `supabase/manual_provisioning.sql` with the customer's login email.
3. On refund, run the revoke statement in the same file.
