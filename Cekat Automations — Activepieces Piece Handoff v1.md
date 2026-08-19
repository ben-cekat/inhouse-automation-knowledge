---
title: Cekat Automations — Activepieces Piece Handoff v1
type: Engineering and UI/UX handoff
status: proposed-for-implementation
last_updated: 2026-08-12
---

# Cekat Automations — Activepieces Piece Handoff v1

## 1. Purpose

This document defines the Cekat-specific Activepieces piece: triggers, actions, lookup operations, payloads, variables, UI behavior, API mappings, and implementation status.

It is intended for Product, UI/UX, frontend, integration/backend engineering, and QA.

This document covers the integration piece only. Overall workflow-builder, execution-engine, permissions, rollout, and migration requirements belong in the companion document:

`Cekat Automations — Activepieces Full Product Handoff v1.md`

## 2. Source of truth and confidence

The current catalog is based on:

- `Business Webhook Events — Consolidated Reference.md`
- Existing Cekat n8n node handlers and descriptions under `n8n-nodes-cekatai/`
- Cekat Automations PRDs and design brief
- Audited existing n8n workflows

The repository contains no Activepieces implementation and no complete OpenAPI/Swagger specification. API responses and undocumented behavior must not be treated as final until confirmed by the Chat team.

### Status labels

| Status | Meaning |
|---|---|
| MVP candidate | Supported by current documented webhook/API evidence and suitable for initial implementation |
| Requires validation | Evidence exists, but the complete contract or reliability is not confirmed |
| Planned | Expected to be added in a future iteration |
| Blocked | Do not implement until the dependency is resolved |

## 3. Chat team Open API dependency

The initial piece is based on the webhook events and endpoints currently available in repository documentation and the existing n8n implementation.

Additional Cekat triggers and actions will be added in the near future when the Chat team provides the official Open API documentation.

The Open API documentation is expected to confirm:

- Complete endpoint inventory
- Request and response schemas
- Authentication and authorization requirements
- Error codes and validation rules
- Supported webhook events
- Retry and idempotency behavior
- API versioning and deprecation policy
- Webhook signature verification

Until then, undocumented capabilities must be labeled `Planned`, `Requires validation`, or `Blocked`. The generic HTTP/API action is the interim escape hatch for approved use cases.

## 4. Credential

### Cekat API credential

| Field | Type | Required | Notes |
|---|---|---:|---|
| API key | Secret string | Yes | Stored in Activepieces credentials; never exposed as a normal step field |
| Environment | Production / staging | Yes | Selects the Cekat base URL |
| Webhook signing secret | Secret string | Optional | Used if signature verification is supported by the backend |

Existing n8n requests send both:

```http
Authorization: Bearer <api-key>
api_key: <api-key>
```

The Activepieces piece should centralize this behavior in its client and allow the backend contract to supersede it when the Chat team provides the Open API document.

## 5. Trigger architecture

Implement one configurable trigger named **Cekat Business Webhook** rather than a separate subscription implementation for every event.

### Trigger configuration

| UI field | Type | Required | Description |
|---|---|---:|---|
| Events | Multi-select | Yes | Select one or more Cekat business events |
| Inbox | Resource picker | No | Restrict events to an inbox where supported |
| CRM board | Resource picker | No | Restrict CRM events to a board where supported |

The trigger must:

1. Register the Activepieces webhook URL with Cekat.
2. Avoid duplicate subscriptions when a flow is enabled or updated.
3. Remove or deactivate the subscription when a flow is disabled, if supported.
4. Return `2xx` quickly and preserve the original body.
5. Deduplicate by top-level event `id` where present.
6. Accept both `event_name` and `event_type`.
7. Expose normalized variables and the complete raw payload.

### Subscription route requiring confirmation

The consolidated reference documents:

```http
POST /business_webhooks
```

The existing n8n implementation uses:

```http
GET  /business_workflows/webhooks
POST /business_workflows/webhooks/subscribe
POST /business_workflows/webhooks/unsubscribe
```

The Activepieces implementation must confirm the canonical route, request field casing, update behavior, and unsubscribe semantics before production release.

## 6. Common trigger output

Every webhook event should expose this normalized envelope where values are available:

```json
{
  "eventId": "event-123",
  "eventName": "conversation.labels_updated",
  "eventType": null,
  "object": "conversation",
  "timestamp": "2026-08-12T12:00:00Z",
  "conversationId": "conversation-123",
  "contactId": null,
  "messageId": null,
  "orderId": null,
  "invoiceId": null,
  "boardId": null,
  "inboxId": "inbox-123",
  "data": {},
  "raw": {}
}
```

`raw` must always contain the untouched received payload. Dynamic CRM fields and evolving nested objects must not be discarded.

## 7. Trigger catalog

| UI name | Backend event | Starts when | Main variables | Status |
|---|---|---|---|---|
| New Message Received | `message.received` | A customer message is received | Event ID, message ID, conversation ID, sender type, data | MVP candidate |
| Message Sent | `message.sent` | A non-system outbound message is sent | Event ID, message ID, conversation ID, sender type, data | MVP candidate |
| Conversation Created | `conversation.created` | A new conversation is created | Conversation ID, inbox ID, conversation data | MVP candidate |
| Conversation Assigned | `conversation.handled_by_updated` | Assignment/handler changes | Conversation ID, old value, new value | MVP candidate |
| Conversation Status Changed | `conversation.stage_status_updated` | Stage status changes | Conversation ID, old status, new status | MVP candidate |
| Pipeline Status Changed | `conversation.pipeline_status_updated` | Pipeline status changes | Conversation ID, old pipeline ID, new pipeline ID | MVP candidate |
| Conversation Label Changed | `conversation.labels_updated` | A label is added or removed | Conversation ID, label ID, label name, change type | MVP candidate |
| First Human Response | `conversation.customer_first_response_human_stage` | First qualifying customer response in a human-handled stage | Conversation ID, inbox ID | Requires validation |
| Contact Updated | `contact.updated` | A contact changes | Contact ID, changed field, old value, new value | MVP candidate |
| New CRM Record | `crm_item.created` | A CRM record is created | Board ID, record ID, record name, message, data | MVP candidate |
| CRM Record Updated | `crm_item.updated` | A CRM record is updated | Board ID, record ID, record name, message, data | MVP candidate |
| CRM Record Deleted | `crm_item.deleted` | A CRM record is deleted | Board ID, record ID, message | Requires validation |
| CRM Field Value Changed | `crm_value.upserted` | A CRM value is created or updated | Board ID, record ID, record name, dynamic values | Requires validation |
| CRM Field Value Deleted | `crm_value.deleted` | A CRM value is deleted | Board ID, record ID, deleted value, dynamic values | Requires validation |
| AI Summary Generated | `ai_summary.generated` | An AI summary is generated | Conversation ID, summary, notes, generation time | Requires validation |
| Conversation Note Created | `conversation_note.created` | A note is created | Contact ID, conversation ID, inbox ID, note | Requires validation |
| Conversation Note Updated | `conversation_note.updated` | A note is updated | Contact ID, conversation ID, previous note, note | Requires validation |
| Order Created | `order.created` | An order is created | Order ID, order status, payment status, data | Planned |
| Order Updated | `order.updated` | An order or invoice is updated | Order ID, changed fields, current data | Planned |
| Order Status Changed | `order.order_status_updated` | Order status changes | Order ID, old status, new status | Planned |
| Payment Status Changed | `order.payment_status_updated` | Payment status changes | Order ID, old status, new status | Planned |
| Invoice Paid | `netzme.invoice_paid` | A Netzme invoice is paid | Invoice ID, amount, method, time, conversation ID | Planned |
| WhatsApp Template Status Changed | `template.status_updated` | A template status changes | Template ID, Meta ID, name, status, inbox | Planned |
| Message Failed | `message.failed` | A message fails | No verified payload | Blocked |

### Trigger payload examples

#### Conversation Label Changed

```json
{
  "id": "event-123",
  "event_name": "conversation.labels_updated",
  "change_type": "added",
  "label": { "id": "label-123", "name": "VIP" },
  "data": { "id": "conversation-123" }
}
```

Variables: `eventId`, `eventName`, `conversationId`, `changeType`, `labelId`, `labelName`, `data`, `raw`.

#### CRM Record Created

```json
{
  "id": "event-123",
  "event_name": "crm_item.created",
  "board_id": "board-123",
  "message": "success",
  "data": { "id": "item-123", "name": "Customer A" }
}
```

