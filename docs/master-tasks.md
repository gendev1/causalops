# CausalOps Copilot — Task Plan (Elastic-only MVP)

## Epic 0 — Repo & Infrastructure

**COP-0.1 Bootstrap Monorepo**

-   **Deps:** —
-   **Deliverables:** `package.json` workspaces, `turbo.json`, `pnpm-workspace.yaml`, MIT `LICENSE`, base README.
-   **Accept:** `pnpm i` works; `turbo dev` runs; lint/build pass.

**COP-0.2 Env & Secrets Wiring**

-   **Deps:** 0.1
-   **Deliverables:** `.env.example` (Elastic Cloud/local; GCP Vertex), runtime env loading in agent/ui.
-   **Accept:** App starts with either Elastic Cloud ID/API key or local ES creds; Vertex SA picked up.

---

## Epic 1 — Elastic Data Plane

**COP-1.1 Index Mapping & ECS-ish Fields**

-   **Deps:** 0.2
-   **Deliverables:** `data/mappings/elastic_index_mapping.json` (fields per PRD), index init util.
-   **Accept:** `causalops-logs` created with mapping; writes succeed.

**COP-1.2 Synthetic Incident Seeds**

-   **Deps:** 1.1
-   **Deliverables:** `data/sample-logs/incident_A_{before,spike,after}.jsonl` with `config_change` → `db_pool_low` → `latency_spike`.
-   **Accept:** Bulk seed indexes 3 files; events visible in Kibana Discover.

**COP-1.3 EQL Patterns (Baseline)**

-   **Deps:** 1.2
-   **Deliverables:** `packages/eql/{config_change.eql,db_pool_exhaustion.eql,latency_hotspot.eql}`.
-   **Accept:** Each query returns ≥1 hit over seeded window in Kibana and via API.

**COP-1.4 Kibana Deep-Link Builder**

-   **Deps:** 1.1
-   **Deliverables:** util to build per-doc deep links (index + \_id + time).
-   **Accept:** Clicking from UI opens exact doc/time in Kibana.

---

## Epic 2 — Agent (Express, Node/TS)

**COP-2.1 Agent Skeleton & Health**

-   **Deps:** 0.1
-   **Deliverables:** `apps/agent` Express service, `GET /health`.
-   **Accept:** Returns `{ok:true}`.

**COP-2.2 Elastic Client & EQL Wrapper**

-   **Deps:** 2.1, 1.3
-   **Deliverables:** `elastic.ts` (cloud/local auth, EQL search with time filters).
-   **Accept:** Programmatic EQL returns same hits as Kibana.

**COP-2.3 `/diagnose` Endpoint (Evidence Assembly)**

-   **Deps:** 2.2, 1.3
-   **Deliverables:** `POST /diagnose` → `{timeframe, evidence:{latency,dbpool,config}}` + deep links.
-   **Accept:** Response includes non-empty evidence for seeded window; fields match PRD.

**COP-2.4 Prompt Contracts & JSON Schema Validation**

-   **Deps:** 2.3
-   **Deliverables:** `packages/shared/schemas.{ts|json}` for **Graph** and **Runbook** (incl. `confidence`); validator (zod/ajv).
-   **Accept:** Invalid LLM output rejected; minimal fallback returned.

**COP-2.5 Graph Generation (Vertex/Gemini)**

-   **Deps:** 2.4
-   **Deliverables:** `vertex.ts`, `causal-graph.ts`, **Prompt file** `packages/prompts/diagnose.md` (few-shot, constraints, confidence).
-   **Accept:** `/diagnose` returns `graph` with ≤8 nodes/≤10 edges, edges have `confidence` + `evidenceIds`.

**COP-2.6 `/runbook` Endpoint**

-   **Deps:** 2.4
-   **Deliverables:** `runbook.ts`, **Prompt file** `packages/prompts/runbook.md`, supports optional `runbookHints`.
-   **Accept:** Returns schema-valid plan with prechecks → reversible step → validation; each step has `confidence`.

**COP-2.7 Error Handling & Fallbacks**

-   **Deps:** 2.3–2.6
-   **Deliverables:** Graceful errors for ES/Vertex; minimal graph fallback; helpful messages.
-   **Accept:** Simulated failures produce user-presentable, actionable errors.

---

## Epic 3 — Web UI (Next.js App Router)

**COP-3.1 UI Shell & Controls**

-   **Deps:** 2.1
-   **Deliverables:** Buttons: **Seed Incident**, **Diagnose**, **Generate Runbook**; `NEXT_PUBLIC_AGENT_URL` config.
-   **Accept:** Buttons call endpoints; loading/disabled states shown.

