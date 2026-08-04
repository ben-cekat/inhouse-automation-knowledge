---
type: resource
tags: [automation, n8n, cekat-tickets, insurance, cms-sync, security-risk]
saved: 2026-07-29
source: "Ticket Automation.json (n8n export)"
---

# n8n Workflow — Ticket Automation

**Different client from the SKIN+/SLIM+ clinic workflows.** This one belongs to **PT AJ Central Asia Raya** (car.co.id — a car insurance company), not the clinic group covered in [[Areas/Automation/n8n Workflows/Label New|Label New]] / [[Areas/Automation/n8n Workflows/Voucher bayar di klinik|Voucher bayar di klinik]] / [[Areas/Automation/n8n Workflows/Social Media Tracker|Social Media Tracker]]. It also works completely differently from those — no WhatsApp inbox triggers, no CRM board, no lead labels.

**What it does:** Keeps a ticket bidirectionally in sync between Cekat's ticketing system and the insurer's own CMS/policy-master system, keyed by policy-number lookups.

## Three entry points

1. **Create Ticket** (webhook `car-insurance/create_ticket`) — fires when a new ticket is created in Cekat. Checks whether the person is an existing policyholder (`is_nasabah`); if so, looks up their policy via the insurer's "CorePolismaster" endpoint, merges the result with the ticket, and posts a new record into the CMS — then writes the resulting CMS record ID back into the Cekat ticket to keep the two linked. If the policy lookup fails, it still creates the CMS record but flags the title "NO POLIS NOT FOUND." If the person isn't an existing policyholder, it skips the lookup and posts a simpler record.
2. **Update Ticket** (webhook `car-insurance/update_ticket`) — fires on ticket edits. Checks whether the ticket already has a linked CMS record: if not, repeats the lookup-and-create logic; if it does, pushes updated contact fields (name/phone/email/detail) into the existing CMS record.
3. **Update Ticket from CMS** (webhook `car_insurance/update_ticket` — note the underscore vs. hyphen elsewhere) — the reverse direction: when the insurer's CMS updates a ticket on its own, this receives that and pushes the change back into Cekat, then responds with a confirmation.

## Known issues (actionable, roughly in priority order)

- **Hardcoded live API bearer tokens in plaintext.** Dozens of HTTP Request nodes paste a raw JWT directly into the node's header parameters instead of using n8n's credential store (only one node, "POST Ticket Data1," does this correctly via a stored credential). Anyone who can view or export this workflow JSON can read working tokens for both Cekat's ticket API and the insurer's CMS. Rotating a token means hunting down and editing every node it was pasted into, and there's real exposure risk if this file is ever shared outside the team. **Priority fix**, independent of anything else below — move all Authorization headers to n8n credentials.
- **Mixed environments wired into one active, production workflow.** Dev (`devcarportal.car.co.id`), a separate demo/staging domain (`demo-car.smartcall.id`), and production (`carportal.car.co.id`) all appear — some live-wired, some as leftover disconnected test calls.
- **~12 orphaned test nodes.** `POST Ticket Data`/`1`/`2`/`3`, `HTTP Request`/`1`/`2`, `Get Detail Ticket1`/`2`, and a bare `GET` node hitting a third-party Vercel proxy are not wired into the trigger graph at all — leftover manual test calls, several of which also carry hardcoded tokens (see above).
- **Silent failure on failed policy lookup during an update.** On the "Update Ticket" path, if the CMS policy lookup fails while updating a not-yet-linked ticket, the flow hits "No Operation, do nothing1" — the update silently disappears with no CMS record created and no error surfaced anywhere.
- **Disabled, unreachable sub-flow.** `Merge1` → `Merge Item1` → `Check No Polis1` is both disabled and not wired to any trigger — dead work-in-progress, safe to ignore but worth deleting during cleanup.
- **Inconsistent webhook path naming.** Two entry points use hyphens (`car-insurance/...`), the reverse-sync one uses an underscore (`car_insurance/...`) — cosmetic, but worth knowing if anyone documents the CMS-side integration.

## Related

- [[Areas/Automation/n8n Workflows/Label New|Label New]], [[Areas/Automation/n8n Workflows/Voucher bayar di klinik|Voucher bayar di klinik]], [[Areas/Automation/n8n Workflows/Social Media Tracker|Social Media Tracker]] — same automation platform (Cekat + n8n), different client and mechanism
- [[Areas/Automation/n8n — Features & Capabilities|n8n — Features & Capabilities]]
