# Brimful data inventory

| Data | Where it lives | Purpose | Sent to a server? | Retention |
|---|---|---|---|---|
| Jar name, target, deadline, coin colour | Device (`localStorage` `brimful:v1`) | Show and track the goal | No | Until user deletes |
| Deposits/withdrawals: amount, time, optional note | Device | Balance, history, streaks | No | Until user deletes |
| Challenges: type, settings, ticked steps | Device | Run the challenge | No | Until user deletes |
| Split percentages | Device | Remember the user's split | No | Until user deletes |
| Settings: currency, theme, motion, sound | Device | Preferences | No | Until user deletes |
| Licence key + status | Device and payments DB | Unlock/restore Plus | Yes, to the payments API (about daily) | While licence exists |
| Payer name, transaction ID, method, amount, review status | Payments DB (`store_orders`, Supabase EU) | Match payment, refunds | Yes, only when buying | Licence life; then as tax rules need |
| IP address | Not stored by us (rate limiting in memory; host logs) | Abuse prevention | Inherent to HTTP | Host's log retention |
| App files | Device cache (service worker `brimful-v1`) | Offline use | No | Until updated/cleared |

Not collected: email, phone, location, contacts, device IDs, analytics, advertising IDs, PINs, card numbers.
