---
title: "Cekat Automations — Decision Brief"
type: brief
status: for-review
created: 2026-07-29
author: Ben
audience: CTO
reading_time: 8 min
detail: "[[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)]]"
---

# Cekat Automations — Decision Brief

**Ask:** approve building an in-house workflow engine to replace embedded n8n, staffed with the 2–3 incoming engineers, first milestone in 8 weeks. Seven decisions needed from you (below) — two of them time-critical, because they change what engineers start on Monday.

Full spec: [[Areas/Automation/PRD — Cekat Automations (In-House Workflow Engine)|PRD]]. This brief is self-contained.

---

## The situation

Every Cekat client builds their automation in n8n — self-hosted by us, embedded in an iframe in our dashboard, with a per-business account provisioned automatically. It works, and it costs us little in licence terms today. It is still the wrong foundation, for three reasons of very different character.

> **On the evidence in this brief.** The workflow-level detail below comes from **two clients** — Euromedicagroup, a heavy user with 46 workflows (four audited in depth), and PT AJ Central Asia Raya, a car insurer whose ticket-sync workflow we audited after it surfaced a new requirement. Five workflows total. They are almost certainly not typical: most clients will have far fewer workflows, and different ones. Treat the *specific* claims (which node types matter, how big migration is) as indicative and unconfirmed — a census across all clients is the first task in week 1. The *structural* arguments below — licensing, the fragility of self-hosting, and the class of bug a general-purpose tool permits — don't depend on the sample, and the second client gave the first real corroboration: the same silent-failure mechanism broke a workflow independently at both.

**1. The licensing position is unresolved, and the cost of resolving it is high.** n8n is source-available under the Sustainable Use License. It permits internal business use; it does not contemplate hosting n8n so that customers build workflows in it as part of a product they pay for. n8n's own line: if end users only *trigger* workflows we built → standard licence. If they *create and edit* workflows → **OEM agreement**. We are the second case.

The reason this matters commercially rather than abstractly: **the sanctioned path is expensive in two currencies.** OEM pricing is per-execution, pooled across all our end customers — and for a conversational product, executions ≈ conversations × messages. Every message-triggered automation becomes a metered event, including the ones a filter node discards a millisecond later. In the one account we've inspected that's 11 message-triggered inboxes. We would start paying, at scale, on the exact metric we most want to grow. And n8n states plainly that **white-labelling is not available** — their branding stays visible inside our product.

So the exposure is *latent*: it costs us little today, and a great deal on the day we regularise it. Building removes the question entirely. 🔵 A legal read is worth having, but it sets urgency rather than direction.

**2. Self-hosting a system we've had to bend is a standing operational risk.** To provision a business, we write directly into n8n's internal Postgres — users, projects, encrypted credentials. n8n doesn't guarantee that schema across versions, and 2.0 shipped documented breaking changes to security defaults, data handling, and configuration. Every upgrade is a potential outage of client provisioning, so in practice we're discouraged from upgrading at all. Alongside that: **no native multi-tenancy** (hard isolation means one instance per tenant), and one shared n8n user per business, so no edit is attributable to a person — for the client or for our CS. n8n's best-documented production failure, execution-table bloat, is ours to absorb too.

**3. The workflows are quietly broken.** We audited five live workflows across two unrelated clients. Every one had defects:

- A stray `x` in an expression silently killed the Hot Leads branch on one inbox.
- Two nodes write to the **wrong CRM board** — copy-paste of a UUID.
- TikTok leads never get a CRM record on conversation open; the branch is wired to nothing.
- A label match uses `equals` against data with a trailing space, with no fallback branch — the request is dropped, no voucher sent, no error logged.
- One of 28 identical timestamp writes is missing its timezone conversion. It lands 7 hours off.

None of this is client carelessness. It's what happens when a general-purpose tool meets a specific domain. n8n cannot know that `7df005f0…` is a CRM board, that a label has a canonical name, or that we run on Asia/Jakarta. **Our tool can.** That's the product argument, and it's stronger than the licensing one.

⚠️ These specific bugs are one client's. But the *mechanisms* that produced them — free-text IDs, optional fallback branches, per-node timezone handling, copy-paste as the only way to scale — are properties of n8n, not of this client. Every client is exposed to them. Confirming how widely they've bitten is part of the census.

A second client's workflow (PT AJ Central Asia Raya — a ticket-sync integration with their CMS) corroborated this the same week: the same silent-failure mechanism — a no-op node with no fallback — independently dropped an update there too.

