---
type: resource
tags: [automation, n8n, cekat-crm, instagram, tiktok, lead-scoring]
saved: 2026-07-29
source: "Social Media Tracker.json (n8n export)"
---

# n8n Workflow — Social Media Tracker

**What it does:** Runs the same lead-lifecycle logic as [[Areas/Automation/n8n Workflows/Label New|Label New]], but for Instagram and TikTok DMs instead of WhatsApp. Despite the name, there is no Facebook coverage, and no WhatsApp (that's handled by the sibling workflows).

## Sections / brands covered

Four sections, one per brand × platform, each with its own CRM board:

| Section | Webhook path | Board ID |
|---|---|---|
| IG SKIN+ | `sosmed-tracker-ig-skin` | `84f6b799-fd7f-437d-a405-47c24648717b` |
| IG SLIM+ | `sosmed-tracker-ig-slim` | `310b4f22-f03f-4948-8874-e7194fae2b15` |
| Tiktok SKIN+ | `sosmed-tracker-tiktok-skin` | `01885631-2f61-4cb8-9650-9c8a14ba9923` |
| Tiktok SLIM+ | `sosmed-tracker-tiktok-slim` | `e3723ef8-8c5f-4609-8d5c-d19a11dc9e82` |

Board references are internally consistent per section (unlike Label New, no wrong-board writes here). No sticky notes anywhere in this file.

## What each section does

Two event types drive each section:

1. **`conversation.stage_status_updated`**
   - When a conversation first becomes `open` → creates a new CRM record (Username, "Tanggal Lead Masuk" timestamp, "First Responded By: AI").
   - When it becomes `assigned`/`pending` → finds the existing record by Username and writes Agent + "Transfer to Telesales: Yes."
2. **`conversation.labels_updated`** (only when `change_type == "add"`) — branches on which of 6 labels (Cold/Warm/Hot Leads, Out Of Area, Spam, No Response) was applied and stamps the matching column with a Jakarta timestamp — the same per-label switch as Label New, just against these Instagram/TikTok boards.

The Search→SplitOut→Limit→Update pattern appears **28 times** (7 per brand section: 1 for the assigned/pending→Agent write + 6 for the label switch).

## Known issues (actionable)

- **TikTok sections never create the initial CRM record on conversation open — a real regression.** In the Instagram sections (`Switch1`, `Switch4`), the "open" branch correctly triggers CRM record creation. In both TikTok sections (`Switch7` for SKIN+, `Switch10` for SLIM+), the "open" output is wired to nothing — instead, record creation ("Create item2"/"Create item3") is wired to the "pending" branch. Net effect: new TikTok leads only get a CRM record once the conversation happens to reach "pending" status, not when it opens. Given the IG version (clearly the template this was copied from) has it right, this looks like an unnoticed copy-paste regression from when TikTok support was added.
- **Missing timezone conversion on one timestamp write.** Node "Update item9" (IG SLIM+, Label Warm column) uses `$now.toFormat(...)` with no `.setZone('Asia/Jakarta')`, while all 27 other identical timestamp writes in the file include it — this one column lands ~7 hours off from every other label timestamp.
- **Three orphaned webhook nodes** ("message received" on `tiktok-webhook`, plus a "status update" and a "labels" webhook) exist with pinned sample payloads but aren't wired into the `connections` graph at all — dead test/staging endpoints that receive traffic but do nothing.
- **No sticky-note documentation anywhere**, unlike the sibling workflows — made the TikTok wiring bug harder to spot until the connections were traced directly.

## Related

- [[Areas/Automation/n8n Workflows/Label New|Label New]] — same CRM label→column pattern, WhatsApp instead of IG/TikTok
- [[Areas/Automation/n8n Workflows/Voucher bayar di klinik|Voucher bayar di klinik]]
- [[Areas/Automation/n8n — Features & Capabilities|n8n — Features & Capabilities]]