Variables: `eventId`, `eventName`, `boardId`, `itemId`, `itemName`, `message`, `data`, `raw`.

#### AI Summary Generated

```json
{
  "id": "event-123",
  "event_type": "ai_summary.generated",
  "conversation_id": "conversation-123",
  "phone_number": "+628123456789",
  "display_name": "Customer A",
  "inbox_name": "WhatsApp",
  "ai_summary_text": "Customer is asking about pricing.",
  "notes": "Follow up tomorrow.",
  "generated_at": "2026-08-12T12:00:00Z"
}
```

Variables: `eventId`, `eventType`, `conversationId`, `phoneNumber`, `displayName`, `inboxName`, `summaryText`, `notes`, `generatedAt`, `raw`.

## 8. Action catalog

### Conversation and messaging actions

| UI name | Required inputs | API operation | Status |
|---|---|---|---|
| Send WhatsApp Message | Conversation, recipient, message | `POST /messages/whatsapp` on API host | MVP candidate |
| Send WhatsApp Template | Inbox, template, recipient, variables | `POST /templates/send` on API host | Planned |
| Add Conversation Label | Conversation, label | `POST /business_workflows/labels` | MVP candidate |
| Remove Conversation Label | Conversation, label | `POST /business_workflows/labels/remove` | MVP candidate |
| Assign Conversation to Agent | Conversation, agent | `POST /business_workflows/assign-agent` | MVP candidate |
| Add Conversation Collaborator | Conversation, agent | `POST /business_workflows/add-collaborator` | Planned |
| Change Conversation Status | Conversation, status | `POST /business_workflows/conversation-status` | MVP candidate |
| Set Pipeline Status | Conversation, pipeline stage | `POST /business_workflows/pipeline-status` | MVP candidate |
| Resolve Conversation | Conversation | `POST /business_workflows/resolve-conversation` | MVP candidate |
| Block AI on Conversation | Conversation | `POST /business_workflows/block-ai` | Planned |
| Unblock AI on Conversation | Conversation | `POST /business_workflows/unblock-ai` | Planned |
| Assign AI Agent | Conversation, AI agent, keep assigned | `PUT /api/conversations/{conversationId}` | Planned |

### CRM actions

| UI name | Required inputs | API operation | Status |
|---|---|---|---|
| Create CRM Record | Board, record name, optional group and fields | `POST /api/crm/boards/{boardId}/items` | MVP candidate |
| Update CRM Record | Board, record, fields | `PUT /api/crm/boards/{boardId}/items/{itemId}` | MVP candidate |
| Delete CRM Record(s) | Board, records, confirmation | `DELETE /api/crm/boards/{boardId}/items` | Planned |
| Find CRM Record | Board and search conditions | `POST /api/crm/boards/{boardId}/items/search` | MVP candidate |
| Update Contact Information | Contact and property map | `POST /business_workflows/additional-data` | MVP candidate |

### Lookup actions

| UI name | API operation | Status |
|---|---|---|
| Find Contact by Phone | `GET /business_workflows/contact?phone_number=...` | MVP candidate |
| Get Conversation Messages | `GET /business_workflows/conversation-messages?conversation_id=...` | MVP candidate |
| List Labels | `GET /business_workflows/labels` | MVP candidate |
| List Inboxes | `GET /business_workflows/inboxes` | MVP candidate |
| List Agents | `GET /business_workflows/agents` | MVP candidate |
| List Pipeline Stages | `GET /business_workflows/pipeline-status` | MVP candidate |
| List CRM Boards | `GET /api/crm/boards` | MVP candidate |
| List CRM Records | `GET /api/crm/boards/{boardId}/items` | MVP candidate |
| Get CRM Record | `GET /api/crm/boards/{boardId}/items/{itemId}` | Planned |
| Get Templates | `GET /templates?inbox_id=...` | Planned |

### Order actions

| UI name | Required inputs | API operation | Status |
|---|---|---|---|
| Create Order | Products, customer, payment method, totals | `POST /api/orders` | Planned |
| Update Order | Order, status/payment fields | `PUT /api/orders/{orderId}` | Planned |
| Get Order | Order ID | `GET /api/orders/{orderId}` | Planned |
| List Orders | None | `GET /api/orders` | Planned |

## 9. Action payload reference

### Add Conversation Label

