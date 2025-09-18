# CausalOps Copilot — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 17 Sep 2025
**Track:** Elastic Challenge — AI-Powered Search + Google Cloud (Vertex/Gemini)
**Owner:** Team CausalOps
**Scope:** Elastic-only MVP (no external ingestion adapters).

---

## 1. Purpose & Background

On-call engineers drown in telemetry but still lack **actionable, auditable guidance** during incidents. Existing chat/RAG tools answer in prose without verifiable evidence or safe steps. **CausalOps Copilot** converts observability signals into a **causal graph with citations** and a **safe, reversible runbook**.

**One-line value prop:** _From alerts to action: evidence → cause → fix._

---

## 2. Goals & Non‑Goals

### 2.1 Goals (MVP / Hackathon)

1. **Diagnose** a staged incident from Elastic indices using EQL; produce a compact **causal DAG** (≤8 nodes) with evidence IDs and Kibana deep links.
2. **Generate Runbook** using Vertex AI (Gemini) in JSON mode: prechecks → reversible actions → validations.
3. **3‑minute demo** end‑to‑end with reproducible seeding; no external dependencies required.
4. **Open source** repo with MIT license, README, and deploy instructions.

### 2.2 Non‑Goals (MVP)

-   Automated execution of runbooks in production clusters.
-   Full parity with commercial RCA suites; broad multi‑source correlation beyond our seeded patterns.
-   SSO/RBAC and enterprise-grade governance.
-   External ingestion adapters (Datadog/Splunk/etc.).

---

## 3. Personas

-   **Ava (On‑Call SRE):** Needs fast, trustworthy triage with concrete, safe steps.
-   **Jordan (Platform Lead):** Cares about consistency, auditability, and MTTR.
-   **Hackathon Judge:** Wants to see partner tech clearly integrated and value demonstrated in minutes.

---

## 4. User Stories & Acceptance Criteria

**US‑1 Diagnose**
_As an SRE, I click “Diagnose” and receive an evidence list and causal graph._

-   **AC:** `/diagnose` returns `{ timeframe, evidence, graph }`.
-   **Evidence:** each item has `@timestamp`, `event.action`, `service.name`, `message`, optional `trace_id`, and Kibana deep link.
-   **Graph:** ≤8 nodes, ≤10 edges; edges carry `evidenceIds`.

**US‑2 Evidence Trail**
_As an SRE, I can expand nodes to view supporting hits and open them in Kibana._

-   **AC:** Evidence cards render key fields and a deep link. Selecting a card highlights node(s).

**US‑3 Runbook Generation**
_As an SRE, I can generate a safe plan with commands I can copy._

-   **AC:** `/runbook` returns schema‑valid JSON with `summary` and `steps[]` where each step has `title`, `command`, `rationale`, `requiresConfirmation`. Mutating steps are preceded by prechecks and followed by validations.

**US‑4 Demo Control**
_As a presenter, I can seed a known scenario and run the full flow under 3 minutes._

-   **AC:** One button seeds data; Diagnose returns in ≤10s; Runbook in ≤7s.

---

## 5. Scope & Scenarios

### 5.1 In Scope

-   **Logs-only MVP**: Ingest **synthetic logs** (before/spike/after) into Elastic and run minimal **EQL** patterns: `config_change`, `db_pool_low`, `latency_spike`. (Traces/metrics are roadmap; will correlate via `trace_id` later.)
-   Node.js agent service (Express) with endpoints: `/health`, `/diagnose`, `/runbook`.
-   Next.js UI (App Router) with three actions: **Seed**, **Diagnose**, **Generate Runbook**.

### 5.2 Out of Scope

-   Live cluster changes; complex auth; multi‑tenant governance; SLO burn‑rate math; cost analysis.

### 5.3 Happy‑Path Demo Scenario

1. Seed incident A (config hash change → DB pool low → latency spike).
2. Diagnose: evidence cards + DAG render; each evidence has a deep link.
3. Generate Runbook: prechecks, `kubectl rollout undo`, validation.

---

## 6. Functional Requirements

### 6.1 Backend (Agent)

