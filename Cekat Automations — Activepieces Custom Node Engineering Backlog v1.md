---
title: Cekat Automations — Activepieces Node Backlog v1
type: Engineering backlog
status: proposed-for-implementation
last_updated: 2026-08-13
---

# Cekat Automations — Activepieces Node Backlog v1

> **Canonical implementation backlog.** This document lists the Cekat Activepieces triggers, actions, lookups, shared engineering work, priorities, dependencies, and completion requirements.

## 1. How to read this document

### Priority

| Priority | Meaning |
|---|---|
| **P0** | Build first; supported by current API/webhook evidence |
| **P1** | Build after contract validation; useful but incomplete response, event, or reliability contracts |
| **P2** | Future expansion after official Cekat Open API documentation and validation |
| **Blocked** | Do not implement until the stated dependency is resolved |

### Related API reference

Use `Cekat Automations — Open API Endpoint Inventory v0.1.md` for evidence-based endpoint details, request/response evidence, pagination, documented errors, conflicts, and remaining unknowns. That inventory is documentation-derived and is not authoritative until the official Cekat Open API contract is confirmed.

## 2. Node summary

### P0 node summary

| ID | Domain | Type | Node | API/event | Required inputs |
|---|---|---|---|---|---|
| TRG-01 | Chat / Conversations | Trigger | Cekat Business Webhook | Business webhook events | `events`; optional `inbox_id`, `board_id` |
| ACT-01 | Chat / Conversations | Action | Send WhatsApp Message | `POST /messages/whatsapp` | `conversation_id`, `receiver`, `message` |
| ACT-02 | Chat / Conversations | Action | Add Conversation Label | `POST /business_workflows/labels` | `conversation_id`, `label_id` |
| ACT-03 | Chat / Conversations | Action | Remove Conversation Label | `POST /business_workflows/labels/remove` | `conversation_id`, `label_id` |
| ACT-04 | Chat / Conversations | Action | Assign Conversation to Agent | `POST /business_workflows/assign-agent` | `conversation_id`, `agent_id` |
| ACT-05 | Chat / Conversations | Action | Change Conversation Status | `POST /business_workflows/conversation-status` | `conversation_id`, `stage_status` |
| ACT-06 | Chat / Conversations | Action | Set Pipeline Status | `POST /business_workflows/pipeline-status` | `conversation_id`, `pipeline_status_id` |
| ACT-07 | Chat / Conversations | Action | Resolve Conversation | `POST /business_workflows/resolve-conversation` | `conversation_id` |
| ACT-08 | CRM | Action | Create CRM Record | `POST /api/crm/boards/{boardId}/items` | `board_id`, `item_name`, CRM fields |
| ACT-09 | CRM | Action | Update CRM Record | `PUT /api/crm/boards/{boardId}/items/{itemId}` | `board_id`, `item_id`, CRM fields |
| ACT-10 | CRM | Action | Find CRM Record | `POST /api/crm/boards/{boardId}/items/search` | `board_id`, search conditions |
| ACT-11 | Contacts | Action | Find Contact by Phone | `GET /business_workflows/contact?phone_number=...` | `phone_number` |
| ACT-12 | Contacts | Action | Update Contact Information | `POST /business_workflows/additional-data` | `contact_id`, `additional_data` |
| ACT-13 | Chat / Conversations | Action | Get Conversation Messages | `GET /business_workflows/conversation-messages?...` | `conversation_id` |
| ACT-14 | Platform / Shared | Action | Call Cekat API | Approved configurable Cekat endpoint | Method/path/body |
| LOOK-01 | Inboxes | Lookup | List Inboxes | `GET /business_workflows/inboxes` | None |
| LOOK-02 | Chat / Conversations | Lookup | List Labels | `GET /business_workflows/labels` | None |
| LOOK-03 | Agents | Lookup | List Agents | `GET /business_workflows/agents` | None |
| LOOK-04 | Chat / Conversations | Lookup | List Pipeline Statuses | `GET /business_workflows/pipeline-status` | None |
| LOOK-05 | CRM | Lookup | List CRM Boards | `GET /api/crm/boards` | None |
| LOOK-06 | CRM | Lookup | List CRM Groups/Columns | Board metadata routes | `board_id` |
| LOOK-07 | CRM | Lookup | List CRM Records | `GET /api/crm/boards/{boardId}/items` | `board_id` |

