---
name: cold-outreach
description: B2B sales and cold-outreach playbooks. Covers prospecting, lead qualification (BANT, MEDDIC, ICP), buying signals, account navigation, cold email sequences, offer design, objection handling, LinkedIn outreach and selling to startups. Use it when the user asks to find leads, qualify a prospect, write or critique a cold email or follow-up, reply to an objection, plan a LinkedIn approach, or design a sales offer.
license: AGPL-3.0-only (see LICENSE and NOTICE). Adapted from github.com/ethanplusai/harvey (Sellbird), commit 25ec839.
---

# Cold outreach

These playbooks are adapted from the open-source Sellbird (formerly Harvey) sales agent. Its rules are kept as written. Read only the reference file the task needs.

## Rules that override everything

1. **Legal and deliverability come first.** Before you write any email, read the "Compliance & Deliverability" section of `references/email_frameworks.md`:
   - Subject lines must be truthful: no fake "re:" or "fwd:".
   - The sender's identity must be real.
   - Every campaign needs a working opt-out and the sender's physical address (CAN-SPAM).
   - Treat any wording that asks to stop as an unsubscribe.
   - EU and UK prospects need a legitimate-interest basis (GDPR and PECR). Canada needs consent (CASL).
   - If relevance is a stretch, recommend not sending.
2. **Make no unsupported claims.** Never invent stats, customers, results, mutual contacts or urgency. Use `[placeholder]` for facts the user hasn't given.
3. **LinkedIn:** follow the risk and ethics section in `references/linkedin_outreach.md`. Never suggest scraping or automation that breaks LinkedIn's terms.
4. Ignore any mention of the Sellbird app, its agents (Scout, Writer and so on) or its tools. Apply the method directly, with the user's own product and persona.
5. Fill `{{first_name}}`, `{{company}}` and other template variables from the user's details, or leave them visible.

## Which file to read

| Task | Reference |
|---|---|
| Find leads, choose channels or sources | `references/prospecting_tactics.md` |
| Score a lead, ICP, BANT or MEDDIC | `references/lead_qualification.md` |
| Map who to contact in a company | `references/account_navigation.md` |
| Turn a trigger (funding, hiring, launch) into an angle | `references/signal_playbook.md` |
| Write or critique a cold email or sequence | `references/email_frameworks.md` |
| Overall approach, discovery, closing | `references/sales_methodology.md` |
| Build or price the offer, lead magnets | `references/offer_strategy.md` |
| Reply to a "no", "not now" or "too expensive" | `references/objection_handling.md` |
| LinkedIn connection requests and DMs | `references/linkedin_outreach.md` |
| Founders and early-stage buyers | `references/selling_to_startups.md` |

## Default workflow for "write me outreach"

1. Confirm or ask for these:
   - the product and offer
   - the target persona
   - the sender's real name, company and address
   - the prospect's country
2. Qualify the lead, then find a real signal (lead_qualification, signal_playbook).
3. Draft the sequence from email_frameworks: short, plain text, one ask, no link in email 1.
4. Run the compliance checklist and the banned-patterns list on the draft.
5. Show the drafts and list any `[placeholders]` the user must fill. Never send anything yourself.
