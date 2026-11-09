# Third-party audit

| Service / asset | What it does | Data sent | Cookies | Consent needed? | DPA needed? | Why kept |
|---|---|---|---|---|---|---|
| Supabase | Postgres DB, Auth, auth emails | All account and workspace data | First-party auth cookies (strictly necessary) | No (essential) | **Yes** – accept Supabase DPA | Core backend |
| Vercel | Hosting, cron, request logs | IP, user agent, URLs | None set by us | No | **Yes** – Vercel DPA | Hosting |
| Whop | Checkout, payments, membership API, webhooks | Buyer data handled by Whop; we send only membership-ID lookups | Whop's own, on whop.com only | No (on our site) | Review Whop's terms; verify their role (merchant of record?) | Payments |
| wa.me links | Opens WhatsApp with prefilled text — user-initiated navigation | Message text + phone number in the URL, only when the user clicks | None from our site | No | No | Core feature, no SDK |
| mailto: links | Opens the user's mail app | None to us | None | No | No | Core feature |
| Google Fonts (Inter, Instrument Serif) via `next/font` | Downloaded **at build time** and self-hosted | **Nothing at runtime** | None | No | No | Typography |
| lucide-react icons | Bundled SVG icons | None | None | No | No | UI |
| Analytics / pixels / chat widgets / embeds | **None installed** | — | — | — | — | — |

CSP allows only `'self'` plus your Supabase URL in `connect-src`. If you add any tool, update the CSP in `src/middleware.ts`, this file, the Cookie Policy, and the Privacy Policy — and gate non-essential tools behind opt-in consent with an equally prominent "Reject".
