---
title: "Slide-generation prompt — Cekat Automations v1 (CEO Review)"
type: prompt
status: draft
created: 2026-08-02
author: Ben
source: "[[Areas/Automation/PRD — Cekat Automations v1 (Simplified Scope Draft)]]"
purpose: "Paste this into an AI slide tool (Gamma, Beautiful.ai, Tome, etc.) to generate a short CEO-review deck."
---

# Slide-generation prompt

Copy everything below the line into your slide tool of choice.

---

Create a short, clean executive slide deck (6–8 slides) titled **"Cekat Automations — v1 Scope Review."** Audience: our CEO, for a quick alignment review before an Aug 3 engineering kickoff. He is not technical — avoid jargon, keep each slide scannable in under 20 seconds, use short phrases and simple tables over paragraphs. Tone: confident, direct, no fluff. Use a clean, minimal business style — light background, one accent color, no stock photos.

Use only the facts below — don't invent numbers, dates, or claims not listed here.

**Slide 1 — Title**
"Cekat Automations — v1 Scope Review." Subtitle: "Replacing embedded n8n with an in-house workflow engine." Small footer: "Kickoff: Aug 3, 2026."

**Slide 2 — Why build this in-house**
Three short points:
1. Licensing risk — n8n's license doesn't cover letting paying customers build/edit workflows inside our product (the OEM case), and that's unresolved.
2. n8n is general-purpose; our data isn't — it has no concept of a Cekat CRM board, a canonical label, or our timezone, which is where real production bugs have already come from (trailing-space filter, hardcoded API token, an unwired branch).
3. Support can't see inside it — IT/CS can't answer "did this run for this customer" without an n8n login and a manual timestamp hunt today.
Closing line: "Narrower than n8n, deeper on our own data — same canvas clients already know."

**Slide 3 — The model, in one line**
Large, centered: "Trigger → Filter → (optional Wait/AI step) → Action." Subtext: "One automation, one trigger, any number of filter/action steps, built on a drag-and-drop canvas."

**Slide 4 — What's in the first 8-week milestone**
A short table or bullet list, two columns (Builder / Automation capabilities):
- Builder: multiple automations, drag-and-drop builder, full execution logs with node-level attribution, searchable execution history (by workflow, status, date range, run ID), live view of running automations.
- Capabilities: scheduled trigger, event triggers (message received, label added/removed, CRM created/changed), conversation-inactivity trigger, contact-property filter, existence filter, wait/delay with re-check, label action, webhook action, data manipulation.
Callout box: "Searchable execution history is a direct fix for a real pain point — IT delivery staff currently have no way to look up a client-reported automation error except scrolling n8n's list by timestamp."

**Slide 5 — Three open decisions that need your call**
A simple 3-row table (Decision / The tension):
1. Segment/CDP-based triggers — deferred to v2, since conversation/CRM automation is more urgent (blocks n8n migration) — needs explicit sign-off, not an assumption.
2. "Every Cekat function callable" — reframed as: everything reachable via a generic webhook call to our own API on day one, ~20 most-used get a polished node, more added on demand. Needs agreement this framing is acceptable.
3. Stop/override an outgoing reply — deferred to v2, since it requires automations to run synchronously in the message-send path, conflicting with the rule that automation failures must never block a live conversation.

**Slide 6 — Delivery plan**
Simple timeline/table: Team = 2–3 new engineers + design part-time. Start Aug 3, 2026. Milestone 1 ~Sep 25, 2026 (8 weeks): a workflow rebuilt entirely in the UI and run in shadow mode against live n8n. Full release ~Nov 6, 2026 (14 weeks): 3 clients migrated, error rate under 1%. Note: "Engine ships before the canvas is finished — Phase 1 is a working, API-usable engine even if the builder slips."

**Slide 7 — Try it yourself**
Large link/button styling: "cekat-cmbebm7ce-ben-cekat.vercel.app" — "An interactive prototype of the builder — drag nodes, connect them, configure, test-run, browse executions." Below it, a small disclaimer box: "UI prototype only — not connected to real data or a real engine. For reviewing interaction and scope, not final visual polish. Only 5 example workflows are fully clickable."

**Slide 8 — What we need from you**
Short, direct ask list: "1. Sign off on the 3 open decisions (previous slide). 2. Confirm the Aug 3 kickoff. 3. Try the prototype and send feedback before [date]." Closing line: "Full technical detail is in the PRD if you want to go deeper — this deck is the scope-only summary."

---

*(End of prompt — paste everything above this line.)*
