---
title: "Business Webhook Events — Consolidated Reference"
type: reference
status: current
source: "Confluence: Business Webhook Events"
source_page_id: "118423553"
last_checked: 2026-08-08
---
# Business Webhook Events — Consolidated Reference

> Local reference consolidated from the parent Confluence page and all 24 child event pages. Use this document when evaluating Cekat automation triggers and webhook-backed nodes. Payloads describe current backend behavior; nested and dynamic fields may evolve.

## 1. Subscription

Create or update an authenticated business webhook and include one or more event names in `events`.

```http
POST /business_webhooks
```

```json
{
  "name": "Customer Integration",
  "webhook_url": "https://example.com/webhooks/cekat",
  "events": ["message.received", "conversation.created"],
  "inbox_id": null,
  "board_id": null,
  "headers": { "Authorization": "Bearer your-token" },
  "secret": "optional-shared-secret"
}
```

- `inbox_id`: optional filter for inbox-aware events.
- `board_id`: optional filter for CRM board events.
- Webhook endpoints should accept JSON `POST` requests and return `2xx` quickly.
- Process asynchronously and deduplicate using payload event `id` where present.

## 2. Common delivery behavior

- Delivery is asynchronous through the business webhook queue.
- Subscriptions are filtered by business and event; inbox/board filters apply where context exists.
- If no matching webhook exists, no request is sent.
- Expired businesses are skipped unless status is `in_development` or `poc`.
- Payload examples describe current backend behavior; nested domain objects can gain fields over time.
- Consumers should route by the event discriminator and process events idempotently.

## 3. Event catalog

| Category | Event | Availability | Trigger |
|---|---|---|---|
| Messages | `message.received` | Available | Customer message received |
| Messages | `message.sent` | Available | Non-system outbound message sent |
| Messages | `message.failed` | Unavailable | Registered only; no active emitter verified |
| Conversations | `conversation.created` | Available | Conversation created |
| Conversations | `conversation.handled_by_updated` | Available | Assigned handler changed |
| Conversations | `conversation.stage_status_updated` | Available | Stage status changed |
| Conversations | `conversation.pipeline_status_updated` | Available | Pipeline status changed |
| Conversations | `conversation.labels_updated` | Available | Conversation label changed |
| Conversations | `conversation.customer_first_response_human_stage` | Available | First qualifying customer response in human stage |
| AI | `ai_summary.generated` | Available | AI summary generated |
| Notes | `conversation_note.created` | Available | Note created |
| Notes | `conversation_note.updated` | Available | Note updated |
| Contacts | `contact.updated` | Available | Contact changed |
| CRM | `crm_item.created` | Available | CRM item created |
| CRM | `crm_item.updated` | Available | CRM item updated |
| CRM | `crm_item.deleted` | Available | CRM item deleted |
| CRM | `crm_value.upserted` | Available | CRM value created or updated |
| CRM | `crm_value.deleted` | Available | CRM value deleted |
| Orders | `order.created` | Available | Order created |
| Orders | `order.updated` | Available | Order or related invoice changed |
| Orders | `order.order_status_updated` | Available | Order status changed |
| Orders | `order.payment_status_updated` | Available | Order payment status changed |
| Payments | `netzme.invoice_paid` | Available | Netzme invoice paid |
| Templates | `template.status_updated` | Available | WhatsApp template status received from Meta |

## 4. Event payloads and behavior

### `conversation.created`

Notifies when Cekat creates a conversation. Sent after the conversation is created and full detail can be loaded. Optional `inbox_id` filtering applies.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.created",
  "data": { "id": "conversation-id", "inbox_id": "inbox-id" }
}
```

`data` contains the full current conversation detail; nested fields may evolve.

### `conversation.customer_first_response_human_stage`

Sent when the first qualifying customer response during the human-handled stage is detected. This is a milestone event, not every customer reply. Optional `inbox_id` filtering applies.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.customer_first_response_human_stage",
  "data": { "id": "conversation-id", "inbox_id": "inbox-id" }
}
```

`data` contains current full conversation detail.

### `conversation.stage_status_updated`

