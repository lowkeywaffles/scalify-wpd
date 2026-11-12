# Scalify Studio (private)

An internal tool for the Scalify founders. Upload media once, write captions with the assistant,
schedule posts, and let Studio publish to Instagram automatically. TikTok posts are prepared and
shown as reminders: TikTok only allows public API posting for audited apps.

## Stack
Next.js 15 (App Router) · Supabase (the QuoteRevive project, in separate `studio_*` tables) · Vercel ·
Instagram API with Instagram Login · Gemini free tier, Claude (optional) or built-in templates.

## How it works
- **Sign-in**: an email allowlist (`studio_members`) plus an 8-digit email code. No passwords. Every table
  uses RLS through `studio_is_member()`, so QuoteRevive customers who share the same Supabase Auth can't read anything.
- **Media**: a private bucket `studio-media` (50 MB per file). Browsers upload directly with a one-time signed upload URL.
  Instagram fetches media through 3-hour signed URLs at publish time.
- **Tokens**: Instagram long-lived tokens are encrypted with AES-256-GCM (key from `STUDIO_TOKEN_KEY` or derived from the service-role key) and stored in
  `studio_secrets`, which has no RLS policies (service role only). They refresh automatically before they expire.
- **Scheduler**: Supabase `pg_cron` calls `/api/cron/publish` every 5 minutes (`supabase/0002_scheduler.sql`), and
  a daily Vercel cron acts as a backup. Each post moves through: scheduled → publishing (container created, waiting
  for Instagram to process) → published / failed. A 2-minute row lock prevents double publishing. A container that is
  already `PUBLISHED` is never published again.

## Environment variables (Vercel project root = `studio`)
| Name | Who sets it | Notes |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY | setup | same as QuoteRevive |
| NEXT_PUBLIC_SITE_URL | setup | e.g. https://scalify-studio.vercel.app |
| SUPABASE_SERVICE_ROLE_KEY | **you** (Sensitive) | Supabase → Project Settings → API keys → service_role |
| STUDIO_TOKEN_KEY | optional (Sensitive) | 32 random bytes, base64. If unset, derived from the service-role key. Changing either disconnects Instagram |
| CRON_SECRET | optional (Sensitive) | only for the daily Vercel backup cron. pg_cron uses a vault-generated secret |
| INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET | **you** (Sensitive) | from the Meta app, see /studio/setup |
| GEMINI_API_KEY | **you** (Sensitive, optional) | free tier; see the privacy note |
| STUDIO_AI_PROVIDER | optional | `gemini` (default), `claude`, `templates` |
| ANTHROPIC_API_KEY / CLAUDE_MODEL | optional | paid; for `claude` |
| GEMINI_MODEL / INSTAGRAM_API_VERSION | optional | defaults `gemini-2.5-flash` / `v27.0` |

## Commands
`npm run dev` · `npm run typecheck` · `npm run lint` · `npm test`

See `RISKS.md` for open risks.
