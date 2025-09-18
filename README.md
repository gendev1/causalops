# CausalOps Copilot

**From alerts to action: evidence → cause → fix.**

AI-powered incident management system that converts observability signals into causal graphs with citations and safe, reversible runbooks. Built for the Elastic Challenge hackathon.

## Architecture

-   **Agent Service** (`apps/agent`): Fastify backend with Elasticsearch and Vertex AI integration
-   **Web UI** (`apps/web`): Next.js frontend for incident visualization
-   **Ingestor** (`apps/ingestor`): CLI tools for seeding Elasticsearch
-   **Shared Packages**: Common schemas, EQL patterns, and LLM prompts

## Quick Start

### Prerequisites

-   Node.js 18+
-   pnpm 8+
-   Elasticsearch (Cloud or local)
-   Google Cloud Vertex AI access

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd causalops
pnpm install
```

### Environment Setup

#### 1. Copy Environment Template

```bash
cp .env.example .env
```

#### 2. Configure Elasticsearch Credentials

**Option A: Elastic Cloud (Recommended)**
```bash
# In .env file:
ELASTIC_CLOUD_ID=your-cloud-id
ELASTIC_API_KEY=your-api-key
```

**Option B: Local Elasticsearch**
```bash
# In .env file:
ELASTIC_NODE=http://localhost:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password
```

#### 3. Configure Google Cloud Vertex AI

```bash
# In .env file:
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
```

#### 4. Validate Environment Configuration

```bash
# Test environment validation
pnpm env-check

# Or run full setup validation
bash scripts/validate-setup.sh
```

The system will validate your credentials and provide clear error messages if any configuration is missing or invalid.

### Development

```bash
# Start all development servers
pnpm dev

# Build all packages and apps
pnpm build

# Run linting and type checking
pnpm lint
pnpm typecheck

# Run tests
pnpm test
```

### Demo Flow

```bash
# 1. Seed incident data
pnpm seed

# 2. Start services
pnpm dev

# 3. Open http://localhost:3000
# 4. Click "Diagnose" → view evidence and causal graph
# 5. Click "Generate Runbook" → get safe, reversible plan
```

## Project Status

🚧 **In Development** - Hackathon MVP targeting:

-   Logs-only evidence collection via EQL patterns
-   Causal graph generation with confidence scoring
-   Safe runbook plans with prechecks and validations

See `docs/master-tasks.md` for detailed implementation progress.

## Key Features

-   **Evidence-Based Analysis**: All claims cited with Elasticsearch evidence IDs
-   **Causal Reasoning**: DAG visualization with confidence-scored relationships
-   **Safe Automation**: Runbook steps include prechecks and rollback strategies
-   **Kibana Integration**: Deep links to original evidence in Kibana
-   **Audit Trail**: Full traceability from alert to action

## Technology Stack

-   **Data**: Elasticsearch with ECS-like field mapping
-   **AI**: Google Cloud Vertex AI (Gemini) with JSON schema enforcement
-   **Backend**: Fastify (Node.js/TypeScript)
-   **Frontend**: Next.js with App Router
-   **Build**: Turborepo + pnpm workspaces

## Contributing

This project follows conventional workspace patterns:

```bash
# Add dependency to specific app
pnpm add -w @repo/web some-package

# Run command in specific workspace
pnpm --filter @repo/agent dev

# Build specific package
turbo run build --filter @repo/shared
```

## License

MIT - see [LICENSE](LICENSE) file.

---

**CausalOps Team** | Elastic Challenge 2025