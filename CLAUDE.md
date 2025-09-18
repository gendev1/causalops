# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CausalOps Copilot is an AI-powered incident management system that converts observability signals into causal graphs with citations and safe, reversible runbooks. The project is built for the Elastic Challenge hackathon, integrating Elasticsearch for data ingestion and Google Cloud Vertex AI (Gemini) for causal analysis and runbook generation.

**Core Value Proposition**: From alerts to action: evidence → cause → fix.

## Architecture

The system follows a monorepo structure with multiple applications:

-   **Agent Service** (Typescript/Express): Backend API service handling Elasticsearch queries, Vertex AI integration, and causal graph generation
-   **Web UI** (Next.js App Router): Frontend interface for incident visualization and runbook generation
-   **Ingestor**: CLI tools for seeding Elasticsearch with synthetic incident data
-   **Shared Packages**: Common schemas, prompts, and utilities

### Key Technical Stack

-   **Data Layer**: Elasticsearch with ECS-like field mapping (`causalops-logs` index)
-   **AI Layer**: Google Cloud Vertex AI (Gemini) with JSON schema enforcement
-   **Backend**: Node.js with Fastify, TypeScript
-   **Frontend**: Next.js with App Router, TypeScript
-   **Build System**: Turborepo monorepo with pnpm workspaces

## Development Commands

Since this is a new project in early development, specific build/test commands are not yet established. The project structure suggests:

```bash
# Install dependencies (expected)
pnpm install

# Development (expected based on monorepo structure)
turbo dev

# Seeding test data (from task plan)
pnpm seed
```

## Core API Endpoints

The agent service provides these main endpoints:

-   `GET /health` - Service health check
-   `POST /diagnose` - Analyze incident evidence and generate causal graph
-   `POST /runbook` - Generate safe, reversible runbook from evidence and graph

## Key Schemas and Contracts

### Diagnose Response Structure

-   `timeframe`: Incident time window
-   `evidence`: Structured evidence from EQL patterns (latency, dbpool, config changes)
-   `graph`: Causal DAG with nodes, edges, confidence levels, and evidence citations

### Runbook Plan Schema

-   `summary`: High-level incident summary
-   `steps[]`: Ordered steps with title, command, rationale, confidence level, and safety flags
-   Each step includes `requiresConfirmation` for destructive operations

### Elasticsearch Integration

-   **Index**: `causalops-logs` with ECS-like mapping
-   **EQL Patterns**:
    -   `config_change.eql`: Configuration changes
    -   `db_pool_exhaustion.eql`: Database connection issues
    -   `latency_hotspot.eql`: Performance degradation
-   **Deep Links**: Kibana integration for evidence traceability

### Vertex AI (Gemini) Integration

-   **Response Format**: JSON with schema enforcement (`responseMimeType: application/json`)
-   **Temperature**: ≤0.4 for deterministic outputs
-   **Confidence Modeling**: All outputs include confidence levels (high/medium/low)
-   **Evidence Binding**: All claims must cite `evidenceIds` from Elasticsearch

## Project Conventions

### Code Organization

-   Follow TypeScript conventions with strict typing
-   Use schema validation (zod/ajv) for LLM outputs
-   Implement graceful fallbacks for external service failures
-   Maintain audit trails with evidence citations

### Safety and Security

-   All runbook commands require confirmation for destructive operations
-   Include prechecks and validations for each runbook step
-   No production secrets in repository (use `.env.example`)
-   Prefer rollback strategies over forward fixes when configuration changes are implicated

### Testing Strategy (From Task Plan)

-   **Unit Tests**: EQL wrappers, schema validators
-   **Integration Tests**: Full seed → diagnose → runbook flow
-   **Prompt Determinism**: Validate LLM output stability across runs
-   **Performance Targets**: Diagnose ≤10s, Runbook ≤7s

## Special Permissions

The `.claude/settings.json` file grants automatic permission for:

-   `Bash(./hack/spec_metadata.sh)`
-   `Bash(hack/spec_metadata.sh)`
-   `Bash(bash hack/spec_metadata.sh)`

This suggests future tooling for specification or metadata generation.

## Development Workflow

1. **Data Seeding**: Use ingestor tools to populate Elasticsearch with synthetic incident data
2. **Evidence Collection**: Test EQL patterns against seeded data
3. **Graph Generation**: Validate causal DAG creation with proper confidence scoring
4. **Runbook Creation**: Ensure safe, reversible plans with proper prechecks
5. **UI Integration**: Test evidence-to-graph hover interactions and deep linking

## Key Files and Locations

-   `docs/prd.md` - Complete product requirements document
-   `docs/master-tasks.md` - Detailed implementation task breakdown
-   `.claude/commands/` - Custom Claude Code commands for project workflows
-   `.claude/agents/` - Specialized agent configurations for code analysis
-   `packages/prompts/` - LLM prompt templates (planned)
-   `packages/shared/schemas.*` - TypeScript/JSON schemas for validation (planned)

The project emphasizes evidence-based analysis, safety-first automation, and clear audit trails throughout the incident response workflow.
