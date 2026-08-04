---
title: "PRD — Cekat Automations: In-House Workflow Engine & Builder"
type: prd
status: draft-for-cto-review
tags: [cekat, automation, workflow-engine, n8n, crm, builder, platform]
created: 2026-07-29
review_by: 2026-07-31
handover_to_engineering: 2026-08-03
author: Ben
consumers: [engineering, design, product]
reading_time: "reference — use the reader map, not linear"
brief: "[[Areas/Automation/Cekat Automations — Decision Brief for CTO]]"
related:
  - "[[Areas/Automation/n8n — Features & Capabilities]]"
  - "[[Areas/Automation/n8n Workflows/Label New]]"
  - "[[Areas/Automation/n8n Workflows/Social Media Tracker]]"
  - "[[Areas/Automation/n8n Workflows/Voucher bayar di klinik]]"
  - "[[MRKT_Automation_RFC_v1]]"
  - "[[Resources/Marketing Documentation Library/Knowledge Base/cekat-marketing-module-architecture]]"
  - "[[Areas/Marketing/Marketing Dashboard/PRD — Segmentation (Builder & Segment Management)]]"
  - "[[Resources/2026-06-29 — App Development]] (Automation section)"
---
# PRD — Cekat Automations: In-House Workflow Engine & Builder

> **This is a reference spec, not a document to read end to end.** ~18,000 words. Use the map below.
>
> **Deciding whether to build this?** Read the **[[Areas/Automation/Cekat Automations — Decision Brief for CTO|Decision Brief]]** instead — 8 minutes, self-contained.

### Who reads what

| If you are… | Read | Skip |
| --- | --- | --- |
| **CTO / deciding** | The [[Areas/Automation/Cekat Automations — Decision Brief for CTO\|Decision Brief]]. If you want the evidence behind it: Section 1.2 (why not n8n), Section 11 (risks, the three requirement tensions, your decisions), Appendix B (the 136 → 12 node example). | Everything else |
| **Engineer — engine** | Sections 4 (core model), 7 (execution engine), 9 (API), 12 (delivery plan) | 1, 2, 3, 6, 10 |
| **Engineer — nodes & adapters** | Sections 4.3–4.4 (taxonomy + node contract), 5 (node catalog), 9 (API) | 6, 7, 10, 11 |
| **Engineer — builder / frontend** | Sections 4.3–4.4 (what a node manifest gives you), 6 (product surface) | 7, 10 |
| **Design** | Sections 3 (users), 6 (product surface, esp. 6.0 the guiding principle) | 4, 5, 7, 9, 10 |
| **Product / PM** | TL;DR, 1, 2, 10 (migration), 11 (risks + open decisions), **Appendix C (CEO requirements trace)** | 4, 7, 9 |
| **New joiner, day one** | TL;DR, Section 1.1 (what clients do today), Appendix B (worked example), then your role's row above | — |

**Confidence legend:** ✅ verified against source docs/code map · ⚠️ assumed, needs engineering confirmation · 🔵 proposed decision, needs CTO sign-off

---

## TL;DR

Cekat clients today build all their automation inside **n8n, embedded in an iframe in the Cekat dashboard**. Self-hosted, so it costs us little in licence terms today. It is still the wrong long-term foundation on three axes: **licensing** (the Sustainable Use License doesn't contemplate this use, and the sanctioned alternative is priced per execution — a latent, not current, exposure), **operational fragility** (we provision by writing into n8n's private Postgres schema, so every upgrade is a risk, and there's no native multi-tenancy), and **product quality** (n8n's generality forces clients into fragile, copy-pasted workflows — our audit of five live workflows across two unrelated clients found defects in every one, including a live credential-exposure bug — Section 11.1, R13 — that needs remediation on its own timeline).

This PRD specifies **Cekat Automations**: an in-house, domain-native workflow engine and drag-drop builder. It is deliberately *narrower* than n8n — no 500-connector library, no arbitrary code execution — but *deeper* on Cekat's own data. The bet is that most client automation need is **"when something happens in a conversation, on a schedule, or on a CRM record, check a condition, then do a Cekat thing,"** and a purpose-built tool for that is both cheaper to run and produces dramatically better workflows than a general-purpose one.

> ⚠️ **Read the evidence base before trusting the scoping.** Every workflow examined for this PRD — the four deep-dive audits at **Euromedicagroup**, the 46-workflow account, and one workflow at a **second, unrelated client** (Section 1.1b) — is still only two clients. This is a small sample, one of them a heavy user. The structural arguments (licensing, operational fragility, the bug classes a general-purpose tool permits) hold regardless, and the second client gave the first real corroboration of them. The **node catalog priorities in Section 5 and the migration sizing in Section 10 are provisional** until the census in P0-7 covers the whole client base. See Section 1.0.

Four design principles carry the whole product:

1. **Familiar by default.** Where we have no strong reason to differ from n8n, we match it — same canvas model, same Editor/Executions split, same vocabulary. Clients have months of muscle memory; every gratuitous divergence is a support ticket and a reason not to migrate. The learning curve is a product requirement, not a nice-to-have. (Section 6.0)
2. **Typed references, not free text.** Inboxes, boards, columns, and labels are pickers backed by real IDs — the class of bug that broke three of four audited workflows becomes unrepresentable.
3. **One automation, many scopes.** A single trigger subscribes to N inboxes or N boards. The 8,600-line, 136-node "Label New" workflow becomes roughly 12 nodes.
4. **Nothing fails silently.** Routers require a fallback branch; unmatched lookups branch explicitly; every run is logged and attributable to a node.