-   **`POST /diagnose`**
    **Req:** `{ windowMins?: number, index?: string }` (defaults: 10 mins, `ELASTIC_INDEX`).
    **Resp:** `{ timeframe, evidence: {latency, dbpool, config}, graph }`.
-   **`POST /runbook`**
    **Req:** `{ evidence, graph, runbookHints? }`

    -   `runbookHints` (optional): object to bias safety/strategy in the LLM.

        -   **Demo-safe example:** `{ "hint": "The root cause appears to be a recent configuration change. Prefer a rollback; include prechecks and validations." }`
            **Resp:** `{ plan }` where `plan` matches JSON schema (see §9.3).

-   **`GET /health`**
    Returns `{ ok: true }`

### 6.2 Elastic Integration

-   **Index:** `causalops-logs` (configurable).
-   **Mapping:** minimal ECS‑like fields: `@timestamp`, `service.name`, `event.action`, `message`, `trace_id`, `labels.*`, `metrics.*`.
-   **EQL Patterns:**

    -   `latency_hotspot.eql`: `any where event.action == "latency_spike" and service.name == "api"`
    -   `db_pool_exhaustion.eql`: `any where event.action == "db_pool_low" and service.name == "api"`
    -   `config_change.eql`: `any where event.action == "config_change"`

### 6.3 Vertex AI / Gemini

-   Use **responseMimeType: `application/json`** and **responseSchema** to enforce structure for `graph` and `plan`.
-   Temperature low (≤0.4) for determinism.

#### Prompt Strategy

**Objective:** Deterministic, auditable LLM outputs for both the causal graph and runbook.

**General constraints**

-   Low temperature (≤0.4), **responseMimeType: `application/json`**, and **responseSchema** enforcement.
-   Cap outputs: graph ≤8 nodes/≤10 edges; 4–6 runbook steps max.
-   Always bind claims to **`evidenceIds`** from Elastic hits.
-   If ambiguity remains, emit a **minimal graph** (top 1–3 nodes, no edges) and a `missingSignals` note.
-   **Confidence modeling:** The model must output a `confidence` field wherever specified by schema with one of `high|medium|low`. Criteria: count/consistency of supporting evidence, temporal ordering, and agreement across patterns. Default to `low` if evidence is sparse or contradictory.

**Graph prompt skeleton** (stored in `packages/prompts/diagnose.md`):

-   **System:** “You are a reliability analyst. Build a concise causal DAG from Elastic EQL evidence. Cite `evidenceIds` on edges and assign `confidence` to each edge.”
-   **Tools/Schema:** Provide the JSON schema for `{nodes, edges}` (with `confidence`).
-   **Few‑shot:** 1–2 examples mapping `{config_change → db_pool_low → latency_spike}` with realistic fields and explicit `confidence` justification in hidden comments.
-   **User content:** The raw `evidence` object and timeframe.
-   **Guards:** Disallow speculative nodes not present in evidence; preserve chronological order; compress duplicate events.

**Runbook prompt skeleton** (stored in `packages/prompts/runbook.md`):

-   **System:** “You are an SRE runbook generator. Output a safe, reversible plan with prechecks and validations. Prefer rollback when recent config change is implicated.”
-   **Schema:** Provide the runbook JSON schema (see §9.3) including per-step `confidence`.
-   **Hints:** Accept optional `runbookHints` to bias strategy (e.g., prefer rollback vs. scale). For demo, pass a fixed hint favoring rollback.
-   **Guards:** Never execute commands; mark mutating steps `requiresConfirmation=true`; include at least one read‑only precheck and a final validation; assign `confidence` to each step.

### 6.4 UI Requirements

-   **Controls:** Seed, Diagnose, Generate Runbook.
-   **Panels:** Evidence Trail (cards with copy + deep link), Causal Graph (DAG), Runbook Panel (pretty JSON + Copy).
-   **Interaction:** Hovering an **evidence card** highlights corresponding **nodes/edges** in the DAG; hovering a **node** highlights its evidence cards. Clicking opens deep links. Smooth 200–300ms animations.
-   **Confidence UI:**

    -   Show a small **badge** (`High/Medium/Low`) on each runbook step.
    -   Edge styling by confidence: **solid** (high), **dashed** (medium), **dotted** (low). Tooltip explains rationale.

