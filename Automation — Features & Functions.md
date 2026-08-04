---
title: Automation — Features & Functions
type: reference
tags:
  - automation
  - workflow-engine
  - cekat
status: draft
---

# Automation — Features & Functions

This document categorizes the planned Cekat Automations capabilities into triggers, filters and flow control, actions and data nodes, and platform or builder capabilities.

## 1. Triggers

| Feature / Function | Description | Phase |
|---|---|---|
| Message received | Starts an automation when a new message is received in selected inboxes or channels. | Phase 1 — MVP |
| Label added / removed | Starts an automation when a conversation label is added, removed, or changed. | Phase 1 — MVP |
| Conversation status changed | Starts an automation when the status of a conversation changes. | Phase 1 — MVP |
| CRM record created | Starts an automation when a new CRM record is created. | Phase 1 — MVP |
| CRM field changed | Starts an automation when a selected CRM field changes. | Phase 1 — MVP |
| Scheduled / cron trigger | Runs an automation on a recurring schedule, such as daily at 09:00. | Phase 1 — MVP |
| Conversation inactivity | Runs an automation after a conversation has been inactive for a defined period. | Phase 1 — MVP |
| Ticket created | Starts an automation when a support ticket is created. | Phase 1 — MVP |
| Ticket updated | Starts an automation when selected ticket fields change. | Phase 1 — MVP |
| Inbound webhook | Receives events from an external system through a webhook endpoint. | Phase 1 — MVP |
| Manual / test run | Runs an automation manually with sample data or a selected recent event. | Phase 1 — MVP |
| Message sent | Starts an automation when a message is sent. | Phase 2 — Full release |
| Pipeline status changed | Starts an automation when a conversation pipeline status changes. | Phase 2 — Full release |
| Conversation assigned | Starts an automation when a conversation is assigned to an agent. | Phase 2 — Full release |
| Contact property changed | Starts an automation when a contact property changes. | Phase 2 — Full release |
| Segment entered / exited | Starts an automation when a contact enters or exits a segment. | Phase 3 — v2 |
| CDP custom event received | Starts an automation when a defined CDP event is received. | Phase 3 — v2 |
| Order created / paid | Starts an automation when an order is created or paid. | Phase 3 — v2 |

## 2. Filters, Conditions & Flow Control

| Feature / Function | Description | Phase |
|---|---|---|
| Contact-property filter | Filters runs based on contact fields such as status, city, or source. | Phase 1 — MVP |
| CRM record filter | Filters runs based on CRM record attributes or field values. | Phase 1 — MVP |
| Existence filter | Checks whether a related record or event exists. | Phase 1 — MVP |
| Conversation existence check | Checks whether a contact has an open or recent conversation. | Phase 1 — MVP |
| CRM record existence check | Checks whether a CRM record exists on a selected board. | Phase 1 — MVP |
| Condition / If node | Routes a workflow into true and false branches based on a condition. | Phase 1 — MVP |
| Router / Switch node | Routes a workflow into multiple named branches based on a value. | Phase 1 — MVP |
| Mandatory fallback branch | Requires branching nodes to define what happens when no condition matches. | Phase 1 — MVP |
| Wait / delay step | Pauses execution for a defined duration or until a specific time. | Phase 1 — MVP |
| Post-wait condition re-check | Re-evaluates conditions after a wait before continuing. | Phase 1 — MVP |
| Loop over list | Iterates over a bounded list of records or values. | Phase 2 — Full release |
| Sequenced actions | Executes multiple actions sequentially within the same workflow. | Phase 2 — Full release |
| Segment-based filter | Filters workflow execution based on CDP segment membership. | Phase 3 — v2 |
| CDP event existence check | Checks whether a contact has or has not generated a specific CDP event. | Phase 3 — v2 |
| Order existence filter | Checks whether a contact has an order or meets an order-value condition. | Phase 3 — v2 |
| Stop workflow | Stops the current workflow path without affecting other automations. | Phase 3 — v2 |
| Stop / override outgoing reply | Stops or overrides an outgoing reply before it is sent. | Phase 3 — v2; separate design required |

## 3. Actions & Data Nodes, by Domain

### Conversation

| Feature / Function | Description | Phase |
|---|---|---|
| Add label | Adds one or more labels to a conversation. | Phase 1 — MVP |
| Remove label | Removes one or more labels from a conversation. | Phase 1 — MVP |
| Send message | Sends a free-text or template-based message. | Phase 2 — Full release |
| Update conversation status | Changes the status or state of a conversation. | Phase 2 — Full release |
| Assign conversation | Assigns a conversation to a selected agent or team. | Phase 2 — Full release |
| Resolve conversation | Marks a conversation as resolved. | Phase 2 — Full release |
| Block AI | Enables or disables AI handling for a conversation. | Phase 2 — Full release |
| Add private note | Adds an internal note to a conversation. | Phase 2 — Full release |

### CRM

| Feature / Function | Description | Phase |
|---|---|---|
| Find CRM record | Searches for a record using a selected board, field, and value. | Phase 1 — MVP |
| Create CRM record | Creates a new record on a selected CRM board. | Phase 1 — MVP |
| Update CRM record | Updates fields on an existing CRM record. | Phase 1 — MVP |
| Find-or-create CRM record | Finds an existing record or creates one when no match exists. | Phase 2 — Full release |
| Update contact property | Writes a value to a contact property. | Phase 2 — Full release |

### Ticketing

| Feature / Function | Description | Phase |
|---|---|---|
| Create ticket | Creates a support ticket based on workflow data. | Phase 2 — Full release |
| Update ticket | Updates fields on an existing support ticket. | Phase 2 — Full release |
| Call and link external ticket | Calls an external ticketing or policy-management system and stores the returned record ID for future synchronization. | Phase 2 — Full release |

