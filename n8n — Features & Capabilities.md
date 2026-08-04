---
type: resource
source: https://docs.n8n.io
saved: 2026-07-29
tags: [automation, ipaas, ai-agents, tooling, build-vs-buy]
---

# n8n — Features & Capabilities

**Type:** research note
**Researched:** 2026-07-29 (n8n 2.x era)
**Scope:** technical capabilities · buy/build evaluation · embedding into a product · use cases & patterns

## Summary

n8n is a source-available, node-based workflow automation platform aimed at technical teams. It sits between Zapier/Make (easy, cloud-only, per-step billing) and writing your own orchestration code: you get a visual canvas plus 500+ connectors, but you can also drop JavaScript/Python into any step, self-host the whole thing, and extend it with custom nodes. Since v1.x it has become an AI-agent platform as much as an iPaaS — LangChain-derived agent/memory/vector-store nodes, MCP client *and* server, RAG primitives, and evaluations are all first-party.

For Cekat AI the two live questions are (a) whether to use it as an internal automation/agent runtime, and (b) whether to expose it to customers inside the product. Those have very different licensing answers — see [Embedding](#4-embedding-n8n-into-a-product).

---

## 1. Technical capabilities

### Core execution model

- **Workflow** = a graph of nodes. **Execution** = one run of the entire workflow, regardless of node count or data volume. This is the billing unit and the key economic difference vs. per-task/per-step pricing.
- **Items**: data flows as an array of JSON items. Most nodes run once per item; item *linking* is tracked so you can reference upstream node output (`$('Node').item`). Binary data is carried alongside JSON.
- **Expressions**: `{{ }}` templating over a JS sandbox, with Luxon (dates), JMESPath (JSON querying), and a large built-in method library (string/array/object/date helpers).
- **Execution order** is deterministic across branches and documented — matters when debugging multi-branch flows.

### Node taxonomy

| Category | What it covers |
|---|---|
| **Triggers** | Webhook, Schedule (cron), Chat Trigger, Form Trigger, Email (IMAP), SSE, MQTT/AMQP, RSS, Error Trigger, Execute Sub-workflow Trigger, Evaluation Trigger, app-specific triggers |
| **Core / logic** | If, Switch, Merge, Filter, Sort, Limit, Loop Over Items (batching), Wait, Aggregate, Split Out, Compare Datasets, Remove Duplicates, Stop and Error, No-Op |
| **Data / transform** | Set (Edit Fields), Code, AI Transform, Date & Time, Crypto, JWT, HTML, XML, Markdown, Extract From File, Convert to File, Compression, Summarize, Data Table |
| **Generic connectivity** | HTTP Request (with pagination helpers + cURL import), GraphQL, SSH, FTP, LDAP, Git, Execute Command |
| **App nodes** | 500+ SaaS connectors (WhatsApp Business Cloud, Twilio, Slack, HubSpot, Salesforce, Postgres/MySQL/MongoDB, Google Workspace, Microsoft 365, Shopify, Meta Graph API, …) |
| **AI cluster nodes** | AI Agent (root) + sub-nodes: chat models, memory, tools, vector stores, embeddings, retrievers, document loaders, text splitters, output parsers |

### Flow logic and reliability

- **Sub-workflows** — call one workflow from another; "convert selection to sub-workflow" refactoring exists. Sub-workflows can pause for external input (human-in-the-loop) and return data to the parent.
- **Error handling** — per-node `continueOnFail`/error output branches, automatic retries, dedicated **Error Trigger** workflows, Stop and Error node.
- **Human-in-the-loop** — "send and wait" operations (e.g. Slack approval) and `/webhook-waiting/*` endpoints; documented pattern for requiring approval before an AI agent invokes a tool.
- **Wait node** — time-based or webhook-resume pauses.

### Code and extensibility

- **Code node** — JavaScript or Python, run-once-per-item or run-once-for-all-items. In 2.0 these execute inside isolated **Task Runners**.
- **Custom nodes** — you can ship your own node packages; community node packages are installable on self-hosted.
- **HTTP Request node** as the universal escape hatch for anything without a connector.
- **`$fromAI()`** — lets an AI agent dynamically populate tool parameters.

### AI stack

- **AI Agent node** — since v1.82 there is a single agent type (Tools Agent). Requires ≥1 tool sub-node.
- **Chains** for deterministic LLM sequences vs. **agents** for model-decided tool use; docs explicitly contrast the two.
- **Memory** sub-nodes (buffer, Redis, Postgres, etc.), **vector stores** (Pinecone, Qdrant, Supabase, PGVector, in-memory), embeddings, retrievers, document loaders → full **RAG** support.
- **MCP Client node** (n8n consumes external MCP servers as agent tools) and **MCP Server Trigger** (n8n workflows exposed *as* MCP tools). There is also an n8n MCP server so coding agents can build/execute n8n workflows programmatically.
- **Guardrails node** for input/output safety checks.
- **Evaluations** — Evaluation Trigger + Evaluation node let you run workflows against known test cases and score outputs with metrics. Unlimited on Pro/Enterprise; one evaluation on registered Community Edition.
- **Streaming** — real-time streamed responses supported for chat-style workflows.
- **AI Workflow Builder / AI Assistant** — natural-language → draft workflow. Cloud plans get a monthly AI-credit allowance (2,300 Starter, up to 13,700 Pro); self-hosted is "coming soon" with BYO API key.
- Model coverage is broad and vendor-neutral: Anthropic, OpenAI, Google/Vertex, Mistral, Groq, Alibaba Qwen, Moonshot Kimi, MiniMax, plus Ollama for local.

### What changed in n8n 2.0

- **Draft vs. Published** workflow versions — you can edit without breaking what's live. (Big operational win; previously a real footgun.)
- **Task Runners on by default** — Code nodes execute isolated; ~35% perf improvement claimed.
- **Security defaults tightened** — Code nodes can no longer read all env vars; `Execute Command` and `Local File Trigger` disabled by default.
- **Data Tables** — built-in tabular storage scoped to a project, so simple state no longer needs an external DB/Sheet.
- **Evaluations** promoted to a first-class tab.
- Sub-workflows can pause and resume with external input.
- ⚠️ 2.0 has documented breaking changes across security defaults, data handling, and configuration — read the migration notes before upgrading an existing instance.

### Deployment and scaling architecture

- **Modes:** `main` (single process) → `queue` (recommended at scale).
- **Queue mode:** main instance handles triggers/webhooks and enqueues execution IDs to **Redis**; **worker** processes pull and execute; results land in **Postgres**. Optional dedicated **webhook processor** processes behind a load balancer for high inbound volume.
- Worker `--concurrency` defaults to 10; n8n recommends ≥5 (too-low concurrency across many workers exhausts the DB connection pool).
- **Postgres 13+ required** for queue mode (SQLite unsupported for distributed setups). Shared `N8N_ENCRYPTION_KEY` across main/workers.
- **Multi-main** (HA, leader election with follower failover) is **Enterprise-only**.
- **Binary data**: filesystem storage is *not* supported in queue mode → S3 external storage (Enterprise) or keep payloads small.
- Health endpoints (`/healthz`, `/healthz/readiness`) and Prometheus `/metrics` per worker.
- Baseline footprint is small — idle Cloud instance ~100 MB RAM; memory, not CPU, is the binding constraint.

### Control surfaces (for programmatic use)

- **Public REST API** (workflows, credentials, executions, tags, users) — can be disabled; Enterprise adds API-key scope control.
- **Internal `/rest/*` API** used by the editor — more capable but explicitly *not* stability-guaranteed ("subject to change at any time").
- **CLI** — import/export workflows and credentials, run workers, DB migrations.
- **Webhooks** in/out, plus Respond to Webhook for synchronous request/response (n8n as an API backend).
- **Git version control** (Enterprise/Business) and environments (dev/staging/prod).

---

## 2. Buy/build evaluation

### Pricing (as of 2026-07-29, annual billing)

| Plan | Price | Executions/mo | Concurrency | Hosting | Notable |
|---|---|---|---|---|---|
| **Community Edition** | Free | Unlimited | — | Self-host | Most core features; no SSO/projects/git/environments |
| **Registered CE** | Free | Unlimited | — | Self-host | + folders, debug-in-editor, custom execution data |
| **Starter** | €20/mo (€24 monthly) | 2,500 | 5 | n8n Cloud | 1 project, 2.5k saved executions, 7-day logs |
| **Pro** | €50/mo (€60 monthly) | 10,000 | 20 | n8n Cloud | 3 projects, 25k saved executions, 30-day logs, admin roles |
| **Business** | €667/mo (€800 monthly) | 40,000 | — | **Self-hosted** | SSO/SAML/LDAP, git version control, environments, queue mode |
| **Enterprise** | Custom | Custom | 200+ | Either | Unlimited projects, external secrets, log streaming, S3 storage, multi-main, SLA support |

- **Overage (Business):** €4,000 per additional 300,000 executions. Workflows keep running; you get invoiced 45 days later if you don't upgrade.
- **License key applies to unlimited instances** — combined usage counts toward one quota.
- **Startup discount:** 50% off Business for <20 employees.
- Cloud data resides in the EU (Frankfurt).
- Self-hosted paid tiers **phone home daily** to the license server with production-execution counts.

### Licensing — the important part

n8n is **source-available, not open source**, under the **Sustainable Use License**:

- ✅ Use and modify freely for **internal business purposes**.
- ✅ Sell consulting/implementation services building n8n workflows.
- ❌ **Cannot** white-label n8n and sell it, or host n8n and charge users for access — i.e. you can't build a product whose value derives substantially from n8n functionality.
- Free CE self-hosting is fine for internal ops; the moment n8n becomes the product, you need a commercial agreement.

### Versus alternatives

| | Strengths | Weaknesses |
|---|---|---|
| **n8n** | Self-hostable, code escape hatches, per-execution (not per-step) pricing, strongest AI/agent story, custom nodes | Steeper learning curve, no native multi-tenancy, source-available licence, ops burden when self-hosted |
| **Zapier** | ~7,000 apps, easiest for non-technical users, most polished | Expensive at volume (per-task), cloud-only, weak for complex logic |
| **Make** | Good middle ground, visual, cheaper than Zapier, Maia AI + agents | Cloud-only, per-operation billing, less code flexibility |
| **Activepieces** | True open source (MIT), friendlier builder, fastest-growing OSS alternative | Smaller connector library, less mature AI tooling, smaller ecosystem |

Cost intuition: for a 10-step workflow run 10,000×/month, n8n is roughly 80–90% cheaper than Zapier because a run is one execution, not ten tasks.

---

## 3. Production risks and gotchas

These come up repeatedly in community/production write-ups — plan for them before committing:

1. **Execution-table bloat is the #1 failure mode.** ~1,000 executions/day ≈ 500 MB/month of execution data. Instances have hit 40+ GB and become unusable. Mitigation: set `EXECUTIONS_DATA_SAVE_ON_SUCCESS=none` (keep failures only), configure pruning, monitor table size from day one.
2. **PostgreSQL TOAST bloat** on large JSON payloads → I/O saturation and worker SIGKILLs at high throughput.
3. **Memory, not CPU, is the constraint.** Large binaries / base64 blobs / big arrays through Code nodes cause `JavaScript heap out of memory`. Wait-node rehydration of heavy payloads is a known OOM trigger. Keep payloads lean; stream files to S3 rather than through the workflow.
4. **No native multi-tenancy.** Projects (Enterprise) give soft separation; hard tenant isolation means one instance per tenant, which multiplies infra and ops cost.
5. **Missed executions during downtime are not recoverable** — cron and webhook events fired while the instance is down are simply lost. Needs a caching proxy in front if you need at-least-once delivery.
6. **Business plan has no dedicated support** — forum only. SLA support starts at Enterprise.
7. **Internal `/rest/*` API is unstable** by design — anything built on it needs re-verification on every upgrade.
8. **Queue mode + filesystem binary storage is unsupported** — S3 is Enterprise-gated.

---

## 4. Embedding n8n into a product

This is the section that most changes the decision. n8n draws a hard line between two models:

### Backend model — n8n as a hidden engine
Your product triggers n8n workflows via webhook or API; workflows execute behind the scenes; **your end users never see n8n**. They trigger and consume workflows you built.

- Runs on a **standard paid (Enterprise) licence**. **No separate agreement needed.**
- No branding constraints, because there's no n8n UI exposed.
- This is the low-friction path.

### OEM model — n8n canvas embedded in your UI
Your customers build and edit their own workflows on the n8n canvas inside your product.

- Requires a **separate OEM commercial agreement** (contact `license@n8n.io` / partnerships).
- **Execution-based pricing**: you commit to an annual execution volume pooled across *all* your end customers — no per-tenant tracking for billing. Unlimited instances/workflows/steps.
- **n8n branding stays visible in the editor.** n8n's own FAQ says white-labelling is **not** possible and that "if full white-labelling is a hard requirement, OEM isn't the right fit."
  - ⚠️ Third-party blogs still cite a "$50K/year white-label" figure from the older *n8n Embed* plan. That appears superseded by the current OEM terms — treat it as unverified and confirm with n8n directly.
- Custom nodes for your own API can ship as part of the OEM deployment.
- Supporting infrastructure exists: **iframe SSO / token exchange** (authenticate users from your own IdP and call n8n APIs on their behalf), **credential overwrites** (set OAuth client secrets globally so end users never see them), and a **custom workflow template library**.

**Quick test from n8n's docs:** if end users only *trigger and consume* workflows you built → backend. If they *create and edit* workflows → OEM.

### Multi-tenant workflow management patterns (from n8n's OEM docs)

| Pattern | Pros | Cons |
|---|---|---|
| **Workflow per user** — clone a base workflow via API, inject per-user credentials, activate | Any trigger type works | N workflows to manage/version/migrate |
| **Single workflow + credentials at call time** — one webhook-triggered workflow; caller passes credentials and params; nodes read them via expressions | One workflow to maintain | Must be webhook-triggered; your product has to invoke it; credentials in transit |

Sizing guidance n8n publishes for OEM (illustrative, from their Cloud): 10+ CPU cycles scaling as needed, 512 MB–4 GB SSD DB, 320 MB–2 GB memory, dedicated DB per instance (or Postgres schemas if not).

---

## 5. Use cases and patterns relevant to Cekat AI

### Directly applicable patterns

- **AI-first conversational support with human handoff** — a well-trodden n8n template pattern: WhatsApp/Twilio trigger → intent router (Switch) → RAG agent over a vector store → escalate to Slack/dashboard on low confidence or flagged intent. A common refinement: when a human replies, pause the AI for that conversation for N hours, then auto-resume.
- **Intent classification and routing** — Switch node classifying into `orderStatus` / `productQuery` / `booking` / `complaint`, with different sub-workflows per branch.
- **RAG over knowledge base** — document loaders + text splitters + embeddings + vector store (Supabase/PGVector fits if you're already on Postgres), retrieved by the agent as a tool.
- **Channel-aware formatting** — detect platform, format per channel (HTML for Telegram, plain for WhatsApp) — relevant for omnichannel.
- **CRM/data sync** — contact enrichment, ticket creation, conversation → CRM record sync, segment computation.
- **Internal ops** — marketing automation glue, reporting pipelines, alerting, data-quality checks (relevant to the existing `MRKT_Automation_RFC` and Meta pixel/CAPI work).
- **MCP bridge** — expose internal Cekat capabilities as MCP tools via MCP Server Trigger, consumable by any agent; or let n8n agents call external MCP servers.
- **Evaluations as regression tests** for prompt/agent changes before shipping.

### Where n8n is a poor fit

- Sub-second latency paths in the hot request path (queue mode adds hop latency).
- Very high-volume per-message processing where execution-count billing gets expensive — a chatbot billing model note from n8n itself: *executions ≈ conversations × messages per conversation*. Model this carefully.
- Anything requiring hard tenant isolation without one-instance-per-tenant.
- Heavy binary/media processing inside the workflow.

---

## Open questions to resolve

- [ ] Which model do we actually want — backend engine (cheap, standard licence) or customer-facing canvas (OEM agreement, n8n branding visible)?
- [ ] If customer-facing: is visible n8n branding acceptable to Cekat's positioning? If not, OEM is disqualified and we're looking at Activepieces (MIT) or building.
- [ ] Execution-volume model: at Cekat's message volumes, what does per-execution billing actually cost? (Batch multiple messages per execution where possible.)
- [ ] Do we need multi-main HA (Enterprise) or is single-main + workers acceptable?
- [ ] Confirm current OEM commercial terms directly with n8n — public figures are stale/contradictory.

## Related

- [[Areas/Automation/Automation|Automation]] — parent area, open decisions tracked there
- [[MRKT_Automation_RFC_v1]]
- [[Areas/Engineering/Engineering|Engineering]]
- [[Areas/Product/Product|Product]]

---

## Sources

**Official (primary)**

- [n8n Docs — Choose how to use n8n](https://docs.n8n.io/choose-how-to-use-n8n) — plan/feature matrix
- [n8n Docs — Deploy as an OEM integration](https://docs.n8n.io/deploy/host-n8n/deploy-as-an-oem-integration) — backend vs OEM distinction
- [n8n Docs — OEM: Manage workflows](https://docs.n8n.io/deploy/host-n8n/deploy-as-an-oem-integration/manage-workflows) — multi-tenant patterns
- [n8n Docs — OEM: Prerequisites](https://docs.n8n.io/deploy/host-n8n/deploy-as-an-oem-integration/prerequisites) — sizing
- [n8n Docs — Enable queue mode](https://docs.n8n.io/deploy/host-n8n/configure-n8n/scaling/enable-queue-mode) — scaling architecture
- [n8n Docs — AI Agent node](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent)
- [n8n Docs — What agents do](https://docs.n8n.io/build/integrate-ai/understand-ai-components/what-agents-do)
- [n8n Docs — sitemap](https://docs.n8n.io/sitemap.md) — node inventory
- [n8n Pricing](https://n8n.io/pricing/) — plans, limits, overage, FAQ
- [n8n OEM / Embedded iPaaS](https://n8n.io/oem/) — OEM FAQ, white-labelling position
- [n8n Docs — v2.0 breaking changes](https://docs.n8n.io/2-0-breaking-changes/)

**Secondary**

- [What's New in n8n 2.0 — Zeabur](https://zeabur.com/blogs/whats-new-in-n8n-2-0)
- [n8n 2.0 Beta: Secure-by-Default Runtime — FlowEngine](https://flowengine.cloud/blog/n8n-2-0-beta-secure-by-default-runtime-publish-save-and-enterprise-grade-orchestration)
- [n8n Guide 2026 — Hatchworks](https://hatchworks.com/blog/ai-agents/n8n-guide/)
- [n8n Sustainable Use License Explained — Nordflux](https://nordflux.de/en/guides/the-n8n-sustainable-use-license-explained)
- [n8n Licensing 101 — FatCamel](https://www.fatcamel.ai/blog/n8n-licensing-101-understanding-commercial-embed-and-sustainable-use-licenses)
- [Embedding n8n in Your SaaS App — FlowMate](https://flowmate.io/blog/embedding-n8n-in-a-saas-app/)
- [n8n vs Make vs Zapier — Digidop](https://www.digidop.com/blog/n8n-vs-make-vs-zapier)
- [Activepieces vs n8n — Agntable](https://www.agntable.com/blog/activepieces-vs-n8n)
- [n8n execution table bloat root cause — Flowgenius](https://flowgenius.in/n8n-workflows-slow-after-weeks-in-production-root-cause-analysis/)
- [Mitigating PostgreSQL TOAST bloat in n8n — Azguards](https://azguards.com/workflow-automation/n8n/the-toast-bloat-mitigating-postgres-write-degradation-in-high-volume-n8n-execution-logging/)
- [AI WhatsApp support with human handoff — n8n template](https://n8n.io/workflows/11648-ai-whatsapp-support-with-human-handoff-using-gemini-twilio-and-supabase-rag/)
