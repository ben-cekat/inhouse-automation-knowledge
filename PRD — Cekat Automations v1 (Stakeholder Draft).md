---
title: "PRD — Cekat Automations v1 (Stakeholder Draft)"
type: prd
status: draft-for-review
created: 2026-08-07
author: Ben
consumers: [ceo, product, engineering, design, IT delivery]
source_documents:
  - "PRD — Cekat Automations v1 (Simplified Scope Draft).md"
  - "In House Automation Phases Scope - Versions Plan.csv"
  - "In House Automation Phases Scope - Breakdown.csv"
---
# Cekat Automations V1

## 1. Executive summary

Cekat Automations V1 is a new, in-house automation platform that lets businesses create and run useful automations through a non-technical-friendly drag-and-drop builder.

V1 is a **working automation platform, not a complete catalog of every Cekat capability**. It uses **Activepieces as its workflow-engine backbone**, with Cekat-specific nodes, validation, observability, and safety controls built around it. V1 prioritizes a resilient and scalable architecture, a simple builder, permanent searchable execution logs, and safe isolation between automations. Chat and CRM are the core domains. Orders, Tickets, and other Cekat capabilities are prioritized extension domains whose initial node coverage will depend on workflow demand, existing API/webhook support, and engineering capacity.

The platform will launch alongside n8n. Existing n8n automations continue to run while Cekat Automations is introduced gradually. Existing workflows are migrated deliberately, through manual rebuilds, rather than through automatic import.

## 2. Architecture decision

**Decision:** Use **Activepieces** as the workflow-engine backbone for Cekat Automations V1.

Activepieces provides the underlying workflow runtime and builder foundation. Cekat will build the product-specific layer around it, including:

- Cekat-native triggers and actions
- Business-scoped resource references and validation
- Cekat-specific execution logs and search
- Error containment and operational safeguards
- Node prioritization based on Cekat workflows and API/webhook documentation
- n8n coexistence and gradual migration support

This decision reduces the amount of workflow infrastructure Cekat must build from scratch while preserving the product requirements that Activepieces does not provide out of the box.

## 3. Problem

Current client automations run in n8n and create two major problems:

1. **Setup is difficult and dependent on Cekat staff.** Clients cannot reliably build and maintain automations themselves, which increases setup time and operational workload.
2. **Debugging is difficult.** Execution information is scattered, difficult to search, and may disappear after 24 hours. IT Delivery often has to trace executions manually by timestamp.
3. **Workflow errors are easy to create.** Free-text IDs, unconnected branches, duplicated logic, and exposed credentials create correctness, maintenance, and security risks.
4. **The platform is not sufficiently domain-aware.** n8n provides broad general-purpose capabilities but does not understand Cekat objects such as inboxes, labels, CRM boards, or business-scoped references.

## 4. V1 goals

### Primary goals

- Provide a working automation platform that reduces manual setup and support effort.
- Establish a resilient, scalable, business-scoped execution backbone.
- Enable non-technical users to create and manage common automations.
- Make every execution permanently searchable and understandable.
- Contain failures so one automation cannot affect other automations, businesses, or the platform.
- Support incremental addition of new nodes without redesigning the platform.
- Run safely alongside existing n8n workflows during gradual migration.

### Success indicators

V1 is successful when:

- A user can create, configure, test, publish, enable, and disable an automation in the builder.
- A basic Chat or CRM automation can run end-to-end with correct side effects.
- IT Delivery can find a specific execution by execution ID, workflow, status, or date range.
- A user can inspect which node caused an action or failure.
- A failing or runaway automation is isolated and can be disabled without affecting other businesses.
- New nodes can be added incrementally through the platform's node contract and adapters.
- Existing n8n workflows continue operating while selected workflows are manually rebuilt and migrated.

## 5. Users

| User | Need in V1 |
| --- | --- |
| Client admin / operations lead | Build and manage useful automations without relying on an engineer for every change |
| Cekat IT Delivery / CS | Quickly determine whether an automation ran, what it did, and where it failed |
| Cekat engineers | Operate a stable execution platform and add nodes without changing the core engine |
| Product and leadership | See adoption, reliability, workload reduction, and migration progress |

