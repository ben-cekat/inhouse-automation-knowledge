---
title: Cekat Automations — Activepieces Full Product Handoff v1
type: Full product engineering, UI/UX, and delivery handoff
status: proposed-for-implementation
last_updated: 2026-08-12
---

# Cekat Automations — Activepieces Full Product Handoff v1

## 1. Executive summary

Cekat Automations is a workflow automation product that enables business users to connect Cekat events to actions using a visual Activepieces-based builder.

The product experience is:

```text
Trigger → optional conditions/transformations → Action(s)
```

The first integration surface is a Cekat-specific Activepieces piece containing business webhook triggers, conversation actions, messaging actions, CRM actions, contact actions, lookups, and later order capabilities.

This document is the full-product handoff. It includes the piece contract described in detail in:

`Cekat Automations — Activepieces Piece Handoff v1.md`

## 2. Audience

- Product and Product Operations
- UI/UX and Content Design
- Frontend and builder engineers
- Backend and integration engineers
- Platform/Activepieces engineers
- QA and release engineering
- Support and operations

## 3. Goals

### V1 goals

- Make common Cekat automations configurable by non-technical business users.
- Provide reliable Cekat webhook triggers and high-value conversation/CRM actions.
- Preserve the flexibility of Activepieces while presenting a Cekat-focused experience.
- Make trigger variables and dynamic CRM fields understandable in the UI.
- Maintain safe execution through retries, idempotency, loop protection, and clear logs.
- Provide a migration path from existing n8n workflows.

### Non-goals for the initial release

- Rebuilding the entire Cekat API as dedicated actions.
- Treating undocumented Chat team endpoints as committed scope.
- Guaranteeing CRM field-specific triggers before backend event coverage is confirmed.
- Implementing financial order automation as the first release unless explicitly approved.
- Replacing all existing n8n workflows immediately.

## 4. Chat team Open API dependency

The initial product scope is based on current repository documentation, the consolidated business webhook reference, and existing n8n Cekat integrations.

Additional triggers and actions will be added in the near future when the Chat team provides the official Open API documentation.

The Open API documentation is expected to clarify:

- Complete endpoint inventory
- Request and response schemas
- Authentication and authorization
- Error codes and validation behavior
- Available webhook events
- Retry and idempotency behavior
- Webhook signature verification
- API versioning and deprecation policy

Until that documentation is delivered and reviewed:

- Current documented capabilities may be implemented as MVP candidates.
- Incomplete capabilities must be labeled `Requires validation`.
- New undocumented capabilities must be labeled `Planned`.
- Events without a verified emitter must be labeled `Blocked`.
- The generic HTTP/API action is the interim escape hatch for approved use cases.

This dependency is a planned near-term expansion, not a reason to block the initial builder and piece foundation.

## 5. Product boundary

### Activepieces provides

- Workflow execution primitives
- Trigger and action lifecycle
- Flow persistence and versioning primitives, subject to deployment configuration
- Expression and variable mapping
- Scheduling and execution infrastructure where enabled
- Standard execution and error concepts

### Cekat product layer owns

- Cekat-branded piece and node naming
- Cekat credential setup
- Cekat webhook subscription lifecycle
- Cekat event normalization
- Cekat API client and resource pickers
- Cekat-specific validation and safety warnings
- Cekat workflow templates and examples
- Cekat business permissions and tenant boundaries
- Cekat support documentation
- Cekat migration and parity validation

### Backend/API ownership

The Chat team owns the official API and webhook contract. Integration engineering owns the Activepieces adapter against that contract. Product owns the user-facing scope and prioritization.

## 6. User roles and scenarios

### Business operator

Wants to automate a repetitive process without writing code.

Example: When a conversation receives a `VIP` label, assign it to a senior agent and update the CRM record.

### Operations manager

Wants visibility into enabled automations, failures, and execution history.

Example: Find why an order-status automation did not send a customer message.

### Builder/admin

Creates workflows, configures credentials, tests nodes, and publishes versions.

### Integration engineer

Implements Cekat triggers/actions, validates API behavior, and maintains the piece as the Chat team expands the Open API.

## 7. Product information architecture

Recommended top-level areas:

```text
Automations
├── All automations
├── Templates
├── Drafts
├── Enabled
└── Executions

Settings
├── Credentials
├── Connections
├── Team and permissions
└── Environment settings
```

## 8. Workflow builder UX

### Builder layout