### P1 node summary

| ID | Domain | Type | Node | API/event | Validation/notes |
|---|---|---|---|---|---|
| ACT-15 | Chat / Conversations; Templates | Action | Send WhatsApp Template | `POST /templates/send` | `inbox_id`, `template_id`, `phone_number`, `phone_name`, variables |
| ACT-16 | Chat / Conversations | Action | Add Conversation Collaborator | `POST /business_workflows/add-collaborator` | `conversation_id`, `agent_id` |
| ACT-17 | Chat / Conversations | Action | Block AI | `POST /business_workflows/block-ai` | `conversation_id` |
| ACT-18 | Chat / Conversations | Action | Unblock AI | `POST /business_workflows/unblock-ai` | `conversation_id` |
| ACT-19 | Chat / Conversations | Action | Assign AI Agent | `PUT /api/conversations/{conversationId}` | `conversationId`, `assigned_ai_agent`, keep-assigned flag |
| ACT-20 | CRM | Action | Delete CRM Record(s) | `DELETE /api/crm/boards/{boardId}/items` | `board_id`, `item_ids` |
| ACT-28 | Broadcasts / Campaigns | Action | Send Meta Event | `POST /api/messages/meta_events/send` | `inbox_meta_dataset_id`, `events` |
| ACT-29 | Broadcasts / Campaigns | Action | Upload Recipient List | `POST /api/recipients` | `name`, CSV/XLSX file |
| ACT-30 | Broadcasts / Campaigns | Lookup | List Recipient Lists | `GET /api/recipients` | `page`, `limit` |
| ACT-31 | Broadcasts / Campaigns | Action | Create Broadcast Campaign | `POST /api/campaigns` | `campaign_name`, `inbox_id`, `recipient_list_id`, `template_id` |
| ACT-32 | Broadcasts / Campaigns | Lookup | Get Campaign Delivery Details | `GET /api/v2/campaigns/{campaignId}/messages` | `campaignId`, `page`, `limit` |
| LOOK-08 | Templates | Lookup | List Templates | `GET /api/templates` | Date filters, `page`, `limit` |
| LOOK-09 | Chat / Conversations | Lookup | List Messages | `GET /api/messages` | `conversation_id`, filters, `page`, `limit` |
| LOOK-10 | Chat / Conversations | Lookup | Get AI Credit Summary | `GET /api/messages/summary/ai_credits` | `conversation_id`, date filters |
| LOOK-11 | Contacts | Lookup | List Contacts | `GET /api/contacts` | Date filters, `page`, `limit` |
| LOOK-12 | Agents | Lookup | List Agent Assignments | `GET /api/agent_assignments` | Date filters, `page`, `limit` |
| LOOK-13 | Broadcasts / Campaigns | Lookup | List Campaigns | `GET /api/campaigns` | Date filters, `page`, `limit` |
| LOOK-14 | Broadcasts / Campaigns | Lookup | Get Legacy Campaign Messages | `GET /api/campaigns/{campaignId}/messages` | `campaignId`, `page`, `limit` |
| TRG-02 | Chat / Conversations | Trigger | First Human Response | `conversation.customer_first_response_human_stage` | Confirm milestone/payload |
| TRG-03 | Chat / Conversations | Trigger | AI Summary Generated | `ai_summary.generated` | Confirm payload/delivery |
| TRG-04 | Chat / Conversations | Trigger | Conversation Note Created | `conversation_note.created` | Confirm optional IDs/coverage |
| TRG-05 | Chat / Conversations | Trigger | Conversation Note Updated | `conversation_note.updated` | Confirm note semantics |
| TRG-06 | CRM | Trigger | CRM Record Deleted | `crm_item.deleted` | Confirm deletion payload |
| TRG-07 | CRM | Trigger | CRM Field Value Changed | `crm_value.upserted` | Confirm write-path coverage/field identity |
| TRG-08 | CRM | Trigger | CRM Field Value Deleted | `crm_value.deleted` | Confirm deleted-value semantics |

### P2 node summary