Sent only when persisted `stage_status` changes. No event is sent when the value is unchanged.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.stage_status_updated",
  "updated_field": "stage_status",
  "old_value": "old-status",
  "new_value": "new-status",
  "data": { "id": "conversation-id" }
}
```

`old_value` and `new_value` are raw stage status values. `data` contains current conversation detail.

### `conversation.labels_updated`

Sent after a conversation label association changes. `change_type` identifies the operation.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.labels_updated",
  "change_type": "added",
  "label": { "id": "label-id", "name": "VIP" },
  "data": { "id": "conversation-id" }
}
```

Use label IDs where stable identity is required; do not depend only on label names.

### `conversation.handled_by_updated`

Sent when the conversation `handled_by` value changes. One event is emitted per changed tracked field.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.handled_by_updated",
  "updated_field": "handled_by",
  "old_value": "old-handler-id",
  "new_value": "new-handler-id",
  "data": { "id": "conversation-id" }
}
```

Either `old_value` or `new_value` may be null. Values are raw stored handler values.

### `conversation.pipeline_status_updated`

Sent when `pipeline_status_id` changes. No event is sent when unchanged.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_name": "conversation.pipeline_status_updated",
  "updated_field": "pipeline_status_id",
  "old_value": "old-pipeline-status-id",
  "new_value": "new-pipeline-status-id",
  "data": { "id": "conversation-id" }
}
```

`old_value` and `new_value` are raw pipeline status IDs and may be null.

### `message.received`

Notifies when Cekat receives a customer message. The legacy path emits for a non-system message whose `sent_by_type` is `user`. A feature flag can replace or suppress this path when Business Webhooks V2 message events are enabled.

```json
{
  "id": "event-uuid",
  "object": "message",
  "timestamp": 1700000000,
  "event_name": "message.received",
  "data": {
    "id": "message-id",
    "sent_by_type": "user",
    "conversation": { "id": "conversation-id" }
  }
}
```

System messages are ignored. `data` contains stored message fields and `data.conversation` contains current conversation detail.

### `message.sent`

Notifies when Cekat sends a non-system message. The legacy path emits for a non-system message whose `sent_by_type` is not `user`. A feature flag can replace or suppress this path when Business Webhooks V2 message events are enabled.

```json
{
  "id": "event-uuid",
  "object": "message",
  "timestamp": 1700000000,
  "event_name": "message.sent",
  "data": {
    "id": "message-id",
    "sent_by_type": "agent",
    "conversation": { "id": "conversation-id" }
  }
}
```

System messages are ignored. Nested schemas may evolve.

### `message.failed`

**Currently unavailable.** The event is registered in the allowed-events list, but no active emitter or verified payload builder exists.

Do not build production automation that depends on this event until its emitter and payload contract are implemented and documented.

### `ai_summary.generated`

Sent after Cekat generates an AI conversation summary and conversation detail can be loaded.

```json
{
  "id": "event-uuid",
  "object": "conversation",
  "timestamp": 1700000000,
  "event_type": "ai_summary.generated",
  "conversation_id": "conversation-id",
  "phone_number": "628123456789",
  "display_name": "Customer",
  "inbox_name": "Sales",
  "ai_summary_text": "Customer asked about pricing.",
  "notes": "Follow up tomorrow",
  "generated_at": "2026-08-08T05:00:00.000Z"
}
```

Important: this payload uses `event_type`, not `event_name`. `ai_summary_text` is a string; non-string input is JSON-serialized. `generated_at` is ISO-8601.

### `conversation_note.created`

Sent after a conversation/contact note is created. Optional `conversation_id` and `inbox_id` may be present.

```json
{
  "id": "event-uuid",
  "object": "conversation_note",
  "timestamp": 1700000000,
  "event_type": "conversation_note.created",
  "contact_id": "contact-id",
  "note": "Customer requested follow-up",
  "conversation_id": "conversation-id",
  "inbox_id": "inbox-id"
}
```

Important: this payload uses `event_type`, not `event_name`. `note` is converted to a string.

### `conversation_note.updated`

Sent after a conversation/contact note is updated.

