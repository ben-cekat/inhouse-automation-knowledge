---
title: "Design Brief — Cekat Automations v1"
type: design-brief
status: draft
created: 2026-07-30
author: Ben
purpose: "Input brief for an AI design tool (Claude, Google Stitch, etc.) to generate v1 screens"
based_on: "[[Areas/Automation/PRD — Cekat Automations v1 (Simplified Scope Draft)]]"
---

# Design Brief — Cekat Automations v1

## Product in one paragraph

Cekat Automations is a drag-and-drop workflow builder, embedded inside the existing Cekat dashboard, replacing an embedded n8n instance clients use today. Businesses build automations that watch for something happening (a message, a label change, a schedule, a quiet conversation), optionally filter or wait, then take an action (add a label, call a webhook, update a record). It needs to feel instantly familiar to someone who has used n8n's canvas — same interaction model, not a reinvention — while being visibly simpler and more legible.

## Who's using this

Primary user: a non-technical client admin or ops lead — comfortable with spreadsheets and SaaS dashboards, not a developer. They build the automation once, then rarely touch it. Secondary user: a Cekat CS agent diagnosing "why didn't this run," who needs to answer that in under 30 seconds without asking an engineer.

## Guiding design principle (the single most important instruction)

**Familiar by default, divergent only with a reason.** Where n8n already does something well, match it: same canvas interaction (drag from a port to connect, click a node to open its config, palette on one side), same list/detail structure, same "Editor / Executions" tab split. Only diverge where it fixes a specific, named problem (see "Where we deliberately differ from n8n" below). Test for every design decision: *would someone who's used the current n8n embed be able to do this without being told?* If no, it needs a clear, visible reason (an inline label, a tooltip, a badge) — not a silent change.

## Visual tone

