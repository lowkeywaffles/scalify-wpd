# Data inventory

Every stored item and why it exists. If a field has no purpose, delete it.

| Table.field | Contains personal data? | Purpose | Retention |
|---|---|---|---|
| auth.users (Supabase) email, hashed password | Yes | Login, account emails | Until account deletion |
| auth.users raw_user_meta_data.terms_accepted_at / terms_version | No | Evidence of terms acceptance | Life of account |
| businesses.name, industry | Maybe (sole traders) | Personalise workspace; sign-off in messages | Until changed/deleted |
| businesses.currency, typical_quote_value, preferred_channel | No | Defaults; above-typical factor in priority score; default channel | " |
| businesses.first_follow_up_days, follow_up_interval_days, max_follow_ups | No | User-controlled reminder frequency and stop rule | " |
| businesses.display_name (optional) | Yes | Profile name | " |
| businesses.avatar_data_url (optional, ≤160px) | Yes (photo) | Profile photo | Until removed |
| businesses.onboarded_at | No | Show onboarding once | " |
| quotes.customer_name | Yes (third party) | Identify the quote; personalise message | Until user deletes |
| quotes.customer_email / customer_phone (optional) | Yes (third party) | Prefill email draft / WhatsApp link | " |
| quotes.title, description, amount, currency, dates, status, notes | Possibly | Core service | " |
| quotes.archived, opted_out | No | Hide; stop recommendations for customers who asked not to be contacted | " |
| activities.* (kind, channel, short summary, status change, contributed_to_sale) | Possibly in summary | Timeline, follow-up rules, metrics. **Message text is not stored.** | " |
| quotes.share_token, share_enabled | No (random token) | Customer quote link; off by default, revocable/regenerable | With the quote |
| activities.via_link + customer's choice/message in summary | Possibly (customer's message) | Record a reply made through the quote link | With the quote |
| businesses.tour_seen, message_language | No | Show tours once; default message language | Life of account |
| reminders.(quote_id, due_on, read_at) | No | In-app reminders, idempotent per day | Deleted with quote/account |
| entitlements.(source, whop_membership_id, status, plan) | Pseudonymous ID | Paid access | Life of account |
| Sent to Whop at checkout: `metadata.qr_business_id` (random UUID) | Pseudonymous | Match the payment to the account | Kept by Whop on the payment/membership |
| webhook_events.id | No | De-duplicate webhooks | 30 days (cron purge) |
| Cookie `sb-*-auth-token` | Session token | Keep user signed in | Session |
| Cookie `qr_theme` | No | Theme preference (set only on click) | 1 year |

Not collected: analytics, IP addresses in our database, device fingerprints, marketing consents, the text of follow-up messages, payment details.
