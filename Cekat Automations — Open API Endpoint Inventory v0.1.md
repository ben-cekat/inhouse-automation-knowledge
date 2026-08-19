---
title: Cekat Automations — Open API Endpoint Inventory v0.1
type: Evidence-based API inventory
status: draft-not-authoritative
last_updated: 2026-08-13
---

# Cekat Automations — Open API Endpoint Inventory v0.1

> **Status:** Evidence-based draft — not authoritative. This inventory consolidates the supplied Cekat Open API Markdown documents and existing implementation evidence. It is intended for AUTO-6 assessment and Activepieces node planning. It is not a replacement for the official Cekat OpenAPI specification.

## 1. Evidence policy

| Classification | Meaning |
|---|---|
| Verified in supplied API docs | Explicitly documented in one of the supplied files |
| Verified in source code | Directly observed in the existing n8n implementation |
| Observed behavior | Visible in implementation or examples, but not confirmed as an official contract |
| Unknown | No reliable contract was found |
| Pending official API documentation | Requires confirmation from the Chat team |

### Sources reviewed

- `templates.md`
- `messages.md`
- `inboxes.md`
- `conversations-v1-old.md`
- `conversations-v2-new-cursor-base-pagination.md`
- `contacts.md`
- `campaigns-broadcast-message.md`
- `agent-assigment.md`
- `agents.md`
- `chat.md`
- Existing `n8n-nodes-cekatai` handlers and descriptions
- `Business Webhook Events — Consolidated Reference.md`

## 2. Cross-cutting contract

### Authentication

The supplied endpoint documents describe either of these authorization forms:

```http
Authorization: api_key <API_KEY>
```

or:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

The existing n8n implementation additionally sends an `api_key` request parameter/header behavior through its shared helper. The official precedence and exact authentication requirements per endpoint are **pending official API documentation**.

### Base URLs

The existing implementation contains these hosts:

```text
https://server.cekat.ai
https://api.cekat.ai
https://staging-server.cekat.ai
```

The supplied API files do not establish the canonical production/staging host or API versioning policy. **Pending confirmation.**

### Business and permission scope

The endpoints are described as operating on the business associated with the credential. The supplied documents do not define:

- OAuth scopes
- API-key permission granularity
- Role requirements
- Cross-business behavior
- Field-level PII restrictions

Treat tenant scope and permissions as unresolved integration requirements.

### Date and timezone filtering

The supplied documents describe:

- Default timezone: `Asia/Jakarta` / GMT+7.
- Optional `X-User-Timezone` header using a valid IANA timezone.
- Date bounds: `YYYY-MM-DD`.
- Datetime bounds: ISO-like datetime with optional fractional seconds and offset.
- Do not send both `start_date` and `start_datetime`, or both `end_date` and `end_datetime`.
- Mixed pairs are allowed, such as `start_date + end_datetime`.

`GET /api/messages` has different behavior: no dates means the current calendar day; start-only extends through the current day. Do not apply the messages rule to all other endpoints.

### Pagination

Most collections use page pagination:

```text
page
limit
```

Conversation v2 uses cursor pagination:

```text
limit
cursor_id
cursor_ts
```

Continue until both values in `metadata.next_cursor` are `null`. The supplied conversation v2 document states a maximum limit of 100 and a documented limit of 300 requests/minute/IP.

Other documented limits include:

- Recipient-list GET: maximum `limit=500`.
- Campaign delivery details v2: maximum `limit=100`.
- Recipient upload: maximum 10 MB, 5,000 contacts, and 100 columns.

Other page limits and rate limits are **unknown** unless stated below.

### Retry and idempotency

No global retry policy, `Retry-After` behavior, idempotency key/header, or duplicate-request contract is documented.

Until confirmed, do not blindly retry ambiguous failures for:

- `POST /api/campaigns`
- `POST /api/recipients`
- `POST /api/messages/meta_events/send`
- Message-sending operations
- Order mutations

## 3. Read endpoints

