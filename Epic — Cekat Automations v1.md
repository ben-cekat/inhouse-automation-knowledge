---
title: "Epic — Cekat Automations v1"
type: epic-draft
status: draft
created: 2026-08-03
author: Ben
based_on: "https://wiki.cekat.ai/doc/simplified-prd-in-house-automation-tool-XWQgVqWSNr"
purpose: "Drafted for pasting into Jira/Linear as an Epic. Child stories are proposed groupings only — engineering should adjust sequencing, splitting, and sizing as they see fit."
---

# Epic: Cekat Automations v1 — In-House Workflow Engine & Builder

## Epic summary

Build an in-house, domain-native workflow automation engine and drag-and-drop builder to replace Cekat's embedded, self-hosted n8n instance — starting with conversation/CRM automation (the current n8n use case), on a foundation designed to extend to marketing/segment automation in v2.

**Start:** 2026-08-03 · **Milestone 1:** ~2026-09-25 (8 weeks) · **Full v1 release:** ~2026-11-06 (14 weeks)

## Why (link to full context, kept short here)

Every Cekat client currently builds automations in n8n, self-hosted and embedded in an iframe. Three reasons this is the wrong long-term foundation: **licensing risk** (n8n's license doesn't cover letting paying customers build/edit workflows inside our product), **domain blindness** (n8n has no concept of a Cekat CRM board, label, or timezone — the direct cause of real production bugs found in client audits: wrong-board writes, a silently dropped voucher promotion, hardcoded plaintext API tokens, an unwired branch silently dropping customers), and **no support visibility** (IT/CS can't answer "did this run for this customer" without an n8n login and a manual timestamp hunt).

## Definition of done for this epic

- An automation can be created, configured, published, and triggered end-to-end through the UI, with a readable run log — matching or exceeding n8n's current capability for the workflow shapes already audited (conversation/CRM ops, cron batch sync, bidirectional ticket sync).
- At least one real client workflow ("Label New") is rebuilt on the new engine and run in shadow mode against the live n8n version with matching output.
- Error rate under 1%.

## In scope for v1

- Workflow list, create/edit/duplicate/delete, per-business scoping (not per-user, unlike n8n today)
- Drag-and-drop canvas builder (React Flow), node config drawer, inline validation
- Trigger → Filter → (optional Wait/AI step) → Action model
- Triggers: schedule (cron), message received, label added/removed, CRM record created/changed, conversation-inactivity
- Filters: contact-property comparison, existence check
- Flow control: Wait/Delay with re-check, Condition/Router (mandatory fallback branch)
- Actions (milestone 1): add/remove label, call webhook, format/manipulate data
- Actions (full release): Call CAPI, update session field, fire custom CDP event, AI analysis step
- Full execution logs, live view of running automations, **searchable execution history** (by workflow, status, date range, run ID)
- **Fault isolation** — a stuck or looping automation is auto-contained to itself; it cannot affect other automations, other businesses, or the platform (exact trip condition TBD — Ardin exploring in Sprint 0)
- Publish/draft/version history with restore-to-any-version; on/off toggle independent of publish state
- Node manifest architecture — new node types require no engine changes

## Explicitly out of scope for v1

- Segment/CDP-based triggers and filters (deferred to v2 — needs CEO sign-off on sequencing)
- First-class nodes for every Cekat function (reframed: reachable via generic webhook/HTTP action from day one; ~20 most-used get polished nodes)
- Stop/override an outgoing reply (deferred to v2 — architectural conflict with the fire-and-forget hot-path rule)
- RBAC (removed from delivery plan for now — flagged as an accepted gap, not forgotten)
- Workspace-level "Variables" tab (intentionally dormant — workspace settings + lookup tables cover the need)

## Key open decisions blocking or shaping scope

1. Segment/CDP triggers in v1 or v2 — needs explicit CEO call.
2. "Every Cekat function callable" — needs agreement that the generic-webhook reframing satisfies the original ask.
3. Stop/override outgoing reply — deferred, needs its own design later.
4. Circuit-breaker trip condition for fault isolation (fixed retry count vs. resource-exhaustion-based) — Ardin exploring, Sprint 0.
5. CRM "field changed" trigger mechanism — does a change-event hook already exist, or do we need a new outbox table? Single biggest technical unknown in the trigger set.

## Top risks

- Canvas builder + execution engine in 6–8 weeks with 2–3 new engineers is tight (mitigated: engine ships API-first, usable before canvas exists).
- CRM change-event source may not exist (Week-1 spike; P1 fallback if blocked).
- Execution-log volume repeats n8n's #1 documented failure (execution-table bloat) — mitigated by a retention design (90 days run summary, 30 days step records, 7–30 day payload retention in object storage).
- Node priorities in this epic are extrapolated from two audited clients — the Sprint 0 census may re-rank scope before Sprint 1 locks.

---

## Proposed child stories, by sprint

⚠️ **These are proposed groupings, not fixed tickets.** Sequencing, splitting, sizing, and sprint boundaries are for engineering to adjust as they see fit once work is underway — treat this as a starting checklist, not a locked plan.

### Sprint 0 — Foundations (Week 1, Aug 3–7)
- [ ] Spike: CRM change-event source (unblocks R2 — highest priority)
- [ ] Node manifest schema + JSON Schema validator
- [ ] Data model + migrations
- [ ] Graph validation rules spec
- [ ] Spike: React Flow prototype
- [ ] Run-context and expression-evaluator design doc
- [ ] **n8n workflow census across all clients** — highest-value task in Phase 0
- [ ] Manual audit of 2–3 workflows from other clients
- [ ] Spike: live-execution push channel (SSE + Redis pub/sub)
- **Proposed gate:** manifest schema frozen, migrations merged, CRM trigger source decided, census delivered and priorities re-ranked before Sprint 1 starts.

### Sprint 1 — Engine, part 1 (Weeks 2–3, Aug 10–21)
- [ ] Graph executor: node walk, port routing, context accumulation
- [ ] Expression evaluator + function library
- [ ] Dispatcher: trigger registry, scope pre-filtering, BullMQ enqueue
- [ ] Trigger adapters — message received, status changed, label added/removed, CRM record created, CRM field changed, schedule/cron
- [ ] Action adapters — add/remove label, set pipeline status, send message (must route through existing wrapped helpers)
- [ ] CRM nodes — find / create / update / find-or-create
- **Proposed demo:** an automation created via API, triggered by a real event, produces correct side effects — no UI yet.

### Sprint 2 — Engine, part 2 + Canvas kickoff (Weeks 4–5, Aug 24–Sep 4)
- [ ] Logic nodes — Filter, Condition, Router (mandatory fallback), Stop, Lookup table, Loop, Wait
- [ ] HTTP request node — allowlist, credential store, timeouts, size caps, SSRF guards
- [ ] Long-running run support — wall-clock limits, loop checkpointing, partial-failure semantics
- [ ] **Fault isolation — circuit breaker + per-automation containment**
- [ ] Run + step persistence, retention policy
- [ ] Retry, idempotency, concurrency limits
- [ ] REST API incl. `/automation-node-types`
- [ ] CDP attribution on all side effects
- [ ] Datadog instrumentation
- [ ] Dogfood: rebuild "Label New" as JSON automation, verify ≤15 nodes, shadow mode
- [ ] Existence filters
- [ ] Conversation-inactivity trigger + sweeper
- [ ] Wait re-check on resume
- [ ] Canvas shell — React Flow, palette, pan/zoom/minimap
- [ ] Manifest-driven config drawer skeleton
- **Proposed demo:** "Label New" running in shadow mode via API; canvas shell renders the same graph read-only.
- **Proposed exit (Phase 1 complete):** an automation can be created, published, and triggered end-to-end with a readable run log.

### Sprint 3 — Builder core (Weeks 6–7, Sep 7–18)
- [ ] `ref:*` pickers wired to live inbox/board/column/label/agent APIs
- [ ] Condition-row builder, type-scoped operators
- [ ] Expression input, context autocomplete, save-time path validation
- [ ] Inline validation badges, publish-blocking error list
- [ ] Test run — sample-event picker, dry-run execution, per-node input/output
- [ ] **Searchable execution history** — search by workflow, status, date range, run ID
- [ ] Workflows list page — trigger summary, last-run outcome, status, edited-by
- **Proposed demo:** build a simple automation end-to-end in the UI and test-run it against a real sample event.

### Sprint 4 — Builder finish → Milestone 1 (Week 8, Sep 21–25)
- [ ] Executions two-pane list + run detail, executed path highlighted on graph
- [ ] Live execution stream — SSE, new runs without refresh, node-by-node highlight
- [ ] Enable/disable toggle, draft/publish flow, version history panel, restore any version
- [ ] Version diff (cut candidate if tight)
- **Proposed Milestone 1 exit:** a Cekat solution engineer rebuilds "Social Media Tracker" entirely in the UI, publishes it, and runs it in shadow mode against the live n8n workflow.

### Sprint 5–6 — Hardening (Weeks 9–12, Sep 28–Oct 23)
- [ ] Audit log
- [ ] Credentials management UI
- [ ] AI step node
- [ ] Inbound webhook trigger
- [ ] Remaining P1 action adapters — assign agent, resolve, block AI, notifications, contact property
- [ ] n8n workflow analyser
- [ ] Shadow-mode diff tooling

### Sprint 7 — First migrations → Full release (Weeks 13–14, Oct 26–Nov 6)
- [ ] First 3 client migrations with CS
- [ ] Grafana dashboards — per-client run volume and error rate
- [ ] Datadog alerts — error rate, run/step table size
- [ ] Agree "automation didn't fire" ticket tag with CS
- [ ] Load test at projected event and batch volume
- **Proposed full release exit:** 3 clients fully migrated, zero regressions, error rate < 1%.

---

## Reference

- Simplified PRD: https://wiki.cekat.ai/doc/simplified-prd-in-house-automation-tool-XWQgVqWSNr
- Interactive prototype: https://cekat-cmbebm7ce-ben-cekat.vercel.app/
