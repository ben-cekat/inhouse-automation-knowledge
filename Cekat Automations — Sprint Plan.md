---
title: "Cekat Automations — Sprint Plan (2-Week Checkpoints)"
type: sprint-plan
status: draft
created: 2026-07-31
author: Ben
based_on: "[[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)]] — Section 12, Delivery plan"
also_see: "[[Areas/Automation/Cekat Automations — Decision Brief for CTO]]"
purpose: "Overlays 2-week checkpoints on the PRD's phase-gated delivery plan, for engineering tracking and CTO status updates. Does not change scope or phase gates — see the caveat below before treating any sprint as a firm commitment."
---

# Cekat Automations — Sprint Plan

## What this is, and isn't

The PRD's delivery plan (Section 12) is organized around **dependency gates**, not fixed calendar chunks — Phase 0 is one week because everything downstream is blocked on the client census and the node manifest schema; Phase 2 explicitly overlaps Phase 1 because canvas work can start once the node contract is frozen, before the engine is finished. Those gates are the real commitments.

This document lays 2-week checkpoints on top of that plan, for two purposes only: giving 2–3 new engineers ramping on an unfamiliar domain more frequent demo points (Risk R6), and giving the CTO a cleaner cadence to check in against than one long phase table. **It is a tracking overlay, not a re-scoping.** If a sprint's item list turns out to be wrong, the phase exit criteria in the PRD are still what's authoritative.

> ⚠️ **Sprint 0's census (P0-7) can still reshape Sprint 1 and Sprint 2.** The PRD already recommends holding ~20% of Phase 1 capacity unallocated against what the census turns up (Section 1.0, Risk R8). Treat Sprints 1–2 below as provisional until the census lands — don't let a 2-week box read as firmer than the evidence currently supports.

Team: 2–3 newly-joining engineers + design part-time. Start: **2026-08-03**. Milestone 1: **~2026-09-25** (8 weeks). Full release: **~2026-11-06** (14 weeks).

Status legend: ☐ not started · ◐ in progress · ✅ done — update inline as sprints close.

---

## Sprint 0 — Foundations
**Weeks 1 · Aug 3–7**

| | Item | Owner |
| --- | --- | --- |
| ☐ | P0-1 Spike: CRM change-event source *(unblocks R2 — highest priority)* | Backend |
| ☐ | P0-2 Node manifest schema + JSON Schema validator | Backend |
| ☐ | P0-3 Data model + migrations | Backend |
| ☐ | P0-4 Graph validation rules spec | Backend |
| ☐ | P0-5 Spike: React Flow prototype | Frontend |
| ☐ | P0-6 Run-context and expression-evaluator design doc | Backend |
| ☐ | **P0-7 n8n workflow census across all clients** — highest-value task in Phase 0 | Backend |
| ☐ | P0-7b Manual audit of 2–3 workflows from other clients | PM + Backend |
| ☐ | P0-8 Spike: live-execution push channel (SSE + Redis pub/sub) | Backend + Frontend |

**Gate (not a demo — a scope lock):** manifest schema frozen, migrations merged, CRM trigger source decided, census delivered and Section 5 priorities formally re-ranked against it. Sprint 1 does not start until this gate clears.

---

## Sprint 1 — Engine, part 1
**Weeks 2–3 · Aug 10–21**

| | Item |
| --- | --- |
| ☐ | P1-1 Graph executor: node walk, port routing, context accumulation |
| ☐ | P1-2 Expression evaluator + function library |
| ☐ | P1-3 Dispatcher: trigger registry, scope pre-filtering, BullMQ enqueue |
| ☐ | P1-4 Trigger adapters — message received, status changed, label added/removed, CRM record created, CRM field changed, schedule/cron |
| ☐ | P1-5 Action adapters — add/remove label, set pipeline status, send message *(must route through existing wrapped helpers — R3)* |
| ☐ | P1-6 CRM nodes — find / create / update / find-or-create |

**Demo:** an automation created via API, triggered by a real event, produces correct side effects (label/CRM writes) — no UI yet.
**Watch:** this sprint absorbs whatever the census changes about trigger priority. If P0-7 surfaces a new trigger shape, re-plan before starting rather than mid-sprint.

---

## Sprint 2 — Engine, part 2 + Canvas kickoff
**Weeks 4–5 · Aug 24–Sep 4**