- Left: node palette grouped by trigger, conversation, CRM, contact, messaging, lookup, and order.
- Center: visual workflow canvas.
- Right: selected node configuration drawer.
- Top: workflow name, save status, test, enable/disable, publish/version controls.
- Bottom or side panel: test output and execution details.

### Node configuration pattern

Each node should include:

1. Human-readable node name.
2. Short explanation of what it does.
3. Required fields first.
4. Optional fields collapsed where appropriate.
5. Dynamic resource pickers.
6. Expression/variable input support.
7. Validation messages beside the relevant field.
8. Advanced section for raw values, backend names, and custom options.
9. Test step capability.
10. Status badge for MVP, Requires validation, Planned, or Blocked where applicable.

### Trigger configuration example

```text
When this happens:
[ Conversation Label Changed ]

Inbox:
[ Any inbox ]

Label:
[ VIP ]

Change type:
[ Added ]
```

### Action configuration example

```text
Do this:
[ Add Conversation Label ]

Conversation:
[ Conversation ID from trigger ]

Label:
[ VIP ]
```

## 9. Variable and data mapping UX

Users should be able to select variables from:

- Trigger output
- Previous action output
- Workflow metadata
- Static values
- Expressions, where supported

The variable picker should group fields by source:

```text
Trigger
├── Event ID
├── Conversation ID
├── Customer
│   ├── Name
│   └── Phone number
├── Label
│   ├── ID
│   └── Name
└── Raw event
```

The raw event and raw action response must remain accessible for advanced users and debugging.

## 10. Piece catalog

The full trigger/action catalog, payloads, variables, and endpoint mappings are defined in:

`Cekat Automations — Activepieces Piece Handoff v1.md`

### Initial trigger scope

- New Message Received
- Message Sent
- Conversation Created
- Conversation Assigned
- Conversation Status Changed
- Pipeline Status Changed
- Conversation Label Changed
- Contact Updated
- New CRM Record
- CRM Record Updated

### Near-term trigger expansion

- First Human Response
- AI Summary Generated
- Conversation Note Created/Updated
- CRM value events after validation
- Order and payment events
- WhatsApp template status events

### Initial action scope

- Send WhatsApp Message
- Add/Remove Conversation Label
- Assign Conversation to Agent
- Change Conversation Status
- Set Pipeline Status
- Resolve Conversation
- Create CRM Record
- Update CRM Record
- Find CRM Record
- Find Contact
- Update Contact Information
- Generic Cekat HTTP/API Request

### Near-term action expansion

- Send WhatsApp Template
- Add Collaborator
- Block/Unblock AI
- Assign AI Agent
- Delete CRM Record
- Create/Update Order
- Additional actions from the Chat team Open API

## 11. Workflow lifecycle

### Draft

- User can edit the flow.
- Flow is not active.
- Test runs are allowed subject to permissions and side-effect safeguards.

### Published

- A version is immutable.
- The workflow can be enabled.
- Changes create a new draft/version rather than silently changing the active version.

### Enabled

- Trigger subscriptions are active.
- The current published version receives events.
- The UI displays the enabled state and last activation time.

### Disabled

- Trigger subscriptions are removed or deactivated where supported.
- Existing executions are not silently deleted.
- The UI explains whether in-flight runs continue or are cancelled.

## 12. Execution behavior

### Trigger delivery

- Return `2xx` quickly to Cekat.
- Process asynchronously where the runtime supports it.
- Preserve the original payload.
- Deduplicate using the top-level event ID where present.

### Retries

- Retry transient network and 5xx failures with bounded backoff.
- Do not retry validation errors without user changes.
- Display the retry count and final error in execution details.
- Avoid duplicate side effects through idempotency keys or persisted event/action state where supported.

### Idempotency

At minimum, store:

- Event ID
- Workflow/version ID
- Action node ID
- Execution ID
- Action attempt/result

An identical event must not repeatedly add labels, create CRM records, or send messages unless the action explicitly allows it.

### Loop protection

Examples of loops to detect or warn about:

- `message.sent` trigger sends another message.
- CRM update trigger updates the same CRM record again.
- Label-changed trigger adds the same label that caused it.
- Status-changed trigger sets the status to its current value.

Provide configuration guidance and runtime protection. At minimum, warn users when a flow’s trigger and action target the same event domain.

### Timeouts

- Use bounded API request timeouts.
- Show timeout errors with the target operation and retry status.
- Do not leave a workflow execution permanently pending.

## 13. Error and empty states

### Configuration errors

Examples:

- Missing credential
- Missing conversation ID
- CRM board no longer exists
- CRM column removed or renamed
- Invalid JSON in interactive message configuration
- Missing bank account for manual payment
- Missing invoice URL for custom payment