```json
{
  "id": "event-uuid",
  "object": "conversation_note",
  "timestamp": 1700000000,
  "event_type": "conversation_note.updated",
  "contact_id": "contact-id",
  "note": "New note",
  "previous_note": "Old note",
  "conversation_id": "conversation-id",
  "inbox_id": "inbox-id"
}
```

Important: this payload uses `event_type`, not `event_name`. `note` and `previous_note` are strings; conversation and inbox IDs are optional.

### `contact.updated`

Sent when contact data changes. Differences under `conversations` and `business` are ignored. The payload contains the first detected changed field, not a complete diff.

```json
{
  "id": "event-uuid",
  "object": "contact",
  "timestamp": 1700000000,
  "event_name": "contact.updated",
  "changes": {
    "key": "display_name",
    "old_value": "Old Name",
    "new_value": "New Name"
  },
  "data": { "id": "contact-id", "display_name": "New Name" }
}
```

Consumers needing every changed field should compare the received contact against their own stored copy. `changes.is_additional_data` may identify a change inside additional data.

### `crm_item.created`

Sent after supported CRM item creation flows. Optional `board_id` restricts delivery to one board. Some internal flows can skip emission.

```json
{
  "id": "event-uuid",
  "object": "crm_item",
  "timestamp": 1700000000,
  "event_name": "crm_item.created",
  "board_id": "board-id",
  "message": "success",
  "data": { "id": "item-id", "name": "Lead" }
}
```

`message` may be `success_with_failures`; `failed` may contain value-creation failures. CRM item schemas depend on board columns and vary between businesses.

### `crm_item.updated`

Sent by supported CRM item and value update flows. Some bulk/internal flows can skip emission.

```json
{
  "id": "event-uuid",
  "object": "crm_item",
  "timestamp": 1700000000,
  "event_name": "crm_item.updated",
  "board_id": "board-id",
  "message": "success",
  "data": { "id": "item-id", "name": "Updated Lead" }
}
```

`data` may be a formatted item or caller-provided result data. Additional operation fields may be present; ignore unknown fields.

### `crm_item.deleted`

Sent after supported CRM item deletion flows. Store required item state before applying downstream deletion.

```json
{
  "id": "event-uuid",
  "object": "crm_item",
  "timestamp": 1700000000,
  "event_name": "crm_item.deleted",
  "board_id": "board-id",
  "message": "success",
  "data": { "item_id": "deleted-item-id" }
}
```

`data` contains deletion context; do not assume full item detail remains available.

### `crm_value.upserted`

Sent after a supported CRM column value is created or updated. Optional `board_id` filtering applies.

```json
{
  "id": "event-uuid",
  "object": "crm_value",
  "timestamp": 1700000000,
  "event_name": "crm_value.upserted",
  "board_id": "board-id",
  "message": "success",
  "data": {
    "item_id": "item-id",
    "item_name": "Lead",
    "Priority": "High"
  }
}
```

Column names are dynamic and mutable. A key such as `Priority` is the CRM column display name; its value type depends on the column type. Resolve stable mappings through board metadata where possible.

### `crm_value.deleted`

Sent after a supported CRM value deletion succeeds.

```json
{
  "id": "event-uuid",
  "object": "crm_value",
  "timestamp": 1700000000,
  "event_name": "crm_value.deleted",
  "board_id": "board-id",
  "message": "success",
  "data": {
    "item_id": "item-id",
    "item_name": "Lead",
    "Priority": "High"
  }
}
```

The dynamic column key contains the value before deletion. Treat it as deletion context, not current item state. Value shape depends on CRM column type.

### `order.created`

Sent by supported order creation flows, including dashboard/OpenAPI, subscription, and internal app-action flows.

```json
{
  "id": "event-uuid",
  "object": "order",
  "timestamp": 1700000000,
  "event_name": "order.created",
  "message": "success",
  "data": {
    "id": "order-id",
    "order_status": "pending",
    "payment_status": "PENDING"
  }
}
```

`data` contains the full result from `getCekatOrderDetail`, including available relationships. Nested order fields may evolve.

### `order.updated`

Sent after supported order or invoice updates. It normally contains current order detail plus changed-field context.