## 6. Product principles

1. **Platform first, node coverage second.** A stable automation backbone is more important than promising every possible node in the first release.
2. **Domain-native where possible.** Use typed, business-scoped references for Cekat objects instead of free-text IDs.
3. **Nothing fails silently.** Non-matches, skipped branches, and failures must have visible run outcomes.
4. **Safe by default.** Credentials must not be exposed in workflow configuration or logs. Failures must be contained.
5. **Familiar but simpler.** Use a drag-and-drop canvas similar to the current n8n experience, while reducing irrelevant complexity for Cekat users.
6. **Incremental extensibility.** Nodes should be added without redesigning the backbone.

## 7. V1 scope

### 6.1 Builder and product surface

V1 includes:

- Automation section in the Cekat dashboard
- Multiple automations per business
- Workflow list and basic workflow management
- Drag-and-drop canvas
- Node palette and node configuration drawer
- Typed pickers for available Cekat resources where supported
- Expressions or references for passing data between nodes
- Test or dry-run capability
- Enable/disable controls
- Publish validation
- Basic version history and restore, subject to implementation capacity

### 6.2 Execution and reliability

V1 includes:

- API-first workflow execution engine
- Business-scoped automations and executions
- Trigger → filter/condition → optional data or AI step → action flow
- Run-level execution records
- Node-level status, duration, input/output summary, and error attribution
- Permanent execution storage; logs must not disappear after 24 hours
- Searchable execution history by:
  - Execution ID
  - Workflow
  - Status
  - Date range
- Live view of currently running automations
- Explicit terminal states, including success, failure, and filtered/skipped outcomes
- Error containment between automations and businesses
- Protection against runaway or looping executions
- Automation attribution on automation-generated side effects where supported

### 6.3 V1 automation capabilities

V1 follows this general structure:

> **Trigger → Filter/Condition → optional Data or AI step → Action**

#### Core trigger domain: Chat and conversation

The initial target includes nodes for capabilities such as:

- Message received
- Message sent, if supported by the existing event surface
- Label added or removed
- Conversation status changed
- Pipeline status changed, if supported by the existing event surface
- Conversation assigned, if supported by the existing event surface

#### Core trigger domain: CRM

The initial target includes:

- CRM record created
- CRM record changed
- Contact property changed, subject to the availability of a reliable change-event source

#### Extension domains: Orders and Tickets

Orders and Tickets are prioritized V1 extension domains, not promises of complete domain coverage.

Initial nodes may be included when they have:

- A reliable existing webhook or Open API surface
- A clear workflow need identified through the workflow census
- A testable and supportable implementation
- Sufficient capacity within the V1 delivery plan

The V1 commitment is to make the platform extensible to these domains, then deliver the highest-value nodes first.

#### Filters and flow control

- Contact-property comparison
- CRM record or related-record existence check
- Condition / If
- Router / Switch with a mandatory fallback branch
- Sequential execution of connected actions

#### Data and AI steps

- Format and manipulate strings, dates, and numbers
- Set named outputs for later nodes
- Find CRM record
- AI analysis step for classification or extraction, if the required AI interface is confirmed
- Generic webhook/Open API call as an escape hatch for capabilities without a first-class node

#### Actions

The initial action target includes:

- Add label
- Remove label
- Call webhook / HTTP endpoint
- Create CRM record
- Update CRM record or CRM table
- Call CAPI
- Update session field
- Fire custom CDP event

These action categories are prioritized, not a guarantee that every variation of each Cekat function ships in the first V1 build.

## 8. V1 node commitment model

V1 uses a **target-and-prioritize** model rather than a rigid promise of a fixed node count.

- Product and engineering may define a target node set, for example approximately 30 nodes.
- The final V1 release may contain fewer nodes if the backbone, builder, reliability, and logs are working correctly.
- The initial nodes are selected using:
  1. Workflow census results
  2. Existing webhook/Open API support
  3. User impact and workload reduction
  4. Implementation and testing effort
  5. Operational and security risk
