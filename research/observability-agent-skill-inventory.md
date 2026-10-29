# Observability Agent Skill Inventory Research

**Date:** October 29, 2026  
**Purpose:** Benchmark observability/APM products' AI agent integrations (MCP, skills, plugins) to inform Talaria's skill strategy.

---

## Executive Summary

All major observability vendors now expose agent workflows through **MCP servers** (Model Context Protocol). Most follow a similar security model: **read-only by default**, explicit OAuth consent for writes, scoped to organization/project, with tool-level annotations (`readOnlyHint`, `destructiveHint`) for client approval UX.

**Key Finding:** The winning pattern is **3-5 focused skills** that close a complete loop (connect → investigate → verify) rather than one mega-skill or 20+ micro-skills. Sentry (6 skills), Elastic K8s (1 comprehensive investigation skill), and Honeycomb (prompts + toolsets) show this working in production.

**Recommendation for Talaria:** The current **3-skill closed loop** (`talaria-get-started` → `talaria-triage-issue` → `talaria-verify-fix`) is **exactly right**. Do not split further. Add a fourth only if a distinct workflow emerges (e.g., `talaria-performance-investigation` for APM-specific queries distinct from error triage).

---

## 1. Product-by-Product Inventory

### 1.1 Sentry

**MCP Server:**  
- **URL:** `https://mcp.sentry.dev/mcp` (project scoping: `/mcp/{org}/{project}`)
- **Auth:** OAuth 2.1 (browser flow), or personal token from Settings → Integrations
- **Transport:** Streamable HTTP (hosted)

**Tools:** 38 total across 6 categories:
- **Docs** (3): `docs_list`, `docs_search`, `docs_get`
- **Connection** (2): `get_connection`, `switch_organization`
- **Projects** (6): `get_projects`, `create_project`, `setup_project`, etc.
- **Keys** (1): `create_api_key`
- **Issues** (9): `search_errors`, `get_error`, `update_issue_status`, `verify_fix`, `get_suspect_commits`, GitHub linking
- **Events** (5): `search_events`, `get_event`, `get_source_map`, `get_replay`, `get_source_context`
- **Traces, Performance, Analytics, Flags:** Additional toolsets (can be filtered with `?toolsets=`)

**Skills:** 6 core skills at https://skills.sentry.dev/
1. **`sentry-get-started`** — Orient, provision project, install SDK, confirm telemetry
2. **`sentry-instrument`** — Add/expand signals (errors, tracing, profiling, session replay, AI/LLM monitoring)
3. **`sentry-debug-issue`** — Find issue, pull context, optionally run Seer autofix, apply fix, resolve with `Fixes PROJECT-12A`
4. **`sentry-create-alert`** — Create alerts via workflow engine API (email, Slack, PagerDuty, Discord)
5. **`sentry-fix-stack-traces`** — Upload source maps (JS/TS) or debug files (native/mobile)
6. **`sentry-setup-releases`** — Deploy tracking and release correlation

**Distribution:**  
- **Agent Plugin:** `npx @sentry/agent-plugin install` (auto-detects Claude Code, Cursor, Codex, Grok)
- **Cursor Plugin:** `getsentry/agent-plugin` on marketplace
- **MCP direct:** Any HTTP-capable MCP client

**Workflow Coverage:**
- ✅ **Instrument** (dedicated skill)
- ✅ **Investigate** (debug-issue covers errors + traces + replay)
- ✅ **Verify** (not a separate skill; embedded in debug-issue as "resolve with Fixes")
- ✅ **Alerts** (dedicated skill)
- ✅ **Performance** (implicit in trace/profile tools + instrumentation skill)