### Marketing & CDP

| Feature / Function | Description | Phase |
|---|---|---|
| Fire custom CDP event | Sends a custom event with defined properties into the customer data platform. | Phase 2 — Full release |
| Call CAPI | Sends Meta or TikTok Conversions API events. | Phase 2 — Full release |
| Send campaign message | Sends campaign messages to eligible contacts. | Phase 3 — v2 |
| Suppression / frequency control | Prevents repeated campaign actions within a defined period. | Phase 3 — v2 |

### Utility & External Systems

| Feature / Function | Description | Phase |
|---|---|---|
| HTTP request / webhook action | Calls an external URL using a configured method, headers, body, and credential. | Phase 1 — MVP |
| Data formatting | Transforms strings, dates, numbers, and other values between steps. | Phase 1 — MVP |
| Set variable / output | Creates a named value that later nodes can reference. | Phase 1 — MVP |
| Generic Cekat API call | Calls Cekat functions that do not yet have a dedicated first-class node. | Phase 1 — MVP |
| Credential reference | Uses encrypted stored credentials instead of raw tokens in workflow configuration. | Phase 2 — Full release |
| Lookup table | Retrieves a value from a configurable key-value table. | Phase 2 — Full release |
| AI analysis step | Classifies or extracts information before routing or performing an action. | Phase 2 — Full release |
| All Cekat functions as nodes | Provides dedicated nodes for every callable Cekat function. | Phase 3 — Future / v2+ |

## 4. Platform / Builder Capabilities

| Feature / Function | Description | Phase |
|---|---|---|
| Workflow census | Reviews existing client workflows to validate node priorities and migration scope. | Phase 0 — Foundations |
| Data model | Defines automations, versions, graphs, nodes, edges, runs, steps, credentials, and lookup tables. | Phase 0 — Foundations |
| Automation menu | Provides a dedicated Automation section in the Cekat dashboard. | Phase 1 — MVP |
| Multiple automation management | Allows users to create, list, edit, enable, disable, and manage multiple automations. | Phase 1 — MVP |
| Drag-and-drop builder | Provides a visual canvas for creating and connecting workflow nodes. | Phase 1 — MVP |
| Workflow list | Displays all workflows belonging to a business. | Phase 1 — MVP |
| Node configuration drawer | Allows each node to be opened and configured using n8n-style controls. | Phase 1 — MVP |
| Typed resource pickers | Uses validated pickers for inboxes, boards, columns, labels, agents, and statuses instead of free-text IDs. | Phase 1 — MVP |
| Expression references | Allows users to reference data such as `{{trigger.contact.phone}}` between nodes. | Phase 1 — MVP |
| Node manifest schema | Defines node configuration, ports, validation, category, domain, and execution behavior in one shared contract. | Phase 1 — MVP |
| API-first execution engine | Makes workflows executable through an API before the visual builder is complete. | Phase 1 — MVP |
| Test-run / dry-run mode | Executes data and logic nodes while simulating external side effects. | Phase 1 — MVP |
| Execution logs | Records every automation run and its terminal status. | Phase 1 — MVP |
| Node-level logs | Shows input, output, status, duration, and errors for each workflow node. | Phase 1 — MVP |
| Searchable execution history | Searches executions by workflow, status, date range, and run ID. | Phase 1 — MVP |
| Live execution view | Displays currently running automations and their progress. | Phase 1 — MVP |
| Run filtering | Filters executions by success, error, filtered status, workflow, date, or run ID. | Phase 1 — MVP |
| Automation attribution | Attaches `automation_id` and `node_id` to automation-generated events and side effects. | Phase 1 — MVP |
| Error handling | Ensures failures are surfaced and do not disappear silently. | Phase 1 — MVP |
| Error containment | Isolates stuck or failing automations so they cannot affect other workflows, businesses, or the platform. | Phase 1 — MVP |
| Enable / disable workflow | Turns individual workflows on or off without deleting them. | Phase 1 — MVP |
| Workflow versioning | Stores immutable versions of workflow definitions. | Phase 1 — MVP |
| Version restore | Restores a workflow to a previous version. | Phase 1 — MVP |
| Publish validation | Prevents publishing workflows with invalid references, missing required branches, or unconnected required ports. | Phase 1 — MVP |
| Business-level isolation | Scopes automations, executions, credentials, and data to the correct business. | Phase 1 — MVP |
| Retry handling | Retries eligible failed steps while avoiding duplicate side effects. | Phase 2 — Full release |
| Idempotent actions | Prevents retries from creating duplicate messages, records, or external side effects. | Phase 2 — Full release |
| Automatic disabling | Disables an automation after excessive failures, looping, or resource consumption. | Phase 2 — Full release |
| Workspace defaults | Applies shared settings such as timezone and date format across workflows. | Phase 2 — Full release |
| Credential management | Stores encrypted external-system credentials and prevents them from appearing in logs or frontend configuration. | Phase 2 — Full release |
| Gradual n8n coexistence | Keeps n8n available for legacy or edge-case workflows during migration. | Phase 2 — Migration period |
| Client migration support | Rebuilds and migrates existing n8n workflows into Cekat Automations. | Phase 2 — Full release |
| Monitoring dashboard | Tracks run volume, failures, execution duration, and storage growth. | Phase 2 — Hardening |

## Explicitly Out of Scope for v1

| Feature / Function | Description | Phase |
|---|---|---|
| Arbitrary code execution | Running custom JavaScript or Python code inside workflows. | Out of scope |
| Large connector library | Providing hundreds of generic third-party integrations. | Out of scope |
| AI agent orchestration | Hosting agents, memory, RAG, or full agent workflows. | Out of scope |
| Large-scale ETL processing | Processing large datasets, binaries, or media files inside workflows. | Out of scope |
