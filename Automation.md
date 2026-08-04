---
type: area
tags: [automation, ipaas, ai-agents]
---

# Automation

## Purpose
> Internal automation and agent infrastructure at Cekat AI — the workflows, tooling, and platform decisions that let the team (and eventually customers) wire systems together without bespoke code for every integration.

Covers both directions:
- **Internal** — marketing/ops/data automations we run ourselves.
- **Product** — whether automation becomes something we expose to customers.

## Current focus

- Evaluating **n8n** as an automation/agent runtime → see [[n8n — Features & Capabilities]]
- Marketing automation scope → see [[MRKT_Automation_RFC_v1]]

## Open decisions

- [ ] **Buy vs. build vs. embed.** n8n as a hidden backend engine (standard licence, no branding constraints) vs. customer-facing canvas (OEM agreement, n8n branding stays visible) vs. an MIT-licensed alternative like Activepieces.
- [ ] **Is visible n8n branding acceptable** if we ever expose a builder to customers? If not, OEM is disqualified.
- [ ] **Execution-volume cost model** at Cekat's message volumes — per-execution billing needs modelling before committing.
- [ ] **Hosting posture** — Community Edition self-hosted vs. paid tier. SSO, git version control, environments, and multi-main HA are all gated behind Business/Enterprise.

## Active projects
```dataview
LIST
FROM "Projects"
WHERE area = "Automation" AND status = "active"
```

## Key resources

- [[Areas/Automation/Cekat Automations — Decision Brief for CTO|Cekat Automations — Decision Brief]] — **start here.** 8-min build-vs-n8n case, risks, decisions needed
- [[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)|PRD — Cekat Automations]] — full engineering spec (reference; has a reader map at the top)
- [[n8n — Features & Capabilities]] — technical capabilities, pricing, licensing, embedding models, production gotchas
- [[MRKT_Automation_RFC_v1]] — marketing automation RFC
- [[Projects/2026-07-07 — Marketing Sheet Weekday Column Automation|Marketing Sheet Weekday Column Automation]]
- **n8n Workflows/** — Cekat client automation deep-dives: [[Areas/Automation/n8n Workflows/Label New|Label New]], [[Areas/Automation/n8n Workflows/Voucher bayar di klinik|Voucher bayar di klinik]], [[Areas/Automation/n8n Workflows/Social Media Tracker|Social Media Tracker]], [[Areas/Automation/n8n Workflows/Ticket Automation|Ticket Automation]] (⚠️ hardcoded API tokens found)

## SOPs & playbooks

- [[Resources/Playbooks/AI Agents|AI Agents playbook]] (Resources)

## Notes & decisions

_Log platform decisions here as they land — what was chosen, when, and why._