**Security Model:**
- Read-only tools require `mcp:read`
- Writes require `mcp:write` (status updates, comments, GitHub linking)
- Keys require `mcp:keys` (ingest key rotation)
- **Permission selection at OAuth:** [Issue #525](https://github.com/getsentry/sentry-mcp/issues/525) proposes granular levels: Read-only (default), Issue Triage (+status/comments), Project Management (+settings/DSNs)
- `?readonly=true` query param hides write tools
- Tool-level annotations: `readOnlyHint`, `destructiveHint`

---

### 1.2 Datadog

**MCP Server:**  
- **URL:** `https://mcp.datadoghq.com/mcp` (varies by site: `mcp.us3.datadoghq.com`, `mcp.datadoghq.eu`, etc.)
- **Auth:** OAuth (browser), or API key + application key via headers
- **Transport:** Streamable HTTP (hosted)

**Tools:** Organized by toolsets (logs, metrics, traces, dashboards, monitors, incidents, SLOs, APM)
- **Discovery:** List services, environments, tags
- **Logs:** Search logs, tail logs, get log context
- **Metrics:** Query metrics, timeseries, top-k queries
- **Traces:** Search traces, get trace detail, flame graphs
- **Dashboards:** List/get dashboards, query dashboard widgets
- **Monitors:** List/get/create/mute monitors
- **Incidents:** List incidents, get incident detail
- **SLOs:** List/get SLOs, check SLO burn rate
- **APM:** Service dependencies, top endpoints, error rates

**Skills/Commands:**  
- **Cursor Plugin:** `datadog-labs/cursor-plugin`
  - `/ddsetup` — First-time domain selection and OAuth
  - `/ddconfig` — Change domain or switch organizations
  - `/ddtoolsets` — Enable/disable toolset groups (logs, metrics, traces, etc.)
  - `datadog-app` skill — Scaffold new Datadog Apps (only when user explicitly asks)
- **No published investigative playbooks** beyond setup commands

**Distribution:**
- **Cursor Plugin:** Cursor Marketplace (v2.6.0+)
- **Claude Code Plugin:** `datadog` plugin
- **MCP direct:** Any HTTP client

**Workflow Coverage:**
- ❌ **Instrument** (no installation skill; user-driven setup)
- ✅ **Investigate** (tools present but no unified workflow skill)
- ❌ **Verify** (no post-deploy verification tool)
- ✅ **Alerts** (create/mute monitors)
- ✅ **Performance** (APM + metrics tools)

**Security Model:**
- **Read permission:** `mcp_read` + resource-level permissions (e.g., `monitors_read`, `logs_read_data`)
- **Write permission:** `mcp_write` + resource write permissions
- **Organization settings:** Org admins can disable `MCP Access` entirely or disable `MCP Write Access` to hide write tools globally
- **IP allowlist:** Optional network restriction
- **Principle:** "Standard Role" gets both by default; custom roles require manual permission grant
- **Guidance:** Docs emphasize least-privilege: grant only `mcp_read` + specific resource reads for agent triage; add `mcp_write` only after human approval

---

### 1.3 Raygun

**MCP Server:**  
- **URL:** `https://api.raygun.com/v3/mcp`
- **Auth:** OAuth (automatic client registration, no manual client ID), or Personal Access Token
- **Transport:** Streamable HTTP (hosted, no local server)

**Tools:** Organized by feature area (Applications, Crash Reporting, APM, Deployments, Customers/Sessions, Metrics, Invitations)
- **Applications:** Find/inspect applications, rotate ingestion keys
- **Crash Reporting:** Search/investigate errors and occurrences, update error statuses, manage comments
- **APM:** Search/investigate performance issues and traces, slow methods/queries/external calls
- **Deployments:** List/create/inspect/update/delete deployment records
- **Customers/Sessions:** Find affected customers, inspect sessions/environments/errors/page journeys
- **Pages/Metrics:** Page performance distributions, performance trends, error trends
- **Invitations:** Review/send/revoke team invitations

**Skills/Playbooks:**  
- **No published skills** (docs provide example prompts, not formal skill files)
- **Example workflows from docs:**
  - *"Find errors after latest deployment of checkout app"*
  - *"Investigate most frequent production error, show stack trace"*
  - *"Which backend methods consumed most time last 24h"*
  - *"Show last session for `user@example.com`, explain where experience failed"*
  - *"Compare p95 page performance last 7 days, identify largest regression"*

**Distribution:**
- **Codex:** `codex mcp add raygun --url https://api.raygun.com/v3/mcp`
- **Cursor, Claude Code, Gemini:** Manual MCP config
- **ChatGPT Desktop:** Settings → MCP servers → Add Streamable HTTP

**Workflow Coverage:**
- ❌ **Instrument** (no setup skill)
- ✅ **Investigate** (error + APM investigation via tools; no formal skill)
- ❌ **Verify** (no post-release verification tool; user can query errors by deployment)
- ✅ **Alerts** (no dedicated alert creation; management is manual)
- ✅ **Performance** (APM traces, page metrics, slow-query identification)

**Security Model:**
- **OAuth:** Plan-scoped; authorization only grants access to selected plan and existing user permissions
- **PAT:** Personal token alternative for clients without OAuth
- **Permissions:** Uses existing Raygun API v3 scopes (applications, APM, customers, deployments, errors, invitations)
- **Read-only by default:** Write operations (update error status, manage comments, create deployments) require explicit grants
- **No tool-level filtering documented** (unlike Datadog/Sentry)

---

### 1.4 Honeycomb

**MCP Server:**  
- **URL:** Region-specific (hosted prompts in setup guide: `https://mcp.honeycomb.io/mcp` inferred from docs)
- **Auth:** API key with scoped permissions
- **Transport:** Hosted (docs reference "API-key authentication")

**Tools:** Organized by capability (Query, Trace, Boards, Triggers, SLOs, Canvas)
- **Workspace Discovery:** `get_workspace_context`, `get_environment`, `get_dataset`, `get_dataset_columns`
- **Query/Analysis:** `run_query`, `get_query_results`, `find_queries`, `find_columns`, `run_bubbleup`
- **Traces/Spans:** `get_trace`, `list_spans`, `get_span_details`
- **Service Map/Anomalies:** `get_service_map`, `get_anomaly_service_profiles`
- **Semantic Conventions:** `search_semconv`, `get_semconv_attribute`, `list_semconv_namespaces`
- **Boards:** `list_boards`, `create_board`, `update_board`
- **Triggers:** `get_triggers`, `create_trigger`, `update_trigger`
- **SLOs:** List/create/update SLOs

**Skills/Playbooks:**
- **Agent Skills** for Claude Code, Cursor (mentioned in March 2026 announcement)
- **Prompts:** Pre-written slash-command workflows from MCP server (e.g., `/investigate-alert`, `/migrate-telemetry`)
- **No published GitHub repo of skills** (unlike Sentry or Elastic)

**Distribution:**
- Honeycomb MCP plugins for Claude Code, Cursor (2026 announcement)
- Direct MCP config for any client

**Workflow Coverage:**
- ✅ **Instrument** ("migrate legacy telemetry to OpenTelemetry" in announcement)
- ✅ **Investigate** (query/trace/anomaly tools + prompts)
- ❌ **Verify** (no post-deploy verification primitive)
- ✅ **Alerts** (Trigger creation/update)
- ✅ **Performance** (trace analysis, anomaly detection, BubbleUp)

**Security Model:**
- **Read-only by default:** Most tools are read-only
- **Write scope:** `mcp:write` required for Board/Trigger/SLO/Canvas writes; granted explicitly during OAuth consent or API key config
- **Activity Log:** Surfaced via MCP only to Team Owners (restricted by role)
- **Principle:** "Limits agent access by default, expands only with explicit permission"
- **Tool annotations:** Write tools listed in MCP Tools Reference with scope requirements

---

### 1.5 Grafana

**MCP Server:**  
- **Open-source server:** `mcp-grafana` (PyPI package, runs locally via `uvx`)
- **Grafana Cloud hosted:** `https://mcp.grafana.com/mcp/{STACK}.grafana.net`
- **Auth (OSS):** Grafana service account token (env var)
- **Auth (Cloud):** OAuth 2.1 browser authorization
- **Transport:** OSS uses stdio or HTTP; Cloud uses Streamable HTTP

**Tools:** Organized by Grafana product area
- **Dashboards:** Search, get summary/property, update, patch
- **Folders:** Search, create
- **Datasources:** Query Prometheus, Loki, InfluxDB, ClickHouse, Snowflake, CloudWatch, Google Cloud Logging, Elasticsearch, Pyroscope
- **Tempo:** Trace search, metrics, trace diff, attribute exploration
- **Alerting:** List/create/update/delete rules, routing
- **Incidents:** Grafana Incident management
- **OnCall:** Schedules, alert groups
- **Navigation:** Generate deeplinks
- **Annotations, Snapshots, Rendering:** List/create/delete, panel/dashboard images
- **User Info:** Current identity and organizations

**Skills/Playbooks:**
- **No published skills** (tooling is infrastructure-focused)
- **Use case:** Run by agents that need to query metrics/logs or create dashboards, not closed-loop investigation workflows

**Distribution:**
- **OSS:** `uvx mcp-grafana` (requires `uv` Python toolchain)
- **Cloud:** MCP config pointing to `mcp.grafana.com` endpoint
- **Docker:** Official `mcp-grafana` image for containerized deployment

**Workflow Coverage:**
- ❌ **Instrument** (Grafana is visualization/alerting layer, not SDKs)
- ✅ **Investigate** (query tools for metrics/logs/traces; no playbook)
- ❌ **Verify** (no verification primitive)
- ✅ **Alerts** (create/manage alert rules)
- ✅ **Performance** (Tempo trace search, datasource queries)

**Security Model:**
- **OSS:** Service account token with Grafana RBAC (e.g., `dashboards:read`, `dashboards:write`, `dashboards:uid:xyz`)
- **Cloud:** OAuth with user's Grafana permissions; three access levels at authorization:
  - **Read:** Inspect resources, query read-only datasources
  - **Query:** Also run raw SQL/InfluxQL (can mutate if datasource creds allow)
  - **Write:** Also create/change/delete resources (includes read + query)
- **Principle:** "Least-privilege service accounts or fine-grained permissions; Editor role for broad access"
- **Production hardening:** Dedicated identities per agent, separate read/write contexts, audit logging

---

### 1.6 New Relic

**MCP Server:**  
- **URL:** `https://mcp.newrelic.com/mcp/` (US), `https://mcp.eu.newrelic.com/mcp/` (EU), `https://mcp.jp.newrelic.com/mcp/` (JP)
- **Auth:** OAuth (browser), or API key (Antigravity CLI only)
- **Transport:** Streamable HTTP (hosted)

**Tools:** Organized by tags (discovery, alerting, data-access, analytics)
- **Discovery:** `get_entity`, list entities, entity relationships
- **Alerting:** Recent alerts, alert event reports, analyze deployment impact
- **Data Access:** `execute_nrql_query`, analyze error logs
- **Analytics (aCCU-gated):** `natural_language_to_nrql_query`, `generate_alert_insights_report`, `generate_user_impact_report`, `analyze_deployment_impact`

**Skills/Playbooks:**
- **No published GitHub skills repo**
- **Docs provide natural-language examples:**
  - *"What entities are in my account?"*
  - *"Show recent alerts for my web application"*
  - *"Top errors from last hour"*
  - *"Run NRQL query to analyze performance"*

**Distribution:**
- **Claude Code, Codex, Antigravity CLI, Kiro CLI, Claude Desktop, VS Code:** Direct MCP config

**Workflow Coverage:**
- ❌ **Instrument** (New Relic SDKs installed separately)
- ✅ **Investigate** (NRQL queries, entity relationships, alert analysis)
- ❌ **Verify** (no post-release verification; `analyze_deployment_impact` is similar but AI-powered analysis, not deterministic check)
- ✅ **Alerts** (query alerts, generate insight reports)
- ✅ **Performance** (NRQL query for metrics, entity traces)

**Security Model:**
- **OAuth required** for most tools (PAT only for Antigravity CLI)
- **Organization access:** Admin must enable MCP via Feature Control Manager; `Organization Read Only` / `Organization Manager` / `Organization Product Admin` roles
- **Tool permissions:** Governed by user's New Relic RBAC; tool call fails with permission error if lacking access
- **Filtering:** `include-tags` HTTP header to restrict tools to specific categories (e.g., `discovery,alerting`)
- **Rate limit:** 2,000 tool calls/hour/user
- **Billing:** Most tools = Core Compute Units (CCUs); 4 AI tools = Advanced CCU (aCCU add-on required)
- **Guidance:** "Use dedicated service accounts with least-privilege; agents act on behalf of user with that user's permissions"

---

### 1.7 Elastic Observability

**MCP Server:**  
- **MCP App (tech preview):** `https://github.com/elastic/example-mcp-app-observability` (self-hosted Node.js server)
- **Agent Builder MCP:** `{KIBANA_URL}/api/agent_builder/mcp` (Kibana-hosted, GA on Cloud Serverless)
- **Auth:** Elasticsearch + Kibana API keys
- **Transport:** HTTP (local or Kibana-hosted)

**Tools (MCP App):** 6 interactive tools with React UIs
1. **`observe`** — ES|QL + ML-anomaly queries (modes: `now`, `table`, `metric` watch, `anomaly` watch)
2. **`manage-alerts`** — Create/list/get/delete Kibana threshold rules; filter by source (MCP-created vs all)
3. **`ml-anomalies`** — Query ML records, inline anomaly explainer with actual/typical time-series chart
4. **`apm-health-summary`** — Cluster/namespace health rollup: KPI tiles, degraded services, SLO violations, ML heatmap, top memory pods, service throughput
5. **`apm-service-dependencies`** — Service graph with latency-aware edge styling (critical edges >10s or ≥5× median)
6. **`k8s-blast-radius`** — Node-outage impact: full outage / degraded / unaffected / reschedule feasibility

**Skills:** Published at `https://github.com/elastic/agent-skills`
- **`observability-k8s-investigation`** — Comprehensive Kubernetes investigation (workload, node, control-plane, autoscaling, network) with 16 failure modes, evidence corroboration, and confidence-calibrated hypotheses
- **`kibana-agent-builder`** — Create/manage Kibana agents and tools
- **`kibana-alerting-rules`** — Create/update/manage alert rules (metric threshold types)
- **`kibana-anomaly-detection`** — ML job management
- Others for Elasticsearch, Kibana, Security

**Distribution:**
- **MCP App:** Self-host via `npm run build && npm start` (Node 22+, Elasticsearch 8.x/9.x, Kibana)
- **Agent Builder:** Built into Kibana for Cloud Serverless customers
- **Skills:** Distributed as `.zip` artifacts, installable in Cursor/Claude Code

**Workflow Coverage:**
- ❌ **Instrument** (Elastic APM/OpenTelemetry installed separately)
- ✅ **Investigate** (K8s skill is the gold standard: 16 failure modes, baseline comparisons, corroboration, calibrated confidence)
- ❌ **Verify** (no post-release verification primitive)
- ✅ **Alerts** (create/manage Kibana rules)
- ✅ **Performance** (APM service dependencies, slow-query identification, anomaly detection)

**Security Model:**
- **API keys:** Separate for Elasticsearch and Kibana; scoped to required operations
- **Read-only mode:** Omit Kibana URL for observe-only (no alert creation)
- **Deployment hardening:**
  - Isolated containers, restricted filesystem/network egress
  - Log every invocation to central SIEM
  - Alert on new tools, bulk reads, credential access
  - No shell, exec, secret, or mutation tools in base skill
- **Principle:** "Start read-only; bounded list/get/search tools; named operations over generic kubectl"
- **MCP App warning:** "Technical preview, not production-supported, no SLA"

---

## 2. Coverage Breakdown: Instrument / Investigate / Verify / Alerts / Performance

| Vendor | Instrument | Investigate | Verify (Post-Deploy) | Alerts | Performance | Notes |
|--------|------------|-------------|----------------------|--------|-------------|-------|
| **Sentry** | ✅ Skill | ✅ Skill | ✅ (in debug-issue) | ✅ Skill | ✅ Tools | 6 skills cover full loop |
| **Datadog** | ❌ | ✅ Tools | ❌ | ✅ Tools | ✅ Tools | No investigation skill, only commands |
| **Raygun** | ❌ | ✅ Tools | ❌ | ❌ | ✅ Tools | No skills, example prompts only |
| **Honeycomb** | ✅ Prompts | ✅ Prompts | ❌ | ✅ Tools | ✅ Tools | Prompts + toolsets, no published skills |
| **Grafana** | ❌ | ✅ Tools | ❌ | ✅ Tools | ✅ Tools | Infrastructure layer, no workflows |
| **New Relic** | ❌ | ✅ Tools | ❌ | ✅ Tools | ✅ Tools | AI-powered analysis, no deterministic verify |
| **Elastic** | ❌ | ✅ Skill | ❌ | ✅ Tools | ✅ Tools | K8s skill is gold standard; MCP App is preview |
| **Talaria** | ✅ Skill | ✅ Skill | ✅ Skill | ❌ | ✅ Tools | **Only vendor with dedicated post-deploy verify** |

**Key Observations:**
- **Verify is rare:** Only Talaria has a dedicated `verify_fix` tool and skill. Sentry embeds it in `sentry-debug-issue` as "resolve with Fixes"; others require manual post-deploy checks.
- **Instrument is vendor-specific:** Only Sentry and Honeycomb provide agent-driven SDK installation; others assume instrumentation is already configured.
- **Investigate is universal:** All vendors expose search/get tools; only Sentry, Elastic, and Talaria have formal investigation skills.
- **Alerts:** All vendors support alert creation/management, but only Sentry has a dedicated skill.

---

## 3. Security / Permissions Guidance

### 3.1 Common Patterns Across Vendors

| Principle | Implementation |
|-----------|----------------|
| **Read-only by default** | OAuth grants start at `mcp:read`; writes require explicit `mcp:write` consent (Sentry, Honeycomb, Datadog) |
| **Scoped credentials** | Org/project scoping (Sentry, Datadog, Grafana Cloud), short-lived tokens preferred over long-lived PATs |
| **Tool-level annotations** | `readOnlyHint`, `destructiveHint` in MCP tool schemas let clients auto-approve reads and ask before writes |
| **RBAC inheritance** | Agent permissions = user permissions (New Relic, Grafana); service accounts with least-privilege for automation (all) |
| **Query params for filtering** | `?readonly=true` (Sentry), `?toolsets=issues,performance` (Sentry), `include-tags` header (New Relic) |
| **Audit logging** | Log every tool call with identity, user, parameters, approval, outcome; send to SIEM (OWASP guidance) |

### 3.2 Vendor-Specific Guidance

**Sentry:**
- Proposal ([Issue #525](https://github.com/getsentry/sentry-mcp/issues/525)): Permission selection at OAuth — Read-only (default), Issue Triage (+status/comments), Project Management (+settings/DSNs)
- `?readonly=true` removes write tools from server response
- Never expose ingest keys to agents; use personal tokens or OAuth

**Datadog:**
- Org admins can disable `MCP Write Access` globally to hide write tools for all users regardless of role
- IP allowlist for network-level restriction
- Principle: "Standard Role gets both `mcp_read` and `mcp_write` by default; use custom roles for least-privilege"

**Honeycomb:**
- Most tools read-only; `mcp:write` required for Board/Trigger/SLO writes
- Activity Log Environment restricted to Team Owners even when available in UI

**Grafana Cloud:**
- Three OAuth access levels: Read (inspect only), Query (also raw SQL/InfluxQL), Write (also create/change/delete)
- "Write access requires Assistant Admin role"

**New Relic:**
- Admin must enable MCP in Feature Control Manager before any use
- Tool permissions follow user's RBAC; permission errors fail at call time
- 2,000 tool calls/hour/user rate limit
- 4 AI tools require Advanced CCU (aCCU) billing add-on

**Elastic:**
- MCP App runs self-hosted with user-provided API keys; read-only if Kibana URL omitted
- Principle from docs: "No shell, exec, secret, or mutation tools; bounded list/get/search only; treat retrieved content as untrusted"

**OWASP / General Best Practices:**
- Grant minimum permissions needed per server
- Use scoped, per-server credentials (never share tokens)
- Prefer ephemeral, short-lived tokens over long-lived PATs
- Require explicit confirmation for destructive, financial, or data-sharing ops
- Display full tool call parameters to user, not summary name
- Never auto-approve tool calls in multi-server setups
- Log all invocations with full parameters, user context, timestamps; feed to SIEM
- Alert on: new tools, admin-level queries, abnormal call frequency, credential access, bulk reads
- Run servers in isolated containers with restricted filesystem/network egress

---

## 4. Talaria's Current MCP Tool Surface

From `README.md` and skills:

**MCP Server:** `https://api.newtalaria.com/mcp` (org/project scoping: `/mcp/{org}`, `/mcp/{org}/{project}`)  
**Auth:** OAuth (PKCE), or personal Bearer token from Settings → Integrations  
**Transport:** Streamable HTTP (hosted)  
**Scopes:** `mcp:read`, `mcp:write`, `mcp:keys`

**Tools (38 total):**

| Category | Tools | Read/Write |
|----------|-------|------------|
| **Docs** | `docs_list`, `docs_search`, `docs_get` | Read |
| **Connection** | `get_connection`, `switch_organization` | Read / Write |
| **Projects** | `get_projects`, `get_project`, `update_project_settings`, `create_project`, `setup_project`, `send_test_event` | Read / Write / Keys |
| **Keys** | `create_api_key` | Keys |
| **Issues** | `search_errors`, `get_error`, `update_issue_status`, `add_issue_comment`, `create_github_issue`, `link_github_issue`, `get_issue_links`, `verify_fix`, `get_suspect_commits` | Read / Write |
| **Events** | `search_events`, `get_event`, `get_source_map`, `get_replay`, `get_source_context` | Read |
| **Traces** | `search_traces`, `get_trace`, `list_suspect_spans`, `list_database_queries` | Read |
| **Sessions** | `search_sessions` | Read |
| **Analytics** | `get_project_stats` (health snapshot per environment) | Read |
| **Feature Flags** | List, get, kill-switch, percent rollout | Read / Write |

**Skills (3):**
1. **`talaria-get-started`** — Connect MCP, confirm org/project, smoke read (`search_errors` or `docs_*`)
2. **`talaria-triage-issue`** — `search_errors` → `get_error` → enrich (`get_trace`, `get_replay`, `get_suspect_commits`) → optional GitHub link/create → optional status update
3. **`talaria-verify-fix`** — `list_releases` / `get_release` → optional `wait_for_event` / `search_events` → `verify_fix` (verdict: verified / pending_adoption / insufficient_data / regressed / not_in_release / unknown_release) → optional `update_issue_status`

**Closed Loop:** get-started → triage-issue → verify-fix ✅

**Unique Differentiator:** `verify_fix` is the **only deterministic post-deploy verification tool** across all surveyed vendors. Sentry embeds it in workflow (resolve with `Fixes`), New Relic has AI-powered `analyze_deployment_impact`, but neither exposes a standalone check like Talaria's adoption-threshold verdict.

---

## 5. Comparative Analysis: Talaria vs. Peers

### 5.1 Skill Count & Scope

| Vendor | Total Skills/Playbooks | Approach |
|--------|------------------------|----------|
| Sentry | 6 skills | Focused, each skill = one workflow (instrument, debug, alert, fix traces, setup releases) |
| Elastic | 1 K8s investigation skill | **Monolithic but excellent:** 16 failure modes, corroboration, calibrated confidence |
| Honeycomb | Prompts (count unknown) | Slash-command prompts from server, not skill files |
| Datadog | 3 commands (`/ddsetup`, `/ddconfig`, `/ddtoolsets`) | Setup only, no investigation playbooks |
| Talaria | **3 skills** | **Closed loop:** connect → triage → verify |
| Others (Raygun, Grafana, New Relic) | 0 formal skills | Example prompts in docs, no skill artifacts |

**Winning Pattern:** 3-6 skills, each skill = one distinct workflow. Avoid:
- **1 mega-skill** (hard to reuse, context window bloat, unclear when to invoke)
- **20+ micro-skills** (discovery problem, user overwhelm, unclear skill boundaries)

### 5.2 Workflow Completeness

**Talaria's Closed Loop:**
```
get-started (connect, confirm, smoke read)
    ↓
triage-issue (search → pack → enrich → hypothesis → optional GitHub → optional status)
    ↓
verify-fix (releases → verdict → optional status update)
```

**Sentry's Closed Loop:**
```
get-started (orient, provision, install SDK, confirm telemetry)
    ↓
debug-issue (find → context → optional Seer autofix → apply fix → resolve with Fixes)
    ↓
(instrument / create-alert / fix-stack-traces are parallel workflows)
```

**Elastic's Closed Loop (K8s only):**
```
k8s-investigation (orient → characterize → classify → corroborate → synthesize)
```

**Key Difference:**  
- **Talaria:** Verify is **explicit, separate, deterministic** (`verify_fix` verdict with adoption threshold)
- **Sentry:** Verify is **implicit** (resolve with `Fixes PROJECT-12A` in commit/PR; Sentry auto-correlates)
- **Elastic:** No verify step (investigation stops at hypothesis + next steps)

### 5.3 Tool Grouping: Instrument / Investigate / Verify / Alerts / Performance

**Talaria's Coverage:**
- ✅ **Investigate:** `talaria-triage-issue` (errors + traces + replays + suspects)
- ✅ **Verify:** `talaria-verify-fix` (unique among peers)
- ✅ **Instrument (partial):** `talaria-get-started` → `setup_project` mints dev key, but no SDK installation (unlike Sentry's `sentry-instrument`)
- ❌ **Alerts:** No alert creation skill (feature flags exist, but no alerting on thresholds/conditions)
- ✅ **Performance:** `list_suspect_spans`, `list_database_queries` in tools; not surfaced in skills

**Recommendation:** Do not split `talaria-triage-issue` into separate "investigate errors" and "investigate performance" skills. The current skill already handles both (traces + spans + queries are optional enrichment). Only create a fourth skill (`talaria-performance-investigation`) if:
1. Performance-only investigations (no error context) become a frequent pattern, AND
2. The investigation methodology differs significantly from error triage (e.g., baseline comparisons, anomaly detection, N+1 query patterns)

**Current state:** Performance tools are correctly embedded in `talaria-triage-issue` as enrichment options.

---

## 6. Recommendations for Talaria Skill Set

### 6.1 Keep the Current 3-Skill Structure ✅

**Do NOT split further.** The 3-skill closed loop is Talaria's competitive advantage:
1. **`talaria-get-started`** — Fast, cheap orient (60 seconds to first read)
2. **`talaria-triage-issue`** — Deep investigation (one issue at a time, pack before theory)
3. **`talaria-verify-fix`** — Post-deploy verification (unique to Talaria)

**Why this works:**
- Clear entry points (user knows which skill to invoke for which task)
- No overlap (each skill has distinct scope and output)
- Completeness (covers connect → investigate → verify)
- Conciseness (3 skills fit in agent context; 20+ skills cause discovery failure)

### 6.2 Potential Fourth Skill: `talaria-setup-alerts` (Optional)

**When to add:**
- If alerting on Talaria conditions (error rate, p95 latency, session crash rate) becomes a requested workflow
- Currently missing from skill set; Sentry has `sentry-create-alert` for this

**What it would do:**
- Create alerts via Talaria's alerting API (if/when available)
- Configure notification actions (Slack, email, PagerDuty, GitHub issue)
- Set thresholds (e.g., "alert if error rate > 5% for 5 minutes")

**Decision:** Only add if:
1. Talaria ships an alerting API, AND
2. Users ask for agent-driven alert setup (vs. UI-driven setup)

**Current state:** Not needed yet; alerting is UI-driven.

### 6.3 Do NOT Create Performance-Specific Skill

**Rationale:**
- Performance tools (`list_suspect_spans`, `list_database_queries`) are already in `talaria-triage-issue` as optional enrichment
- Splitting into separate skill creates:
  - Confusion (is this issue an error or performance problem?)
  - Duplication (both skills need `search_errors`, `get_error`, `get_trace`)
  - Discoverability problem (user unsure which to invoke)

**When to reconsider:**
- If performance-only investigations (no error) become 30%+ of workflows, AND
- The investigation methodology differs (e.g., baseline comparison, anomaly detection, N+1 pattern recognition)

**Current state:** Keep as-is; performance is correctly an enrichment path in `talaria-triage-issue`.

### 6.4 Strengthen Existing Skills

**`talaria-get-started`:**
- ✅ Already strong (cheap orient, real projectId, smoke read)
- Consider: Add `send_test_event` example if user has not seen events yet (already in docs workflow)

**`talaria-triage-issue`:**
- ✅ Already strong (pack before theory, enrich only what pack points to, optional GitHub)
- Consider: Add explicit performance enrichment path (e.g., "if trace slow, call `list_suspect_spans`")
- Consider: Clarify when to use `get_suspect_commits` (thin suspects from pack → enrich)

**`talaria-verify-fix`:**
- ✅ Already strong (deterministic verdict, optional wait, clear status rules)
- Consider: Add example of "what to do after `pending_adoption`" (wait N hours, then re-verify)

### 6.5 Security Model Alignment

**Talaria's current model:**
- ✅ Read-only by default (`mcp:read`)
- ✅ Write requires explicit grant (`mcp:write`)
- ✅ Keys separate (`mcp:keys`)
- ✅ Org/project scoping (`/mcp/{org}/{project}`)
- ✅ Tool annotations (implicit from docs: `setup_project` is Keys, `update_issue_status` is Write)

**Peer best practices Talaria should adopt:**
1. **`?readonly=true` query param** (Sentry, Datadog) → Hide write tools for CI/bot use cases
2. **`?toolsets=issues,performance` query param** (Sentry) → Reduce context window for focused tasks
3. **Permission selection at OAuth** (Sentry proposal #525) → Let user choose Read-only / Triage / Full-write at consent time
4. **Tool-level MCP annotations** → Ensure every tool has explicit `readOnlyHint` / `destructiveHint` in schema

**Recommendation:** Add `?readonly=true` and toolset filtering to Talaria MCP server. This matches peer vendors and enables:
- CI bots that only read errors (no risk of status updates)
- Agent workflows that only need one area (e.g., `?toolsets=issues` hides traces/flags/keys)

---

## 7. Final Benchmarking Summary

### 7.1 Talaria vs. Best-in-Class (Sentry, Elastic)

| Criterion | Talaria | Sentry | Elastic K8s | Winner |
|-----------|---------|--------|-------------|--------|
| **Skill count** | 3 | 6 | 1 | Tie (Talaria/Elastic) — Focused beats sprawl |
| **Closed loop** | ✅ Connect → Triage → Verify | ✅ Get-started → Debug → (implicit verify) | ⚠️ Investigate only | **Talaria** (explicit verify) |
| **Post-deploy verify** | ✅ `verify_fix` with verdict | ⚠️ Implicit (Fixes link) | ❌ None | **Talaria** (unique) |
| **Investigation depth** | ✅ Pack + enrich + GitHub | ✅ Pack + Seer + fix + GitHub | ✅ 16 failure modes + corroboration | Tie (all strong) |
| **Instrumentation** | ⚠️ Partial (mints key, no SDK install) | ✅ Full SDK install | ❌ OTel/APM assumed | **Sentry** |
| **Alerting** | ❌ None | ✅ Dedicated skill | ✅ Create rules | **Sentry/Elastic** |
| **Security model** | ✅ Read-only default, scoped tokens | ✅ Permission levels, `?readonly=true` | ✅ Read-only mode, no shell/exec | Tie (all strong) |
| **Distribution** | ✅ Cursor plugin, MCP direct | ✅ Agent plugin, Cursor plugin, MCP | ⚠️ MCP App (preview), skills via .zip | **Sentry/Talaria** |

**Verdict:**  
- **Talaria's 3-skill closed loop is competitive with Sentry's 6-skill model.** Both win over mega-skills and micro-skills.
- **Talaria's `verify_fix` is a unique differentiator.** No peer has a deterministic post-deploy check with adoption thresholds.
- **Sentry edges out Talaria on instrumentation and alerting.** But these are not core error-monitoring workflows for most agents.
- **Elastic's K8s skill is the gold standard for investigation depth.** Talaria could learn from its "16 failure modes + corroboration + calibrated confidence" structure, but Talaria's skill is already strong.

### 7.2 What Talaria Should NOT Do

1. **Do not split into 10+ micro-skills.** Datadog's 3-command model is setup-only and offers no workflows. Talaria's 3 skills are the right granularity.
2. **Do not merge into 1 mega-skill.** Elastic's 1-skill model works for K8s because it's domain-specific (one failure taxonomy). Talaria covers errors + traces + replays + GitHub + verify; merging would bloat context and obscure entry points.
3. **Do not add instrumentation skill unless Talaria expands to SDK installation.** Current `setup_project` mints a key; that's not the same as Sentry's "detect platform, install SDK, confirm telemetry." If Talaria stays backend-only (SDK installation is out of scope), keep instrumentation as a tool, not a skill.
4. **Do not add alerting skill until Talaria ships alerting API.** Feature flags are not alerts. If Talaria adds threshold-based alerts (error rate, p95 latency), then consider `talaria-setup-alerts`.

### 7.3 What Talaria Should Do

1. **Keep the 3-skill closed loop.** It's the competitive advantage.
2. **Add `?readonly=true` and `?toolsets=` query params** to match Sentry/Datadog security models.
3. **Add explicit MCP tool annotations** (`readOnlyHint`, `destructiveHint`) to help clients auto-approve reads.
4. **Clarify performance enrichment in `talaria-triage-issue` skill.** Example: "If trace p95 > 1s, call `list_suspect_spans`; if DB-heavy, call `list_database_queries` with `nPlusOneOnly: true`."
5. **Document when to use `verify_fix` vs. `search_events`.** Verdict is for "did the fix hold after release"; raw event search is for "is it still firing right now."
6. **Publish skill .zip artifacts** (like Elastic) for one-click installation in Cursor/Claude Code, in addition to the existing Cursor plugin.

---

## 8. References

### Primary Sources

**Sentry:**
- MCP Server: https://mcp.sentry.dev/
- Skills: https://skills.sentry.dev/
- Docs: https://docs.sentry.io/product/sentry-mcp/
- Agent Plugin: https://github.com/getsentry/agent-plugin
- Permission proposal: https://github.com/getsentry/sentry-mcp/issues/525

**Datadog:**
- MCP Server: https://mcp.datadoghq.com/ (region-specific)
- Docs: https://docs.datadoghq.com/mcp_server/
- Cursor Plugin: https://github.com/datadog-labs/cursor-plugin
- Cursor Marketplace: https://cursor.com/marketplace/mcp/datadog

**Raygun:**
- MCP Server: https://api.raygun.com/v3/mcp
- Docs: https://raygun.com/documentation/product-guides/raygun-mcp-server/
- MCP Page: https://ai.raygun.com/mcp

**Honeycomb:**
- MCP Docs: https://docs.honeycomb.io/integrations/mcp/
- Announcement: https://www.honeycomb.io/blog/honeycomb-advances-observability-for-ai-powered-software-development (March 11, 2026)
- Agent Observability: https://www.honeycomb.io/blog/honeycomb-launches-agent-observability-full-visibility-agentic-workflows (May 12, 2026)

**Grafana:**
- OSS MCP: https://grafana.com/docs/grafana/latest/ai-tools/mcp/
- Cloud MCP: https://grafana.com/docs/grafana-cloud/platform/grafana-assistant/configure/cloud-mcp/
- GitHub: https://github.com/grafana/mcp-grafana

**New Relic:**
- MCP Docs: https://docs.newrelic.com/docs/agentic-ai/mcp/
- Setup Guide: https://docs.newrelic.com/docs/agentic-ai/mcp/setup/
- Tool Reference: https://docs.newrelic.com/docs/agentic-ai/mcp/tool-reference/

**Elastic:**
- MCP App: https://github.com/elastic/example-mcp-app-observability
- Skills: https://github.com/elastic/agent-skills
- K8s Investigation Blog: https://www.elastic.co/observability-labs/blog/ai-powered-kubernetes-observability-elastic-mcp
- Agent Builder MCP: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/mcp-server

**Talaria:**
- MCP Page: https://www.newtalaria.com/mcp
- Docs: https://www.newtalaria.com/docs/mcp
- Triage Guide: https://www.newtalaria.com/docs/guides/triage-issues-with-an-agent
- GitHub Plugin: https://github.com/newtalaria/talaria-grok-plugin

### Security Best Practices

- OWASP MCP Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/MCP_Security_Cheat_Sheet.html
- OWASP DevSecOps AI Agent Security: https://owasp.github.io/DevSecOpsGuideline/2-Process/2-2-Develop/2-2-5-AI-Agent-and-MCP-Security/
- IETF MCP Security Draft: https://datatracker.ietf.org/doc/draft-mohiuddin-mcp-security-considerations/
- Read-only K8s MCP: https://blog.peterlee.app/en/cloud/read-only-mcp-for-kubernetes-triage/
- P0 Datadog Agentic Gateway: https://docs.p0.dev/agentic-access/agentic-gateway/mcp-server/datadog

---

## Appendix: Quick Reference

### Skill Count by Vendor

| Vendor | Skill/Playbook Count | Type |
|--------|---------------------|------|
| Elastic | 1 (K8s investigation) + multiple Kibana skills | Formal skills (.md or .zip) |
| Sentry | 6 | Formal skills (.md) |
| Talaria | **3** | Formal skills (.md) |
| Honeycomb | Unknown (prompts from server) | Slash-command prompts |
| Datadog | 3 commands | Setup commands, no workflows |
| Raygun | 0 | Example prompts in docs |
| Grafana | 0 | Tool server only |
| New Relic | 0 | Example prompts in docs |

### MCP Server URLs

| Vendor | URL Template |
|--------|--------------|
| Sentry | `https://mcp.sentry.dev/mcp/{org}/{project}` |
| Datadog | `https://mcp.datadoghq.com/mcp` (region-specific) |
| Raygun | `https://api.raygun.com/v3/mcp` |
| Honeycomb | (Region-specific, not publicly documented) |
| Grafana Cloud | `https://mcp.grafana.com/mcp/{STACK}.grafana.net` |
| New Relic | `https://mcp.newrelic.com/mcp/` (US/EU/JP) |
| Talaria | `https://api.newtalaria.com/mcp/{org}/{project}` |
| Elastic | Self-hosted: `http://localhost:3001/mcp` (MCP App), `{KIBANA_URL}/api/agent_builder/mcp` (Agent Builder) |

### Unique Differentiators

- **Talaria:** Only vendor with deterministic post-deploy `verify_fix` (adoption threshold, verdict, auto-reopen logic)
- **Sentry:** Most comprehensive skill set (6 skills cover instrument → debug → alert → verify)
- **Elastic:** Best investigation depth (16 K8s failure modes, corroboration, calibrated confidence)
- **Honeycomb:** Prompts-first model (slash commands from server, not skill files)
- **Datadog:** Most mature tooling (org-wide disable switches, IP allowlists, toolset filtering)

---

**End of Research Memo**
