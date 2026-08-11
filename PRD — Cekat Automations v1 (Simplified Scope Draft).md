---
title: "PRD — Cekat Automations v1 (Simplified Scope Draft)"
type: prd
status: draft
tags: [cekat, automation, workflow-engine, simplified, v1-scope]
created: 2026-07-30
author: Ben
consumers: [engineering, ceo, cto]
purpose: "A plain-language, scope-only companion to the full PRD — organized directly against the CEO's original automation notes, for quick alignment before the Aug 3 kickoff"
prototype: "https://cekat-cmbebm7ce-ben-cekat.vercel.app/"
full_spec: "[[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)]]"
decision_brief: "[[Areas/Automation/Cekat Automations — Decision Brief for CTO]]"
source_requirements: "[[Resources/2026-06-29 — App Development]] — Automation section"
sprint_plan: "[[Areas/Automation/Cekat Automations — Sprint Plan]]"
---
# Cekat Automations — v1 Scope, Simplified

## What this document is

This document answers a narrower question: **"what exactly is in v1, and what isn't."** 

## Why we're building this in-house, briefly

Every Cekat client currently builds automations in n8n, self-hosted by us and embedded in an iframe. Three reasons it's the wrong long-term foundation, in short:

1. **Licensing risk.** n8n's Sustainable Use License covers internal use, not hosting it so paying customers build and edit workflows inside our product — that's the OEM case, unresolved and costly to resolve.
2. **n8n is general-purpose; our data isn't.** It has no concept of a Cekat CRM board, a canonical label, or that we run on Asia/Jakarta — so clients build automations with free-text IDs and no validation, which is where real production bugs (a trailing-space filter, a hardcoded API token, an unwired branch) have come from in workflows we've already audited.
3. **Support can't see inside it.** When something breaks, IT/CS can't answer "did this automation run for this customer" without an n8n login and a manual timestamp hunt — the exact gap the searchable execution history above exists to close.

The plan: use Activepieces as the workflow-engine backbone while building a Cekat-specific product layer around it. The resulting platform stays deliberately narrower than n8n (no 500 connectors, no arbitrary code) but deeper on Cekat's own data — same drag-and-drop canvas clients already know, fewer ways to shoot themselves in the foot. Cekat-specific nodes, validation, execution logs, error containment, and business scoping remain part of the product responsibility.

## n8n doesn't go away on day one

Cekat Automations and n8n run side by side during the transition — this isn't a hard cutover. Existing client workflows keep running on n8n exactly as they do today; nothing is migrated automatically or forced. Once the builder is ready, new automations default to Cekat Automations instead of n8n. Migrating an existing n8n workflow to the new engine is a deliberate, per-client project — a manual rebuild, not an automated import (the audited workflows are 60–90% duplication, so a straight conversion would just import the bugs along with the logic) — not something that happens on its own. n8n is only fully retired once there's a documented path to full feature parity; no sunset date is set yet.

## The model, in one line

**Trigger → Filter → (optional Wait/AI step) → Action.** One automation, one trigger, any number of filter/action steps, built on a drag-and-drop canvas.

---

## Should have — v1

These are committed for v1. (Delivery sequencing across sprints — what ships in the first 8-week milestone vs. later in the 14-week release — lives in the Sprint Plan, not here.)

**Builder and product surface** — the UX layer, separate from what a workflow can actually do:

| Requirement                                      | What it means concretely                                                                                                                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Multiple automations                             | A business can create, list, and manage any number of automations                                                                                                                                                                                                |
| Drag-and-drop builder                            | Visual canvas, not a form or code editor — same interaction model as the current n8n embed                                                                                                                                                                       |
| Full execution logs, with node-level attribution | Every run is logged; every side effect can be traced to the specific automation *and* the specific step that caused it                                                                                                                                           |
| Searchable execution history                     | Every execution is retained and searchable — by workflow, status (success/error), date range, and run ID — not just browsable by scrolling a timestamp-ordered list                                                                                              |
| Live view of running automations                 | See what's currently executing, not just a history list after the fact                                                                                                                                                                                           |
| Error containment                                | If one automation gets stuck (e.g. stuck in a loop) or keeps failing, only that automation is affected — it gets automatically disabled instead of being left to keep retrying, and no other automation, no other client, and no other part of Cekat is impacted |

