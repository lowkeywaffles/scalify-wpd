# Brimful data inventory

| Data | Where it lives | Purpose | Sent to a server? | Retention |
|---|---|---|---|---|
| Jar name, target, deadline, coin colour | Device (`localStorage` `brimful:v1`) | Show and track the goal | No | Until user deletes |
| Deposits/withdrawals: amount, time, optional note | Device | Balance, history, streaks | No | Until user deletes |
| Challenges: type, settings, ticked steps | Device | Run the challenge | No | Until user deletes |
| Split percentages | Device | Remember the user's split | No | Until user deletes |
| Settings: currency, language, theme, motion, sound | Device | Preferences | No | Until user deletes |
| Cloud-backup recovery code | Device only | Encrypt/locate the cloud backup | Never (only a SHA-256 hash of it, as the lookup id) | Until backup is turned off |
| Encrypted cloud backup (all of the above, AES-256-GCM) | Payments DB (`brimful_backups`, Supabase EU) | Restore on another device | Yes, only if the user turns it on; ciphertext only | Until turned off / deleted, or 400 days after last update (daily job) |
| Licence key + status | Device and payments DB | Unlock/restore Plus | Yes, to the payments API (about daily) | While licence exists |
| Payer name, transaction ID, method, amount, review status, 18+/guardian confirmation (yes/no) | Payments DB (`store_orders`, Supabase EU) | Match payment, refunds | Yes, only when buying | Licence life; then as tax rules need. Rejected: deleted 180 days after review |
| Card purchase: Whop payment ID, amount, status | Payments DB | Unlock, refunds | Yes, from Whop's API | As above. Unpaid checkouts deleted after 3 days |
| Payment alert text (product, amount, method only) | Telegram, operator's chat | Tell the operator to check | Yes (to Telegram) | Operator's Telegram history |
| IP address | Not stored by us (rate limiting in memory; host logs) | Abuse prevention | Inherent to HTTP | Host's log retention |
| App files | Device cache (service worker `brimful-v3`, name changes per version) | Offline use | No | Until updated/cleared |

Not collected: email, phone, location, contacts, device IDs, analytics, advertising IDs, PINs, card numbers. Whop may collect email and card details on its own checkout under its own policy; we don't copy them.