| Endpoint | Method | Documented request | Documented response/data | Classification |
|---|---:|---|---|---|
| `/api/templates` | GET | Date/datetime filters, `page`, `limit` | Template metadata, header/body/footer/variables/buttons, inbox/business references, pagination | First-class lookup candidate |
| `/api/messages` | GET | `conversation_id`, date/datetime filters, `is_ads`, `is_template`, `sort_order`, `version`, `page`, `limit` | Message identity/content/sender, conversation, media, platform ID, status, timestamps, flexible metadata | First-class lookup candidate |
| `/api/messages/summary/ai_credits` | GET | `conversation_id`, date/datetime filters | `total_ai_messages`, `total_ai_credits_used`, `total_conversations` | First-class lookup candidate |
| `/api/inboxes` | GET | Date/datetime filters, `page`, `limit` | Inbox identity/type/status, flow/AI fields, business, phone, timestamps | Resource picker candidate |
| `/api/contacts` | GET | Date/datetime filters, `page`, `limit` | Contact identity/name/email/phone/platform, connected inboxes, `additional_data` | First-class lookup candidate |
| `/api/agents` | GET | Date/datetime filters, `page`, `limit` | Agent identity/name/email, role, divisions, online state, creation time | Resource picker candidate |
| `/api/agent_assignments` | GET | Date/datetime filters, `page`, `limit` | Contact/conversation/inbox context, handler, stage status, assignment timestamps | P1 lookup candidate |
| `/api/conversations` | GET | See v2 conflict below | Conversation/contact/inbox/assignment/resolution/labels/notes, stage status, minimal first/last message, cursor metadata | P0/P1 lookup candidate |
| `/api/campaigns` | GET | Date/datetime filters, `page`, `limit` | Campaign/template/inbox/recipient-list references and aggregate delivery metrics | P1 lookup candidate |
| `/api/recipients` | GET | `page`, `limit` | Recipient-list ID/name/total contacts | P1 lookup candidate |
| `/api/v2/campaigns/{campaignId}/messages` | GET | Campaign UUID, `page`, `limit` | Per-recipient delivery, reply, failure, conversation, and template details | P1 lookup candidate |
| `/api/campaigns/{campaignId}/messages` | GET | Legacy page/limit and optional version | Legacy detailed campaign messages and aggregate metrics; full schema not supplied | Legacy/P2 only |

## 4. Write endpoints

### 4.1 Send Meta event

```http
POST /api/messages/meta_events/send
```

**Request documented in `campaigns-broadcast-message.md`:**

```json
{
  "inbox_meta_dataset_id": "dataset-123",
  "test_event_code": "TEST123",
  "events": [
    {
      "event_name": "Purchase",
      "event_time": 1700000000,
      "action_source": "business_messaging",
      "user_data": {},
      "custom_data": {
        "currency": "IDR",
        "value": 100000
      },
      "messaging_channel": "whatsapp"
    }
  ]
}
```

Documented validation includes non-empty `event_name`, `action_source`, and `user_data`; Purchase requires currency and numeric value; business messaging requires `messaging_channel`; `event_time` is Unix seconds when supplied.

Documented statuses include 200 success, 400 validation, 404 dataset integration not found, and 502 Meta forwarding error.

**Node classification:** P1 action; side-effecting; no documented idempotency or retry contract.

### 4.2 Upload recipient list

```http
POST /api/recipients
```

**Request:** `multipart/form-data` with required `name` and CSV/XLSX `file`.

Required input headers:

```text
phone_number
name
```

Documented limits and behavior:

- Maximum 10 MB.
- Maximum 5,000 contacts.
- Maximum 100 columns.
- Phone normalization and deduplication are documented.

**Success:** 201 with recipient-list `id`, `name`, and `total_contacts`.

**Documented errors:** 401, 413 oversized file, and 422 validation/input-file errors.

**Node classification:** P1 action; side-effecting; no documented idempotency or retry contract.

### 4.3 Create broadcast campaign

```http
POST /api/campaigns
```

**Required request fields:**

```json
{
  "campaign_name": "Campaign name",
  "inbox_id": "inbox-123",
  "recipient_list_id": "recipient-list-123",
  "template_id": "template-123"
}
```

**Optional fields:**

```text
label_id
schedule_at
```

Documented constraints:

- WhatsApp inbox only.
- Campaign creation uses a recipient-list ID; raw phone numbers are not supported.
- Scheduled time cannot be in the past.
- Campaigns cannot be edited or cancelled through the documented API.

**Success:** 201 with campaign `id`, name, status, and creation time.

**Documented errors:** 401, 422 validation/reference/unsupported-inbox/past-schedule errors, and 503 queuing failure.

**Node classification:** P1 action; side-effecting; do not blindly retry ambiguous failures.

## 5. Conversation version conflict