> **Why "searchable" is called out explicitly, not assumed:** IT delivery staff report that when a client reports an automation error today, there's no way to look it up directly — they have to manually scroll n8n's execution list and find the failing run by timestamp alone. This is a direct, named requirement from that pain point, not a generic "add search" nice-to-have: search must work by workflow, status, date range, and run ID, since those are the terms a client's error report actually arrives in.
>
> **Why "error containment" is called out explicitly, not assumed:** a stuck or looping automation must never be able to slow down or affect other automations — for this business, for any other client, or for Cekat as a whole. One bad automation should only ever be able to hurt itself. Exactly how a stuck automation gets auto-disabled — after a fixed number of failed attempts, or based on how much it's consuming — is still being worked out (Ardin is exploring this in Sprint 0), but the guarantee itself is locked in as a requirement now, not left for later.

**Automation capabilities** — what a workflow can trigger on, filter by, and do:

| Requirement                                     | What it means concretely                                                                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger → Filter → Action structure             | Every automation is built as this pipeline                                                                                                |
| Event trigger                                   | Message received, message sent, conversation status changed, pipeline status changed, conversation assigned, label added/removed, CRM record created/changed, contact property changed |
| Contact-property filter                         | Compare a field on the contact (e.g. status, city)                                                                                        |
| Existence filter                                | Check whether a related record exists (e.g. "has an open conversation") — distinct from comparing a value                                 |
| Label action                                    | Add/remove a label on a conversation                                                                                                      |
| Webhook action                                  | Call an external URL                                                                                                                      |
| Data manipulation                               | Format/transform values (dates, strings, numbers) between steps                                                                           |
| CRM actions                                     | Find CRM record · Create CRM record · Update CRM Table                                                                                     |
| AI analysis step                                | Run a classify/extract step before deciding the action                                                                                    |
| Call CAPI functions                             | Fire a Meta/TikTok Conversions API event                                                                                                  |
| Update session fields                           | Write to the conversation's session metadata                                                                                              |
| Fire a custom CDP event                         | Same mechanism already used manually today — e.g. a receptionist clicking a "customer entered clinic" button on the contact's CRM detail page fires a custom event into the customer journey. Here, an automation fires that event programmatically instead of a person clicking it. |
| Sequenced/chained actions                       | Reading: one workflow can trigger a sequence of actions, one after another. Falls out of the graph model itself — not a separate build item, just confirming it's covered |

> 🔄 **Moved to v2, 2026-08-05:** Scheduled (cron) trigger, Conversation-inactivity trigger ("chat delay"), and Wait/delay-with-re-check were previously listed here. See "Nice to have / not in v1" below for the reasoning and the open tension this creates with the "Sync Data Book New" workflow shape.

---

## Nice to have / not in v1 — needs a decision, not just a note