-   **Advanced (collapsed):** Index selector, OpenAPI link.

---

## 7. Non‑Functional Requirements

-   **Performance:** Diagnose ≤10s; Runbook ≤7s on ≤10k events.
-   **Reliability:** Graceful error states for Elastic/Vertex outages.
-   **Security:** Demo creds only; no prod access; least‑privilege GCP SA.
-   **Auditability:** Each graph edge cites `evidenceIds`.
-   **Portability:** Runbook is vendor‑neutral (plain shell/kubectl).
-   **OSS Compliance:** MIT license; reproducible local run.

---

## 8. Competitive Positioning (brief)

-   **Different from typical RAG bots:** Schema‑enforced outputs + evidence links.
-   **Different from in‑platform RCA:** Vendor‑neutral runbook JSON usable outside the tool.

---

## 9. APIs, Schemas & Contracts

### 9.1 `/diagnose` Response

```json
{
    "timeframe": { "gte": "2025-09-17T01:02:03Z", "lte": "now" },
    "latency": {
        "name": "latency_spike",
        "hits": [{ "_id": "...", "@timestamp": "...", "service": { "name": "api" }, "event": { "action": "latency_spike" }, "message": "Latency spike p95=980ms" }]
    },
    "dbpool": { "name": "db_pool_low", "hits": [] },
    "config": { "name": "config_change", "hits": [] },
    "graph": {
        "nodes": [
            { "id": "n1", "label": "Config hash changed (api)" },
            { "id": "n2", "label": "DB pool low (api)" },
            { "id": "n3", "label": "Latency spike (api)" }
        ],
        "edges": [
            { "from": "n1", "to": "n2", "evidenceIds": ["index/_id"] },
            { "from": "n2", "to": "n3", "evidenceIds": ["index/_id"] }
        ]
    }
}
```

### 9.2 Graph Generation Schema (LLM)

```json
{
    "type": "object",
    "properties": {
        "nodes": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "label": { "type": "string" } }, "required": ["id", "label"] } },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "from": { "type": "string" },
                    "to": { "type": "string" },
                    "evidenceIds": { "type": "array", "items": { "type": "string" } },
                    "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
                },
                "required": ["from", "to", "confidence"]
            }
        }
    },
    "required": ["nodes", "edges"]
}
```

### 9.3 Runbook Plan Schema (LLM)

```json
{
    "type": "object",
    "properties": {
        "summary": { "type": "string" },
        "steps": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": { "type": "string" },
                    "command": { "type": "string" },
                    "rationale": { "type": "string" },
                    "requiresConfirmation": { "type": "boolean" },
                    "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
                },
                "required": ["title", "command", "confidence"]
            }
        }
    },
    "required": ["summary", "steps"]
}
```

---

## 10. Data Model (Elastic Index)

| Field          | Type     | Example                                           |
| -------------- | -------- | ------------------------------------------------- |
| `@timestamp`   | datetime | `2025-09-17T01:02:03Z`                            |
| `service.name` | keyword  | `api`                                             |
| `event.action` | keyword  | `config_change` / `db_pool_low` / `latency_spike` |
| `message`      | text     | `Latency spike p95=980ms`                         |
| `trace_id`     | keyword  | `t-1001`                                          |
| `labels.*`     | object   | `{ "db_pool_avail": 3 }`                          |
| `metrics.*`    | object   | `{ "p95_ms": 980 }`                               |

---

## 11. UX Flows (MVP)

1. **Home** → buttons: _Seed Incident_, _Diagnose_, _Generate Runbook_.
2. **After Diagnose** → Evidence Trail (list) + Causal Graph (DAG).
3. **After Runbook** → JSON Plan panel with _Copy All_ and _Mark steps done_ (visual only).
4. **Advanced (collapsed)** → Index selector, link to OpenAPI.

---

## 12. Metrics & Telemetry