The message should explain the correction, not only show a technical status code.

### Runtime errors

Display:

- Node name
- Operation attempted
- Target resource where available
- HTTP status
- Human-readable error
- Retry state
- Link to raw response/logs

### Empty states

- No inboxes available
- No labels available
- No agents available
- No CRM boards available
- No CRM columns available
- No templates available for the selected inbox

Each empty state should explain whether the problem is permissions, configuration, or unavailable backend data.

## 14. Credentials and security

- Store API keys only in the Activepieces credential store.
- Never place API keys in node fields, workflow names, logs, or variable previews.
- Redact authorization headers and secrets from raw request/response logs.
- Restrict generic HTTP requests to approved Cekat hosts or use an explicit allowlist.
- Enforce business/tenant scope at credential and API-client level.
- Treat webhook secrets as secrets.
- Confirm user permission before allowing destructive CRM actions or financial order actions.
- Preserve audit records for credential changes and workflow publication.

## 15. Multi-tenancy and permissions

Required permission categories should include:

| Capability | Example permission |
|---|---|
| View automations | Read workflows and executions |
| Edit automations | Create/update drafts |
| Publish automations | Publish a version |
| Enable automations | Activate subscriptions |
| Manage credentials | Create/update Cekat connections |
| Run tests | Execute test runs with side effects |
| Delete CRM records | Confirm destructive CRM actions |
| Manage orders | Create/update financial records |

All Cekat resource pickers and API calls must be scoped to the current business/tenant.

## 16. Observability and support

### Execution record

Store or expose:

- Workflow ID and version
- Trigger event ID
- Start/end time
- Node execution order
- Status per node
- Input/output metadata with secrets redacted
- Retry attempts
- Error details
- Correlation/request ID where available

### Metrics

Track:

- Enabled workflows
- Trigger deliveries
- Successful executions
- Failed executions
- Retry count
- Duplicate events suppressed
- API latency by operation
- API error rate by endpoint
- Webhook subscription failures

### Support workflow

Support should be able to identify:

1. Which workflow/version ran.
2. Which Cekat event started it.
3. Whether the event was duplicated or suppressed.
4. Which API action failed.
5. Whether a retry occurred.
6. Whether the failure came from configuration, permissions, or the Chat API.

## 17. n8n coexistence and migration

The existing `n8n-nodes-cekatai` package and workflow audits are migration references, not the Activepieces runtime.

Migration should be incremental:

1. Inventory existing workflows.
2. Map each n8n trigger/action to an Activepieces equivalent.
3. Identify unsupported or custom behavior.
4. Rebuild a test workflow.
5. Compare outputs and side effects.
6. Run in parallel where safe.
7. Switch ownership after parity approval.
8. Retire the n8n flow only after monitoring confirms stability.

Migration fixtures include ticket automation, social media tracking, CRM label automation, and voucher workflows.

## 18. Testing strategy

### Unit tests

- Event discriminator normalization.
- Payload-to-variable mapping.
- Dynamic CRM field formatting.
- Request body construction.
- Credential/header handling.
- Error classification.
- Idempotency key generation.

### Integration tests

- Register and remove webhook subscription.
- Receive each supported event type.
- Add/remove labels.
- Assign agents.
- Change conversation status and pipeline status.
- Send a message in a controlled test inbox.
- Create/update/search CRM records.
- Confirm raw payload preservation.

### UX tests

- Configure a trigger without backend terminology.
- Select dynamic inbox, label, agent, board, group, and column resources.
- Map trigger variables into actions.
- Understand validation errors.
- Confirm destructive actions.
- Inspect test output.
- Find and understand failed executions.

### Regression tests

- Existing n8n workflow parity where applicable.
- Duplicate webhook deliveries.
- Missing optional fields.
- `event_name` versus `event_type` payloads.
- Dynamic CRM columns.
- API timeout and 5xx behavior.

## 19. Delivery phases

### Phase 0 — Contract validation

- Confirm webhook subscription route.
- Confirm authentication and signatures.
- Confirm event payloads and response schemas with the Chat team.
- Confirm tenant and permission behavior.
- Identify API gaps for the Open API documentation.

### Phase 1 — Piece foundation

- Implement credential.
- Implement common API client.
- Implement business webhook trigger.
- Implement event normalization and raw payload output.
- Implement resource pickers.

### Phase 2 — Core actions