| ID | Domain | Type | Node | API/event | Dependency |
|---|---|---|---|---|---|
| TRG-09 | Orders / Payments | Trigger | Order Created | `order.created` | Official event schema |
| TRG-10 | Orders / Payments | Trigger | Order Updated | `order.updated` | Changed-field schema |
| TRG-11 | Orders / Payments | Trigger | Order Status Changed | `order.order_status_updated` | Official status contract |
| TRG-12 | Orders / Payments | Trigger | Payment Status Changed | `order.payment_status_updated` | Official payment contract |
| TRG-13 | Orders / Payments | Trigger | Invoice Paid | `netzme.invoice_paid` | Official invoice contract |
| TRG-14 | Templates | Trigger | WhatsApp Template Status Changed | `template.status_updated` | Official template event |
| ACT-23 | Orders / Payments | Action | Create Order | `POST /api/orders` | `orders_products`, payment/customer fields |
| ACT-24 | Orders / Payments | Action | Update Order | `PUT /api/orders/{orderId}` | `orderId`, order/payment fields |
| ACT-25 | Orders / Payments | Lookup | Get Order | `GET /api/orders/{orderId}` | `orderId` |
| ACT-26 | Orders / Payments | Lookup | List Orders | `GET /api/orders` | None |
| ACT-27+ | Varies | Trigger/Action | Additional Cekat capabilities | To be confirmed | Official Cekat Open API |

### Blocked node summary

| ID | Domain | Node | Reason |
|---|---|---|---|
| TRG-B01 | Chat / Conversations | Message Failed | No verified active emitter or payload builder |
| TRG-B02 | CRM | Guaranteed CRM Field Changed | No proof of complete write-path coverage or stable field identifiers |

## 4. Detailed node notes

### TRG-01 — Cekat Business Webhook

**Purpose:** Configurable trigger that starts an automation when a subscribed Cekat business event is received.

**Primary domain:** Chat / Conversations. It can also receive CRM and Contact events.

**Cross-domain events:**

- Chat / Conversations: message received, message sent, conversation created, assignment/status/pipeline/label changes
- CRM: record created or updated
- Contacts: contact updated

**Configuration:**

- Events: multi-select
- Inbox: optional
- CRM board: optional

**Initial events:** `message.received`, `message.sent`, `conversation.created`, `conversation.handled_by_updated`, `conversation.stage_status_updated`, `conversation.pipeline_status_updated`, `conversation.labels_updated`, `contact.updated`, `crm_item.created`, and `crm_item.updated`.

**Normalized output:**

```json
{
  "eventId": "...",
  "eventName": "...",
  "eventType": "...",
  "object": "...",
  "timestamp": "...",
  "conversationId": "...",
  "contactId": "...",
  "messageId": "...",
  "boardId": "...",
  "inboxId": "...",
  "data": {},
  "raw": {}
}
```

**Acceptance criteria:** accepts both `event_name` and `event_type`; preserves the original body; returns `2xx` quickly; deduplicates by event ID where present; does not expose `message.failed` as production-ready.

**Open dependency:** Confirm `/business_webhooks` versus `/business_workflows/webhooks/subscribe`.

### ACT-01 — Send WhatsApp Message

Support initially:

- Plain text
- Optional file URL

Design extension points for CTA URL, reply buttons, and lists. Validate interactive JSON before sending and prevent or warn about message-trigger loops.

### ACT-08/ACT-09 — CRM records

Load board metadata at runtime. Support text/long text, number, date, checkbox, email/phone, select/dropdown, agent, contact, company, order/subscription references, file, timeline, reference, and conversation fields. Do not hardcode column names; preserve dynamic fields in raw payloads.

### ACT-14 — Call Cekat API

Configurable approved Cekat method/path/query/headers/body action. Restrict it to approved Cekat hosts or an allowlist, use the shared credential, redact secrets, and expose status, headers, parsed body, and raw response.

### Input naming rule

Where an action or lookup requires a resource identifier, use the API field name in the implementation contract and input documentation. For example: `conversation_id`, `contact_id`, `inbox_id`, `board_id`, `item_id`, `agent_id`, `campaignId`, and `orderId`. UI display labels may remain human-readable, but the underlying variable and payload mapping must be explicit.

### Additional P1 API nodes