- Additional nodes can be added after launch without changing the core engine.

## 9. Explicitly out of V1

The following are not V1 commitments:

- Complete coverage of all Cekat functions
- CDP or segment-based triggers and filters
- Campaign, broadcast, or lifecycle marketing automation
- Schedule / cron trigger
- Conversation inactivity / chat-delay trigger
- Wait/delay with condition re-check on resume
- Stop or override an outgoing reply
- Automatic import of n8n workflows
- Arbitrary JavaScript or Python code execution
- Large connector or marketplace ecosystem
- AI agent orchestration, memory, or RAG
- Large-scale ETL or media processing

These capabilities may be considered for V2 or later based on demand and architecture readiness.

## 10. n8n coexistence and migration

n8n remains in use during V1:

- Existing n8n workflows continue running.
- New Cekat Automations are introduced gradually.
- Existing n8n bugs remain an operational responsibility and must continue to be fixed.
- Migration is a deliberate, per-workflow rebuild and validation process.
- No automatic n8n import is required for V1.
- n8n is not retired until there is a documented path for the workflows that still depend on it.

V1 must therefore include an operational strategy for maintaining both systems at the same time.

## 11. Delivery approach

### Phase 1: Foundation and prototype

Planned activities:

- Census existing client workflows
- Census existing nodes and recurring workflow patterns
- Break down and prioritize custom nodes
- Select or create the execution backbone
- Define the node and workflow contract
- Build the initial builder UI
- Produce an automation proof of concept and working prototype

### Phase 2: Initial node delivery

Planned activities:

- Develop prioritized Cekat-native nodes
- Connect nodes to existing webhook and Open API surfaces
- Validate end-to-end workflows
- Expand the working prototype into a usable V1 platform

### Team assumption

- Two backend engineers are expected to support the automation work.
- Frontend support remains available through Iwan, subject to his design-system commitments.
- Scope must remain capacity-aware; node coverage may be reduced without invalidating V1 if the platform backbone and core workflow are usable.

## 12. User scenarios

### Scenario 1: Client admin builds a Chat automation

A client admin creates an automation that runs when a message is received, checks a contact or conversation condition, and adds or removes a label.

**Expected outcome:** The admin can configure the trigger and typed references, test the workflow, publish it, enable it, and verify the result from the execution history without engineering help.

### Scenario 2: Client admin builds a CRM automation

A client admin creates an automation that runs when a CRM record is created or changed, checks whether a related record exists, and creates or updates CRM data.

**Expected outcome:** The workflow uses business-scoped CRM references, rejects invalid configuration before publishing, and records the resulting actions against the automation and node that performed them.

### Scenario 3: IT Delivery diagnoses a failed execution

A client reports that an automation did not work. IT Delivery searches by execution ID, workflow, status, or date range and opens the run details.

**Expected outcome:** IT Delivery can see the trigger, each node's status, the failure reason, and the affected business without accessing n8n or manually searching by timestamp.

### Scenario 4: A runaway automation is contained

An automation enters repeated failures or exceeds its execution limits.

**Expected outcome:** The platform stops or disables the affected automation according to configured safeguards, while other automations, businesses, and platform workloads continue operating normally.

### Scenario 5: Engineering adds a new node

An engineer adds a prioritized Orders, Tickets, Chat, CRM, or other Cekat capability using an existing webhook or Open API surface.

**Expected outcome:** The node can be added through the platform's node contract and adapter pattern without redesigning the execution backbone or existing workflows.

### Scenario 6: Cekat operates n8n and Cekat Automations together

An existing n8n workflow continues running while a selected workflow is manually rebuilt and tested in Cekat Automations.

**Expected outcome:** Both systems operate safely in parallel, and the rebuilt workflow can be validated before any production cutover.

## 13. V1 acceptance criteria

V1 is accepted only when all must-have criteria below are met.

### Builder and workflow management