- Send WhatsApp Message.
- Add/Remove Label.
- Assign Agent.
- Change Status.
- Set Pipeline Status.
- Resolve Conversation.
- Create/Update CRM Record.
- Find CRM Record.
- Update Contact Information.

### Phase 3 — Builder and execution hardening

- Variable picker.
- Test runs.
- Error states.
- Retry and idempotency behavior.
- Loop warnings/protection.
- Execution logs.
- Permissions and secret redaction.

### Phase 4 — Near-term expansion

After the Chat team provides and engineering reviews the official Open API:

- Add newly documented triggers.
- Add newly documented actions.
- Replace inferred response shapes with official schemas.
- Add official error handling and retry rules.
- Update UI labels, resource pickers, and documentation.
- Re-run regression and migration tests.

### Phase 5 — Rollout

- Internal pilot.
- Selected business pilot.
- Monitor error rates and API behavior.
- Expand availability.
- Maintain rollback to n8n for workflows without parity.

## 20. Acceptance criteria

### Product

- Users can create, test, publish, enable, disable, and inspect automations.
- The MVP catalog is clearly separated from planned/unverified capabilities.
- Users understand available variables without reading API documentation.

### UI/UX

- Human-readable node names are used throughout the builder.
- Dynamic resources load correctly or show actionable empty states.
- Required and conditional fields are clear.
- Destructive and financial actions have appropriate confirmation.
- Raw event data is available for advanced users.

### Engineering

- Webhook events are normalized consistently.
- Both `event_name` and `event_type` are supported.
- Duplicate events do not create duplicate side effects.
- Secrets are not leaked in logs or previews.
- API errors are observable and actionable.
- CRM fields are loaded dynamically.
- The piece can accept new triggers/actions without changing the common envelope.

### QA

- All MVP trigger/action happy paths pass.
- Error, timeout, retry, and duplicate-event tests pass.
- Existing migration fixtures have documented parity results.
- Open API additions have a regression-test plan before release.

## 21. Open decisions and risks

| Decision/risk | Impact | Owner/dependency | Status |
|---|---|---|---|
| Canonical webhook subscription route | Trigger activation may fail or create duplicate subscriptions | Chat team/API owner | Open |
| Official Open API documentation | Determines future triggers/actions and schemas | Chat team | Pending |
| CRM event coverage | Field-change automation reliability | Chat team/backend | Open |
| Stable CRM column identifiers | Dynamic field mapping and renamed-column behavior | Chat team/backend | Open |
| Webhook signatures | Security and authenticity | Chat team | Open |
| Retry/idempotency semantics | Duplicate side effects | Chat team/platform | Open |
| Generic HTTP allowlist | Security and flexibility trade-off | Platform/security | Open |
| Order action inclusion | Financial risk and permissions | Product/finance | Deferred |
| n8n migration timing | Operational complexity | Product/operations | Phased |

## 22. Rollout and rollback

### Rollout checklist

- API contract validation complete.
- Credentials configured in staging and production.
- Webhook subscription lifecycle tested.
- Observability dashboards available.
- Support playbook available.
- MVP workflows tested with representative data.
- Security review complete.
- Pilot users selected.

### Rollback options

- Disable affected Activepieces workflows.
- Remove/deactivate Cekat webhook subscriptions.
- Restore the previous published workflow version.
- Keep existing n8n workflows active until parity is confirmed.
- Disable a problematic node/action without disabling unrelated workflows.

## 23. Ownership

| Area | Responsible team |
|---|---|
| Product scope and prioritization | Product |
| Builder and interaction design | UI/UX and frontend |
| Activepieces piece | Integration/platform engineering |
| Official Chat API and webhook contract | Chat team |
| Execution, logs, and reliability | Platform/automation engineering |
| Security and credentials | Platform/security |
| Migration validation | Product, operations, and integration engineering |
| QA and release gates | QA/release engineering |
| Support procedures | Operations/support |

## 24. References

- `Cekat Automations — Activepieces Piece Handoff v1.md`
- `Business Webhook Events — Consolidated Reference.md`
- `PRD — Cekat Automations v1 (Stakeholder Draft).md`
- `PRD — Cekat Automations v1 (Simplified Scope Draft).md`
- `PRD — Cekat Automations (In-House Workflow Engine).md`
- `Design Brief — Cekat Automations v1.md`
- `Cekat Automations — Data, Services & Schema (Explainer).md`
- `Epic — Cekat Automations v1.md`
- `Cekat Automations — Sprint Plan.md`
- `n8n-nodes-cekatai/`
- `n8n Workflows/`
