# Third-party audit

| Service | What it does | Data it receives | Cookies | Consent needed | DPA |
|---|---|---|---|---|---|
| Vercel | Hosts the static site and the payments API | Requests (IP, user agent) | None set by us | No (necessary) | Vercel DPA applies; confirm on your plan |
| Supabase (EU, Frankfurt) | Stores payment records | Payer name, transaction ID, method, amount, status | None | No (contract) | Supabase DPA; confirm |
| Telebirr / Bank of Abyssinia | The customer's own transfer to you | Handled by them directly | n/a | n/a | n/a |

Not used: analytics, ads, pixels, fonts or scripts from CDNs, embeds, social widgets, email marketing tools.
Fonts and libraries are self-hosted (see THIRD_PARTY_LICENSES.md). The CSP allows connections only to this site
and `https://quoterevivepro.vercel.app` (payments API).