Stated must-haves are tracked against their specs in [Section 2.5](#25-v1-must-have-checklist).

**Scope decisions taken** ([Section 2.4](#24-decisions-already-taken)): one unified engine with conversation-ops in v1 and marketing/segment triggers in v2; n8n coexists and clients migrate gradually; drag-drop canvas from v1; first milestone in 6–8 weeks with 2–3 engineers.

**The main risk is scope-vs-team** ([Section 11.1](#111-top-risks)): a canvas builder *and* an execution engine in 6–8 weeks with 2–3 new engineers is tight. [Section 12](#12-delivery-plan) sequences the work so the engine ships first and is usable via API before the canvas is finished, so a canvas slip doesn't block everything.

---

## 1. Problem

### 1.0 What we actually know, and what we don't

| | |
| --- | --- |
| **Sample** | 5 workflows audited in depth + 1 full account browsed (46 workflows) |
| **Distinct clients in that sample** | **2** — Euromedicagroup (SKIN+ / SLIM+ / Eurohairlab, a multi-brand clinic group) and PT AJ Central Asia Raya (car.co.id, car insurance) |
| **How typical is it?** | ⚠️ Still unknown for the client base at large. But the two clients share almost nothing — different industry, different Cekat modules (CRM/labels vs. Ticketing), different integration shape (inbound-triggered CRM writes vs. bidirectional external-system sync) — and **both independently produced a silent-failure bug** (Section 1.2c) and Euromedicagroup alone runs 46 workflows. Two data points is not a census, but zero overlap between them is more informative than two workflows from the same client would be. |

**What generalises from this sample:**

- The licensing position (Section 1.2a) — a property of n8n's licence, not of any client.
- The **latent** cost exposure (Section 1.2a) — regularising the licence means OEM's per-execution pricing, which scales with message volume for every client. Not a cost today; a large one on the day we address it.
- The operational fragility of the self-hosted setup (Section 1.2b) — private-schema provisioning, upgrade risk, no multi-tenancy, one shared user per business.
- The **mechanisms** that produce the bugs in Section 1.2c — free-text IDs, optional fallback branches, per-node timezone handling, copy-paste as the only way to scale. These are n8n's design, and every client is exposed to them. ✅ **Partially corroborated**: an independent silent-failure bug now exists in a second, unrelated client's workflow (Section 1.1b) — same mechanism (a no-op branch swallowing a failure), different industry.
- The primitives that shrink workflows in Section 4.5 — they address duplication, which n8n's model forces on anyone with more than one inbox, board, or external endpoint.
- **Credentials belong in a credential store, not in node config.** Section 1.1b's finding (dozens of hardcoded live tokens) is now independent evidence for a requirement this PRD already specified (Section 8) — it just wasn't urgent until we saw it in production.

**What does NOT generalise, and is therefore provisional:**

- **Which node types matter most.** Section 5's P0/P1 calls are extrapolated from two clients. This has already broken twice — see the batch-sync discovery and the Ticketing discovery below.
- **Pattern distribution.** The ~2/3 CRM-upsert share in Section 1.1 is one client's mix; it says nothing about how common ticket/CMS-sync-shaped automations are.
- **Migration effort.** 46 workflows for one client is not a planning number. Some clients will have three.
- **Node-count reduction targets.** 136 → 12 is impressive because that client had extreme duplication. A client with three clean workflows gains far less.

**Consequence:** **P0-7 (census across all clients) runs in week 1** and its output re-ranks Section 5 before Phase 1 scope is locked. Hold ~20% of Phase 1 capacity unallocated until then (R8). Two unrelated clients have each independently forced a scope change before the census even started — treat that as the expected pattern, not the exception.

### 1.1 What clients do today

Cekat provisions each business an n8n account automatically (`GET /workflows` → creates an n8n user, personal project, and an encrypted `CekatOpenApi` credential directly in n8n's Postgres, then returns a session for the iframe). ✅ Clients build workflows on `workflows.cekat.ai` that call back into Cekat through ~24 authenticated `/business_workflows/*` routes — labels, pipeline status, agent assignment, conversation state, AI blocking, contacts, notifications. ✅

**At least one client is a very heavy user.** Euromedicagroup has **46 workflows** in their project. ✅ (observed 2026-07-29) ⚠️ We do not know whether any other client is close to this — see Section 1.0. The list also shows hygiene problems the tool itself causes: workflows named `My workflow 6891`, `My workflow 6803`, `My workflow 6838`, `temporary`; Published and never-published drafts side by side with nothing distinguishing purpose. Nobody can tell what is load-bearing and what is abandoned — which is itself a reason the census (P0-7) may find real migration scope is much smaller than 46.

Within **this client's** four audited workflows, most logic reduces to three patterns (⚠️ shares are estimates from the audit notes, not a node census, and are one client's mix — not a client-base distribution):

| Pattern | Rough share of this client's audited nodes | Example |
| --- | --- | --- |
| **Conversation event → condition → find CRM record → create/update a row** | ~2/3 — 62 instances of the identical `Search → Split Out → Limit → Update` chain across two files alone | "Input Campaign": promo reply → write campaign source to contact's CRM row |
| **Conversation event → condition → label / conversation state change** | ~1/4 | "Label New": label added → remove cooler labels, stamp CRM column |
| Everything else (HTTP to Google Sheets, send WA message) | ~1/10, concentrated in one workflow | "Voucher bayar di klinik": fetch voucher code from Apps Script |

The thesis this supports is directional rather than precise: we do not need n8n's 500 connectors, we need Cekat-native triggers and CRM operations to be excellent. How the P0/P1 line falls within that is what the census settles.

**A second workflow shape the deep-dive audit missed — inside the same client's account.** ✅ `Sync Data Book New` (their most recently edited workflow) has a fundamentally different structure: **Schedule Trigger → HTTP Request → Loop Over Items → Split Out → Filter → Search/Create/Update item → Wait**, across ~10 parallel lanes. This is **cron-driven batch synchronisation**, not event-driven conversation ops — pulling an external source on a timer and reconciling it into CRM boards. Sibling names (`Data Book`, `Calendar Sosmed SKIN SLIM`, `Calendar SLIM+`, `Book Appointment`, `Create data user on tracker (new)`, `Automation Broadcast`) suggest it recurs for them.

**Consequence for this PRD:** Schedule, HTTP Request, Loop and Wait move from P1 to P0. Section 5 reflects that.

**The more important lesson is methodological.** Four workflows from one client missed a whole workflow *shape* belonging to that same client. A census of one account corrected it — and that was still one client. Then we looked at one workflow from a *second* client and found a third, unrelated shape — see below. It is reasonable to expect the full census (P0-7) to surface still more — which is exactly why Section 5 is provisional and why R8 reserves Phase 1 capacity.

### 1.1b A second client, a third workflow shape — and a live security exposure

✅ **"Ticket Automation"** belongs to **PT AJ Central Asia Raya** (car.co.id, a car insurance company) — an entirely different client from the clinic group above, with no shared mechanism, board, or inbox. It keeps a support ticket **bidirectionally synced** between Cekat's own ticketing system and the insurer's external policy-management CMS, keyed by policy number, across three webhook entry points: **Create Ticket** (new Cekat ticket → look up the policyholder in the insurer's CMS → post a linked record → write the CMS record ID back onto the Cekat ticket), **Update Ticket** (push field changes into the linked CMS record, or run the link-creation logic if one doesn't exist yet), and **Update Ticket from CMS** — the reverse direction, where the insurer's own system pushes a change back into Cekat.

**This is the third distinct workflow shape found across two clients**, after conversation/CRM ops and cron-driven batch sync: **event-triggered, bidirectional sync with an external, client-owned system**, round-tripping an ID to keep two records linked. Directly answers this PRD's brief: *"it should be able to call a client's webhook."* Mechanically, the outbound half is already covered — the HTTP request node (Section 5.4, P0) makes arbitrary outbound calls with credential-store auth. What's new is that this shape is now confirmed to exist in production, recurs as a named pattern (create-and-link, update-and-link), and needs a first-class Ticketing domain and an inbound direction. Reflected in Section 5 and as primitive (4) in Section 4.5.

**It also surfaced the most severe individual defect in this evidence base — a live security exposure, not a logic bug.** Across dozens of HTTP Request nodes in this workflow, **live bearer tokens for both Cekat's own ticket API and the insurer's CMS are pasted in plaintext into node config**, rather than stored in n8n's credential store (only one node out of dozens does this correctly). Anyone who can view or export this workflow's JSON — which is exactly what n8n's own "download workflow" feature does — can read working production credentials for two systems. This is unrelated to the build-vs-n8n decision and needs remediation on its own timeline; see Section 11.1 (R13) and the Decision Brief.

The same workflow also reproduces the silent-failure mechanism independently of the clinic client: on the Update Ticket path, a failed policy lookup for a not-yet-linked ticket routes to a "No Operation, do nothing" node — the update disappears with no CMS record created and nothing surfaced anywhere. Same class of bug as the Voucher and Social Media Tracker findings (Section 1.2c), different client, different industry — the strongest evidence yet that the mechanism, not the client, is the cause. It also has ~12 orphaned test nodes wired to nothing (several also carrying hardcoded tokens), mixed dev/staging/production domains live-wired into one active workflow, and inconsistent webhook path naming (`car-insurance/...` vs `car_insurance/...`).

### 1.2 Why n8n is the wrong foundation

**Current deployment (important context for what follows).** ✅ n8n is **self-hosted by Cekat**, not on n8n Cloud. That materially changes the economics: self-hosted Community Edition has **unlimited executions and no per-execution fee**, so there is no meter running on message volume today. An earlier draft of this PRD argued from n8n Cloud's per-execution pricing; that was wrong and has been corrected below.

**(a) Licensing.** ⚠️ *Needs a legal read; it sets urgency, not direction.* n8n is source-available under the **Sustainable Use License**, which permits internal business use but does not contemplate hosting n8n so that customers build workflows in it as part of a product they pay for. n8n's guidance draws the line explicitly: if end users only *trigger and consume* workflows we built → backend model, standard licence; if they *create and edit* workflows → **OEM agreement required**. Cekat is in the second case.

The commercial substance is in what regularising costs: **OEM pricing is per-execution, pooled across all end customers.** For a conversational product, executions ≈ conversations × messages (n8n's own chatbot guidance says as much). Every message-triggered automation becomes a metered event, including those a Filter node discards immediately — in the one account inspected, 11 message-triggered inboxes. Cekat would begin paying at scale on the metric it most wants to grow. n8n also states plainly that **white-labelling is not available — their branding stays visible in the editor**.

**(b) Operational fragility of the self-hosted setup.** ✅ Provisioning writes rows **directly into n8n's internal Postgres schema** (users, projects, encrypted credentials). n8n does not guarantee that schema across versions, and 2.0 shipped documented breaking changes to security defaults, data handling, and configuration. Every upgrade is therefore a potential outage of client provisioning — which in practice creates pressure *not* to upgrade, accumulating security and support debt.

Compounding it:

- **No native multi-tenancy.** Hard tenant isolation means one instance per tenant. Projects are Enterprise-gated.
- **One n8n user per business.** All of a client's workflows sit in that single account's "Personal" project, so no edit is attributable to a person — for the client or for Cekat CS.
- **Execution-table bloat**, n8n's best-documented production failure (~500 MB/month at 1,000 executions/day; instances reaching 40+ GB), is ours to absorb and monitor.
- **Self-hosted CE also lacks** SSO, git version control, environments, and multi-main HA — all gated behind paid tiers.

⚠️ Note the asymmetry: self-hosting is what makes the current arrangement cheap, *and* what makes it fragile — the same fact.

**(c) Workflow quality — the strongest product argument.** ✅ We audited five live workflows across **two unrelated clients**. Every one had defects that a domain-native tool would have prevented at design time. ⚠️ The *specific* defects are still only these two clients'; the **mechanism column** is what generalises, because those are properties of n8n's design that every client is exposed to — and the same mechanism (silent failure via a no-op branch) independently producing a bug at both clients is the first real corroboration of that claim, not just an assumption:

| Defect found | Workflow | Root cause a Cekat-native tool removes |
| --- | --- | --- |
| Stray `x` in an expression (`{{ ...label.data.name }}x`) silently killed the Hot Leads branch on one inbox | Label New | Free-text expression where a **label picker** belongs |
| Two nodes wrote to the *wrong CRM board* (`a7bb6e54…` instead of `7df005f0…`) | Label New | Board IDs typed as **free-text strings** instead of validated references |
| TikTok sections never create the CRM record on conversation open — the "open" output is wired to nothing; record creation hangs off "pending" instead | Social Media Tracker | No **publish-time validation** for unconnected branches |
| One of 28 identical timestamp writes missing `.setZone('Asia/Jakarta')` — lands ~7 hours off | Social Media Tracker | Timezone is **per-node copy-paste** rather than a workspace setting |
| Label match uses `equals` on data containing a trailing space (`"SLIM+ PromKil W1 "`), with **no fallback branch** → request silently dropped, no voucher, no error | Voucher bayar di klinik | Routers **permit** having no fallback; no run-failure surfacing |
| Three orphaned webhook nodes receiving live traffic and doing nothing | Social Media Tracker | No **dead-node detection** on publish |
| Same 4-node chain (`Search → Split Out → Limit → Update`) repeated **34×** in one file and **28×** in another; 8,600 lines that are duplication, not logic | Label New, Social Media Tracker | No **multi-scope triggers**; no reusable **find-or-create** primitive |
| Failed policy lookup during an update hits a "No Operation, do nothing" node — the update silently disappears, no record created, no error surfaced | Ticket Automation | Same mechanism as the Voucher drop, at a **second, unrelated client** — the first real corroboration that "no fallback branch" is a systemic n8n gap, not one client's mistake |
| Dozens of HTTP nodes paste **live API bearer tokens in plaintext** into header parameters instead of using the credential store — anyone who can view or export the workflow JSON can read working tokens for both Cekat's ticket API and the client's CMS | Ticket Automation | 🔴 **Not a correctness bug — a live security exposure.** Distinct severity class from the rows above. `type: "ref:credential"` (Section 4.4) makes free-text secrets in a node config unrepresentable. **Flagged as Risk R13 (Section 11.1) for remediation on its own timeline, independent of this decision.** |

⚠️ **On severity.** The token-leak row is not evidence for *or against* building Cekat Automations — n8n's credential store would have prevented it too, had this workflow used it. It belongs here because it's part of the same evidence base and because a domain-native tool with typed, mandatory credential references removes the class of mistake by construction. It needs fixing **now**, regardless of what the CTO decides about this PRD.

Read together: these are not careless-client bugs, they are the predictable output of a *general-purpose* tool applied to a *specific* domain. n8n cannot know that `7df005f0…` is a board, that a label has a canonical name, or that Cekat's timestamps are Asia/Jakarta. Our tool can, and that is the differentiator we are actually shipping.

⚠️ **Worth confirming, not assuming:** that this defect rate is representative. Nine defects across five workflows at two clients is striking, but Euromedicagroup is an unusually heavy user with unusually duplicated workflows — duplication is itself a defect multiplier — and the second client's single audited workflow, while unrelated in mechanism and domain, is still one data point. The census should sample a few workflows from two or three *more* clients to test whether the pattern holds at a third and fourth; two-for-two on independent clients is suggestive, not yet proof, and if it holds it is the single most persuasive argument in this document and worth quantifying properly.

### 1.3 What breaks for the business

- **Support load.** Silent drops produce "the automation didn't run" tickets with no log to point at. There is no execution history a Cekat CS agent can read without an n8n login.
- **No per-user attribution.** ✅ Provisioning creates **one n8n user per business**, and all that business's workflows live in that single account's "Personal" project. Every admin and agent at the client shares one identity, so "who changed this workflow and broke it" is unanswerable — for the client and for Cekat CS. This is a direct consequence of n8n's project model and cannot be fixed without Enterprise projects plus SSO.
- **No workflow hygiene.** In the one account we've seen, 46 workflows with no folders in use, no ownership, no last-run-at in the list, and no way to tell live from abandoned. ⚠️ How widespread this is depends on how many clients reach that scale.
- **Onboarding friction.** New clients face a general-purpose node canvas with 500 connectors, 99% irrelevant. Time-to-first-working-automation is measured in days of solution-engineering time.
- **No attribution.** Automation side effects don't identify themselves. The founder's spec is explicit: *"semua custom event OR CAPI itu harus ada logs ini yang manggil siapa dan dari mana… berarti setiap automation juga harus ada node labelling."* We cannot answer "which automation caused this event" today. ✅
- **Blocked roadmap.** The MRKT Automation RFC's segment-triggered marketing loop needs a rules engine that reads Cekat's own segment and CDP state. Building that inside n8n means the engine lives outside our data plane.

---

## 2. Goals, non-goals, and decisions

### 2.1 Goals

| # | Goal | Success measure |
| --- | --- | --- |
| G1 | Cover the automation needs of the audited workflows without n8n | 100% of audited *live* logic expressible in the v1 node catalog (Section 5), verified by rebuilding "Label New" and "Social Media Tracker". ⚠️ Necessary but not sufficient — these are one client's; the census sets the real coverage bar. |
| G1b | Cover the client base, not just the sample | ⚠️ Target set after P0-7: 🔵 propose *"the v1 catalog expresses ≥ 80% of live workflows across all clients"* once we can count them |
| G2 | Make the common case dramatically smaller **where duplication exists** | "Label New" rebuilt in **≤ 15 nodes** (from 136); "Social Media Tracker" in **≤ 20**. ⚠️ Gains scale with a client's duplication; a client with three clean workflows should expect parity, not reduction. |
| G3 | Eliminate silent failure | Every run has a terminal status; zero paths where a non-match produces neither an action nor a logged skip |
| G4 | Make automation legible to non-engineers | A Cekat CS agent can answer "did automation X run for conversation Y, and what did it do" from the dashboard in < 30s, without an n8n login |
| G5 | Full attribution into CDP | 100% of automation-caused side effects carry `automation_id` + `node_id` into the events table |
| G6 | Remove the licensing exposure and the self-hosted-n8n operational surface for migrated clients | n8n execution volume for migrated clients → 0; no n8n provisioning path required for new clients |

### 2.2 Non-goals for v1

- **Not** an n8n replacement in breadth. No 500-connector library, no community nodes, no marketplace.
- **Not** an arbitrary code-execution environment. No JS/Python Code node in v1 ([Section 6.7](#67-expressions) explains the sandbox reasoning).
- **Not** an AI agent framework. Agent orchestration stays in the existing AI/flows product; Automations may *call* an AI step (Section 5.4) but does not host agents, memory, or RAG.
- **Not** a data pipeline or ETL tool. No large binary/media processing inside a workflow.
- **Not** a replacement for Chat "Flows". ⚠️ Flows (`helpers/flows_actions.js`) handle in-conversation branching dialogue; Automations handle out-of-band reactions to events. [Section 11.2](#112-open-decisions-for-the-cto) flags whether these converge later.

### 2.3 Success metrics

| Metric | Baseline | Target 90 days after full release | Source |
| --- | --- | --- | --- |
| Clients with ≥1 published Cekat Automation | 0 | ≥ 60% of clients currently using n8n | Product DB — published automations per `business_id` |
| Median nodes per automation | ⚠️ **No baseline.** 90–136 in one client's audited files is not a median of anything. Set after P0-7. | 🔵 deferred to census | Product DB — node count per published version |
| Automation runs with `failed` status | Not measured today | < 1%, 100% surfaced in-app | **Datadog** — run-status metric, alerted |
| p95 run duration | n/a | 🔵 set separately for event runs vs. batch runs — one threshold across both is meaningless (Section 5.3) | **Datadog** |
| Median time-to-first-published-automation | ⚠️ days (needs a read from CS) | < 1 hour, self-serve | Product DB — business created → first publish |
| Support tickets tagged "automation didn't fire" | ⚠️ **no tag exists yet** | −70% | Ticketing — ⚠️ **tag must be agreed with CS before launch or there is no baseline** |
| n8n executions/month across migrated clients | current volume | 0 | n8n Postgres — reuse the P0-7 census script |
| Run/step table size | n/a | 🔵 threshold TBD; alert before it becomes an incident | **Datadog** DB metrics — dashboard from week one (Section 7.5) |

**Instrumentation is part of the build, not a follow-up.** The worker already produces run and step records; it should emit the same state transitions as Datadog metrics tagged by `business_id`, `automation_id`, and terminal status, with a Grafana board for the per-client view CS needs. Two items need action *before* launch rather than after: the support-ticket tag (no baseline otherwise) and the run-log size dashboard — table bloat is n8n's best-documented failure mode (Section 7.5) and we should not discover ours in an incident.

### 2.4 Decisions already taken

These were settled before drafting and are not open for the CTO review — they are recorded here so the reasoning is visible.

| Decision | Choice | Rationale |
| --- | --- | --- |
| **One engine or two?** | 🔵 **One unified engine.** v1 ships conversation/CRM triggers and actions. Marketing/segment triggers and campaign-send actions ship in v2 **on the same primitives**. | The MRKT RFC's `trigger → condition → action → outcome` loop is structurally identical to conversation ops. Building two engines guarantees divergence. |
| **What happens to n8n?** | 🔵 **Coexist, migrate gradually.** n8n stays available for existing and edge-case workflows; new automations default to Cekat Automations; migration is a per-client project. | Avoids a hard capability bar before launch. Keeps the escape hatch for the ~10% (Google Sheets, arbitrary HTTP) while we build toward it. |
| **Builder UX** | 🔵 **Drag-drop node canvas from v1**, n8n-like. | Clients are already fluent in the n8n canvas; a linear step-list would be a visible downgrade and would make migration feel like a loss. Cost is acknowledged in [Section 11.1](#111-top-risks) and mitigated by shipping the engine API-first. |
| **Team & timeline** | 2–3 newly-joining engineers; **first milestone 6–8 weeks** from 2026-08-03. | Drives the phasing in [Section 12](#12-delivery-plan) toward well-bounded, learnable work early. |

### 2.5 v1 must-have checklist

Stated requirements, and where each is specified. Everything here is in scope for the first release — this is the list to check the build against.

| # | Must-have | Specified in |
| --- | --- | --- |
| M1 | Lives under an **Automation** menu in the Cekat dashboard | Section 6.1 |
| M2 | Admins/agents see a **list of workflows** for their business | Section 6.1, 6.2 |
| M3 | Admins/agents see a **list of executions** | Section 6.1, 6.9 |
| M4 | **Create** a new workflow | Section 6.2 |
| M5 | **Edit** an existing workflow | Section 6.4 |
| M6 | Each workflow has its own **canvas/editor view** | Section 6.3, 6.4 |
| M7 | Each workflow has its own **execution logs** | Section 6.3, 6.9 |
| M8 | Each node **opens and can be configured**, n8n-style | Section 6.5 |
| M9 | **Executions are live** — a row appears the moment a trigger fires | Section 6.9 |
| M10 | Each workflow can be **turned on or off** | Section 6.8 |
| M11 | **Versioning with restore to any version** | Section 6.8 |
| M12 | Workflows are scoped **per client / business_id** | Section 6.1, Section 8 |
| M13 | Overall experience **similar to n8n**, flat learning curve for non-technical users | Section 6.0 — the governing principle for the whole surface |
| M14 | A runaway or looping automation is **contained to itself** — it cannot pause, slow down, or affect any other automation, any other business, or the platform overall | Section 7.3 |

---

## 3. Users and jobs

| Persona | Job to be done | What v1 gives them |
| --- | --- | --- |
| **Client admin / ops lead** (primary) | "When a customer says X, tag the conversation and update their CRM row" — without an engineer | Canvas builder with Cekat-native pickers, test-run, publish |
| **Client marketing manager** (v2 primary) | "When someone enters segment Y, message them once, don't re-message for 3 days" | v2: segment triggers, frequency capping, campaign actions |
| **Cekat CS / solution engineer** | Diagnose "the automation didn't run" | Run history with per-node input/output, filterable by conversation/contact |
| **Cekat PM / analyst** | Attribute outcomes to automations | `automation_id` + `node_id` on every emitted CDP event |
| **Cekat engineer** | Add a new action without touching the engine | Declarative node contract ([Section 4.4](#44-the-node-contract)); new node = one manifest + one handler |

---

## 4. Core model

### 4.1 Anatomy of a workflow

Four layers. Confusing them is how workflow tools end up with muddled permissions and unclear versioning boundaries.

**Layer 1 — Container (mutable, business-scoped)**

| Component | Definition |
| --- | --- |
| **Automation** | Named container. Owns identity, `enabled` state, tags, `created_by` / `last_edited_by`, and the version history. **This is the unit of permission and of on/off.** |

**Layer 2 — Definition (immutable once published)**

| Component | Definition |
| --- | --- |
| **Version** | Immutable snapshot of a graph. One may be `published`; one mutable `draft` may exist alongside. **The unit of restore and diff** (Section 6.8). |
| **Graph** | `{ nodes[], edges[] }` — the workflow's structure. |
| **Node** | One typed step: `id`, `type`, user-given `name`, canvas `position`, and `config`. Exactly one **trigger** node per automation in v1. |
| **Port** | A node's connection points. One input (triggers have none); **named** outputs (`found` / `not_found` / `multiple_matches`). Named outputs are what make branching legible and what publish-validation checks. |
| **Edge** | `source_node.output_port → target_node.input`. |
| **Config field** | A typed key on a node — `ref:*`, `expression`, `enum`, `conditions`, scalar. Its type determines the UI control and the validation rule (Section 4.3). |
| **Expression** | A binding from a config field into the run context (`{{ trigger.contact.phone }}`). Resolved at execution; **validated at save time**. |

**Layer 3 — Shared resources (referenced by nodes, live outside the graph)**

Deliberately *not* in the version snapshot: they're shared across workflows and change on a different cadence. ⚠️ Consequence engineering must handle — restoring an old version does **not** restore the lookup table or credential it referenced. The restore UI must say so.

| Component | Definition |
| --- | --- |
| **Lookup table** | Business- or automation-scoped key→value map (Section 5.5). Edited as a table, not a graph. |
| **Credential** | Encrypted secret for the HTTP node. Referenced by ID; never rendered to the frontend or written to run logs. |
| **Workspace settings** | Business-level defaults — timezone, date format. Removes per-node copy-paste (Section 4.5). |
| **Reference data** | Live Cekat objects a `ref:*` field points at: inboxes, boards, columns, labels, agents, pipeline statuses. Owned by their domains; Automations only references them. |

**Layer 4 — Runtime (append-only)**

| Component | Definition |
| --- | --- |
| **Run** | One execution of one version, caused by one trigger event. **The unit of observability** and of rate limiting. Records which version executed. |
| **Step** | One node's execution within a run: input, output, status, duration, error. ⚠️ Loop iterations aggregate into one step record, not N (Section 5.3). |
| **Run context** | The accumulating object nodes read from and write into — what expressions resolve against (Section 4.2). |

### 4.2 Execution semantics

🔵 **Single-item, not n8n's item-array model.** n8n passes an array of items between nodes, and most nodes run once per item. It is powerful, and also the source of the `Search → Split Out → Limit` chain that appears 62 times across two audited files. We take a simpler contract:

- A run carries **one context object**. Nodes read from it and write namespaced outputs into it (`{{ trigger.conversation.id }}`, `{{ find_contact.record.id }}`).
- Nodes that inherently produce many results (e.g. **Find CRM records**) declare a **match strategy** and either resolve to one record or route to a `multiple_matches` port. No manual unwrapping.
- Explicit fan-out uses a **Loop** node with a bounded iteration cap (Section 5.3).

This is a deliberate expressiveness trade: it removes the single largest source of accidental complexity we observed, and the Loop node covers the genuine fan-out cases.

**Determinism and ordering.** Runs are independent and may execute concurrently. ⚠️ Per-conversation ordering is **not** guaranteed in v1; if two labels are added to one conversation 50ms apart, their runs may interleave. [Section 11.2](#112-open-decisions-for-the-cto) raises whether we need per-conversation serialization — the audited "mutual exclusivity" logic (Hot removes Warm removes Cold) is order-sensitive and is a real case for it.

### 4.3 Node taxonomy — two axes

Nodes are classified on **two independent axes**. Keeping them separate matters: one drives engine behaviour, the other drives how users find things. Conflating them is why the earlier draft of this PRD had "Find CRM record" filed under both *Data* and *Actions*.

#### Axis 1 — Category (functional, 4 values, engine-relevant)

This is the **canonical** classification. It determines port shape, dry-run behaviour, retry policy, and validation rules.

| Category | Side effects? | Ports | Dry-run behaviour | Retry | Examples |
| --- | --- | --- | --- | --- | --- |
| **Trigger** | — | **No input**; one output. Exactly one per workflow (v1). | Supplies sample data | n/a | Label added · Message received · Schedule · Webhook · Manual |
| **Logic** | No | One input; **≥1 named outputs**, some `required` | Executes for real | n/a — pure | Filter · Condition · Router · Loop · Wait · Stop |
| **Data** | No | One input; one or more outputs | **Executes for real** — safe, and gives a truthful test | Free, no idempotency needed | Find CRM record · Get contact · Set variable / Format · Lookup · AI step |
| **Action** | **Yes** | One input; one output + optional `error` port | **Simulated** — shows "would have run" (Section 6.6) | Needs idempotency care (Section 7.4) | Add label · Update CRM record · Send message · Fire CAPI · HTTP write |

The Data/Action split is the load-bearing one. It is what lets a client hit **Test** on a real conversation and see genuine lookup results without messaging a customer or writing to their CRM — the single most-requested capability missing from the current setup.

Two edge cases worth spelling out:

- **HTTP request** is `action` by default, but derives `sideEffects` from method: `GET`/`HEAD` → `false`, so read-only calls execute for real in dry-run and retry freely. Anything else is simulated.
- **AI step** is `data` — it mutates no state — but carries `deterministic: false`, so it is never assumed cacheable and re-runs are expected to differ. It also costs money per call, so 🔵 dry-run should execute it but count it against quota visibly.

#### Axis 2 — Domain (browsing, open-ended)

How the palette groups nodes and how search is scoped. Purely presentational — it never affects execution, and new domains can be added without engine changes.

| Domain | Nodes |
| --- | --- |
| **Conversation** | message/label/status/pipeline triggers · add-remove label · assign agent · set status · resolve · block AI · send message · private note |
| **CRM** | record created / field changed triggers · find · create · update · find-or-create · update contact property |
| **Marketing** | fire custom event · send CAPI · *(v2: segment triggers, campaign send, suppression)* |
| **Ticketing** | ticket created / updated triggers · create ticket · update ticket · call-and-link external sync |
| **Flow** | filter · condition · router · loop · wait · stop |
| **Utility** | schedule · webhook · manual trigger · HTTP request · AI step · set variable / format · lookup |

**Every node declares both.** `Add label` is `category: action, domain: conversation`. `Find CRM record` is `category: data, domain: crm`. `Router` is `category: logic, domain: flow`.

Section 5 lists triggers and flow control first (where you start building), then data and action nodes grouped by domain; every heading states its category. The palette in Section 6.4 groups by **domain**, with category shown as a badge on the node — so users absorb the Data/Action distinction incidentally, which is what makes dry-run comprehensible the first time they use it.

### 4.4 The node contract

Every node type is declared by a manifest so the builder UI, validator, and engine all read from one source. Adding a node should require **no engine changes**.

```jsonc
{
  "type": "crm.find_record",
  "category": "data",          // Axis 1 — engine behaviour (Section 4.3)
  "domain": "crm",             // Axis 2 — palette grouping
  "label": "Find CRM record",
  "inputs": [{ "port": "in" }],
  "outputs": [
    { "port": "found",            "label": "Found" },
    { "port": "not_found",        "label": "Not found",        "required": true },
    { "port": "multiple_matches", "label": "Multiple matches", "required": true }
  ],
  "config": [
    { "key": "board_id",  "type": "ref:crm_board", "required": true },
    { "key": "match_on",  "type": "ref:crm_column", "scopedBy": "board_id", "required": true },
    { "key": "value",     "type": "expression", "required": true },
    { "key": "on_multiple", "type": "enum",
      "options": ["route_to_port", "most_recently_updated", "most_recently_created"],
      "default": "route_to_port" }
  ],
  "emits": { "record": "crm_record" },
  "sideEffects": false,        // derived from category; overridable (e.g. HTTP GET)
  "retryable": true
}
```

Three properties of this contract do the heavy lifting:

- **`type: "ref:*"`** config fields render as **pickers** and are validated as real, live, business-scoped references at save *and* publish time. This is what makes the wrong-board and stray-`x` bugs unrepresentable. ✅ (fixes Label New defects 1 & 2)
- **`required: true` on an output port** means publish fails if that port is unconnected. This is what makes silent drops unrepresentable. ✅ (fixes Voucher and Social Media Tracker defects)
- **`sideEffects: false`** marks a node safe to re-execute, which drives retry policy and test-run behaviour ([Section 7.4](#74-retries-and-idempotency)).

### 4.5 The primitives that shrink workflows

This is the section to walk the CTO through, because it is where the 136 → 15 node reduction comes from.

**(1) Multi-scope triggers.** A trigger subscribes to a **set** of inboxes, boards, or channels, not one. The matched scope is available downstream as `{{ trigger.inbox }}` / `{{ trigger.board }}`.

> "Label New" duplicates its four-node chain once per (label × inbox) = 34 times across 4 brands and 6 inboxes. With a multi-inbox trigger and a board resolved from `{{ trigger.inbox }}` via a **lookup table** (Section 5.5), that becomes **one** chain.

**(2) Find-or-create CRM record.** One node replaces `Search items → Split Out → Limit(last) → Update item`, with duplicates handled by an explicit strategy rather than "keep whatever the API returned last." ✅ (the audit flagged `Limit(lastItems)` as a latent correctness risk precisely because "last" is API-return order, not recency)

**(3) Workspace-level defaults.** Timezone, date format, and default board mappings live on the business, not on each node. ✅ (fixes the 1-of-28 missing `.setZone` bug by construction)

**(4) Call-and-link external sync.** One composite node for the create-then-link pattern behind every bidirectional integration: call an external system, take the ID it returns, and write that ID back onto the Cekat record so the two stay linked on every future update. ✅ This is what the Ticket Automation workflow does by hand, three separate times, with three separate copies of the lookup-merge-post-writeback logic (Section 1.1b) — and it's the same shape any future client-CMS or client-ERP integration will need. Built on the **typed credential reference** from Section 4.4, not a free-text URL and header, which is the direct fix for the token-leak defect in Section 1.2c.

---

## 5. Node catalog — v1

Notation: **[P0]** = required for first milestone · **[P1]** = required for full release · **[v2]** = explicitly deferred.

All Cekat-domain actions map to already-existing internal surfaces (`/business_workflows/*`, CRM APIs), so v1 is largely an **orchestration layer over APIs we already run in production**. ✅ This is a significant de-risking argument for the CTO: we are not building 30 new integrations, we are building an engine plus thin adapters.

Each subsection below states the **category** (Section 4.3) of the nodes it contains.

### 5.1 Triggers — *category: `trigger`*

| Node | Scope selector | Payload | Priority | Existing surface |
| --- | --- | --- | --- | --- |
| **Message received** | inboxes[], channels[] | conversation, contact, message | P0 | webhook pipeline ✅ |
| **Message sent** | inboxes[] | as above | P1 | ✅ |
| **Conversation status changed** | inboxes[], from[], to[] | conversation, previous status | P0 | `conversations` ✅ |
| **Label added / removed** | inboxes[], labels[] | conversation, label, change_type | P0 | `conversations_labels` ✅ |
| **Pipeline status changed** | inboxes[], from[], to[] | conversation, pipeline status | P1 | `/business_workflows/pipeline-status` ✅ |
| **Conversation assigned** | inboxes[], agents[] | conversation, agent | P1 | ✅ |
| **CRM record created** | boards[] | record, board | P0 | CRM ✅ |
| **CRM field changed** | boards[], columns[] | record, column, old/new value | P0 | CRM ⚠️ *needs a change-event source — see Section 11.2* |
| **Contact property changed** | properties[] | contact, property, old/new | P1 | ⚠️ same |
| **Schedule (cron)** | — | scheduled_at | **P0** ⬆ | new |
| **Conversation inactive for N** | inboxes[], duration, whose-turn | conversation, contact, last message, elapsed | **P0** ⬆ | new — ⚠️ needs a scheduler/sweeper |
| **Ticket created** | — | ticket, contact | **P0** ⬆ | new — domain: ticketing |
| **Ticket updated** | fields[] | ticket, field, old/new value | **P0** ⬆ | new — domain: ticketing |
| **Inbound webhook** | — | raw body, headers | **P0** ⬆ | new — ⬆ **promoted from P1.** The Ticket Automation workflow's "Update Ticket from CMS" entry point is exactly this: an external system (the client's own CMS) reaching back into Cekat unprompted. Not a hypothetical escape hatch — a real, live pattern at a client today. |
| **Manual / test run** | — | user-supplied sample | P0 | new |
| Segment entered / exited | segments[] | contact, segment | **v2** | Segmentation PRD |
| CDP custom event received | events[] | contact, event, properties | **v2** | `custom_event_definitions` ✅ |
| Order created / paid | — | order, contact | **v2** | `cekat_orders` ✅ |

> **Note on "Conversation inactive for N" (P0) — a late addition.** The CEO's requirements list *"bisa by chat delay"* as one of three first-class trigger modes, alongside cron and event. ⚠️ I read this as **conversation inactivity**: no message for N minutes/hours, optionally scoped to whose turn it is ("customer hasn't replied in 24h" vs. "no agent has replied in 15min"). That covers the follow-up, re-engagement, and SLA-breach automations that are among the most common asks in any messaging product — and the catalog had no way to express them. **Needs confirming with the CEO** that this is the intended meaning; if instead he means "delay *after* a chat event before acting," the Wait node (Section 5.3) already covers it.
>
> ⚠️ Engineering note: this is not an event trigger. Nothing *happens* when a conversation goes quiet, so it needs a sweeper — a periodic scan for conversations crossing the threshold, or a per-conversation scheduled check written on each message. The second scales better but writes more. Worth a spike alongside P0-1.

> **Note on "CRM field changed" (P0).** The "Voucher bayar di klinik" workflow triggers on a CRM record's appointment-date field changing, so this is load-bearing for migration. ⚠️ It requires a change-data source on CRM writes. Engineering to confirm whether an existing hook or an outbox table is the right mechanism; this is the single biggest unknown in the v1 trigger set and is called out as a spike in [Section 12](#12-delivery-plan).

**Multi-trigger automations are v2.** In v1, one automation = one trigger. Where n8n users combined a `labels_updated` trigger and a `resolved` trigger in one file (Label New's reset mechanism), that becomes two automations. This is a legibility win, not just a scoping cut.

### 5.2 Filters and conditions — *category: `logic` · domain: flow*

- **Filter** [P0] — a guard immediately after the trigger. Non-matching runs terminate with status `filtered` (**logged, not silent** — directly addresses G3 and the Voucher silent-drop bug).
- **Condition (If)** [P0] — `true` / `false` ports, both required.
- **Router (Switch)** [P0] — N named branches **plus a mandatory `fallback` port**. Publish fails without it.

**Existence filters** [P0] — the CEO's *"if exist'an… if conversation exist"*. A distinct filter shape from property comparison: it asks whether a *related record or event exists* for this contact, optionally within a window.

| Filter | Example | Priority |
| --- | --- | --- |
| Conversation exists | "contact has an open conversation on any inbox" | P0 |
| Conversation exists in window | "contact conversed in the last 7 days" | P0 |
| CRM record exists on board | "contact already has a row on the Bookings board" | P0 |
| Order exists / order value | "contact has an order over 500k" | P1 |
| CDP event exists / not exists | "contact has *not* had a `purchase` event since the campaign" | **v2** *(with CDP triggers)* |
| Segment membership | "contact is in segment X" | **v2** *(see Section 11.2 tension 2)* |

🔵 These share semantics with the Segmentation PRD's condition model deliberately — same operators, same time-window handling. Where a filter and a segment condition mean the same thing, they should be **the same code**, not two implementations that drift. Worth an explicit interface agreement with whoever owns Segmentation before Phase 1.

Property comparison rows are built from a typed field picker with operators scoped to type:

| Field type | Operators |
| --- | --- |
| text | is, is not, contains, does not contain, starts with, ends with, is empty, is not empty, matches pattern |
| number | =, ≠, >, <, ≥, ≤, between, is empty |
| date/datetime | before, after, between, in the last N, in the next N, is empty |
| enum (status, pipeline, channel) | is any of, is none of |
| ref (label, agent, board, inbox) | is any of, is none of |
| boolean | is true, is false |

🔵 **Text comparison defaults to trimmed + case-insensitive**, with a "strict match" toggle. The Voucher workflow lost requests to a label saved as `"SLIM+ PromKil W1 "` — a trailing space. The default should make the common intent correct and require opt-in for strictness. ✅

### 5.3 Flow control — *category: `logic` · domain: flow*

| Node | Notes | Priority |
| --- | --- | --- |
| **Loop over list** | bounded; hard cap (🔵 propose 500 iterations, per-business configurable). ⬆ Promoted — batch-sync workflows are built around it. | **P0** ⬆ |
| **Wait / Delay** | fixed duration, or until a time-of-day in business timezone. Durable — survives restarts. Appears at the end of nearly every batch-sync lane, ⚠️ likely for external-API rate limiting. **Carries a re-check option — see below.** | **P0** ⬆ |
| **Stop** | terminates with a custom status + message, visible in run log | P0 |
| Merge / join branches | | **v2** |
| Sub-automation (call another automation) | | **v2** |

🔵 **Re-check on resume — the CEO's "post cron filter."** [P0] The requirements list a filter stage that runs *after* a scheduled delay, and it's the subtlest item in the notes. The reason it matters: **state changes during a wait.** Trigger fires at 02:00, the automation waits until 09:00 to send — and in between, the customer converted, unsubscribed, replied, or was resolved by an agent. Acting on 7-hour-old state is how automations embarrass a business.

Two ways to express it, and we should ship both:

1. **Any Condition node placed after a Wait** already re-evaluates against live state — the graph model gives this for free, and it's the flexible form.
2. 🔵 **A `re-check conditions on resume` option on the Wait node itself**, which re-runs the automation's Filter stage before continuing and routes to an `abandoned` port if it no longer matches. This is the form clients will actually use, because the failure it prevents is one they won't think to guard against manually.

⚠️ Same requirement appears in the MRKT Automation RFC as *"suppress against live data — check current CDP state at send time."* Building it once, here, serves both.

⚠️ **The batch-sync shape stresses the engine differently from event-driven automations.** A cron run that loops 500 records, each making an HTTP call and a CRM upsert, is a long-running execution — minutes, not the ~300ms–7s the client's current executions take. Implications engineering must design for in Phase 1, not retrofit: per-run wall-clock limits sized for batch work, step-level checkpointing so a worker restart doesn't redo the whole loop, partial-failure semantics (does record 300 failing abort the run or continue?), and run-log volume from loop iterations (500 iterations × 6 nodes = 3,000 step records for one run — this is precisely the table-bloat vector Section 7.5 guards against, so **loop iterations must aggregate rather than write a step record each**).

### 5.4 Data and action nodes, by domain

Category is stated per row, because the Data/Action distinction determines dry-run and retry behaviour (Section 4.3) and clients will see it as a badge in the palette.

**Domain: Conversation** — all map to existing `/business_workflows/*` routes ✅

| Node | Category | Route | Priority |
| --- | --- | --- | --- |
| Add label / Remove label | action | `POST /labels`, `POST /labels/remove` | P0 |
| Set pipeline status | action | `POST /pipeline-status` | P0 |
| Assign agent / Add collaborator | action | `POST /assign-agent`, `POST /add-collaborator` | P1 |
| Set conversation status / Resolve | action | `POST /conversation-status`, `POST /resolve-conversation` | P1 |
| Block AI / Unblock AI | action | `POST /block-ai`, `POST /unblock-ai` | P1 |
| Send message (text / WA template) | action | `POST /custom-api/messages` + message routes | P0 |
| Add private note | action | ⚠️ confirm route | P1 |
| Create notification | action | `POST /notifications` | P1 |
| Get conversation messages | **data** | `GET /conversation-messages` | P1 |
| Get contact | **data** | `GET /contact` | P1 |
| **Update session fields** | action | ⚠️ confirm route — CEO's *"update session auto"*. Cekat has session-level custom fields; automations should be able to write them. | P1 |
| **Stop / override outgoing reply** | action | ⚠️ **needs design, not just a route.** CEO's *"stop reply override replynya"*. Block AI (above) prevents the AI replying at all; this is different — intercepting or replacing a reply that is about to be sent. That implies automations run **synchronously in the send path**, which conflicts with the fire-and-forget hot-path rule in Section 7.1. Flagged as open decision 7 in Section 11.2. | 🔵 **v2 pending design** |

> ⚠️ **Important side-effect note for engineering:** label assignment via the workflow path already triggers Marketing side effects (`wrapAssignLabelToConvo` → Meta CAPI and TikTok lower-funnel dispatch). ✅ Cekat Automations **must** call the same wrapped helpers, not the underlying tables, or we silently break attribution for every migrated client. This is a hard requirement, not a preference.

**Domain: CRM**

| Node | Category | Priority |
| --- | --- | --- |
| Find CRM record (Section 4.4) | **data** — executes for real in dry-run | P0 |
| Create CRM record | action | P0 |
| Update CRM record | action | P0 |
| Find or create CRM record (composite) | action — *composite; the find half is safe, the create half is not* | P0 |
| Update contact property | action | P1 |
| Create order | action | **v2** |

**Domain: Marketing**

| Node | Category | Priority |
| --- | --- | --- |
| Fire custom event (into CDP, attributed) | action | P1 |
| Send CAPI event | action | P1 — 🔵 the founder's spec asks for CAPI to be callable from automations ✅ |
| Send campaign / broadcast to segment | action | **v2** |
| Frequency cap / suppression check | **data** | **v2** (MRKT RFC dependency) |

**Domain: Ticketing** — new domain, added from the Ticket Automation audit (Section 1.1b) ⚠️ single-client evidence, pending census confirmation

| Node | Category | Notes | Priority |
| --- | --- | --- | --- |
| Create ticket | action | Cekat-side ticket creation | **P0** ⬆ |
| Update ticket | action | Cekat-side ticket update | **P0** ⬆ |
| **Call and link external system** | action | ⬆ new — the 4th shrinking primitive (Section 4.5). Calls a client-controlled endpoint via a **typed credential reference** (never free-text URL + header), takes the response ID, and writes it back onto the Cekat record. This is the mechanism the CEO's *"call client's webhook"* requirement needs, and it's the direct design fix for the hardcoded-token defect in Section 1.2c. | **P0** ⬆ |

**Domain: Utility**

| Node | Category | Notes | Priority |
| --- | --- | --- | --- |
| **HTTP request** | action *(→ `data` when method is `GET`/`HEAD` — see Section 4.3)* | ⬆ **Promoted from P1.** Not an edge-case escape hatch — it is the backbone of every batch-sync workflow (`Sync Data Book New`, `Data Book`, the Calendar workflows) and of the Voucher Apps Script pattern. Needs: domain allowlist per business, credential store, response size cap, timeout, no private-IP destinations, pagination helper ⚠️. **Auth must be `type: "ref:credential"` (Section 4.4) — never a free-text header field.** The Ticket Automation workflow is a live example of what happens when a general-purpose tool allows the free-text version (Section 1.2c). | **P0** ⬆ |
| **AI step** | **data** *(`deterministic: false`, metered)* | Structured classify/extract against a declared output schema. Not an agent. Covers the founder's "AI analysis" pre-action. | P1 |
| **Set variable / Format** | **data** | date formatting (workspace timezone default), string ops, number ops | P0 |
| **Lookup** | **data** | reads a lookup table (Section 5.5) | P0 |

### 5.5 Lookup table

🔵 A small, first-class key→value map scoped to an automation or a business. Not present in n8n's core, and it is what makes multi-scope triggers actually usable:

```
inbox → board
  SKIN+ AI         → 7df005f0-…
  SKIN+ Telesales  → 7df005f0-…
  SLIM+ AI         → 310b4f22-…
```

With this, one automation handles all four brands: `Find CRM record` uses `board = lookup(inbox_to_board, trigger.inbox)`. Editing the mapping is a table edit, not a graph edit — which is exactly the change that was mis-made in "Label New." Sits alongside n8n 2.0's Data Tables concept but scoped much tighter. ✅

---

## 6. Product surface and builder UX

Full visual design to be produced by design against this skeleton; this section defines structure and behaviour.

### 6.0 Guiding principle — familiar by default

🔵 **Where we have no strong reason to differ from n8n, we match n8n.** Clients have months of muscle memory in the embedded editor. Every gratuitous divergence is a support ticket and a reason to resist migrating. Concretely: same canvas interaction model (drag from a port to connect, click a node to configure, palette on one side, config on the other), same Editor/Executions tab split, same publish semantics, same vocabulary where it isn't actively misleading.

We diverge **only** where n8n's design is the cause of a documented problem:

| We match n8n | We deliberately diverge | Why |
| --- | --- | --- |
| Canvas interaction, node config drawer, Editor/Executions tabs, workflow list, publish toggle | **Business-scoped, not "Personal"** — see Section 6.1 | n8n's one-user-per-business model makes edits unattributable ✅ |
| Zoom/fit/tidy controls, execute-from-trigger button | **Typed pickers instead of free-text IDs/expressions** | Root cause of 2 of 9 audited defects |
| Version history, tags | **Mandatory fallback ports** | Root cause of the silent-drop defects |
| Execution list with status + duration | **Live execution stream, not "Auto refresh" checkbox** — see Section 6.9 | Polling toggle is a workaround; clients want to watch it fire |
| — | **Multi-scope triggers + lookup tables** (Section 4.5) | Removes the duplication n8n's model forces |

The test for any UX decision: *would a client who has used the embedded n8n editor be able to do this without being told?* If no, we need a documented reason.

### 6.1 Navigation and scoping

Lives under the existing **Automation** top-level nav item (alongside Chat, Orders, Marketing) — the same slot the n8n iframe occupies today, so nothing moves for clients. ✅ 🔄 *Corrected from an earlier draft that listed "CRM" as a separate sibling tab — the live dashboard's top nav is Chat / Orders / Marketing / Automation, no standalone CRM tab.*

```
Automation
├── Workflows          ← default landing
├── Executions         ← all runs across all workflows, business-wide
├── Credentials        ← HTTP node secrets (P0 — HTTP node is now P0; see the token-leak finding in Section 1.2c)
└── Data tables        ← Section 5.5's lookup tables, using the live product's existing label for this slot
```

🔵 **Workflows are scoped to `business_id`, not to a user.** Every admin and agent of that business sees the same list, subject to RBAC (Section 8). This is a deliberate divergence from what's on screen today: n8n provisions one user per business and files everything under that user's "Personal" project, which is why the header reads *"Workflows, credentials and data tables owned by you"* and why no edit is attributable to a person. In Cekat Automations the list belongs to the business; **`created_by` and `last_edited_by` are real Cekat users** and appear in the list and the audit log.

⚠️ **Open:** whether to offer folders/projects for sub-grouping within a business. Given 46 workflows in one account, some grouping is clearly needed — but tags plus good search may be enough for v1. Flagged in Section 11.2.

### 6.2 Workflows list

| Column / control | Notes |
| --- | --- |
| Name | Click → opens Editor |
| Trigger summary | 🔵 **Not in n8n.** "Label added · 6 inboxes" or "Every day 09:00". The single biggest legibility win over the current list — today you must open a workflow to learn what fires it. |
| Status | Published / Draft / Disabled — three distinct states, not n8n's two |
| Last run + outcome | 🔵 **Not in n8n's list.** "2 min ago · succeeded" / "4 hrs ago · 3 failed". Makes dead workflows obvious at a glance. |
| Runs (24h) + error rate | Sparkline or count |
| Last edited by + when | Real Cekat user |
| Row menu | Open, Duplicate, Rename, Enable/Disable, Export, Delete |

Controls: search by name, filter (status, trigger type, edited-by), sort (last updated / last run / name), tags, pagination. **Create workflow** primary button — 🔵 offering *Start blank* or *Start from template* (Section 12 Phase 4 templates library).

### 6.3 Workflow detail — tab structure

Matches the current editor exactly: **Editor · Executions**, with the workflow name, tags, Published state, version history, and overflow menu in the header. (n8n's third tab, *Evaluations*, is out of scope — that's AI-agent regression testing, which belongs to the AI product, not here.)

### 6.4 Canvas

- Node-graph canvas (🔵 **React Flow** recommended — mature, MIT, handles pan/zoom/edges/minimap so the team writes Cekat logic, not graph plumbing). Building canvas primitives from scratch is the fastest way to miss the 8-week milestone.
- Left rail: node palette grouped by **domain** — Conversation · CRM · Marketing · Ticketing · Flow · Utility (Section 4.3, Axis 2) — searchable, with each node showing its **category** as a badge so the Data/Action distinction is visible before the user ever runs a test. 🔄 *Corrected to include Ticketing, added to Section 4.3's domain list after the Ticket Automation audit (Section 1.1b) but previously missed here. Note the prototype and Simplified PRD currently show Conversation/CRM/Ticketing/Flow/Utility without Marketing — Marketing's nodes (CAPI, custom event) are full-release, not milestone-1, so they're deliberately absent from that milestone-scoped view rather than out of the product.*
- Click node → right-hand config drawer (not a modal — clients need the graph visible while configuring).
- Auto-layout button; snap-to-grid; multi-select; copy/paste subgraph.
- Validation surfaced **inline on the node** (red badge + reason), not only on publish.
- Bottom-left control cluster matching current muscle memory: fit-to-view, zoom in/out, undo, **tidy/auto-layout**. Given the sprawling multi-lane canvases clients build today, tidy is not cosmetic.
- **Execute workflow** button, labelled with the trigger it will run from (as today: *"Execute workflow from Schedule Trigger"*).
- Collapsible **Logs** panel docked at the bottom, showing the most recent runs without leaving the Editor.

### 6.5 Configuration panel

Rendered entirely from the node manifest (Section 4.3). Consequence: **a new node type requires zero frontend work.** This is a deliberate architectural choice to keep 2–3 engineers productive.

Field types: `ref:*` (searchable picker), `expression` (autocomplete over available context), `enum`, `text`, `number`, `datetime`, `key_value`, `conditions` (the condition-row builder).

Each node opens into a drawer with, at minimum: a rename field, the manifest-driven config form, an inline expression/variable picker showing what upstream nodes provide, and — after a test run — the node's actual input and output side by side. This last part is the thing clients most need and currently have to infer.

### 6.6 Test run

- **Run with sample data** from the trigger drawer: pick a real recent event (last 20 matching events for this business) or paste JSON.
- Test runs execute in **dry-run by default** — nodes with `sideEffects: true` are simulated and clearly marked "would have run." A "run for real" toggle exists and requires explicit confirmation.
- Every node shows its actual input/output inline after a test run. ✅ This is the single most-requested thing missing from the current setup — clients cannot see why a branch didn't match.

### 6.7 Expressions

🔵 **No arbitrary JavaScript in v1.** n8n's `{{ }}` JS sandbox is why 2.0 had to introduce isolated Task Runners and tighten env-var access, and why the audited workflows contain a typo-driven silent failure. We ship instead:

- `{{ path.to.value }}` interpolation over the run context, with **autocomplete** driven by upstream node `emits` declarations. A path that cannot exist is a **save-time error**, not a runtime one. ✅ (this alone would have caught `{{ ...name }}x`)
- A curated function library: string (`trim`, `lower`, `upper`, `replace`, `split`, `slice`), date (`now`, `format`, `add`, `diff` — all timezone-aware with workspace default), number, and `lookup()`.
- Everything evaluates in a pure, non-Turing-complete evaluator. No network, no filesystem, no host access, bounded execution time.

⚠️ We will hit cases this cannot express. The **HTTP request** node and the **AI step** are the designated escape hatches, and n8n remains available for genuine outliers ([Section 10](#10-coexistence-with-n8n)). Revisit a sandboxed Code node in v2 only with evidence from real blocked cases.

### 6.8 On/off, publish, and versioning

Three independent states, deliberately not conflated. n8n collapses these and it is a recurring source of "I thought it was off" incidents.

| State | Values | Meaning |
| --- | --- | --- |
| **Enabled** | on / off | Whether triggers fire at all. A one-click toggle on the list row **and** in the workflow header. Turning off takes effect immediately; in-flight runs finish (🔵 or are cancelled — needs a decision, recommend *finish*). |
| **Publication** | draft / published | Which version live triggers execute. Editing never affects running behaviour until Publish. ✅ |
| **Version** | v1…vN | Immutable history. |

**Enable/disable (must-have).**

- Toggle from the workflows list without opening the workflow — the common case is "turn this off, it's misfiring."
- Disabling is instant and unambiguous in the UI; a disabled workflow is visually distinct in the list, not just a changed badge.
- Every toggle is audit-logged with user and timestamp (Section 8).
- 🔵 Disabling does **not** discard the draft or version history; re-enabling restores exactly the previously published version.

**Versioning and restore (must-have).**

- **Every publish creates an immutable version.** Versions are never overwritten or garbage-collected. 🔵 Recommend also snapshotting on significant draft saves so an in-progress editing session can be recovered.
- **Version history panel** lists: version number, published-at, published-by, and an optional change note the user can add at publish time.
- **Restore any version, not just the previous one.** Selecting any historical version and restoring it creates a *new* version whose content equals the old one — history is append-only, so a restore is itself auditable and reversible. This is strictly better than a destructive rollback.
- **Diff between any two versions**, shown as node-level changes (added / removed / reconfigured) rather than raw JSON. ⚠️ A readable graph diff is non-trivial; if it slips, ship restore first and diff second — restore is the must-have, diff is the convenience.
- **View a historical version read-only on the canvas** before committing to restore.
- Every run records which version executed (Section 6.9), so a failure traces to an exact version and that version can be inspected or restored directly from the run detail.

**Publish validation** runs before any version is created: unconnected required ports, broken references, missing config, unreachable nodes, cycles. A workflow that fails validation cannot be published — which is the mechanism that would have caught the unwired TikTok branch and the three orphaned webhook nodes in the audited files. ✅

### 6.9 Executions

Available both per-workflow (Executions tab) and business-wide (Automation → Executions). Two-pane layout matching the current editor: run list on the left, selected run's graph on the right with the executed path highlighted and every node's real input/output inspectable.

**Live by default.** 🔵 The moment a trigger fires, a new row appears at the top of the list — no refresh, no "Auto refresh" checkbox to remember to tick. A run in progress shows as `Running` with elapsed time and updates in place as it moves through nodes; on completion it settles to its terminal status. If the user has the run open, the graph lights up node by node as execution advances.

This matters for three reasons: it is the fastest way to confirm a new automation works (fire the trigger, watch it run); it is how CS diagnoses a live incident; and it directly delivers the founder's *"automation juga ada live tracker ongoing actions."* ✅ The current "Auto refresh" checkbox is a polling workaround for the same need.

⚠️ **Engineering note.** Live updates need a push channel — 🔵 recommend SSE from the API, with the worker publishing run/step state transitions to Redis pub/sub and the API fanning out to subscribed clients. Constraints: scope every subscription to `business_id` (a client must never see another's runs), cap concurrent subscriptions, coalesce step-level events for loop-heavy batch runs (Section 5.3 — 3,000 step transitions must not become 3,000 pushes), and fall back to polling if the channel drops. This is a real piece of infrastructure, not a UI detail — it is called out as its own ticket in the delivery plan.

**Run list row:** timestamp, status (`Running` / `Succeeded` / `Failed` / `Filtered` / `Stopped`), duration, trigger source, and an icon distinguishing manual/test runs from live ones (as today). **Filters:** status, date range, workflow, and search by **run ID**.

🔄 **Revised from an earlier draft.** That draft specified filtering by conversation/contact instead, reasoning that a CS agent arrives at the question with a customer, not a run ID. Reconsidered after the IT delivery interview that motivated this whole requirement: the actual reported pain wasn't "find the run for this customer" — it's "a client reports an automation error and there's no way to look it up without manually scrolling n8n's execution list by timestamp." Run ID is the field that closes that specific gap directly and is available the moment a run fails (surfaced in error messages/logs), whereas a contact/conversation search still requires cross-referencing which customer was involved. ⚠️ Contact/conversation filtering is a real capability n8n genuinely lacks and may still be worth adding later — flagged here as a deliberately deferred, not rejected, idea if census or support feedback shows it's needed.

**Run detail header:** timestamp, status, duration, run ID, trigger event link, and the automation version that executed — so a failure can be tied to a specific published version. Actions: retry, copy to editor, delete.

⚠️ Retention differs from n8n's "save all executions" default — see Section 7.5. The UI must state plainly how long runs are kept, and why payloads for older successful runs are unavailable.

---

## 7. Execution engine

### 7.1 Architecture

Reuses existing Cekat infrastructure — BullMQ/Redis, Supabase/Postgres — rather than introducing a new runtime. ✅

```
Cekat domain events
  (chat webhook, label helper, CRM writes, cron, inbound webhook)
        │
        ▼
  Automation Dispatcher
   ├─ match event → published trigger subscriptions (business-scoped, indexed)
   ├─ evaluate trigger-level scope filters (inbox/board/label) BEFORE enqueue
   └─ enqueue Run  ──────────────────────────────►  automationRunQueue (BullMQ)
                                                          │
                                                          ▼
                                                   Automation Worker
                                                    ├─ load published version (cached)
                                                    ├─ walk graph, execute steps
                                                    ├─ call Cekat helpers / adapters
                                                    └─ write run + step records
```

🔵 **Scope filtering happens before enqueue.** This is the direct answer to n8n's cost problem: an inbox the automation doesn't watch never creates a run. In n8n, every message on every triggered inbox is a billed execution that a Filter node then discards.

⚠️ **Hot-path rule (non-negotiable, matches existing Marketing module rules):** dispatch is fire-and-forget. Automation failure must never block conversation ingestion, label assignment, or webhook acknowledgement. ✅

### 7.2 Trigger subscription registry

Publishing writes a row per (business, event_type, scope) into an indexed `automation_triggers` table. Dispatch is an indexed lookup, not a scan over workflow definitions. Cache with invalidation on publish.

### 7.3 Concurrency and limits

Per-business: max concurrent runs, max runs/minute, max steps per run, max run wall-clock. Defaults 🔵 TBD with engineering; the point is that they exist from day one and are visible in the run log when hit, rather than being discovered in an incident.

⚠️ **Loop protection.** An automation that adds a label, triggered by label-added, is an infinite loop. Required guards: (a) runs carry a causation chain with a max depth (🔵 propose 3); (b) automation-caused events are tagged so an automation can opt out of self-triggering (🔵 default: **off** — automations do not trigger on their own side effects unless explicitly enabled).

⚠️ **Fault isolation — an automation's failure must stay inside that automation.** An automation stuck in a loop, retry storm, or runaway fan-out must not degrade or block other automations for the same business, other businesses, or the platform overall. Required guards: (a) each run's resource use (queue time, worker time, step count) is capped per-run and enforced by the concurrency limits above, so one run can't starve the shared job queue; (b) failure containment is per-`automation_id`, not per-`business_id` or global — a run that fails, loops, or hits its wall-clock/step-count limit is killed and marked `Failed` without pausing or disabling other automations on the same business, and without affecting automations belonging to any other business; (c) 🔵 an automatic circuit breaker: an automation that repeatedly fails or hits its limits is auto-disabled with the reason logged, rather than left to keep retrying and consuming shared capacity. The exact trip condition — a fixed retry/failure count vs. resource-exhaustion-based (queue time, worker time, step count consumed) — is **TBD; Ardin to explore and propose during Sprint 0.** This is the direct answer to "an infinite loop or runaway automation takes down the whole business, or the whole platform" — the blast radius of any single failure is exactly one automation.

### 7.4 Retries and idempotency

- Each run carries an idempotency key `(trigger_event_id, automation_version_id)`. Duplicate delivery is a no-op.
- Per-node retry policy from the manifest: `retryable` nodes get exponential backoff (🔵 3 attempts). Non-retryable side-effecting nodes fail the step and route to the node's error port if wired, else fail the run.
- 🔵 **Per-node error port** as an opt-in output, mirroring n8n's `continueOnFail` but explicit in the graph rather than a hidden setting. The audit found retry settings inconsistently applied across copy-pasted nodes precisely because they were invisible.

### 7.5 Execution data retention — designed against n8n's #1 failure mode

n8n's most-documented production failure is execution-table bloat (~500 MB/month at 1k executions/day; instances reaching 40+ GB and becoming unusable), compounded by Postgres TOAST bloat on large JSON payloads. ✅ We design against it from day one rather than discovering it:

| Data | Store | Retention |
| --- | --- | --- |
| Run summary (id, automation, version, status, timings, trigger ref) | Postgres, partitioned by month | 🔵 90 days hot, then aggregate counters only |
| Step records (status, duration, error) | Postgres | 🔵 30 days |
| Step input/output payloads | ⚠️ object storage, referenced by key — **not** inline JSONB | 🔵 7 days for success, 30 days for failure |
| Aggregate counters (runs/day, error rate per automation) | Postgres rollup table | indefinite |

🔵 **Success-payload retention should be short and configurable.** n8n's own mitigation is `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none`; we should default to keeping failure payloads long and success payloads briefly. Table size must be on a dashboard from the first week in production, not added after the first incident.

### 7.6 Attribution into CDP

Every side effect emits an event carrying `source: "automation"`, `automation_id`, `automation_version_id`, `node_id`, `run_id`. ✅ Satisfies the founder's requirement and makes "which automation caused this" a query rather than an investigation. Feeds directly into the CDP events table's existing `By who` dimension (API / Automation / Human / AI / Node ID). ✅

---

## 8. Multi-tenancy, permissions, security

- **Business-scoped everything.** Every automation, run, trigger subscription, and credential carries `business_id`; all queries are scoped. Unlike n8n, tenancy is native rather than achieved by instance-per-tenant. ✅
- **RBAC.** ⏸️ **Removed from the delivery plan for now** — not built in v1. "Automations" is already a named module in the platform's per-module permission spec, so the hooks exist; the intended v1 roles were **View** (list + run history), **Edit** (create/edit drafts), **Publish** (publish/enable/disable), with Publish as a separate grant since publishing changes production behaviour for real customers. Until this ships, anyone with dashboard access to Automations can publish/enable/disable — worth the CTO's explicit sign-off that this gap is acceptable for the migrated clients in Phase 3.
- **Audit log.** Who created/edited/published/enabled/disabled/deleted, with version diffs. Non-negotiable given the platform-wide "APP LOGS — PERUBAHAN APA PUN done by client ke log" requirement. ✅
- **Credentials.** HTTP node secrets in an encrypted credential store, referenced by ID, never rendered back to the frontend, never written into run logs. ✅ Mirrors the existing rule that tokens are never exposed to frontend clients. 🔴 **Not theoretical:** the Ticket Automation audit (Section 1.1b) found live bearer tokens hardcoded in plaintext across dozens of nodes in a production workflow today — see Risk R13. This is the exact failure mode a mandatory, typed credential reference removes by construction.
- **Egress control.** HTTP node restricted to a per-business domain allowlist; no private-IP/link-local destinations (SSRF); response size and timeout caps.
- **PII in logs.** ⚠️ Step payloads contain message content and contact details. Retention limits (Section 7.5) plus a per-business toggle to redact message bodies from run logs. Needs a privacy read before full release.

---

## 9. Open API surface

The engine is API-first so that the canvas is a client of it, not a prerequisite for it. This is what lets Phase 1 deliver value before the builder exists.

```
GET    /automations
POST   /automations
GET    /automations/:id
PATCH  /automations/:id
DELETE /automations/:id
POST   /automations/:id/versions          # save draft
POST   /automations/:id/publish
POST   /automations/:id/enable | /disable
GET    /automations/:id/versions
GET    /automations/:id/versions/:version          # read-only graph
POST   /automations/:id/versions/:version/restore  # appends a new version
GET    /automations/:id/versions/diff?from=&to=
POST   /automations/:id/test-run
GET    /automations/:id/runs
GET    /automation-runs/:run_id           # includes steps
POST   /automation-triggers/webhook/:token
GET    /automation-node-types             # manifests — powers the builder UI
```

🔵 Expose this on the public Open API too. The founder's spec repeatedly asks for open API coverage of every module, and it gives clients a programmatic path that n8n's unstable internal `/rest/*` never safely offered. ✅

---

## 10. Coexistence with n8n

### 10.0 First: run a census

⚠️ **Nothing in this PRD's sizing can be trusted until this runs.** Everything examined so far is two clients (Section 1.0) — still a small sample against the full client base. **P0-7** in [Section 12](#12-delivery-plan) is a scripted export of **every** client's n8n workflows into one inventory. Per business: workflow count, published vs. draft, node-type histogram, trigger types, last-execution date, and dead-workflow flags.

Four outputs, in priority order:

1. **A distribution, not an anecdote.** How many workflows does a typical client have? Is Euromedicagroup's 46 an outlier or the top of a long tail? This single number reshapes migration planning.
2. **A real parity backlog** ranked by how many *client workflows across the base* each missing node type unblocks — replacing the judgement calls in Section 5 with counts. Any node type appearing in many clients' workflows but absent from Section 5 is a Phase 1 scope change.
3. **Live vs. dead split.** Workflows with no execution in 90 days are probably not migration scope. Given the `temporary` / `My workflow 6891` naming, this could cut the real total substantially.
4. **Workflow shapes we haven't seen.** Cluster by trigger type and node histogram; anything that doesn't look like conversation-ops or batch-sync is a discovery. Expect at least one (Section 1.1).

🔵 Worth adding a manual pass: open two or three workflows from **different** clients and audit them the way the original five were audited. That tests whether the defect pattern in Section 1.2c — already replicated once, at a second, unrelated client (Section 1.1b) — holds at a third and fourth, or was specific to these two clients' build habits. This matters because, if it holds, it is the strongest argument in this document.

Half a day of scripting against the n8n Postgres or Public API, plus a few hours of manual review. Week 1, before Phase 1 scope is locked.

### 10.1 Position

**Position:** n8n is not switched off. It becomes the **advanced/legacy** tier.

| Phase | n8n | Cekat Automations |
| --- | --- | --- |
| Now → full release | Default and only option | Internal alpha, then design partners |
| Full release | Available; existing workflows untouched; **new** workflows discouraged in-product | Default for all new automations |
| Release + 2 quarters | Available on request; flagged in-product as legacy | Standard |
| Sunset (🔵 decision deferred) | Requires 100% parity incl. HTTP/Sheets patterns | — |

**Migration approach.** Manual rebuild with tooling assistance, not automated import. 🔵 An automated n8n-JSON → Cekat-graph converter is explicitly **not** proposed: the audited files are 60–90% duplication, and a faithful conversion would import that duplication plus the bugs. The value of migration is the collapse from 136 nodes to 15, which a converter cannot do.

**Migration tooling (P1):**
1. **n8n workflow analyser** — parse an exported workflow, report node inventory, referenced boards/inboxes/labels, and flag patterns not yet supported in Cekat Automations. Doubles as a **parity gap tracker** across the client base.
2. **Parity checklist** per workflow, signed off by CS before disabling the n8n original.
3. **Shadow mode** — run the Cekat automation with all side-effecting nodes in dry-run alongside the live n8n workflow, and diff intended actions for a week. 🔵 Strongly recommended for the first three migrations; it is the only way to migrate a lead-labelling workflow without risking a client's CRM.

**Parity status against the four audited workflows** ⚠️ — one client only; this table proves the catalog handles *their* needs, not the client base's:

| Workflow | v1 covers | Gap |
| --- | --- | --- |
| Input Campaign | ✅ fully (message trigger → filter → find CRM → update) | none |
| Label New | ✅ fully (label trigger → router → find/update CRM), collapses 136 → ~12 nodes | none |
| Social Media Tracker | ✅ fully (status + label triggers → find-or-create CRM) | needs IG/TikTok as trigger channel scopes ⚠️ |
| Voucher bayar di klinik | ⚠️ partial | needs **HTTP node** (P1) for the Apps Script voucher pool, and **CRM field-changed trigger** (P0) for the disabled booking mechanism |

**Fix the known bugs during migration.** The audit surfaced nine live defects across five workflows at two clients (Section 1.2c). Migration is the moment to fix them, and each fix is a demonstrable client-facing win — 🔵 worth framing to the CTO as the launch narrative: *"we migrated your workflow and fixed the bugs you didn't know you had."*

---

## 11. Risks and open decisions

### 11.1 Top risks

| # | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| R1 | **Canvas builder + engine in 6–8 weeks with 2–3 new engineers is tight.** | High | Engine ships API-first (Phase 1) and is usable/dogfoodable before the canvas exists. Use React Flow rather than building graph primitives. Manifest-driven config panel means node work is backend-only. If the canvas slips, the milestone is still a working engine with migrated internal workflows. |
| R2 | **CRM change-event source may not exist** — "CRM field changed" is P0 and load-bearing for migration. | High | Week-1 spike (Section 12). If no hook exists, an outbox table on CRM writes is the fallback; if that is also blocked, this trigger moves to P1 and Voucher-style workflows stay on n8n longer. |
| R3 | Bypassing Marketing helpers silently breaks CAPI/TikTok attribution for migrated clients. | High | Hard requirement in Section 5.4: actions call `wrapAssignLabelToConvo` and equivalents. Add a test asserting Meta/TikTok dispatch fires from the automation path. |
| R4 | Expression language too limited; clients hit a wall and churn back to n8n. | Medium | HTTP + AI escape hatches; n8n stays available; track blocked cases explicitly as v2 input rather than guessing. |
| R5 | Execution-log volume repeats n8n's bloat failure inside our own Postgres. | Medium | Section 7.5 retention design from day one; table-size dashboard in week one of production. |
| R6 | New engineers ramping on an unfamiliar domain slows Phase 1. | Medium | Phase 0 produces the node-manifest spec and interface contracts so the three streams (engine / adapters / builder) are independently workable. First tickets are individual node adapters — small, bounded, and a good way to learn the domain. |
| R7 | Legal position on current n8n embedding is unresolved. | ⚠️ Unknown | Get a legal read this week. It changes urgency, not direction. |
| R8 | **The evidence base is still only two clients.** Four audited workflows and the 46-workflow account are Euromedicagroup — a heavy user whose needs may be atypical; the fifth audited workflow (Ticket Automation) is one data point from a second, unrelated client. Scope has already grown twice — once from a fuller look at the Euromedicagroup account (batch-sync workflows), once from the second client (a third workflow shape, plus the token-leak finding). Every other client is still unexamined. | **High** | P0-7 census across all clients in week 1, before Phase 1 scope locks. Section 5 priorities explicitly provisional (Section 1.0). Hold ~20% of Phase 1 capacity unallocated. Manually audit workflows from 2–3 other clients to test whether the defect pattern generalises. |
| R9 | **Batch runs break assumptions built for event runs** — minutes-long executions, thousands of step records, worker restarts mid-loop. | Medium | Designed for in P1-7c rather than retrofitted: wall-clock limits, loop checkpointing, aggregated loop step-logging. |
| R10 | Live execution streaming is real infrastructure (SSE fan-out, per-business isolation, backpressure under loop-heavy runs) and can quietly consume a large slice of Phase 2. | Medium | De-risked by the P0-8 spike; the Executions view must degrade to polling so a streaming slip doesn't block the milestone. |
| R11 | **"ALL FUNCTIONS" expectation vs. a scoped v1 catalog.** The CEO's requirements ask for every Cekat function to be callable; v1 ships ~20 nodes. Risk is the release reading as incomplete against a stated expectation. | **High** | Reframe to "everything reachable, most-used hand-built" — HTTP node against our own Open API covers the tail from day one (Section 11.2, tension 1). Needs explicit agreement, not assumption. |
| R12 | **Sequencing disagreement on segment/CDP triggers.** They lead the CEO's trigger list but are v2 here. If he expects them in v1, Phase 1 scope changes materially. | **High** | Design the trigger registry so they're ordinary adapters — makes the ordering reversible rather than architectural (Section 11.2, tension 2). Get a ruling before Monday. |
| R13 | 🔴 **Live credential exposure in an existing production workflow.** The Ticket Automation audit (Section 1.1b) found dozens of HTTP nodes with plaintext bearer tokens for both Cekat's ticket API and a client's CMS, readable by anyone who can view or export the workflow JSON. This is a security incident in the current n8n setup, not a risk to the Cekat Automations build. | **Urgent, unrelated to this decision's timeline** | Rotate the exposed tokens and move all affected nodes to n8n's own credential store **now** — this doesn't wait for a build-vs-n8n decision. Flag to security/CTO immediately if not already known. Cekat Automations' typed `ref:credential` config type (Section 4.4) prevents the same class of mistake going forward. |

### 11.2 Open decisions for the CTO

*(Tensions 1–2 above are also decisions, and the most time-critical ones — they change what engineers start on Monday.)*

1. **Legal review of the current n8n arrangement.** ⚠️ Unresolved licensing questions under the Sustainable Use License. Answer sets migration urgency rather than direction.
2. **Per-conversation run serialization.** Do we guarantee ordered execution per conversation in v1? The mutual-exclusivity label logic (Hot removes Warm removes Cold) is order-sensitive. Costs throughput and adds a keyed queue; the alternative is documented eventual consistency. **Recommendation: 🔵 yes, keyed by conversation_id** — the correctness risk is client-visible.
3. **Automations vs. Chat Flows.** Two rules engines now exist (`flows_actions.js` for in-conversation branching, Automations for out-of-band events). Converge, or keep the boundary? **Recommendation: 🔵 keep separate in v1, revisit at v2** — but a stated boundary is needed now so clients aren't confused about where to build.
4. **Where does the CRM field-changed event come from?** (R2) Needs an owner and a week-1 answer.
5. **n8n sunset commitment.** Do we commit publicly to a sunset date, or keep it indefinitely as the advanced tier? Affects how hard we push HTTP-node capability.
6. **Do we need folders/projects inside a business?** One client's 46 workflows in a flat list is unmanageable — but ⚠️ we don't know how many clients get near that. **Recommendation: 🔵 tags + search in v1; let the census's workflows-per-client distribution decide whether folders are needed before full release.**
### Two tensions with the CEO's requirements

Full line-by-line trace in Appendix C. Most of the requirements are already specified; these two are genuine conflicts and need resolving before Monday, because they change what engineers build.

**Tension 1 — "ALL FUNCTIONS! / All cekat functions" vs. a scoped catalog.**
The requirements ask for *every* Cekat function to be callable from an automation. Section 5 deliberately ships a subset. These cannot both be true in v1.

🔵 **Recommendation: reframe from "all functions" to "all functions reachable, none hand-built."** The node manifest (Section 4.4) makes each new action a manifest plus a thin handler — days, not weeks. Combined with the **HTTP request node calling our own Open API**, any Cekat function with an API route is *already* reachable in v1 even before it has a first-class node. So the honest answer is: "everything is reachable on day one; the most-used 20 get proper nodes, and the rest get promoted on demand." That satisfies the intent — no client blocked — without pretending we can spec 100 nodes in six weeks. ⚠️ It does require the Open API to actually cover the functions clients want, which the census will test.

**Tension 2 — segment and CDP triggers are central to the CEO's model, but v2 in this plan.**
The requirements open with *"Pure CDP / Contact property change / Message"* as the trigger sources and list *"by segment"* first among filters. Section 5 has CDP-event triggers and segment filters as v2, on the reasoning that conversation-ops is the migration-blocking work.

⚠️ **This is the sequencing disagreement most likely to surface in review, and the CEO may simply be right.** The two readings:

- *Mine:* clients are on n8n today doing conversation and CRM work. Migrating them is the urgent problem; segment-triggered marketing is net-new capability with no existing users to rescue.
- *His:* the CDP and segmentation investment is already made and idle — nothing acts on it. Automation is what closes that loop, and conversation ops is the less differentiated half.

Both are defensible and they imply different Phase 1s. 🔵 **Recommendation: hold v1 as specified, but design the trigger registry and filter model so segment and CDP events are ordinary trigger types** — no engine change to add them, only adapters. Then the decision becomes "which adapters ship first," reversible at any point, rather than an architecture commitment. **This needs an explicit ruling, not an assumption.**

### Open decisions

7. **Can an automation stop or override an outgoing reply?** The requirements ask for it (*"stop reply override replynya"*). It implies automations run **synchronously in the message-send path**, which contradicts the fire-and-forget rule that keeps automation failures from breaking conversations (Section 7.1). Doing it safely needs a bounded-timeout synchronous hook with a fail-open default — a different execution mode, not another node. **Recommendation: 🔵 out of v1; design properly in v2.** Block-AI covers the adjacent need meanwhile.
8. **Build the engine into the existing modular monolith, or as a separate service?** ⚠️ The App Development doc's direction is toward microservices. Automations is a natural extraction candidate (own queue, own storage lifecycle), but a separate service adds cross-boundary latency to every action call. **Recommendation: 🔵 start inside the monolith behind a clean module boundary, with storage separated so extraction is later possible.**

---

## 12. Delivery plan

**Team:** 2–3 newly-joining engineers + design part-time. **Start:** 2026-08-03. **Milestone 1:** ~2026-09-25 (8 weeks).

Three streams are defined so they can proceed in parallel after Phase 0, with contracts rather than code as the interface.

### Phase 0 — Foundations (week 1)

| ID | Item | Owner |
| --- | --- | --- |
| P0-1 | **Spike:** CRM change-event source — does a hook exist, or do we need an outbox table? *(unblocks R2, highest priority)* | Backend |
| P0-2 | Node manifest schema + JSON Schema validator; the contract all three streams code against | Backend |
| P0-3 | Data model + migrations: `automations`, `automation_versions`, `automation_triggers`, `automation_runs`, `automation_steps`, `automation_lookup_tables` | Backend |
| P0-4 | Graph validation rules spec (required ports, broken refs, unreachable nodes, cycles) | Backend |
| P0-5 | **Spike:** React Flow — node rendering, ports, custom edges; throwaway prototype | Frontend |
| P0-6 | Run-context and expression-evaluator design doc | Backend |
| P0-7 | **n8n workflow census across ALL clients** — scripted export; per-business counts, node-type histogram, trigger types, last-execution dates, dead-workflow flags, shape clustering. **Highest-value task in Phase 0** — everything in Section 5 and Section 10 is currently extrapolated from one client (Section 1.0, R8). Output re-ranks Section 5 before Phase 1 scope locks. | Backend |
| P0-7b | **Manual audit of 2–3 workflows from other clients** — same depth as the four originals. Tests whether the defect pattern in Section 1.2c is general or one client's build habits. | PM + Backend |
| P0-8 | **Spike:** live-execution push channel (SSE + Redis pub/sub) — prove the transport before Phase 2 depends on it | Backend + Frontend |

**Exit criteria:** manifest schema frozen; migrations merged; CRM trigger source decided; **census delivered and Section 5 priorities formally re-ranked against it** — this is a gate, not a nice-to-have. If the census reveals a new workflow shape, Phase 1 scope is revised before it starts.

### Phase 1 — Engine, API-first (weeks 2–5)

| ID | Item |
| --- | --- |
| P1-1 | Graph executor: node walk, port routing, context accumulation, terminal statuses |
| P1-2 | Expression evaluator + function library (string, date w/ workspace timezone, number, `lookup()`) |
| P1-3 | Dispatcher: trigger registry, scope pre-filtering, BullMQ enqueue |
| P1-4 | Trigger adapters — message received, conversation status changed, label added/removed, CRM record created, CRM field changed, **schedule/cron** |
| P1-5 | Action adapters — add/remove label, set pipeline status, send message *(must route through existing wrapped helpers — see R3)* |
| P1-6 | CRM nodes — find / create / update / find-or-create, with match strategies |
| P1-7 | Logic nodes — Filter, Condition, Router (w/ mandatory fallback), Stop, Lookup table, **Loop** (bounded, aggregated step logging), **Wait** (durable) |
| P1-7b | **HTTP request node** — allowlist, credential store, timeouts, size caps, SSRF guards. Load-bearing for batch-sync workflows, so it is Phase 1 not Phase 3. |
| P1-7c | **Long-running run support** — wall-clock limits sized for batch, loop checkpointing, partial-failure semantics |
| P1-8 | Run + step persistence, retention policy, object-storage payload offload |
| P1-9 | Retry, idempotency, loop protection, concurrency limits |
| P1-10 | REST API (Section 9) incl. `/automation-node-types` |
| P1-11 | CDP attribution on all side effects (`automation_id`, `node_id`, `run_id`) |
| P1-13 | **Datadog instrumentation** — run/step state transitions as metrics tagged by `business_id`, `automation_id`, terminal status; run duration; queue depth. Built alongside the executor, not bolted on (Section 2.3). |
| P1-12 | **Dogfood:** rebuild "Label New" as a JSON-authored automation; verify ≤ 15 nodes and behavioural parity in shadow mode |
| P1-14 | **Existence filters** — conversation exists, conversation-in-window, CRM record exists (Section 5.2). 🔵 Share the condition model with Segmentation rather than reimplementing. |
| P1-15 | **Conversation-inactivity trigger** + its sweeper/scheduler mechanism (Section 5.1) |
| P1-16 | **Wait re-check on resume** — re-evaluate filter after a delay, `abandoned` port (Section 5.3, the CEO's "post cron filter") |

**Exit criteria:** an automation can be created via API, published, triggered by a real event, and produces correct side effects with a readable run log. **This is a shippable milestone even if no UI exists.**

### Phase 2 — Builder (weeks 4–8, overlapping)

| ID | Item |
| --- | --- |
| P2-1 | Canvas shell — React Flow, palette, pan/zoom/minimap, node add/connect/delete |
| P2-2 | Manifest-driven config drawer (all field types) |
| P2-3 | `ref:*` pickers wired to live inbox/board/column/label/agent APIs |
| P2-4 | Condition-row builder with type-scoped operators |
| P2-5 | Expression input with context autocomplete + save-time path validation |
| P2-6 | Inline validation badges; publish-blocking error list |
| P2-7 | Test run: sample-event picker, dry-run execution, per-node input/output display |
| P2-8 | Workflows list page — trigger summary, last-run outcome, status, edited-by |
| P2-9 | Executions: two-pane list + run detail, executed path highlighted on the graph |
| P2-10 | **Live execution stream** — SSE subscription, new runs appear without refresh, in-progress runs update in place, node-by-node highlight on the open run *(depends on P0-8)* |
| P2-11 | Enable/disable toggle (list + header), draft/publish flow, version history panel, **restore any version**, read-only historical view |
| P2-12 | Version diff (node-level) — *cut candidate if Phase 2 is tight; restore ships without it* |

**Exit criteria (Milestone 1):** a Cekat solution engineer rebuilds "Social Media Tracker" entirely in the UI, publishes it, and runs it in shadow mode against the live n8n workflow.

### Phase 3 — Hardening & first migrations (weeks 9–14)

Audit log · Credentials management UI · AI step · inbound webhook trigger · remaining P1 action adapters (assign agent, resolve, block AI, notifications, contact property) · n8n workflow analyser · shadow-mode diff tooling · first 3 client migrations with CS · **Grafana dashboards** for per-client run volume and error rate (CS-facing) · Datadog alerts on error rate and run/step table size · **agree the "automation didn't fire" ticket tag with CS** (needs a pre-launch baseline) · load test at projected event *and* batch volume.

⏸️ **RBAC removed from the delivery plan for now** (Section 8) — not scheduled in v1. Anyone with Automations access can publish/enable/disable until it ships; flagged for explicit CTO sign-off before migrating clients whose CS/admin split matters.

**Exit criteria (full release):** 3 clients fully migrated, zero regressions, error rate < 1%.

### Phase 4 — v2 (post-release)

Segment entered/exited triggers · frequency capping & suppression · campaign/broadcast actions · holdout groups (MRKT RFC dependency) · CDP custom-event triggers · order triggers · multi-trigger automations · sub-automations · merge node · templates library.

### Suggested split for three engineers

| Engineer | Focus | Rationale for a new joiner |
| --- | --- | --- |
| **E1 — Engine** | Executor, expressions, dispatcher, retry/idempotency, run persistence | Self-contained; deep but narrow domain surface; learn Cekat's event flow |
| **E2 — Adapters & API** | Trigger/action/CRM adapters, REST surface, CDP attribution | Best onboarding path — each node adapter is a small, shippable, reviewable ticket that teaches one part of the platform |
| **E3 — Builder** | Canvas, config drawer, validation, test run, run views | Parallel from week 1 against the frozen manifest schema; blocked by nothing after Phase 0 |

---

## 13. Appendix A — evidence base

| Source | Used for |
| --- | --- |
| [[Areas/Automation/n8n Workflows/Label New]] | 136 nodes / 8,600 lines; 34× duplication; expression typo; wrong-board writes; dead branches |
| [[Areas/Automation/n8n Workflows/Social Media Tracker]] | 28× duplication; TikTok unwired "open" branch; missing `.setZone`; 3 orphaned webhooks |
| [[Areas/Automation/n8n Workflows/Voucher bayar di klinik]] | equals-vs-contains silent drop; trailing-space label; inconsistent retry config; CRM-field-change trigger requirement; HTTP/Apps Script pattern |
| [[Areas/Automation/n8n Workflows/Ticket Automation]] | second client (PT AJ Central Asia Raya); third workflow shape — bidirectional external CMS sync via inbound + outbound webhooks; hardcoded live API tokens (Risk R13); independently-reproduced silent-failure-on-no-op bug; call-and-link external sync primitive (Section 4.5) |
| Input Campaign (memory note) | `Search → Split Out → Limit(last) → Update` canonical pattern; `Limit(lastItems)` ordering risk |
| [[Areas/Automation/n8n — Features & Capabilities]] | Licensing (Sustainable Use / OEM / white-label position), pricing & overage, execution-bloat and TOAST failure modes, multi-tenancy limits, 2.0 breaking changes |
| [[Resources/Marketing Documentation Library/Knowledge Base/cekat-marketing-module-architecture]] | `/business_workflows/*` route inventory, n8n provisioning flow, `workflows_auth`, BullMQ queue patterns, hot-path reliability rules, `wrapAssignLabelToConvo` side effects |
| [[MRKT_Automation_RFC_v1]] | v2 segment-trigger scope, suppression/frequency capping, holdout requirement, builder-simplicity guidance |
| [[Resources/2026-06-29 — App Development]] — Automation section | Founder requirements: trigger→filter→action, drag-drop, complete logs, node-level labelling for CDP attribution, live action tracker, cron with pre-execution filter, CAPI callable from automations |
| [[Areas/Marketing/Marketing Dashboard/PRD — Segmentation (Builder & Segment Management)]] | Segment definition as the v2 trigger primitive |

## 14. Appendix B — worked example

**"Label New," today in n8n:** 136 nodes, 8,600 lines, 11 triggers, the same 4-node chain 34 times, 3 live bugs.

**The same behaviour in Cekat Automations:**

```
[Trigger] Label added
   scope: inboxes = [SKIN+ AI, SKIN+ Telesales, SLIM+ AI,
                     SLIM+ Telesales, Skin+ Ecommerce, Eurohairlab]
   labels = [Cold, Warm, Hot, No Response, Spam, Out Of Area]
        │
        ▼
[Data] Find CRM record
   board  = lookup(inbox_to_board, {{ trigger.inbox }})
   match  = Phone is {{ trigger.contact.phone }}
   on multiple → most_recently_updated
        │ found                    │ not found          │ multiple
        ▼                          ▼                    ▼
[Logic] Router on {{ trigger.label }}     [Stop: "no CRM record"]  → (same)
   ├ Cold        → [CRM] Update: Label Cold  = {{ now + 1 day }}
   ├ Warm        → [CRM] Update: Label Warm  = {{ now + 1 day }}
   │                [Action] Remove label: Cold
   ├ Hot         → [CRM] Update: Label Hot   = {{ now + 1 day }}
   │                [Action] Remove labels: Cold, Warm
   ├ No Response → [CRM] Update: No Response = {{ now + 1 day }}
   ├ Spam        → [CRM] Update: Spam        = {{ now + 1 day }}
   ├ Out Of Area → [CRM] Update: Out of Area = {{ now + 1 day }}
   └ fallback    → [Stop: "unmapped label"]   ← mandatory; logged, not silent
```

**12 nodes.** Timezone from workspace settings, so the missing-`.setZone` bug cannot occur. Boards from a lookup table, so wrong-board writes cannot occur. Labels from a picker, so the stray `x` cannot occur. Fallback mandatory, so unmapped labels are logged rather than dropped. Adding a seventh inbox is one entry in the trigger scope and one row in the lookup table — not 6 copy-pasted nodes.

*This diagram is the slide for the CTO conversation.*

---

## 15. Appendix C — traceability against the CEO's requirements

Source: the Automation section of [[Resources/2026-06-29 — App Development]], supplied as the CEO's expectations for this product. Every line traced. Status is deliberately blunt.

**✅ specified · ⚠️ specified with a caveat · 🔴 conflict needing a ruling · ➕ added to the spec because of this review**

### Top-level

| Requirement | Status | Where |
| --- | --- | --- |
| Bisa create multiple automations | ✅ | 6.1, 6.2 — business-scoped list, create/duplicate |
| **LOGS! LENGKAPP!** | ✅ | 6.9 — Executions view: every run listed live, per-node input/output, executed path on the graph, filterable by status/date/workflow and searchable by run ID — direct fix for IT delivery's reported pain of manually scrolling n8n's execution list by timestamp to find a client-reported error. ⚠️ One detail to confirm: payload bodies of *successful* runs age out (7.5) to avoid n8n's table-bloat failure; run history, statuses and errors persist far longer |
| Trigger → Filter → Action | ✅ | 4.1, 4.3 — the graph model is a superset of the 3-stage pipeline; a linear T→F→A automation is the common case |
| Automation drag drop | ✅ | 6.0, 6.4 — n8n-style canvas, React Flow |

### Trigger sources — "Pure CDP / Contact property change / Message"

| Requirement | Status | Where |
| --- | --- | --- |
| Message | ✅ P0 | 5.1 |
| Contact property change | ✅ P1 | 5.1 |
| Pure CDP | 🔴 **Tension 2** | 5.1 — CDP-event triggers are v2. Leads the CEO's list; needs a ruling |
| Bisa cron (daily jam 9) | ✅ P0 | 5.1 — schedule trigger, time-of-day in business timezone |
| Bisa on trigger | ✅ P0 | 5.1 — event triggers |
| **Bisa by chat delay** | ➕ **added P0** | 5.1 — conversation-inactivity trigger. ⚠️ Was entirely missing; needs the CEO to confirm I've read it right |

### Filter

| Requirement | Status | Where |
| --- | --- | --- |
| By segment | 🔴 **Tension 2** | 5.2 — v2. Listed first by the CEO |
| Contact property | ✅ P0 | 5.2 |
| **If exist'an / if conversation exist** | ➕ **added P0** | 5.2 — existence filters. Was under-specified; now its own filter shape |

### Pre-action

| Requirement | Status | Where |
| --- | --- | --- |
| AI analysis | ✅ P1 | 5.4 — AI step, structured classify/extract |
| Bisa cron | ✅ P0 | 5.3 — Wait node |
| Cron based on time (jam brp) | ✅ P0 | 5.3 — Wait until time-of-day, business timezone |
| **Post cron filter** | ➕ **added P0** | 5.3 — re-check on resume + `abandoned` port. The subtlest item in the notes and it was missing |

### Actions

| Requirement | Status | Where |
| --- | --- | --- |
| Call CAPI functions | ✅ P1 | 5.4 |
| Label | ✅ P0 | 5.4 |
| **Update session auto** | ➕ **added P1** | 5.4 — session field writes. ⚠️ Route needs confirming |
| Open webhook | ✅ P0 | 5.4 — HTTP request node |
| **Call client's webhook** | ➕ **added P0** | 5.1, 5.4, 4.5 — confirmed as a real requirement by the Ticket Automation audit (Section 1.1b): inbound webhook trigger promoted to P0, new Ticketing domain, and the "call-and-link external sync" primitive for calling out to a client-controlled endpoint and writing the returned ID back onto the Cekat record — with a mandatory typed credential reference, the direct fix for the token-leak defect the same audit found |
| Automation calls custom event | ✅ P1 | 5.4 — fire custom event, attributed |
| **ALL FUNCTIONS / All cekat functions** | 🔴 **Tension 1** | 11.2 — proposal: everything *reachable* day one via HTTP against our own Open API; ~20 most-used get first-class nodes; promotion on demand |
| Manipulasi data-nya | ✅ P0 | 5.4 — Set variable / Format |
| **Stop reply / override reply** | 🔴 **decision 7** | 5.4 — implies synchronous execution in the send path, which conflicts with the fire-and-forget hot-path rule (7.1). Needs design; v2 |
| Sequence actions | ✅ P0 | 4.1 — inherent in the graph |
| Active sequence apa aja? | ✅ P0 | 6.9 — live execution stream shows in-flight and waiting runs |
| Loggings | ✅ | 6.9 — same as above |

### Related requirements from the same source

| Requirement | Status | Where |
| --- | --- | --- |
| Node-level labelling so CDP knows which automation and which node caused an event | ✅ P0 | 7.6 — `automation_id`, `node_id`, `run_id` on every side effect |
| Automation execution visible in CDP | ✅ P0 | 7.6 |
| Live tracker of ongoing actions | ✅ P0 | 6.9 |
| Automation can call marketing events | ✅ P1 | 5.4 |

### Summary

- **5 capabilities added** to the spec as a direct result of this trace: chat-delay trigger, existence filters, post-wait re-check, session updates, and the call-and-link external sync primitive (confirmed by the separate Ticket Automation audit, Section 1.1b). Four are P0. The chat-delay trigger in particular unlocks follow-up and SLA automations the catalog previously couldn't express at all.
- **2 conflicts** need a ruling before Monday (Section 11.2): "all functions" scope, and whether segment/CDP triggers belong in v1.
- **1 requirement deferred** with reasoning: stop/override reply, because it needs a synchronous execution mode rather than another node.
- Everything else was already specified.

⚠️ The notes are terse and in places ambiguous — *"bisa by chat delay"* and *"post cron filter"* are my readings, not certainties. Both are worth confirming directly rather than building on my interpretation.