```json
{
  "id": "event-uuid",
  "object": "order",
  "timestamp": 1700000000,
  "event_name": "order.updated",
  "message": "success",
  "changed": {
    "notes": { "old_value": "Old", "new_value": "New" }
  },
  "data": { "id": "order-id" }
}
```

Different update entry points can provide different `changed` keys. `data` is current full order detail; for invoice paths it is loaded from the related order ID.

### `order.order_status_updated`

Sent in addition to `order.updated` when an actual `order_status` change is detected.

```json
{
  "id": "event-uuid",
  "object": "order",
  "timestamp": 1700000000,
  "event_name": "order.order_status_updated",
  "order_id": "order-id",
  "changed": {
    "old_value": "pending",
    "new_value": "processing"
  }
}
```

Common statuses include `pending`, `processing`, `shipping`, `cancelled`, and `completed`; other entry points may enforce their own validation.

### `order.payment_status_updated`

Sent in addition to `order.updated` when an invoice/payment workflow detects a payment status change.

```json
{
  "id": "event-uuid",
  "object": "order",
  "timestamp": 1700000000,
  "event_name": "order.payment_status_updated",
  "order_id": "order-id",
  "changed": {
    "old_value": "PENDING",
    "new_value": "PAID"
  }
}
```

Status casing follows stored/provider values. Preserve the original value when processing it.

### `netzme.invoice_paid`

Sent after the Netzme payment flow processes a paid invoice and resolves the related business/inbox conversation.

```json
{
  "id": "event-uuid",
  "object": "netzme",
  "timestamp": 1700000000,
  "event_name": "netzme.invoice_paid",
  "invoice_id": "merchant-reference",
  "amount": 150000,
  "payment_method": "QRIS",
  "payment_time": "2026-08-08T05:00:00Z",
  "conversations": { "id": "conversation-id" }
}
```

Payment consumers should be idempotent and validate amounts against their own order/invoice records.

### `template.status_updated`

Sent after Cekat receives Meta's `message_template_status_update` webhook. It may represent approval, rejection, pause, or another Meta status transition.

```json
{
  "id": "event-uuid",
  "object": "template",
  "timestamp": 1700000000,
  "event_name": "template.status_updated",
  "data": {
    "id": "template-row-id",
    "wa_template_id": "123456789012345",
    "template_status": "APPROVED",
    "template_name": "welcome_message",
    "inbox_id": "inbox-id",
    "inbox_name": "Sales WhatsApp"
  }
}
```

`data.id` is the Cekat template record ID. `data.wa_template_id` is the Meta template ID. Other status values may appear if Meta adds or sends them.

## 5. Automation-node implications

- Treat `message.failed` as unavailable until an emitter and payload contract exist.
- Support both `event_name` and `event_type` discriminators; they are not consistent across events.
- Preserve top-level event `id` for deduplication and idempotency.
- Treat nested schemas as evolving and ignore unknown fields.
- Treat CRM column names and payload keys as dynamic; resolve stable mappings through board metadata.
- Use business, inbox, and board filters when the event provides the relevant context.
- Validate event-specific payloads before committing a first-class V1 trigger node.
- For each committed node, document downstream fields, authentication, errors, retry behavior, idempotency, and example payloads.

## 6. Internal implementation references

- Allowed event registration: `cekat-ecommerce-backend/helpers/business_webooks/index.js`
- Matching and queue dispatch: `cekat-ecommerce-backend/helpers/business_weobooks/handle_webhooks.js`
- Conversation events: `helpers/business_webooks/handle_conversation_webhook.ts`
- Contact events: `helpers/business_webooks/handle_contact_webhooks.ts`
- Template events: `helpers/business_webooks/handle_template_update_webhook.ts`
- CRM events: `controllers/crmValueController.js`, `helpers/crm_item_operations.js`, `helpers/crm_item.js`, `controllers/crmItemController.js`, `controllers/crmOpenApiController.js`
- Order events: `controllers/cekatOrdersController.js`, `controllers/cekatOrdersOpenApiController.js`, `controllers/invoiceController.js`, order controllers and subscription helpers
- Payment events: `helpers/netzme.js`, `helpers/invoice.js`