| Requirement                                     | Current plan                                                                                                                                                   | The actual tension                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filter/trigger by segment (CDP-based)           | Deferred to v2                                                                                                                                                 | The CEO's notes list "by segment" and "Pure CDP" first among trigger/filter types. The plan treats conversation/CRM automation as more urgent (it's what's blocking n8n migration) and marketing automation as net-new. Both are defensible — this needs his explicit call, not an assumption either way. |
| "ALL FUNCTIONS" / every Cekat function callable | Reframed: everything reachable via a generic webhook-style call to our own API on day one; ~20 most-used get a polished first-class node; more added on demand | This technically satisfies the request without hand-building 100 node types in 6 weeks — but it's a reframing of what was asked for, not a literal yes. Needs agreement that this framing is acceptable.                                                                                                  |
| Stop / override an outgoing reply               | Deferred to v2                                                                                                                                                 | Requires automations to run *synchronously* in the message-send path, which conflicts with the rule that automation failures must never block or slow down a live conversation. This is a real architectural fork, not a scheduling choice — it needs its own design later, not a shortcut now.           |
| Scheduled (cron) trigger                        | Deferred to v2 (2026-08-05)                                                                                                                                    | The audited "Sync Data Book New" workflow shape is exactly this — a cron-driven batch sync. Deferring cron means that workflow shape can't migrate off n8n until v2. Flag to the CEO explicitly, since it's a real migration blocker for at least one client, not just a theoretical gap.                  |
| Conversation-inactivity trigger ("chat delay")  | Deferred to v2 (2026-08-05)                                                                                                                                    | A direct reading of the CEO's own note ("bisa by chat delay") — deferring something he explicitly asked for needs his sign-off, not an assumption.                                                                                                                                                          |
| Wait/delay step, with a re-check after the wait | Deferred to v2 (2026-08-05)                                                                                                                                    | The "post cron filter" pattern from the CEO's notes. Several audited workflows lean on this exact shape (act, then re-verify after a pause) — deferring it removes a pattern current n8n workflows actually use, not just a theoretical one.                                                               |

---

## Not yet scoped — v3 candidates (2026-08-05)

v1 and v2 together cover Chat and CRM fully, since that's what the audited n8n workflows actually use. Marketing is the one domain where v1 only has two actions (Call CAPI, fire a custom CDP event) and no marketing-native triggers at all — everything that *reads* from segments/CDP to decide when an automation should run is still open. These aren't committed anywhere yet — proposed here for visibility, not requested by the CEO's notes, and not yet run by him.

**Triggers:**
* Campaign/broadcast delivered or opened
* Frequency cap or suppression-list entry reached
* Lifecycle/RFM stage changed (e.g. VIP, churn-risk)
* Ad platform conversion echoed back into Cekat

**Actions:**
* Add/remove contact from a segment or list
* Enroll contact into a campaign or broadcast sequence
* Apply or lift a suppression/frequency cap
* Update marketing consent/opt-in status

---

## The v1 node list, in one place

**Triggers:**
* Message received
* Message sent
* Conversation status changed
* Label added/removed
* Pipeline status changed
* Conversation assigned
* CRM record created/changed
* Contact property changed

**Filters:**
* Contact property comparison
* Existence check (conversation/record exists)

**Flow control:**
* Condition/Router

**Actions:**
* Add/remove label
* Call webhook
* Format/manipulate data
* Find CRM record
* Create CRM record
* Update CRM Table
* Call CAPI
* Update session field
* Fire custom event
* AI analysis step

**Explicitly out of v1:**
* Segment/CDP-based triggers and filters
* first-class nodes for every Cekat function
* Stop/override outgoing reply
* Schedule (cron) trigger — deferred to v2, 2026-08-05
* Conversation-inactivity trigger — deferred to v2, 2026-08-05
* Wait/delay step (with re-check) — deferred to v2, 2026-08-05

---

## Node palette — grouped by domain, tagged by category

The builder's palette groups nodes by **domain** (what part of the product they touch — what a user is scanning for) and tags each with its **category** (Trigger / Logic / Data / Action — what it does structurally).

| Domain           | Node                        | Category |
| ---------------- | --------------------------- | -------- |
| **Conversation** | Label added / removed       | Trigger  |
|                  | Message received            | Trigger  |
|                  | Message sent                | Trigger  |
|                  | Conversation status changed | Trigger  |
|                  | Pipeline status changed     | Trigger  |
|                  | Conversation assigned       | Trigger  |
|                  | Add / Remove label          | Action   |
|                  | Send message                | Action   |
| **CRM**          | Find CRM record             | Data     |
|                  | Create CRM record           | Action   |
|                  | Update CRM Table             | Action   |
|                  | Contact property changed    | Trigger  |
| **Ticketing**    | Ticket created / updated    | Trigger  |
|                  | Create / Update ticket      | Action   |
|                  | Call & link external ticket | Action   |
| **Flow**         | Filter                      | Logic    |
|                  | Router (Switch)             | Logic    |
|                  | Wait / Delay *(v2)*         | Logic    |
|                  | Loop over list              | Logic    |
| **Utility**      | HTTP request                | Action   |
|                  | Lookup table                | Data     |
|                  | Set variable / Format       | Data     |
|                  | AI step                     | Data     |