> 🔴 **Separate from this decision, and urgent.** That same workflow has dozens of HTTP nodes with **live API bearer tokens hardcoded in plaintext** — Cekat's ticket API and the client's CMS both — instead of using n8n's credential store. Anyone who can view or export the workflow JSON can read working tokens. This needs rotating and moving into the credential store **now**, independent of whatever gets decided below. Flagging here so it doesn't wait on this review.

---

## What we'd build

A workflow engine and drag-drop builder that is deliberately **narrower** than n8n — no 500 connectors, no arbitrary code — but **deeper** on Cekat's own data. Clients keep the canvas they already know; we remove the classes of bug the canvas currently permits.

Three ideas do most of the work:

| | What it does |
| --- | --- |
| **Typed references, not free text** | Boards, inboxes, labels, columns are pickers backed by live IDs, validated on save and publish. The wrong-board and stray-`x` bugs become *unrepresentable*. |
| **One automation, many scopes** | A trigger subscribes to N inboxes at once. Today's 136-node, 8,600-line "Label New" workflow becomes **12 nodes**. |
| **Nothing fails silently** | Routers must have a fallback branch or they won't publish. Every run is logged, attributable to a node, and visible to CS. |

**Concretely:** one client's "Label New" is 136 nodes today — the same four-node chain copy-pasted 34 times across 6 inboxes. Rebuilt, it's one multi-inbox trigger, one CRM lookup, one router, six updates. Adding a seventh inbox becomes one entry in a table, not six pasted nodes. That comparison is the pitch, and it's worked through in Appendix B of the PRD. The gain scales with how much duplication a client has — dramatic for heavy users, modest for someone running three simple workflows.

**Crucially, we're not building 30 integrations.** Every action maps to a `/business_workflows/*` route we already run in production. This is an orchestration layer over APIs that exist, plus a canvas.

---

## Scope and sequencing

**Decided already:** one engine (conversation ops in v1, marketing/segment triggers in v2 on the same primitives); n8n coexists and clients migrate gradually; n8n-style canvas from day one, because a simpler step-list would feel like a downgrade to clients already fluent in n8n.

| Phase | Weeks | Outcome |
| --- | --- | --- |
| **0 — Foundations** | 1 | Data model, node contract frozen, two spikes, full workflow census |
| **1 — Engine, API-first** | 2–5 | Working engine, no UI. "Label New" rebuilt and running in shadow mode. **Shippable on its own.** |
| **2 — Builder** | 4–8 | Canvas, node config, test run, live execution view. **← Milestone 1** |
| **3 — Hardening** | 9–14 | Credentials, migration tooling, first 3 clients migrated. **← Full release** |
| **4 — v2** | post-release | Segment triggers, campaign actions, frequency capping |

The important structural choice: **Phase 1 delivers value without the canvas.** If the builder slips — the likeliest failure mode — we still have a working engine with real workflows on it.

---

## What I'm least sure about

**The canvas is a lot to ask of 2–3 new engineers in 8 weeks.** A node canvas *and* an execution engine is genuinely tight. Mitigations: use React Flow rather than building graph primitives, make the config panel render from the node manifest so new nodes need zero frontend work, and keep the engine independently shippable. I'd rather flag this now than discover it in week 6.

**The evidence base is two clients, and it has already moved my estimate twice.** I planned against four audited workflows at one client. Then I looked at that client's full account: 46 workflows, including a shape the audit entirely missed — cron-driven batch sync (schedule → HTTP → loop → CRM upsert → wait) rather than event-driven conversation ops. That pushed four node types from "nice to have" into Phase 1. Then a second, unrelated client's ticket-sync workflow surfaced a third shape entirely — bidirectional external-system sync over inbound and outbound webhooks — plus a live credential-exposure bug that had nothing to do with the build-vs-n8n question and needed flagging separately (see the alert above).

If two clients can move the plan that much, twice, a client base we haven't looked at can move it further — in either direction. Other clients may need node types we haven't imagined; equally, most may run three simple workflows and be trivial to migrate. **A census across all clients is the first task in week 1**, before Phase 1 scope is locked. Until then, treat the node-priority calls in the PRD as provisional. I'd hold ~20% of Phase 1 capacity unallocated against what it turns up.

**One hard technical dependency:** the "CRM field changed" trigger needs a change-event source on CRM writes that may not exist. It's load-bearing for migrating the voucher workflows. Week-1 spike; if the answer is no, we need an outbox table.