Clean, calm, data-dense but not cluttered — this sits inside an existing product (Cekat's dashboard), so it should read as a natural extension of that dashboard's visual language, not a separate app bolted on. Favor clarity over decoration: status badges, colored port/connection lines, and inline validation markers do more work here than illustration or big empty states. This is a tool professionals use daily, not a marketing surface.

---

## Match the current Cekat menu layout exactly — this is not optional

Cekat Automations replaces what's currently an embedded n8n instance living under the **same nav slot it occupies today.** The generated design must reuse the existing chrome pixel-for-pixel, not reinterpret it.

### Full text description of the reference screenshot (for a model with no image access)

*Ignore browser chrome around the edges (address bar, browser's own bookmark sidebar) — not part of the product. Everything below is the application UI only.*

**Overall theme:** Dark mode throughout. Background near-black (roughly `#0D0D10`–`#121214`). Primary text white. Secondary/metadata text muted mid-gray (roughly `#8B8B93`). One accent color — warm orange-red (roughly `#F0562E`) — used consistently for: the active top-nav tab's underline, the active sub-tab's underline, the primary button fill, and the active page-number highlight in pagination. A separate green (roughly `#22C55E`) is used only for the "Published" status indicator. Clean sans-serif typography (system-UI/Inter-like), no serif, no decoration — a dense, utilitarian data tool, not a marketing surface.

**1. Top application header bar** (full width, dark background, ~56–64px tall): far left, a small circular brand logo (blue circle, stylized "C"). Immediately after: four primary nav items, each with a small icon beside its label — "Chat," "Orders," "Marketing," "Automation" — plain text, dimmer gray when inactive; the active one ("Automation") is brighter/white with a colored underline beneath it. Far right, in order: an outlined "Manage plans" button with a small external-link icon; three small square icon-only buttons (document/clipboard, briefcase, help question-mark-in-circle); a bell (notifications) icon; a circular user avatar, the user's name as text, and a small dropdown chevron.

**2. Page header block** (below the top bar, dark background, generous padding): left-aligned bold white heading "Overview" with a smaller gray subtitle beneath ("All the workflows, credentials and data tables you have access to"). Right-aligned, vertically centered with the heading: one prominent orange-accent button with white text reading "Create workflow" — a split/combo button with a thin internal divider separating the main label from a small dropdown-chevron section on its right edge.

**3. Sub-tab row** (below the page header, left-aligned, no background change, generous spacing between items): five tab labels in this exact order — "Workflows," "Credentials," "Executions," "Variables," "Data tables." Active tab is white with a colored underline beneath just that word; the rest are gray with no underline.

**4. List-controls row** (below the sub-tabs, grouped and right-aligned on their own line): a rounded-rectangle search input (dark fill, thin border) with a magnifying-glass icon and "Search" placeholder; next to it, a "Sort by last updated" dropdown with a chevron, same styling; next to that, a small square icon-only button with a funnel/filter icon.

**5. The workflow list** (a vertical stack of rows, full width, thin horizontal divider between rows, no alternating shading). Each row's anatomy:
- *Left side, two lines:* line 1 is the workflow name in bold/semibold white (freeform naming — ALL_CAPS_WITH_UNDERSCORES, Title Case with spaces, occasional parentheses — no enforced convention). Line 2, smaller and gray, directly beneath: "Last updated [X] ago" then a vertical bar "|" separator then "Created [date]."
- *Right side, one horizontal group, left to right:* a rounded-pill badge (subtle dark-gray fill, thin border) with a tiny person icon and text like "Personal / [folder, truncated with ellipsis if long]"; immediately after, another pill badge with a small green dot and green-tinted text reading "Published" (the only status value currently shown — no visible Draft/Disabled state today, but this pill is the template to extend into three colors); finally, a vertical three-dot "kebab" menu icon button at the row's far right edge.

**6. Pagination footer** (below the list, one horizontal line): far left, gray text "Total [N]"; center, pagination controls (left-chevron, page-number buttons with the current page highlighted in the orange accent or a light contrast fill, right-chevron); far right, a "[N]/page" dropdown (e.g. "50/page") with a chevron.

---

**Top-level app shell (do not redesign — reuse as-is):**
- Dark theme throughout: near-black background, white primary text, muted gray secondary text (timestamps, metadata lines).
- Top nav bar: Cekat logo, then a horizontal tab row — **Chat · Orders · Marketing · Automation** — with the active tab underlined in the brand's orange/red accent color.
- Top-right cluster: "Manage plans" button, a row of small utility icons, a notification bell, and the user's avatar + name with a dropdown chevron (e.g. "Dhanu Dewantara").

**Automation page structure (reuse as-is):**
- Page header: bold "Overview" title with a one-line gray subtitle underneath ("All the workflows, credentials and data tables you have access to").
- A row of five sub-tabs directly under the header, left-aligned, with the active one underlined in the same orange/red accent: **Workflows · Credentials · Executions · Variables · Data tables.** Keep this exact tab set and order — do not rename "Data tables" back to "Lookup tables," and do not drop "Variables" even though it isn't in our v1 node catalog yet; it can stay as a placeholder/inherited tab.
- Primary action, top-right of the header row: a red/orange **"Create workflow"** split button — main click creates a blank workflow, the attached dropdown chevron offers alternatives (e.g. "Start from template").
- List controls row, right-aligned above the table: a search input, a "Sort by [last updated]" dropdown, and a filter icon button.
- Pagination footer: total count on the left ("Total 54"), page number controls in the center, a "[N]/page" size dropdown on the right.

**Row anatomy — this is the template every workflow row must follow, extended rather than replaced:**
- Line 1: workflow name, bold, white, click-through to the editor.
- Line 2, small gray text: `Last updated [relative time]` followed by a separator, then a second field.
- Right-aligned, in order: an owner/scope pill (`Personal / [folder path]`), a status pill (colored — currently only green "Published" exists; extend this to the three-state set below), and a three-dot overflow menu.

### 1. Workflows list (default landing page)

Follow the row anatomy above exactly, with these additions layered into the existing template rather than new columns bolted on the side:

- **Line 2 changes from "Created [date]" to a trigger summary** — e.g. "Label added · 6 inboxes" or "Every day at 09:00" — this is the single biggest legibility win over the current list, where a user must open a workflow to learn what fires it. Keep "Last updated [time]" as the first half of the line; replace only the second half.
- **Status pill becomes three states** instead of the current single green "Published": **Published** (green, as today), **Draft** (gray/yellow), **Disabled** (red or muted, and the whole row dims slightly when disabled — not just the pill).
- **A new small pill or icon+text is added just before the status pill**, showing last run outcome — e.g. a green check "2m ago" or a red X "4h ago · 3 failed" — reusing the same pill shape/sizing already used for the owner and status pills so it reads as part of the same family, not a foreign element.
- Overflow menu (three-dot, already present): Open, Duplicate, Rename, Enable/Disable, Export, Delete.
- Keep the existing search + sort + filter row and pagination footer exactly as shown in the reference; add filter options for status, trigger type, and edited-by inside the existing filter icon's dropdown rather than adding new controls to the row.
- The existing "Create workflow" split button stays as-is; wire its dropdown to offer "Start blank" / "Start from template."

### 2. Workflow editor — canvas

The core screen. Two-tab header: **Editor** | **Executions**, plus workflow name (editable inline), tags, a Published/Draft toggle, version history icon, and an overflow menu.

Canvas layout:
- **Left rail:** searchable node palette, grouped into labeled sections by domain — Conversation, CRM, Marketing, Flow, Utility. Each node in the palette shows a small category badge (Trigger / Logic / Data / Action) using distinct colors so the data-vs-action distinction is visible before it's ever used.
- **Center:** the graph canvas itself — nodes as rounded rectangle cards connected by curved lines with clear directional arrows. Named output ports appear as small labeled circles on a node's right edge (e.g. "found" / "not found" / "multiple matches" as three separate connection points on a lookup node). A required-but-unconnected port shows a visible red/amber indicator on the node itself, not just at publish time.
- **Bottom-left control cluster:** zoom in/out, fit-to-view, undo/redo, and a "tidy/auto-layout" button.
- **Primary action button**, top-right of canvas: "Execute workflow from [Trigger Name]" — labeled dynamically with whichever trigger the workflow uses.
- **Collapsible logs panel**, docked at the bottom, showing the most recent runs without leaving the canvas.

### 3. Node configuration drawer

Opens as a right-hand panel (not a modal) when a node is clicked — the canvas stays visible behind it. Contains:
- A rename field for the node
- The config form itself, generated per node type — mostly dropdown pickers (for boards, inboxes, labels — always real, searchable, live values, never free-text ID fields), a few text/expression inputs with inline autocomplete showing available upstream data (e.g. typing `{{` surfaces a dropdown of what earlier nodes produced), and toggle/enum controls where relevant
- After a test run, an "Input / Output" section appearing side-by-side at the bottom of the drawer, showing the real data that flowed through that specific node

### 4. Test run / dry-run experience

A "Test" button opens a lightweight picker: choose a real recent event for this business (last ~20 matching events) or paste sample JSON. After running, every node on the canvas gets a small inline badge showing it executed, plus a hover/click reveal of its actual input and output. Nodes that would have taken a real action (send a message, update a record) are visually marked "Would have run" (e.g. a dashed border or a small "simulated" tag) rather than looking identical to a real execution.

### 5. Executions view

The **Executions** sub-tab already exists in the current nav — reuse that exact tab slot and page shell. Two-pane layout, available both inside a single workflow (an Editor/Executions split within the workflow itself) and business-wide (the top-level Executions sub-tab).
- **Left pane:** list of runs — timestamp, status badge (Running / Succeeded / Failed / Filtered / Stopped, each a distinct color), duration, trigger source, small icon distinguishing manual/test runs from live ones. Filterable by status, date range, workflow, and — notably — by a specific conversation or contact.
- **Right pane:** the selected run shown as the same canvas, with the actual executed path highlighted (e.g. a colored trace along the edges that were taken) and every node clickable to reveal its real input/output for that run.
- New runs appear at the top of the list live, without a manual refresh — a run "in progress" shows an animated/pulsing "Running" state with elapsed time, settling to a final status badge on completion.

### 6. Enable/disable, publish, and version history

- A clearly visible on/off toggle both on the workflows list row and in the editor header — when off, the row is visually muted/grayed in the list, not just a small badge change.
- **Version history panel** (slide-out or modal): a chronological list of published versions, each with version number, published-at timestamp, published-by user, and an optional change note. Each entry has a "View" (read-only canvas) and "Restore" action. Restoring is visually framed as "create a new version identical to this one," not a destructive rollback.

### 7. Data tables (secondary screen — sub-tab already exists in current nav)

Reuse the existing **Data tables** sub-tab directly; do not rename it. Content: a simple two-column key→value spreadsheet-style editor (e.g. "inbox → board" mappings) — this is what the PRD calls a lookup table, kept under the name already in production.

### 8. Credentials (secondary screen — sub-tab already exists in current nav)

Reuse the existing **Credentials** sub-tab directly. Content: a simple list of stored secrets (name, type, last used, created by) with an "Add credential" flow that never displays the secret value again after creation — used by the webhook/HTTP action node.

### Variables (existing sub-tab — not part of this brief)

The current nav already has a **Variables** tab. It isn't in the v1 node catalog yet (see "What NOT to design yet" below) — leave it in place as-is; nothing here requires touching it.

---

## Where we deliberately differ from n8n (call these out visually, don't hide them)

| We match n8n | We deliberately change | Why (for the designer's context, not shown to the user) |
| --- | --- | --- |
| Canvas drag/connect, node config drawer, Editor/Executions tabs, publish toggle, zoom/tidy controls | Typed pickers instead of free-text fields everywhere a board/label/inbox is referenced | Removes the most common source of copy-paste bugs |
| — | Mandatory fallback branch on any router/condition node — shown as a distinct, always-present "else" port | Prevents silent drops when nothing matches |
| Execution list with status + duration | Live-updating list (no manual refresh, no "auto-refresh" toggle) | Users want to watch an automation fire in real time |
| — | Trigger summary column on the list view | Today a user must open a workflow to know what triggers it — this is new and valuable |

---

## Content/copy notes for the designer

- Status words to use consistently: **Published**, **Draft**, **Disabled** for workflow-level state; **Running**, **Succeeded**, **Failed**, **Filtered**, **Stopped** for run-level state.
- Avoid generic empty states like "No data yet" — where possible, give action-oriented empty states ("Create your first automation" with the same primary button as the list page).
- Every place a technical ID would otherwise show (board ID, inbox ID) should render the real human-readable name instead, with the ID only in a tooltip if needed at all.

## What NOT to design yet (out of scope for this brief)

- Segment/CDP-based trigger or filter configuration screens (deferred, still under discussion)
- Any settings screen for "stop/override an outgoing reply" (deferred)
- A dedicated screen exposing "all Cekat functions" as individual nodes — for v1, this is just the generic HTTP/webhook action node's config panel, nothing more elaborate

## Suggested generation order

If generating screens one at a time rather than all at once: **(1)** Workflows list, **(2)** Editor canvas with palette + a few placed nodes, **(3)** Node config drawer open over the canvas, **(4)** Executions two-pane view. These four cover the primary user journey and are the most useful set to react to first.

---

## Appendix: node & trigger reference (for populating the palette and config drawer mockups)

Scoped to the v1 must-haves only (see the simplified scope draft). Properties are described as they should *render* in the config drawer, not as backend field names — every "picker" is a searchable dropdown of real, live values, never a free-text box.

### Triggers — palette section "Conversation," "CRM," "Utility"

| Node | One-line description | Config properties (as shown to the user) | Example values |
| --- | --- | --- | --- |
| **Message received** | Fires when a new message arrives | Inboxes (multi-select picker) · Channels (multi-select picker, optional) | Inboxes: "SKIN+ AI, SLIM+ AI" |
| **Label added / removed** | Fires when a label is added or removed on a conversation | Inboxes (multi-select picker) · Labels (multi-select picker) · Change type (toggle: Added / Removed / Either) | Labels: "Hot, Warm, Cold" |
| **Conversation status changed** | Fires when a conversation's status changes | Inboxes (multi-select picker) · From status (picker, optional) · To status (picker, optional) | "Any → Resolved" |
| **CRM record created** | Fires when a new record is created on a board | Board (single-select picker) | "Bookings board" |
| **CRM field changed** | Fires when a specific field on a board changes | Board (picker) · Column(s) to watch (multi-select picker) | "Appointment Date" |
| **Conversation inactive for N** | Fires when a conversation has had no reply for a set time | Inboxes (multi-select picker) · Duration (number + unit dropdown: minutes/hours) · Whose turn (toggle: Customer hasn't replied / Agent hasn't replied) | "24 hours, customer hasn't replied" |
| **Schedule** | Fires on a recurring schedule | Frequency (dropdown: Daily / Weekly / Custom cron) · Time of day (time picker) · Timezone (defaults to workspace setting, overridable) | "Daily at 09:00, Asia/Jakarta" |
| **Manual / test run** | No live trigger — run on demand with sample data | Sample source (toggle: Pick a recent real event / Paste sample data) | — |

### Filters and flow control — palette section "Flow"

| Node | One-line description | Config properties | Example values |
| --- | --- | --- | --- |
| **Filter** | A single yes/no gate right after the trigger | Field (picker, scoped to what's available) · Operator (dropdown, changes based on field type — text/number/date/enum/boolean each show different operator options) · Value (input matching the field type) | "Label is Hot" |
| **Condition (If)** | A branch with exactly two outcomes | Same field/operator/value builder as Filter | "Order value > 500,000" |
| **Router (Switch)** | A branch with several named outcomes plus a required fallback | Field to switch on (picker) · One row per branch value (add/remove rows) · Fallback branch (always present, cannot be removed) | Branches: "Hot / Warm / Cold / (fallback: unmapped)" |
| **Existence filter** | Checks whether a related record/conversation exists, rather than comparing a value | What to check (dropdown: Conversation exists / Conversation exists in window / CRM record exists on board) · Window (number + unit, only shown for the "in window" option) · Board (picker, only shown for the CRM option) | "Conversation exists in the last 7 days" |
| **Wait / Delay** | Pauses before continuing | Duration (number + unit) or Until time of day (time picker) · "Re-check conditions on resume" (toggle) | "Wait until 09:00, re-check: on" |

### Actions — palette sections "Conversation," "CRM," "Marketing," "Utility"

| Node | One-line description | Config properties | Example values |
| --- | --- | --- | --- |
| **Add label / Remove label** | Adds or removes a label on the conversation | Label(s) (multi-select picker) | "Add: Hot. Remove: Cold, Warm" |
| **Send message** | Sends a text or templated message | Message type (toggle: Free text / Template) · Content (text box with variable autocomplete, or template picker) | "Template: booking_confirmation" |
| **Update session field** | Writes a value to the conversation's session data | Field (picker) · Value (input, with variable autocomplete) | "SLA status → Met" |
| **Find CRM record** | Looks up a record without changing anything | Board (picker) · Match field (picker, scoped to the chosen board) · Match value (input with variable autocomplete) · If multiple matches (dropdown: Route to separate branch / Use most recently updated / Use most recently created) | "Board: Bookings, match Phone = {{contact.phone}}" |
| **Create / Update CRM record** | Writes a new record or updates an existing one | Board (picker) · Record reference (only for Update — usually chained from a Find node) · Field values (one row per field, each with its own input type matching the field) | "Set Status = Confirmed" |
| **Call webhook (HTTP request)** | Calls an external URL | Method (dropdown: GET/POST/PUT/PATCH/DELETE) · URL (text input) · Credential (picker — never a raw token field) · Headers/Body (key-value rows, with variable autocomplete) | "POST to client's CMS endpoint" |
| **Call CAPI** | Sends a conversion event to Meta/TikTok | Platform (dropdown: Meta / TikTok) · Event type (picker) · Value (input, optional) | "Meta: Purchase, value 250,000" |
| **Fire custom event** | Emits a custom event into Cekat's event tracking | Event name (picker or free text) · Properties (key-value rows) | "Event: promo_redeemed" |
| **Format / Set variable** | Transforms a value for use later in the automation | Operation (dropdown: trim / uppercase / lowercase / date format / number format / etc.) · Input (variable picker) · Output name | "Format date as DD MMM YYYY" |
| **Lookup** | Reads a value from a data table | Table (picker) · Key (input with variable autocomplete) | "inbox_to_board[{{trigger.inbox}}]" |

Every node in the palette should show a small colored category badge — **Trigger**, **Logic**, **Data**, or **Action** — so the design communicates the data-vs-action distinction (which nodes are safe to test freely vs. which ones take a real effect) before the user ever opens one.
