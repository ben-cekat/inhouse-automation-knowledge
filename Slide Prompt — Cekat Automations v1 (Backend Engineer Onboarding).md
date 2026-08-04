---
title: "Slide-generation prompt — Cekat Automations v1 (Backend Engineer Onboarding)"
type: prompt
status: draft
created: 2026-08-02
author: Ben
source: "[[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)]], [[Areas/Automation/Cekat Automations — Data, Services & Schema (Explainer)]], [[Areas/Automation/Cekat Automations — Sprint Plan]]"
purpose: "Paste this into an AI slide tool (Gamma, Beautiful.ai, Tome, etc.) to generate an onboarding deck for the 2–3 newly-joining backend engineers. Written so Ben can present and field basic questions on it without deep engineering background — technical detail lives in the linked docs, not on the slides."
---

# Slide-generation prompt

Copy everything below the line into your slide tool of choice.

---

Create a slide deck (8 slides) titled **"Cekat Automations — Engineering Onboarding."** Audience: the 2–3 newly-joining backend engineers starting Sprint 0 on Aug 3, 2026. Important constraint: the presenter is not a deep technical expert, so every slide must be understandable and explainable out loud without extra background — plain language, short sentences, no code blocks, no acronyms without a one-line explanation next to them the first time they appear. This is a orientation/context deck, not a spec walkthrough — the detailed technical spec lives elsewhere and is linked at the end. Tone: clear and confident, not dumbed-down. Clean, minimal style, one accent color.

Use only the facts below — don't invent numbers, dates, or claims not listed here.

**Slide 1 — Title**
"Cekat Automations — Engineering Onboarding." Subtitle: "Building an in-house workflow engine to replace embedded n8n." Footer: "Sprint 0 starts Aug 3, 2026 · Team: 2–3 engineers + design part-time."

**Slide 2 — Why we're building this**
Four real problems found by auditing clients' actual n8n workflows — this system exists specifically to fix these:
- IDs are typed in as free text with no checking, so typos have silently broken workflows in production.
- Nothing stops someone from leaving a branch disconnected — one client's workflow was silently dropping customers because of exactly this.
- We found live API passwords/tokens saved in plain text inside a workflow, instead of in a secure credential store.
- n8n's biggest known weakness is that its run-history data grows without limit and eventually makes the whole system slow or unusable.
Closing line: "Every design choice in this system traces back to one of these four real problems — not a generic rebuild."

**Slide 3 — The mental model: three pieces**
Explain with a simple analogy, three boxes:
1. **A filing cabinet** — every automation someone builds, with full version history (like Google Docs version history — you can always go back to an older version).
2. **A mailroom** — watches everything happening in Cekat (a message arrives, a label changes, a CRM record updates) and decides which automations should react, before anything expensive happens.
3. **A logbook** — records every single time an automation ran, so anyone can look up "did this run for this customer, and what happened."
Closing line: "This isn't a new system built from scratch — it reuses infrastructure Cekat already runs today. We're adding new pieces on top, not replacing the foundation."

**Slide 4 — What a "node" is**
Plain explanation, no code: each building block on the canvas (a trigger, a filter, an action like "send a message") is called a node. Every node type is described once, in one shared place — so the visual builder, the validation, and the actual execution all read from that same description. That means adding a brand-new type of node later shouldn't require changing how the engine itself works.
Two simple properties every node has, explained in plain words:
- **What it does** — is it a starting point (trigger), a decision (logic), a read-only lookup (data), or something that changes real data (action)? This affects how carefully it's tested before going live.
- **Where it shows up in the menu** — which category a user finds it under when building (Conversation, CRM, Ticketing, Flow, Utility). This is just for organization and doesn't affect how it runs.

**Slide 5 — How an automation actually runs**
Simple left-to-right flow, plain labels: "Something happens in Cekat" → "Mailroom checks: does any automation care about this?" → "If yes, it's queued up to run" → "A worker picks it up, runs through the steps, and does the real work (adds a label, updates a CRM record, etc.)" → "Every run gets logged."
Callout: "If an automation fails, it must never slow down or block a real customer's conversation — that's a hard rule, not a nice-to-have."
Callout: "The queueing system here is the same one another part of Cekat (Marketing) already uses in production — proven, not new."

**Slide 6 — Where the data lives, and for how long**
Simple table, plain columns (What / Kept where / How long):
- A record of every run (which automation, status, timing) — main database — 90 days at full detail, summarized after that.
- Details of each step within a run (status, error) — main database — 30 days.
- The actual data that passed through each step — separate storage, not the main database — 7 days if it succeeded, 30 days if it failed.
- Daily counts (runs per day, error rate) — main database — kept forever.
Callout: "Failures are kept longer than successes on purpose — you almost never need to dig into a run that worked, but you often need to when one didn't. This design specifically avoids the exact way n8n's database grows out of control."

**Slide 7 — What Sprint 0 covers (Week 1, Aug 3–7)**
Plain checklist, no jargon beyond the item name itself:
- Define every node type in one shared place (the manifest)
- Set up the core database structure
- Define the rules for what makes a workflow valid
- First look at the visual canvas library
- Design how automations reference data from earlier steps
- First look at showing runs live, as they happen
- **Figure out how to detect when a CRM record's field changes** — highest priority, several planned automations depend on this
- **Review real automation workflows across every client** — highest-value task this week, since our plan so far is based on only two clients
Closing line: "Nothing in Sprint 1 starts until this foundational work is done and reviewed."

**Slide 8 — Open questions the team will help answer**
Framed honestly as unresolved, not hidden:
- How do we detect a CRM field changing — is there already a way, or do we need to build one?
- How many automations can run at once per client, and how fast, before we need limits?
- Where do we securely store connection credentials (API keys, tokens)?
- How do we stop an automation from accidentally triggering itself in an infinite loop?
Closing line: "For full technical detail — the exact data structure, the API, the security model — see the linked PRD and data schema doc. This deck is just enough to get oriented on day one."

---

*(End of prompt — paste everything above this line.)*
