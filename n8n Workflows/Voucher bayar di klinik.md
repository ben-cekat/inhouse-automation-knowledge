---
type: resource
tags: [automation, n8n, google-sheets, whatsapp, voucher, promo]
saved: 2026-07-29
source: "Voucher bayar di klinik.json (n8n export)"
---

# n8n Workflow — Voucher bayar di klinik

**What it does:** Issues one-time discount voucher codes to WhatsApp customers so they can redeem a discount when paying in person at the clinic ("bayar di klinik" = "pay at the clinic"). Unlike the other workflows from this client, it does **not** touch the Cekat CRM board at all — voucher inventory lives in Google Sheets, read and written via Google Apps Script web-app calls.

The file actually bundles two independent mechanisms under one name — only one of them is currently live.

## Mechanism 1 — Voucher Blast After Booking (currently disabled)

Triggered by `cekatCrmTrigger` nodes firing when a CRM record's appointment date ("Book") field changes, on either the SKIN+ or SLIM+ board. Checks whether the appointment falls today/tomorrow/day-after-tomorrow, then selects a voucher tier (SKIN+: 50k or 75k; SLIM+: 75k or 100k) based on how soon the appointment is, falling back to next month's sheet if the current month is out of codes.

**Both trigger nodes for this mechanism are disabled** (`Voucher Book Bayar Di Klinik SKIN+`, id `c2f9b547…`; `Voucher Book Bayar Di Klinik SLIM+`, id `387571ac…`) — this entire booking-based voucher blast is not running in production. Worth confirming with whoever owns this whether that's intentional.

## Mechanism 2 — PromKil (promo kilat / flash promo) — this is the live one

Triggered by `cekatTrigger` on `conversation.labels_updated`. When staff manually add a label like "SKIN+ PromKil W1" to a WhatsApp chat, the flow:

1. Fetches an unused voucher code from that week's Google Sheet tab (via Apps Script HTTP call)
2. Marks the code as used
3. Sends the code back to the customer as a plain WhatsApp text, telling them to show it to Telesales/Frontdesk at the clinic

Runs across four WhatsApp inboxes, all under "Euromedicagroup": SkinPlus Tele, SkinPlus AI, SlimPlus Tele, SlimPlus AI. Branches purely by which "PromKil W1"–"W5" label was applied, each pulling from its own dedicated sheet tab per brand. The "Cabang Klinik" (clinic branch) field exists in the data but is never used for branching.

There's no Search→SplitOut→Limit→Update CRM pattern here — the repeated chain instead is Trigger → Filter (label check) → Switch (week/tier) → HTTP fetch code → HTTP mark used → send WhatsApp message, repeated ~8 times across brand × inbox-type combinations.

## Known issues (actionable)

- **Inconsistent label matching, risk of silent drops.** SKIN+'s switches (`Switch`, `Switch1`) use strict "equals" for all W1–W5 checks. SLIM+'s switches (`Switch2`, `Switch3`) use "contains" for W1–W4 but "equals" for W5. Real sample data in the file shows a label saved with a trailing space ("SLIM+ PromKil W1 ") — an "equals" check would silently miss this, and none of these switches has a fallback branch, so a mismatch just drops the request with no voucher sent and no visible error.
- **Inconsistent retry settings.** The primary "fetch code" calls (`75k`, `50k`, `100k`, `75k1`) have `retryOnFail: true`; their "next month" fallback counterparts (`Voucher next month expired2/3/5`, `75k2`) don't — a copy-paste gap that makes the fallback path more fragile against a flaky Apps Script response.
- **No documentation on the live half.** The one sticky note in the file labels only the disabled booking-blast section; the much larger, actually-running PromKil section (~90 nodes across 4 brand/inbox branches) has no section dividers at all.
- No mismatched CRM board IDs or broken node references found (this workflow doesn't use CRM boards for its live logic).

## Related

- [[Areas/Automation/n8n Workflows/Label New|Label New]] — same client, CRM-board-based lead labeling (contrast: this workflow uses Google Sheets instead)
- [[Areas/Automation/n8n Workflows/Social Media Tracker|Social Media Tracker]]
- [[Areas/Automation/n8n — Features & Capabilities|n8n — Features & Capabilities]]
