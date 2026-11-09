# Owner's step-by-step guide

## Where things are
| What | Where |
|---|---|
| Live site | https://quoterevive-ebon.vercel.app |
| Customer how-to | https://quoterevive-ebon.vercel.app/guide |
| Hosting | vercel.com → project **quoterevive** |
| Database & logins | supabase.com → project `yardudilkrhhhhtvgyuh` |
| Code | GitHub `lowkeywaffles/scalify-wpd`, folder `quoterevive/` |

## Do next, in order
1. **Gmail sender (custom SMTP)** — see below. Unlocks branded emails and removes the 2-emails/hour limit.
2. **Fill in business details** — send Claude: legal name, address, country, registration/TIN if any, support email, governing law.
3. **Whop** — create product ($39 one-time), API key, webhook (see `docs/WHOP.md`). Put secrets in Vercel yourself.
4. **Sandbox purchase + refund test** with Claude.
5. **Lawyer review** of /legal pages; sign Supabase + Vercel DPAs (in their dashboards).
6. **Merge the branch into `main`** so future pushes deploy automatically.
7. Revoke the Supabase access token used for setup (supabase.com/dashboard/account/tokens).
8. Launch on Instagram using `docs/INSTAGRAM_MARKETING.md`.

## Gmail as the email sender
1. Google Account → Security → turn on **2-Step Verification**.
2. Google Account → search **App passwords** → create one named "QuoteRevive" → copy the 16-character password.
3. Supabase → Authentication → **Emails** → **SMTP Settings** → Enable custom SMTP:
   - Sender email: your Gmail address · Sender name: QuoteRevive
   - Host: `smtp.gmail.com` · Port: `465` · Username: your Gmail address · Password: the app password
4. Save, then tell Claude — it will install the branded templates (`supabase/email-templates/`) and raise the email rate limit.
Gmail allows roughly 500 emails/day. Move to Resend + your own domain before scaling.

## Daily operations
- **Activating a buyer manually:** check the payment in Whop → Supabase SQL editor → run `supabase/manual_provisioning.sql` with their login email.
- **Refund:** refund in Whop (access is revoked automatically once the webhook is set up; otherwise run the revoke line in the same SQL file).
- **Something broke?** Vercel → quoterevive → Logs. Database errors are logged with a short tag like `[onboarding]` — never with customer data.
- **Support requests for data deletion:** users can do it themselves in Settings → Delete account.