- `ACT-28` Send Meta Event: confirm response/error contract and duplicate handling.
- `ACT-29` Upload Recipient List: confirm auth, retention, and retry behavior.
- `ACT-30` List Recipient Lists: confirm pagination and response schema.
- `ACT-31` Create Broadcast Campaign: confirm queueing, duplicate prevention, and permissions.
- `ACT-32` Get Campaign Delivery Details: confirm PII access, pagination, and response schema.
- `LOOK-08`–`LOOK-14`: confirm response schemas, field types, PII scope, timestamp semantics, and legacy/v2 behavior.

## 4. Platform/shared engineering work

| ID | Work item | Deliverable | Priority |
|---|---|---|---|
| CORE-01 | Cekat credential | API key, environment, optional webhook signing secret | P0 |
| CORE-02 | Cekat API client | Base URL selection, bearer/API-key headers, timeout, error normalization | P0 |
| CORE-03 | Webhook subscription lifecycle | Create, list/check, update, deactivate/unsubscribe, duplicate prevention | P0 |
| CORE-04 | Common event normalizer | Support `event_name` and `event_type`; normalized IDs and raw payload | P0 |
| CORE-05 | Resource pickers | Inboxes, labels, agents, pipeline statuses, CRM boards/groups/columns | P0 |
| CORE-06 | Common action response wrapper | `success`, `operation`, `target`, `request`, `response`, `raw` | P0 |
| CORE-07 | Idempotency and deduplication | Persist event/action identity and suppress duplicate side effects | P0 |
| CORE-08 | Test fixtures | Payloads and mock API responses for P0 nodes | P0 |
| CORE-09 | Open API contract update | Replace inferred contracts with official Cekat API schemas | P1 / dependency |
| CORE-10 | Date/time filter validator | Validate date/datetime bounds, timezone header, and messages-specific behavior | P0 |
| CORE-11 | Conversation v2 cursor client | Cursor traversal, termination on both null, limit <= 100 | P0 / provider confirmation |
| CORE-12 | Safe write retry policy | No blind retries for campaign, recipient, Meta-event, message, or order writes | P0 |
| CORE-13 | API inventory maintenance | Keep node contracts linked to the API inventory | P0 |
| CORE-14 | PII redaction and access controls | Protect contact, message, recipient, campaign, and Meta user data | P1 |

## 5. API contract validation backlog

| ID | Work item | Required decision |
|---|---|---|
| API-01 | Conversation v1/v2 resolution | Confirm v2 cursor contract, rollout, version selector, and v1 deprecation |
| API-02 | Authentication and scope | Confirm API-key/bearer precedence, roles, business scope, and PII permissions |
| API-03 | Error contract | Confirm global error envelope, 429 behavior, Retry-After, and retryable statuses |
| API-04 | Write idempotency | Confirm idempotency support for campaigns, recipients, Meta events, messages, and orders |
| API-05 | Pagination limits | Confirm page/limit maximums and ordering for all page-based endpoints |
| API-06 | Flexible schemas | Confirm nullable fields and nested message/interactive/additional-data schemas |
| API-07 | Broadcast lifecycle | Confirm campaign queueing, delivery states, cancellation/edit support, and PII retention |

## 6. Implementation contract

Every trigger must expose a human-readable name and backend event name, preserve the raw event, normalize documented IDs, support test payloads, define filtering behavior, and document event availability/caveats.

Every action must define required/optional inputs, validate IDs/JSON/conditional fields/resource scope, use the shared credential, normalize errors, return a consistent output envelope, redact secrets from logs, and define retry/idempotency behavior.

## 7. Engineer definition of done

A node is complete when:

- UI fields and help text are implemented.
- Its primary domain is documented.
- Dynamic resource pickers are implemented where applicable.
- Request payloads match the validated API contract.
- Response and error handling are tested.
- Raw request/response data is safely available for debugging.
- Unit and integration tests pass.
- Duplicate-event and loop behavior is covered where relevant.
- Documentation includes examples, variables, caveats, and status.
- The node is mapped to an approved MVP, P1, or future release milestone.

## 8. Related documents

- `Cekat Automations — Open API Endpoint Inventory v0.1.md`
- Existing `n8n-nodes-cekatai` handlers and descriptions
- `Business Webhook Events — Consolidated Reference.md`
- Cekat Automations V1 PRDs and Design Brief