**COP-3.2 Evidence Trail**

-   **Deps:** 3.1, 2.3
-   **Deliverables:** Evidence cards (timestamp, service, action, message, deep link).
-   **Accept:** Cards render list; link opens Kibana.

**COP-3.3 Causal Graph (DAG) with Confidence Styling**

-   **Deps:** 3.1, 2.5
-   **Deliverables:** Cytoscape (or d3) DAG; edge styles: solid=high, dashed=medium, dotted=low.
-   **Accept:** Graph renders within 10s; legend displays confidence mapping.

**COP-3.4 Evidence↔Graph Hover Link**

-   **Deps:** 3.2, 3.3
-   **Deliverables:** Hovering evidence highlights nodes/edges; hovering nodes highlights evidence cards (200–300ms anim).
-   **Accept:** UX linkage works bidirectionally.

**COP-3.5 Runbook Panel**

-   **Deps:** 3.1, 2.6
-   **Deliverables:** Pretty JSON viewer; “Copy all” button; per-step confidence badges; “Mark step done” (visual only).
-   **Accept:** Plan renders; badges show High/Med/Low.

**COP-3.6 Advanced Panel & OpenAPI Link**

-   **Deps:** 3.1
-   **Deliverables:** Index selector; footer link to OpenAPI doc.
-   **Accept:** Changing index re-queries; OpenAPI opens.

---

## Epic 4 — Seeding & Demo Controls

**COP-4.1 Index Init + Bulk Seed CLI**

-   **Deps:** 1.1, 1.2
-   **Deliverables:** `apps/ingestor` scripts: `index-init.ts`, `seed.ts`.
-   **Accept:** `pnpm seed` creates index & bulk inserts; timestamps spaced per offsets.

**COP-4.2 Demo Trigger API (Web)**

-   **Deps:** 4.1
-   **Deliverables:** `apps/web/app/api/trigger/route.ts` to call ingestor/seed.
-   **Accept:** Clicking **Seed Incident** reseeds; diagnose finds events.

---

## Epic 5 — Docs, Contracts, Deployment

**COP-5.1 OpenAPI for Agent**

-   **Deps:** 2.3, 2.6
-   **Deliverables:** `openapi.yaml` for `/health`, `/diagnose`, `/runbook`.
-   **Accept:** Validates in Swagger; link from UI footer.

**COP-5.2 README (Elastic-only)**

-   **Deps:** 4.1, 3.x
-   **Deliverables:** Setup, `.env`, seed, run, demo script (3-min).
-   **Accept:** New user reproduces demo E2E.

**COP-5.3 Cloud Run Manifests**

-   **Deps:** 2.x, 3.x
-   **Deliverables:** `infra/cloudrun/{agent.yaml,web.yaml}`.
-   **Accept:** Deploys with env vars; public URLs reachable.

---

## Epic 6 — Quality & Tests

**COP-6.1 Unit Tests (Agent)**

-   **Deps:** 2.2, 2.4
-   **Deliverables:** Tests for EQL wrapper, schema validators.
-   **Accept:** CI green; failure cases covered.

**COP-6.2 Integration Tests**

-   **Deps:** 2.3–2.6, 4.1
-   **Deliverables:** Seed → `/diagnose` → `/runbook` flow test; snapshot of graph/plan structure.
-   **Accept:** Passes locally with seeded data.

**COP-6.3 Prompt Determinism Harness**

-   **Deps:** 2.5, 2.6
-   **Deliverables:** Run 3 trials with fixed seed; assert schema-valid, stable (#nodes range, step count).
-   **Accept:** All runs valid; variance within bounds.

**COP-6.4 UI Smoke & UX Links**

-   **Deps:** 3.2–3.5
-   **Deliverables:** Playwright or Cypress smoke; hover linkage test.
-   **Accept:** Hover highlights correct edges/cards; deep links open.

**COP-6.5 Performance Guardrails**

-   **Deps:** 2.3, 3.3
-   **Deliverables:** Cap hits/time window; pagination if needed; loading spinners.
-   **Accept:** Diagnose ≤10s; Runbook ≤7s on demo data.

---

## Epic 7 — Submission Assets

**COP-7.1 Demo Video Script & Recording**

-   **Deps:** All
-   **Deliverables:** ≤3-min video; script matches PRD storyboard.
-   **Accept:** Uploaded, public, link in README.

**COP-7.2 Devpost Checklist**

-   **Deps:** All
-   **Deliverables:** Hosted URLs, public repo, license, instructions, challenge selection.
-   **Accept:** Submission complete.

---
