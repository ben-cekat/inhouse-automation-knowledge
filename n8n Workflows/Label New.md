---
type: resource
tags: [automation, n8n, cekat-crm, whatsapp, lead-scoring]
saved: 2026-07-29
source: "Label New.json (n8n export)"
---

# n8n Workflow — Label New

**What it does:** Keeps a CRM board in sync with the lead-status label a WhatsApp conversation carries in Cekat. Whenever staff (or the AI agent) adds a label like "Hot Leads" to a conversation, this workflow finds the matching CRM record (by phone number) and stamps a "follow-up due" timestamp into the corresponding column — so the CRM board always reflects the current lead temperature and when it's due for re-engagement.

## Trigger & core pattern

Fires on `conversation.labels_updated`, gated to only proceed when `payload.change_type == "add"` (label removals are ignored here — a separate mechanism handles those, see below).

Every branch repeats the same four-step pattern seen across this client's other workflows:

`Search items` (cekatCrm `searchItems`, find CRM record by Phone) → `Split Out` (unwrap the `response.data` array) → `Limit` (keep last match, to resolve to one record) → `Update item` (cekatCrm `updateItem`, write a Jakarta-timezone timestamp — `$now.plus({days:1})` — into the matching column).

This exact chain repeats **34 times** across the file (136 nodes) — once per label × per inbox. The workflow's size (8,600 lines) is duplication of this one pattern, not genuine logical complexity.

## Sections / brands covered

| Section (sticky note) | Inboxes | Notes |
|---|---|---|
| AI SKIN+ SLIM+ | SKIN+ AI, SLIM+ AI | |
| Human Agents SKIN+ SLIM+ | SKIN+ Telesales, SLIM+ Telesales | |
| *(undocumented)* | Skin+ Ecommerce | No sticky note; added later |
| *(undocumented)* | Eurohairlab (different clinic brand) | No sticky note; copy-pasted from SLIM+ logic |

11 `cekatTrigger` nodes total — one set listening for `labels_updated` per inbox, plus a matching set listening for conversation-resolved events (used only by the reset mechanism below). **Skin+ Ecommerce has no resolved-trigger counterpart**, so its labels never auto-clear.

## Label taxonomy → CRM column

| Label | Column written |
|---|---|
| Cold Leads | Label Cold |
| Warm Leads | Label Warm |
| Hot Leads | Label Hot |
| No Response | No Response |
| Spam | Spam |
| Out Of Area | Out of Area |
| Voucher SKIN+ / Voucher SLIM+ | *(unwired — see bugs)* |

## Mutual exclusivity + reset

Adding a "hotter" temperature label removes the cooler one (Warm removes Cold; Hot removes both Cold and Warm) via `n8n-nodes-base.cekat` `removeLabel` calls — confirmed against the sample payload's label IDs. This does **not** extend to No Response / Spam / Out Of Area, so a conversation can end up simultaneously "Hot Leads" and "Spam."

Separately, a **"Remove Label After Resolve"** section (`If3`–`If6` nodes) checks `payload.new_value == "resolved"` per inbox and, when true, clears all lead-status labels at once so the next conversation starts fresh.

## Known issues (actionable)

- **Typo breaks Hot Leads matching on SKIN+ AI inbox.** The first `Switch` node's Hot Leads condition is `={{ $json.payload.label.data.name }}x` — a stray trailing `x` that means this branch never matches. Confirmed isolated to this one switch (not present in Switch2–Switch5, Switch8).
- **Wrong CRM board referenced in two places.** "Update item2" (Hot Leads, SKIN+ AI section) writes to board `a7bb6e54…` instead of the correct `7df005f0…`. "Search items11"/"Update item9" (Warm Leads, SKIN+ Telesales section) both search and update against that same wrong board.
- **Voucher SKIN+ / Voucher SLIM+ branches are dead.** Present in the Switch conditions but wired to nothing downstream.
- **Eurohairlab copy-paste leftovers.** Its switch still contains an irrelevant "Voucher SLIM+" condition, and is missing the "Out Of Area" branch that the other sections have.
- **Skin+ Ecommerce labels never auto-clear** (no resolved-trigger for that inbox).

## Related

- [[Areas/Automation/n8n Workflows/Social Media Tracker|Social Media Tracker]] — same label→column pattern, applied to Instagram/TikTok instead of WhatsApp
- [[Areas/Automation/n8n Workflows/Voucher bayar di klinik|Voucher bayar di klinik]] — different mechanism (Google Sheets, not CRM board), same client
- [[Areas/Automation/n8n — Features & Capabilities|n8n — Features & Capabilities]]