| | Item |
| --- | --- |
| ☐ | P1-7 Logic nodes — Filter, Condition, Router (mandatory fallback), Stop, Lookup table, Loop, Wait |
| ☐ | P1-7b HTTP request node — allowlist, credential store, timeouts, size caps, SSRF guards |
| ☐ | P1-7c Long-running run support — wall-clock limits, loop checkpointing, partial-failure semantics |
| ☐ | P1-8 Run + step persistence, retention policy |
| ☐ | P1-9 Retry, idempotency, concurrency limits |
| ☐ | P1-10 REST API incl. `/automation-node-types` |
| ☐ | P1-11 CDP attribution on all side effects |
| ☐ | P1-13 Datadog instrumentation |
| ☐ | P1-12 **Dogfood:** rebuild "Label New" as JSON automation, verify ≤15 nodes, shadow mode |
| ☐ | P1-14 Existence filters |
| ☐ | P1-15 Conversation-inactivity trigger + sweeper |
| ☐ | P1-16 Wait re-check on resume |
| ☐ | P2-1 Canvas shell — React Flow, palette, pan/zoom/minimap *(Phase 2 starts here, overlapping)* |
| ☐ | P2-2 Manifest-driven config drawer skeleton |

**Demo:** "Label New" running in shadow mode via API; canvas shell renders the same graph read-only, using the manifest from Sprint 0.
**Exit (Phase 1 complete):** an automation can be created, published, and triggered end-to-end with a readable run log — shippable even without the rest of the UI.

---

## Sprint 3 — Builder core
**Weeks 6–7 · Sep 7–18**

| | Item |
| --- | --- |
| ☐ | P2-3 `ref:*` pickers wired to live inbox/board/column/label/agent APIs |
| ☐ | P2-4 Condition-row builder, type-scoped operators |
| ☐ | P2-5 Expression input, context autocomplete, save-time path validation |
| ☐ | P2-6 Inline validation badges, publish-blocking error list |
| ☐ | P2-7 Test run — sample-event picker, dry-run execution, per-node input/output |
| ☐ | P2-8 Workflows list page — trigger summary, last-run outcome, status, edited-by |

**Demo:** build a simple automation end-to-end in the UI (trigger → filter → action) and test-run it against a real sample event, with the Data/Action dry-run distinction visible.

---

## Sprint 4 — Builder finish → Milestone 1
**Week 8 · Sep 21–25**

| | Item |
| --- | --- |
| ☐ | P2-9 Executions two-pane list + run detail, executed path highlighted on graph |
| ☐ | P2-10 Live execution stream — SSE, new runs without refresh, node-by-node highlight *(depends on P0-8)* |
| ☐ | P2-11 Enable/disable toggle, draft/publish flow, version history panel, restore any version |
| ☐ | P2-12 Version diff *(cut candidate if tight — restore ships without it)* |

**Milestone 1 exit criteria (~2026-09-25):** a Cekat solution engineer rebuilds "Social Media Tracker" entirely in the UI, publishes it, and runs it in shadow mode against the live n8n workflow.

---

## Sprint 5 — Hardening, part 1
**Weeks 9–10 · Sep 28–Oct 9**

| | Item |
| --- | --- |
| ☐ | Audit log |
| ☐ | Credentials management UI |
| ☐ | AI step node |

---

## Sprint 6 — Hardening, part 2
**Weeks 11–12 · Oct 12–23**

| | Item |
| --- | --- |
| ☐ | Inbound webhook trigger |
| ☐ | Remaining P1 action adapters — assign agent, resolve, block AI, notifications, contact property |
| ☐ | n8n workflow analyser |
| ☐ | Shadow-mode diff tooling |

---

## Sprint 7 — First migrations → Full release
**Weeks 13–14 · Oct 26–Nov 6**

| | Item |
| --- | --- |
| ☐ | First 3 client migrations with CS |
| ☐ | Grafana dashboards — per-client run volume and error rate (CS-facing) |
| ☐ | Datadog alerts — error rate, run/step table size |
| ☐ | Agree "automation didn't fire" ticket tag with CS *(needs a pre-launch baseline)* |
| ☐ | Load test at projected event **and** batch volume |

**Full release exit criteria (~2026-11-06):** 3 clients fully migrated, zero regressions, error rate < 1%.

---

## Not scheduled — Phase 4 / v2

Segment entered/exited triggers · frequency capping & suppression · campaign/broadcast actions · holdout groups (MRKT RFC dependency) · CDP custom-event triggers · order triggers · multi-trigger automations · sub-automations · merge node · templates library.