-   **Time‑to‑diagnose** (ms) from click to evidence render.
-   **Graph size** (nodes/edges).
-   **Evidence grounding rate**: % of claims with ≥1 evidence ID.
-   **Runbook safety**: % steps with prechecks and validations.
-   **Confidence distribution**: % of edges/steps labeled high/medium/low; track over time as signals improve.

---

## 13. Architecture (High‑Level)

-   **UI:** Next.js (App Router) calling Agent.
-   **Agent:** Express; modules: `elastic.ts` (EQL), `vertex.ts` (LLM JSON), `causal-graph.ts`, `runbook.ts`.
-   **Data plane:** Elastic Cloud or local ES; optional Kibana for deep links.
-   **AI:** Vertex AI / Gemini with JSON schemas; low temperature.
-   **Hosting:** Local for demo; Cloud Run YAML provided.

---

## 14. Release Plan

-   **v0 (Hackathon):** Seeded data; Diagnose + Runbook; JSON upload optional.
-   **v0.1 (2 weeks):** Slack/Jira share, 5 runbook templates, index selector persistence.
-   **v0.2 (4–6 weeks):** Traces/metrics enrichment, simple RBAC. (External adapters post-hackathon roadmap.)

---

## 15. Risks & Mitigations

| Risk                   | Impact         | Mitigation                                                              |
| ---------------------- | -------------- | ----------------------------------------------------------------------- |
| Elastic/Vertex latency | Demo stalls    | Pre‑warm data; small payloads; cached graph during time window          |
| LLM hallucination      | Wrong steps    | Schema‑enforce; require prechecks; cite evidence                        |
| Thin signals           | Low confidence | Show “Missing signals” checklist; degrade to hypothesis with confidence |

---

## 16. Security, Privacy, Compliance

-   No production secrets in repo; `.env.example` only.
-   Demo data only; if user uploads logs, store in temp index with TTL or manual cleanup.
-   GCP SA limited to Vertex AI.

---

## 17. Test Plan (MVP)

-   **Unit:** EQL query wrappers; schema validators for LLM outputs.
-   **Integration:** `/diagnose` returns non‑empty evidence on seeded index; `/runbook` returns valid JSON with prechecks.
-   **UI smoke:** Seed → Diagnose → Runbook flow renders without errors under 10s/7s targets.
-   **Prompt determinism:** Graph and plan are stable across three runs with fixed seeds; outputs validate against schemas; on schema error, agent returns a minimal graph and a helpful message.
-   **Evidence ↔ graph UX:** Hover interactions highlight the correct nodes/edges and evidence cards; deep links open successfully.
-   **Confidence presence:** All edges and steps include `confidence` and badges/edge styles render correctly.

---

## 18. Demo Script (3 minutes)

1. _Hook (10s):_ “AI copilot that answers with **receipts** and a **runnable plan**.”
2. _Seed (15s):_ Click Seed Incident.
3. _Diagnose (40s):_ Evidence cards + Kibana deep links; causal DAG animates.
4. _Runbook (45s):_ Prechecks → `kubectl rollout undo` → validation.
5. _Close (20s):_ “We reduce MTTR by returning **Answer → Evidence → Plan**. Elastic + Gemini, end‑to‑end.”

---

## 19. Submission Checklist (Hackathon)

-   Hosted URLs for Agent + Web (Cloud Run/Vercel).
-   Public GitHub repo with MIT license and README (setup + demo steps).
-   3‑minute video (YouTube/Vimeo).
-   Challenge selection: **Elastic**.
-   Clear mention of Elastic + Google Cloud integration.

---

## 20. Resolved Decisions

-   **Signals scope (MVP):** Logs‑only. Roadmap: fuse traces & metrics by correlating on `trace_id` for deeper cross‑signal context.
-   **Confidence modeling:** Add `confidence: high|medium|low` to causal **edges** and **runbook steps**; instruct Gemini to self‑assess based on evidence density/consistency.
-   **Runbook strategies:** Single **happy‑path** plan for MVP (prefer rollback in demo). Roadmap: multi‑strategy selection (rollback vs scale) aligned with team policy.