Both conversation documents use:

```http
GET /api/conversations
```

but define incompatible contracts.

| Aspect | v1 old | v2 new |
|---|---|---|
| Pagination | `page`, `limit` | `cursor_id`, `cursor_ts`, `limit` |
| Limit | Old maximum documented as 1000 | New maximum documented as 100 |
| Metadata | Page totals | `metadata.next_cursor` |
| Completion | Page totals | Both next-cursor values are null |
| Fields | Full first/last messages | Minimal first/last message fields plus `stage_status` |
| Rate limit | Not documented | 300 requests/minute/IP documented |
| Status | Explicitly old | Explicitly new/current candidate |

**Implementation position:** Use v2 cursor pagination as the intended current contract, but mark it `Pending provider confirmation` because no version selector, route change, rollout date, or deprecation date is provided.

The v2 example also contains malformed JSON and is inconsistent about whether `last_message.created_at` exists. Treat only documented minimal message fields as contractual until corrected; use `/api/messages` for full message details.

## 6. Domain field notes

### Messages

Documented/observed fields include message ID, body/content, sender identity/type, conversation ID, media, platform message ID, status, timestamps, business ID, and flexible additional/location/interactive/action objects.

Sender types documented across the supplied materials include `agent`, `user`, `ai`, `private_note`, `api`, `campaigns`, `follow_up`, `system`, and `inbox`.

Delivery statuses include `sent`, `delivered`, `read`, and `failed`.

Flexible nested object schemas remain incomplete.

### Conversations

Core fields include conversation/contact/inbox references, handler/resolver fields, resolution time, notes, labels, additional data, creation time, and (in v2) `stage_status`.

Documented example stage statuses include `resolved`, `pending`, `assigned`, and `open`.

### Campaign delivery details

The v2 campaign-detail response includes recipient identity/phone, campaign and conversation references, content/media, delivery status/time, sent/delivered/read/replied/button-clicked/agent-replied/failed indicators, error text, first-reply information, and template category.

PII and retention controls are not documented.

## 7. Endpoint and node classification

### First-class node candidates

- List Templates
- List Messages
- Get AI Credit Summary
- List Inboxes
- List Contacts
- List Agents
- List Conversations using cursor v2 after provider confirmation
- Send Meta Event
- Upload Recipient List
- List Recipient Lists
- Create Broadcast Campaign
- List Campaigns
- Get Campaign Delivery Details v2

### Generic API-only or validation candidates

- Legacy campaign message details
- Agent assignment reporting until timestamp semantics are confirmed
- Flexible message nested-object operations
- Any endpoint without a complete response contract

### Existing Cekat nodes covered by prior evidence

- Conversation label/status/assignment actions
- WhatsApp message action
- CRM actions and lookups
- Contact additional-data update
- Business webhook trigger

## 8. Remaining unknowns

The supplied documents do not establish:

- Canonical production/staging base URLs.
- API version negotiation.
- OAuth scopes, API-key roles, and tenant isolation rules.
- A global error envelope.
- Retry policy, `Retry-After`, or idempotency support.
- Rate limits beyond conversations v2.
- Pagination maximums for most endpoints.
- Stable ordering guarantees for page-based endpoints.
- Exact conversation v2 rollout/deprecation behavior.
- Complete legacy campaign-message response schema.
- Complete nullable/type schema for flexible fields.
- PII retention, masking, and export controls.

## 9. AUTO-6 assessment

The supplied documents resolve a substantial portion of AUTO-6:

- Relevant endpoints are grouped by domain.
- Methods, paths, and many request schemas are documented.
- Several success and error examples are available.
- Read-only versus side-effecting operations can be classified.
- Pagination, date/time filters, limits, and conversation cursor behavior are documented for the relevant endpoints.
- First-class node candidates and generic/legacy candidates are identified.

AUTO-6 should remain **In Progress — evidence-based inventory complete; official API validation pending** until the API owner confirms authentication scope, full response/error schemas, retry/idempotency behavior, rate limits, tenant permissions, and conversation versioning.

## 10. Source quality notes

`chat.md` is a stale/incomplete endpoint summary: it omits documented POST endpoints and v2 routes and describes conversations using page pagination. It should not be treated as authoritative.

`conversations-v1-old.md` is retained for migration context only. `conversations-v2-new-cursor-base-pagination.md` is the preferred current candidate but requires provider confirmation because it reuses the same path.