- [ ] A business user can create, name, save, edit, publish, enable, disable, and delete an automation.
- [ ] A business can own multiple automations, and one business cannot access another business's automations.
- [ ] A user can add, move, connect, configure, and remove nodes on a drag-and-drop canvas.
- [ ] Resource fields use validated, business-scoped pickers where a supported Cekat resource exists.
- [ ] A user can run a test or dry run before enabling an automation.
- [ ] Invalid references, missing required configuration, and unconnected required branches prevent publishing with actionable errors.

### Execution and side effects

- [ ] A published automation can execute from at least one supported Chat or CRM trigger.
- [ ] Connected conditions and actions execute in the configured order.
- [ ] Supported action side effects are attributable to the automation and node that caused them.
- [ ] A generic webhook/Open API action can call a supported endpoint without exposing raw credentials in the workflow definition.
- [ ] A non-match or skipped branch produces an explicit recorded outcome rather than a silent drop.

### Logs and diagnosis

- [ ] Every execution receives a unique execution ID.
- [ ] Execution records persist beyond the current 24-hour n8n log limitation, subject to an agreed retention policy.
- [ ] Users with permission can search by execution ID, workflow, status, and date range.
- [ ] A run detail view shows trigger data, node-level status, duration, relevant input/output summaries, and errors without exposing secrets.
- [ ] A currently running execution is visible before it reaches a terminal state.

### Safety and operations

- [ ] Automation execution is isolated by business and automation.
- [ ] A failure, loop, or resource-limit breach in one automation cannot block or materially degrade another business's automation.
- [ ] The platform has a defined containment or disablement mechanism for runaway automations.
- [ ] Credentials and sensitive values are excluded from frontend configuration, execution logs, and error messages.
- [ ] The platform emits operational metrics for execution volume, failures, duration, and storage growth.

### Extensibility and coexistence

- [ ] Engineers can add a new node through the documented node contract and adapter pattern.
- [ ] At least one prioritized non-core extension node from Orders or Tickets can be evaluated through the same backbone, or the decision to defer it is documented with evidence.
- [ ] Existing n8n workflows continue operating during V1 rollout.
- [ ] At least one selected workflow has a documented manual rebuild, test, and coexistence or migration procedure.

## 15. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Scope expands through requests for every Cekat function | Use the target-and-prioritize node model and generic API/webhook escape hatch |
| Two-engineer team cannot deliver all target nodes | Protect the backbone, builder, logs, and safety requirements; defer lower-value nodes |
| CRM change events are unreliable or unavailable | Confirm the event source early; treat it as a technical dependency |
| AI/CAPI/session/CDP interfaces require more work than expected | Validate existing APIs before committing each node to the release set |
| Existing n8n issues continue while V1 is built | Maintain a parallel support and bug-fix plan |
| Automation failures affect other workloads | Isolate execution resources and enforce limits per automation/business |
| Logs grow too quickly or become expensive | Define retention, indexing, storage monitoring, and operational alerts before launch |
| Users find the builder too technical | Test the builder with non-technical users and prioritize typed pickers and clear errors |

## 16. Open decisions

These should be resolved before the final stakeholder PRD or implementation plan:

1. Which exact initial node set is committed for V1 after the workflow census?
2. Are Orders and Tickets both included in the first V1 node batch, or only prioritized for subsequent V1 iterations?
3. What is the minimum acceptable V1 node count or workflow coverage target?
4. Is AI analysis a V1 launch requirement or a V1 extension node?
5. Are CAPI, session-field updates, and custom CDP events launch requirements or prioritized actions?
6. What exact safeguards trigger containment or automatic disabling of a runaway automation?
7. What retention and access policy applies to permanent execution logs?
8. What permissions do client admins, agents, IT Delivery, and engineers have?
9. What is the confirmed frontend capacity during the delivery period?
10. Which existing n8n workflows will be maintained, rebuilt, or migrated first?

## 17. V1 decision statement

The proposed V1 decision is:

> **Build and launch a stable, scalable, non-technical-friendly automation platform with permanent searchable execution logs and strong error containment. Make Chat and CRM the core domains, prioritize Orders and Tickets as extensible V1 domains, and deliver the highest-value nodes supported by existing APIs/webhooks and team capacity. Keep n8n running in parallel and expand node coverage incrementally.**