**Two places where this plan doesn't match the CEO's stated expectations.** I traced his automation notes line by line (Appendix C of the PRD). Most is already specified, and four missing capabilities are now added — a chat-inactivity trigger, existence filters, a post-delay re-check, and session updates. Two are genuine conflicts:

1. **"ALL FUNCTIONS! / All cekat functions."** v1 ships ~20 nodes, not all of them. My proposed reconciliation: *everything reachable on day one* — the HTTP node calls our own Open API, so any function with a route works before it has a first-class node — with the most-used 20 hand-built and the rest promoted on demand. That meets the intent without pretending we can spec 100 nodes in six weeks. Needs agreeing, not assuming.
2. **Segment and CDP triggers lead his trigger list but are v2 in my plan.** He may be right. My reasoning is that migrating clients off n8n is the urgent work and marketing automation is net-new; his is that the CDP investment is already built and idle, and automation is what makes it pay. Different Phase 1s. My mitigation is architectural — design the trigger registry so these are ordinary adapters, making the ordering a reversible scheduling call rather than a commitment. **But this one needs an actual ruling before Monday.**

**One trap worth naming:** label assignment already fires Meta CAPI and TikTok attribution side effects through `wrapAssignLabelToConvo`. If the new engine writes to tables directly instead of calling the same wrapped helpers, we silently break attribution for every migrated client. It's a hard requirement in the spec with a test attached.

---

## Decisions I need from you

| # | Decision | My recommendation |
| --- | --- | --- |
| 1 | **Do segment and CDP triggers ship in v1?** They lead the CEO's trigger list; my plan has them in v2. Changes Phase 1 scope materially. **Most time-critical — engineers start Monday.** | Hold v1 as scoped, but build the trigger registry so they're drop-in adapters. Revisit after the census. |
| 2 | **"All Cekat functions" — how do we honour that in v1?** | "Everything reachable via HTTP + our Open API; ~20 most-used get first-class nodes; promote on demand." Needs your agreement on the framing. |
| 3 | Do we guarantee **ordered execution per conversation**? The Hot-removes-Warm-removes-Cold logic is order-sensitive. | **Yes**, keyed by conversation. The correctness risk is client-visible. |
| 4 | **Automations vs. Chat Flows** — two rules engines now exist. Converge or keep the boundary? | Keep separate in v1, but state the boundary now so clients know where to build. |
| 5 | Where does the **CRM change event** come from? | Needs an owner and a week-1 answer. |
| 6 | Do we commit to an **n8n sunset date**, or keep it as the advanced tier indefinitely? | No public date yet. Revisit after the census. |
| 7 | **Inside the monolith, or a separate service?** | Start inside, behind a clean module boundary, with storage separated so extraction stays possible. |

---

## What success looks like

90 days after full release: 60% of n8n-using clients migrated, under 1% of runs failing with 100% of failures visible in-app, and a CS agent able to answer "did this automation run for this customer" in under 30 seconds without an n8n login.

**These need to be instrumented, not estimated.** The engine emits run and step records anyway, so the same data should feed our existing observability rather than a separate reporting path:

| Metric | Source |
| --- | --- |
| Run volume, error rate, p50/p95 duration, queue depth | **Datadog** — worker emits metrics per run and per step; alert on error-rate breach |
| Runs per business, per automation | **Datadog** dimensions on the same metrics, plus a **Grafana** board for the per-client view CS uses |
| Migration progress (clients on new engine vs. n8n) | Product DB query — published automations per business, cross-referenced with n8n execution volume per business |
| n8n execution volume trending to zero | n8n's own Postgres, same query as the P0-7 census — reuse the script |
| Time-to-first-published-automation | Product DB — business created → first publish timestamp |
| "Automation didn't fire" support tickets | ⚠️ Needs a ticket tag agreed with CS **before** launch, or there's no baseline to improve against |
| Run-log table size | **Datadog** DB metrics — on a dashboard from week one, given this is n8n's documented failure mode |

Two of these need action before we ship rather than after: the support-ticket tag (no baseline otherwise) and the run-log size dashboard.

⚠️ No node-count reduction target yet — quoting one heavy user's 136 → 12 as a baseline would be misleading. Set it after the census.

The launch narrative I'd want, per migrated client: *"we moved your workflow over and fixed the bugs you didn't know you had."* For the two clients we've audited, we already know what they are.