Notes on how this differs from the v1 node list above: Ticketing is a full domain here (mirrors the "Ticket Automation" example workflow) even though only some of its nodes are v1; "Loop over list" and "Data" as a category label are new relative to the plain trigger/filter/action framing earlier in this doc — Data nodes read/transform without an external side effect (Find CRM record, Lookup, Format, AI step), which is why they're tagged separately from Action nodes that do have one. This distinction doesn't change v1 scope, just how the palette is organized for the user.

---

## Why this stays simple

Two guardrails, carried over from the full PRD, that keep this scope from creeping:

1. **Everything not yet a first-class node is still reachable** via the generic webhook/HTTP action calling Cekat's own API — so nothing is technically blocked, even where the polished version comes later.
2. **A census across all clients runs in week 1** before this scope is locked further. This list reflects what two clients' audited workflows and the CEO's notes require; it is not yet confirmed against the full client base.

---

## Delivery plan

**Team:** 2–3 newly-joining engineers + design part-time. **Start:** 2026-08-03. **Milestone 1:** ~2026-09-25 (8 weeks). **Full release:** ~2026-11-06 (14 weeks).

The engine ships before the canvas is finished — Phase 1 is a working, API-usable engine with no UI, so if the builder slips, there's still a shippable product underneath it. Broken into 2-week checkpoints for tracking:

| Sprint | When        | Focus                                                                                                                                                                                                  | Checkpoint                                                                                         |
| ------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 0      | Week 1      | Foundations: node manifest schema, data model, and — highest priority — **a workflow census across every client**, since the node priorities above are extrapolated from two clients' workflows so far | Scope lock: Section 5's priorities re-ranked against real census data before Sprint 1 starts       |
| 1      | Weeks 2–3   | Engine, part 1: graph executor, triggers, label/CRM actions                                                                                                                                            | An automation runs end-to-end via API with correct side effects — no UI yet                        |
| 2      | Weeks 4–5   | Engine, part 2 (webhook action, wait/loop, retries) + canvas kickoff                                                                                                                                   | "Label New" rebuilt and running in shadow mode; canvas renders the same graph read-only            |
| 3      | Weeks 6–7   | Builder core: pickers, config drawer, test run, workflows list                                                                                                                                         | Build and test-run a simple automation entirely in the UI                                          |
| 4      | Week 8      | Builder finish: executions view, live run stream, publish/version history                                                                                                                              | **Milestone 1** — a workflow is rebuilt entirely in the UI and run in shadow mode against live n8n |
| 5–6    | Weeks 9–12  | Hardening: credentials UI, remaining actions, inbound webhook trigger                                                                                                                                  | —                                                                                                  |
| 7      | Weeks 13–14 | First 3 client migrations, monitoring dashboards, load test                                                                                                                                            | **Full release** — 3 clients migrated, error rate under 1%                                         |

---

## Node & trigger reference — properties, with open items marked

One row per v1 node, showing what a user would configure. Anything marked **[placeholder]** is a real unknown or an unconfirmed recommendation, not a settled detail — use this table as the punch list for what to ask engineering or the CTO directly, rather than assuming any placeholder cell is decided.

### A note on "variables"

Two different things get called "variables" in this project, and it's worth keeping them apart:

1. **The workspace-level "Variables" tab** already sitting in Cekat's current nav (next to Data tables). In n8n this is normally just simple named constants set once per workspace and reused anywhere (e.g. `default_currency = IDR`). **Deliberately left out of v1** — the reasoning is that workspace settings (timezone, defaults) and Data tables (lookup tables) already cover the need. Worth stating explicitly rather than leaving as a silent gap: flag to engineering/CTO as *"intentionally dormant for v1, revisit if a real need surfaces."*
2. **What each node exposes to the nodes after it** — e.g. a "Message received" trigger hands `contact`, `conversation`, and `message` downstream so a later node can reference `{{trigger.contact.phone}}`. This is the one that actually matters for the builder (it drives expression autocomplete) and for bug prevention (a path that doesn't exist becomes a save-time error instead of a silent failure — the direct fix for the "stray x in an expression" bug from the n8n audit). It is a property of each node, not a separate settings screen — added as a column below.

### Triggers

| Node                        | Config properties (as shown to the user)                                                                                | Exposes downstream (variables later nodes can use)   | Open items                                                                                                                                                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Message received            | Inboxes (multi-select) · Channels (multi-select, optional)                                                              | `conversation`, `contact`, `message`                 | None — existing route                                                                                                                                                                                                                                                                                                                             |
| Message sent                 | Inboxes (multi-select)                                                                                                   | `conversation`, `contact`, `message`                 | None — existing route                                                                                                                                                                                                                                                                                                                             |
| Label added / removed       | Inboxes (multi-select) · Labels (multi-select) · Change type (Added / Removed / Either)                                 | `conversation`, `label`, `change_type`               | None — existing route                                                                                                                                                                                                                                                                                                                             |
| Conversation status changed | Inboxes (multi-select) · From status (optional) · To status (optional)                                                  | `conversation`, `previous_status`, `new_status`      | None — existing route                                                                                                                                                                                                                                                                                                                             |
| Pipeline status changed     | Inboxes (multi-select) · From status (optional) · To status (optional)                                                  | `conversation`, `pipeline_status`                    | None — existing route (`/business_workflows/pipeline-status`)                                                                                                                                                                                                                                                                                     |
| Conversation assigned       | Inboxes (multi-select) · Agents (multi-select, optional)                                                                | `conversation`, `agent`                              | None — existing route                                                                                                                                                                                                                                                                                                                             |
| CRM record created          | Board (single-select)                                                                                                   | `record`, `board`                                    | None — existing route                                                                                                                                                                                                                                                                                                                             |
| CRM field changed           | Board (picker) · Column(s) to watch (multi-select)                                                                      | `record`, `column`, `old_value`, `new_value`         | **[placeholder]** — the underlying mechanism to detect a field change doesn't exist yet. Ask engineering: does a hook already exist on CRM writes, or do we need a new outbox table? This is the single biggest technical unknown in the whole v1 trigger set.                                                                                    |
| Contact property changed    | Property (single-select) · from Board field list                                                                        | `contact`, `property`, `old_value`, `new_value`      | **[placeholder]** — shares the same underlying mechanism question as CRM field changed above; likely the same fix once that's resolved.                                                                                                                                                                                                          |
| Conversation inactive for N — **Deferred to v2** | Inboxes (multi-select) · Duration (number + unit) · Whose turn (toggle: customer hasn't replied / agent hasn't replied) | `conversation`, `contact`, `last_message`, `elapsed` | 🔄 Moved to v2 (2026-08-05). Was a reading of "bisa by chat delay," not a confirmed spec — the CEO-sign-off question below still applies whenever this is picked back up: does he mean "conversation gone quiet" (this), or "wait a fixed time after a chat event"? |
| Schedule (cron) — **Deferred to v2**             | Frequency (Daily / Weekly / Custom) · Time of day · Timezone                                                            | `scheduled_at`                                       | 🔄 Moved to v2 (2026-08-05). Note: the audited "Sync Data Book New" workflow needs this node to migrate off n8n — deferring cron means that workflow shape stays on n8n until v2.                                                                                    |
| Manual / test run           | Sample source (pick a real recent event / paste sample data)                                                            | whatever shape the picked/pasted sample has          | None                                                                                                                                                                                                                                                                                                                                              |

### Filters and flow control

| Node             | Config properties                                                        | Exposes downstream                                        | Open items                                                                                                                                                                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Filter           | Field (picker) · Operator (depends on field type) · Value                | — (passes the run through unchanged, exposes nothing new) | **[placeholder]** — default text-matching behavior (trimmed + case-insensitive vs. exact match) is a recommendation only. Ask the CTO to sign off, since it directly affects whether past bugs like the trailing-space voucher issue can recur.                                                                          |
| Condition (If)   | Same field/operator/value builder as Filter                              | —                                                         | None                                                                                                                                                                                                                                                                                                                     |
| Router (Switch)  | Field to switch on · one row per branch · mandatory fallback branch      | —                                                         | None — the mandatory fallback is a settled decision                                                                                                                                                                                                                                                                      |
| Existence filter | What to check (dropdown) · Window (if time-based) · Board (if CRM-based) | — (boolean routing only)                                  | **[placeholder]** — this shares logic with the Segmentation feature elsewhere in the roadmap. Ask whoever owns Segmentation whether the condition model should literally be shared code, so the two don't drift apart.                                                                                                   |
| Wait / Delay — **Deferred to v2** | Duration or time-of-day · "re-check conditions on resume" toggle         | —                                                         | 🔄 Moved to v2 (2026-08-05). Note: this is the "post cron filter" pattern from the CEO's notes — several audited workflows rely on it, so deferring it leaves those workflow shapes on n8n until v2. |

### Actions

| Node                        | Config properties                                                                                                                                                                                                                                                                                                                                                                  | Exposes downstream                                                                                                                                      | Open items                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add / Remove label          | Label(s) (multi-select)                                                                                                                                                                                                                                                                                                                                                            | —                                                                                                                                                       | None — existing route                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Send message                | Message type (free text / template) · Content                                                                                                                                                                                                                                                                                                                                      | —                                                                                                                                                       | None — existing route                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Update session field        | Field (picker) · Value                                                                                                                                                                                                                                                                                                                                                             | —                                                                                                                                                       | **[placeholder]** — the API route for writing session fields doesn't exist yet and needs confirming with engineering.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Find CRM record             | Board · Match field · Match value · behavior if multiple matches found                                                                                                                                                                                                                                                                                                             | `record` (the matched record's fields)                                                                                                                  | **[placeholder]** — the default behavior on multiple matches (route to a separate branch vs. auto-pick most recently updated) is a recommendation, not signed off.                                                                                                                                                                                                                                                                                                                                                          |
| Create CRM record           | Board · Field values                                                                                                                                                                                                                                                                                                                                                               | **[placeholder]** — likely the created record's ID, but not yet confirmed whether this node returns anything usable downstream                          | None else structurally                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Update CRM Table            | CRM table (single-select) · Match field (single-select, scoped to the chosen table) · Match value (expression) · If multiple matches (dropdown: route to separate branch / most recently updated / most recently created) · Column to update (single-select, scoped to the chosen table) · Value (expression — the value to write, typically referencing a previous node's output) | **[placeholder]** — likely the updated record's ID, not yet confirmed                                                                                   | **Decided:** this node finds its own match, so it can be used standalone right after a trigger, without requiring a Find CRM record node upstream first. **[placeholder]** — the default "if multiple matches" behavior (route to a separate branch vs. auto-pick most recently updated vs. auto-pick most recently created) is a recommendation only, not yet signed off. Same open item as Find CRM record above — worth asking the CTO to rule on both at once, since they should almost certainly get the same default. |
| Call webhook (HTTP request) | Method · URL · Credential (picker, never raw token) · Headers/Body                                                                                                                                                                                                                                                                                                                 | **[placeholder]** — presumably the response status/body, but exact shape (and whether it's exposed for non-GET calls) needs confirming with engineering | Also **[placeholder]**: exact limits (allowed domains, response size cap, timeout length, pagination handling) are still TBD                                                                                                                                                                                                                                                                                                                                                                                                |
| Call CAPI                   | Platform (Meta/TikTok) · Event type · Value                                                                                                                                                                                                                                                                                                                                        | **[placeholder]** — likely just a success/failure flag, not confirmed                                                                                   | **[placeholder]** — the exact list of supported event types isn't enumerated yet                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Fire custom event           | Event name · Properties (key-value)                                                                                                                                                                                                                                                                                                                                                | —                                                                                                                                                       | **[placeholder]** — whether event names are freeform or must be chosen from a pre-defined list isn't decided                                                                                                                                                                                                                                                                                                                                                                                                                |
| Format / Set variable       | Operation (dropdown) · Input · Output name                                                                                                                                                                                                                                                                                                                                         | the formatted `output` value itself, under the name the user gives it                                                                                   | **[placeholder]** — the exact list of supported operations (trim, case, date format, number format, etc.) isn't finalized                                                                                                                                                                                                                                                                                                                                                                                                   |
| Lookup                      | Table (picker) · Key                                                                                                                                                                                                                                                                                                                                                               | the looked-up `value`                                                                                                                                   | **[placeholder]** — exact limits (max rows, whether a table is scoped to one automation or shared business-wide) aren't decided                                                                                                                                                                                                                                                                                                                                                                                             |

---

## Interactive prototype

[v0-cekat-automation-prototype.vercel.app](https://v0-cekat-automation-prototype.vercel.app/) — a clickable walkthrough of the builder: drag nodes onto a canvas, connect them, configure a node, run a test, and browse executions.

> **Please read before clicking around.**
> 
> - **This is a UI prototype, not the product.** Nothing is connected to a real backend, real client data, or an execution engine — every workflow, run, and number you see is fixed sample data, not live.
>     
> - **Interaction and scope, not final visual design.** It's here to validate _what a user can do and in what order_ — not to sign off on pixel-level styling, spacing, or copy. Colors follow the current brand palette but polish isn't the point of this review.
>     
> - **Only a subset is wired up.** The "Label New," "Voucher bayar di klinik," "Sync Data Book New," "Social Media Tracker," and "Ticket Automation" workflows are clickable end-to-end; everything else in the sidebar (Credentials, Data tables) is a placeholder. Not every v1 node type has a working config panel yet.
>     
> - **It will keep changing.** This link gets redeployed as feedback comes in — what you see today may differ from what a teammate sees next week. Treat it as a snapshot for this review, not a stable reference to link elsewhere.
>     
> - A "🔧 Prototype" banner and a watermark are visible throughout for exactly this reason — so nobody downstream mistakes a screenshot of it for the real product.
>     
> - Best viewed on desktop. If the link is broken or behaving oddly, ping Ben rather than assuming it reflects a real product bug.
>     

# CEO Notes

## App Development

```
Bisa create multiple automations
LOGS! LENGKAPP!
Trigger -> Filter -> Action 
Automation drag drop

—-------------------------------------------
Pure CDP / Contact property change / Message

Ways for the automation to run:
Bisa cron (e.g. daily jam 9)
Bisa on trigger
Bisa by chat delay


Filter
By segment
Contact property
If exist” an.. 
If conversation exist

Pre action:
AI analysis
Bisa cron
Bisa cron based on time juga (jam brp)..


Post cron filter:

Actions bisa:
Call CAPI functions
Label
update session auto..
ALL FUNCTIONS!
Open webhook
All cekat functions.
Automation bs panggil custom event
 
*** Buat manipulasi data”nya..




stop reply override replynya

Bisa juga nge sequence actionsnya

Active sequence apa aja?

Loggings
```

## Additional Notes

```
ini kan automations yang skrg kita itu bottleneck banget in terms of 2 things
1. set upnya ribet bgt (jadi gbs self serve, set up harus di kita, set up time jadi panjang)
2. bug nya banyak jadi coba u bikin nya in phases
```