```json
{
  "conversation_id": "conversation-123",
  "label_id": "label-123",
  "currency": "idr",
  "value": 0
}
```

### Send WhatsApp Message

```json
{
  "conversation_id": "conversation-123",
  "receiver": "+628123456789",
  "message": "Hello",
  "file_url": ""
}
```

Interactive CTA, button, and list payloads may add `media_type`, `header`, `footer`, and `action` fields. Invalid dynamic JSON must produce a visible validation error in Activepieces rather than silently sending an empty structure.

### Create CRM Record

```json
{
  "item_name": "Customer A",
  "group_id": "group-123",
  "Status": "New",
  "Phone": "+628123456789"
}
```

CRM columns are dynamic and must be loaded at runtime from the selected board.

### Update CRM Record

```json
{
  "Status": "Qualified",
  "Priority": "High"
}
```

### Create Order

```json
{
  "orders_products": [
    {
      "product_id": "product-123",
      "product_name": "Product A",
      "quantity": 1,
      "price": 100000
    }
  ],
  "payment_method": "manual",
  "conversation_id": "conversation-123",
  "display_name": "Customer A"
}
```

## 10. CRM field types

The piece should support dynamic CRM fields including:

- Text and long text
- Number
- Date
- Checkbox
- Email
- Phone
- Select and dropdown
- Agent
- Contact
- Company
- Order
- Subscription
- File
- Timeline
- Reference
- Conversation

UI/UX must not hardcode board columns. Column names are mutable display names; retain the underlying raw values and warn when a previously selected field is no longer available.

## 11. Action output convention

Every action should return a consistent envelope:

```json
{
  "success": true,
  "operation": "update_crm_item",
  "target": {
    "boardId": "board-123",
    "itemId": "item-123"
  },
  "request": {},
  "response": {},
  "raw": {}
}
```

The actual API response schemas are not complete in the repository. Do not expose undocumented response fields as guaranteed variables.

## 12. UI/UX requirements

- Show human-readable names by default; expose backend event names only in advanced details.
- Provide resource pickers for inboxes, labels, agents, pipeline stages, boards, groups, and columns.
- Allow every input to accept a prior-step variable or expression.
- Clearly mark required fields.
- Show a warning before destructive CRM deletion.
- Show a warning before financial order actions.
- Preserve raw payloads and responses in test runs.
- Show an API-contract warning for `Requires validation` and `Planned` nodes.
- Show a clear empty state when board metadata or lookup resources cannot be loaded.
- Validate phone numbers, IDs, JSON fields, and required conditional payment fields.

## 13. MVP acceptance criteria

- A user can configure a Cekat webhook without knowing backend event names.
- The trigger supports event filtering by inbox and CRM board where applicable.
- Both `event_name` and `event_type` are accepted.
- The raw event is preserved.
- Trigger variables appear in the Activepieces variable picker.
- Conversation label, assignment, status, messaging, and CRM create/update actions can consume trigger variables.
- CRM fields load dynamically from the selected board.
- API failures expose status and actionable error information.
- Duplicate webhook deliveries do not duplicate side effects.
- Unsupported events are not presented as production-ready.
- Future additions from the Chat team Open API can be added without breaking the common trigger envelope.

## 14. Open questions

1. Which webhook subscription route is canonical?
2. Does Cekat provide webhook signatures and how are they verified?
3. What are the official response and error schemas?
4. Which CRM write paths emit CRM events?
5. Are CRM columns identified by stable IDs or only display names?
6. What retry and idempotency guarantees does the API provide?
7. Which additional triggers/actions will be included in the Chat team Open API?
8. What API versioning and deprecation policy applies?

## 15. References

- `Business Webhook Events — Consolidated Reference.md`
- `n8n-nodes-cekatai/nodes/Cekat/GenericFunctions.ts`
- `n8n-nodes-cekatai/nodes/Cekat/CekatTrigger.node.ts`
- `n8n-nodes-cekatai/nodes/Cekat/CekatCRMTrigger.node.ts`
- `n8n-nodes-cekatai/nodes/Cekat/handlers/`
- `n8n-nodes-cekatai/nodes/Cekat/description/`
- `PRD — Cekat Automations v1 (Stakeholder Draft).md`
- `PRD — Cekat Automations v1 (Simplified Scope Draft).md`
- `Design Brief — Cekat Automations v1.md`
