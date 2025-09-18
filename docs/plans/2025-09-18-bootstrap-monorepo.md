# COP-0.1 Bootstrap Monorepo Implementation Plan

## Overview

Create a complete Turborepo + pnpm workspace monorepo from scratch to enable CausalOps Copilot hackathon development. This foundational task establishes the workspace structure, build tooling, and development workflow for all subsequent tasks.

## Current State Analysis

The project currently exists only as documentation and Claude Code configuration:

### What Exists:

-   `/docs/prd.md` - Product requirements document
-   `/docs/master-tasks.md` - Implementation task breakdown
-   `/.claude/` - Claude Code configuration and commands
-   `/CLAUDE.md` - Project overview and conventions

### What's Missing:

-   **NO** monorepo configuration files (package.json, turbo.json, pnpm-workspace.yaml)
-   **NO** application directories (apps/agent, apps/web, apps/ingestor)
-   **NO** shared package directories (packages/shared, packages/eql, packages/prompts)
-   **NO** standard project files (LICENSE, README.md, .gitignore, .env.example)
-   **NO** TypeScript configuration
-   **NO** source code files

## Desired End State

A fully functional monorepo where:

-   `pnpm i` installs all dependencies successfully
-   `turbo dev` starts all development servers
-   `turbo build` builds all applications and packages
-   `turbo lint` and `turbo typecheck` pass across workspace
-   Foundation exists for immediate development of COP-1.x, COP-2.x, and COP-3.x tasks

### Key Discoveries:

-   Project architecture requires 3 apps: agent (Express), web (Next.js), ingestor (CLI)
-   Shared packages needed: eql patterns, schemas/utils, LLM prompts
-   Must follow 2024-2025 Turborepo best practices for hackathon speed
-   Using @repo/ namespace prevents npm registry conflicts
-   TypeScript configuration must be shared across workspace

## What We're NOT Doing

-   Installing actual dependencies for specific frameworks (Next.js, Express, etc.)
-   Writing application source code
-   Setting up databases or external services
-   Configuring deployment pipelines
-   Adding specific linting rules or testing frameworks

## Implementation Approach

Create minimal but complete monorepo foundation using proven 2024-2025 patterns. Prioritize hackathon development speed through optimized Turborepo configuration and shared tooling.

## Phase 1: Core Monorepo Infrastructure

### Overview

Establish root-level configuration files and workspace structure that enables dependency management and build orchestration.

### Changes Required:

#### 1. Root Package Configuration

**File**: `package.json`
**Changes**: Create root workspace configuration

```json
{
    "name": "@repo/root",
    "private": true,
    "description": "CausalOps Copilot - AI-powered incident management with causal graphs",
    "scripts": {
        "build": "turbo run build",
        "dev": "turbo run dev",
        "lint": "turbo run lint",
        "typecheck": "turbo run typecheck",
        "test": "turbo run test",
        "clean": "turbo run clean",
        "seed": "turbo run seed"
    },
    "devDependencies": {
        "turbo": "^2.0.0",
        "typescript": "^5.2.0",
        "@types/node": "^20.0.0"
    },
    "packageManager": "pnpm@9.0.0",
    "engines": {
        "node": ">=18",
        "pnpm": ">=8"
    }
}
```

#### 2. Workspace Configuration

**File**: `pnpm-workspace.yaml`
**Changes**: Define workspace packages

```yaml
packages:
    - 'apps/*'
    - 'packages/*'
    - '!**/test/**'
    - '!**/dist/**'
    - '!**/.next/**'
```

#### 3. Turborepo Pipeline Configuration

**File**: `turbo.json`
**Changes**: Optimized build pipelines for hackathon development

```json
{
    "$schema": "https://turborepo.com/schema.json",
    "ui": "stream",
    "globalDependencies": [".env", "tsconfig.json", "pnpm-workspace.yaml"],
    "globalEnv": ["NODE_ENV", "ELASTIC_CLOUD_ID", "ELASTIC_API_KEY", "GOOGLE_APPLICATION_CREDENTIALS"],
    "tasks": {
        "build": {
            "dependsOn": ["^build"],
            "outputs": ["dist/**", ".next/**", "!.next/cache/**", "build/**"],
            "env": ["NODE_ENV"]
        },
        "dev": {
            "cache": false,
            "persistent": true,
            "interruptible": true
        },
        "lint": {
            "outputs": []
        },
        "typecheck": {
            "dependsOn": ["^build"],
            "outputs": []
        },
        "test": {
            "dependsOn": ["build"],
            "outputs": ["coverage/**"]
        },
        "clean": {
            "cache": false
        },
        "seed": {
            "dependsOn": ["build"],
            "cache": false
        }
    }
}
```

#### 4. Root TypeScript Configuration

**File**: `tsconfig.json`
**Changes**: Workspace-level TypeScript settings

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["ES2022"],
        "module": "ESNext",
        "moduleResolution": "bundler",
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "strict": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "isolatedModules": true,
        "newLine": "lf",
        "incremental": true
    },
    "exclude": ["node_modules", "dist", ".next", "build"]
}
```

#### 5. Git Configuration

**File**: `.gitignore`
**Changes**: Comprehensive ignore patterns

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
dist/
build/
.next/
out/

# Environment variables
.env
.env.local
.env.production.local
.env.development.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Turborepo cache
.turbo/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

#### 6. Environment Configuration

**File**: `.env.example`
**Changes**: Template for required environment variables

```bash
# Elasticsearch Configuration
ELASTIC_CLOUD_ID=your-cloud-id-here
ELASTIC_API_KEY=your-api-key-here
ELASTIC_INDEX=causalops-logs

# Local Elasticsearch (alternative)
ELASTIC_NODE=http://localhost:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=changeme

# Google Cloud Vertex AI
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCP_PROJECT_ID=your-project-id

# Application URLs
NEXT_PUBLIC_AGENT_URL=http://localhost:3001
AGENT_PORT=3001
WEB_PORT=3000
```

#### 7. Project License

**File**: `LICENSE`
**Changes**: MIT License for open source compliance

```
MIT License

Copyright (c) 2025 CausalOps Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Success Criteria:

#### Automated Verification:

-   [ ] `pnpm --version` returns 9.x or higher
-   [ ] `pnpm i` completes without errors
-   [ ] `turbo --version` returns 2.x or higher
-   [ ] Root TypeScript compilation: `npx tsc --noEmit`
-   [ ] Workspace structure validation: `pnpm list --depth=0`

#### Manual Verification:

-   [ ] All configuration files are syntactically valid
-   [ ] `.env.example` contains all required variables from PRD
-   [ ] License is properly formatted MIT license
-   [ ] Git ignores all appropriate files and directories

---

## Phase 2: Application Directory Structure

### Overview

Create the three main application directories with minimal package.json configurations that enable development server commands.

### Changes Required:

#### 1. Agent Service Foundation

**File**: `apps/agent/package.json`
**Changes**: Fastify backend application setup

```json
{
    "name": "@repo/agent",
    "version": "0.1.0",
    "private": true,
    "description": "CausalOps Agent - Fastify backend for incident diagnosis",
    "main": "src/index.ts",
    "scripts": {
        "dev": "echo 'Agent dev server - implement in COP-2.1'",
        "build": "echo 'Agent build - implement in COP-2.1'",
        "start": "echo 'Agent start - implement in COP-2.1'",
        "lint": "echo 'Agent lint - implement in COP-2.1'",
        "typecheck": "echo 'Agent typecheck - implement in COP-2.1'",
        "test": "echo 'Agent test - implement in COP-6.1'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `apps/agent/tsconfig.json`
**Changes**: TypeScript configuration extending root

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src"
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "node_modules"]
}
```

**File**: `apps/agent/src/index.ts`
**Changes**: Placeholder file to validate TypeScript setup

```typescript
// COP-2.1 will implement Fastify server here
console.log('CausalOps Agent - Coming in COP-2.1');
```

#### 2. Web Application Foundation

**File**: `apps/web/package.json`
**Changes**: Next.js frontend application setup

```json
{
    "name": "@repo/web",
    "version": "0.1.0",
    "private": true,
    "description": "CausalOps Web UI - Next.js frontend for incident visualization",
    "scripts": {
        "dev": "echo 'Web dev server - implement in COP-3.1'",
        "build": "echo 'Web build - implement in COP-3.1'",
        "start": "echo 'Web start - implement in COP-3.1'",
        "lint": "echo 'Web lint - implement in COP-3.1'",
        "typecheck": "echo 'Web typecheck - implement in COP-3.1'",
        "test": "echo 'Web test - implement in COP-6.4'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `apps/web/tsconfig.json`
**Changes**: TypeScript configuration for Next.js

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "lib": ["dom", "dom.iterable", "ES2022"],
        "allowJs": true,
        "jsx": "preserve",
        "incremental": true,
        "plugins": [
            {
                "name": "next"
            }
        ],
        "paths": {
            "@/*": ["./src/*"]
        }
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

**File**: `apps/web/src/page.tsx`
**Changes**: Placeholder file to validate TypeScript setup

```typescript
// COP-3.1 will implement Next.js App Router here
export default function HomePage() {
    return <div>CausalOps Web UI - Coming in COP-3.1</div>;
}
```

#### 3. Ingestor CLI Foundation

**File**: `apps/ingestor/package.json`
**Changes**: CLI tools for Elasticsearch seeding

```json
{
    "name": "@repo/ingestor",
    "version": "0.1.0",
    "private": true,
    "description": "CausalOps Ingestor - CLI tools for Elasticsearch data seeding",
    "main": "src/index.ts",
    "bin": {
        "seed": "dist/seed.js",
        "index-init": "dist/index-init.js"
    },
    "scripts": {
        "dev": "echo 'Ingestor dev - implement in COP-4.1'",
        "build": "echo 'Ingestor build - implement in COP-4.1'",
        "seed": "echo 'Seed command - implement in COP-4.1'",
        "lint": "echo 'Ingestor lint - implement in COP-4.1'",
        "typecheck": "echo 'Ingestor typecheck - implement in COP-4.1'",
        "test": "echo 'Ingestor test - implement in COP-6.1'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `apps/ingestor/tsconfig.json`
**Changes**: TypeScript configuration for CLI tools

```json
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src",
        "declaration": true,
        "declarationMap": true
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "node_modules"]
}
```

**File**: `apps/ingestor/src/index.ts`
**Changes**: Placeholder file to validate TypeScript setup

```typescript
// COP-4.1 will implement CLI tools here
console.log('CausalOps Ingestor - Coming in COP-4.1');
```

### Success Criteria:

#### Automated Verification:

-   [ ] All app directories exist with proper structure
-   [ ] TypeScript compilation succeeds: `turbo run typecheck`
-   [ ] Package resolution works: `pnpm list --depth=1`
-   [ ] Workspace commands execute: `turbo run dev` (shows placeholder messages)

#### Manual Verification:

-   [ ] Each app has consistent package.json structure
-   [ ] TypeScript configurations properly extend root config
-   [ ] Placeholder source files are syntactically valid
-   [ ] All scripts provide informative messages about future implementation

---

## Phase 3: Shared Package Foundation

### Overview

Create shared packages for TypeScript configuration, utilities, and placeholder packages for future EQL patterns and prompts.

### Changes Required:

#### 1. Shared TypeScript Configuration

**File**: `packages/typescript-config/package.json`
**Changes**: Shared TypeScript configuration package

```json
{
    "name": "@repo/typescript-config",
    "version": "0.1.0",
    "private": true,
    "description": "Shared TypeScript configuration for CausalOps workspace",
    "main": "index.js",
    "files": ["base.json", "nextjs.json", "node.json"]
}
```

**File**: `packages/typescript-config/base.json`
**Changes**: Base TypeScript configuration

```json
{
    "compilerOptions": {
        "strict": true,
        "useUnknownInCatchVariables": true,
        "allowJs": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "isolatedModules": true,
        "newLine": "lf",
        "module": "ESNext",
        "moduleResolution": "bundler",
        "target": "ES2022",
        "lib": ["ES2022"],
        "allowSyntheticDefaultImports": true,
        "esModuleInterop": true,
        "incremental": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true
    }
}
```

**File**: `packages/typescript-config/nextjs.json`
**Changes**: Next.js specific TypeScript configuration

```json
{
    "extends": "./base.json",
    "compilerOptions": {
        "lib": ["dom", "dom.iterable", "ES2022"],
        "allowJs": true,
        "jsx": "preserve",
        "plugins": [
            {
                "name": "next"
            }
        ]
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}
```

**File**: `packages/typescript-config/node.json`
**Changes**: Node.js specific TypeScript configuration

```json
{
    "extends": "./base.json",
    "compilerOptions": {
        "lib": ["ES2022"],
        "module": "CommonJS",
        "outDir": "dist",
        "rootDir": "src"
    }
}
```

#### 2. Shared Utilities Package

**File**: `packages/shared/package.json`
**Changes**: Shared utilities and schemas package

```json
{
    "name": "@repo/shared",
    "version": "0.1.0",
    "private": true,
    "description": "Shared utilities and schemas for CausalOps",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "default": "./dist/index.js"
        },
        "./schemas": {
            "types": "./dist/schemas.d.ts",
            "default": "./dist/schemas.js"
        }
    },
    "scripts": {
        "build": "echo 'Shared build - implement in COP-2.4'",
        "dev": "echo 'Shared dev - implement in COP-2.4'",
        "lint": "echo 'Shared lint - implement in COP-2.4'",
        "typecheck": "echo 'Shared typecheck - implement in COP-2.4'",
        "test": "echo 'Shared test - implement in COP-6.1'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `packages/shared/tsconfig.json`
**Changes**: TypeScript configuration for shared package

```json
{
    "extends": "@repo/typescript-config/node.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src"
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "node_modules"]
}
```

**File**: `packages/shared/src/index.ts`
**Changes**: Placeholder shared utilities

```typescript
// COP-2.4 will implement schemas and utilities here
export const CAUSAL_OPS_VERSION = '0.1.0';
export const DEFAULT_TIMEOUT = 10000;

console.log('CausalOps Shared - Coming in COP-2.4');
```

#### 3. EQL Patterns Package

**File**: `packages/eql/package.json`
**Changes**: EQL pattern definitions package

```json
{
    "name": "@repo/eql",
    "version": "0.1.0",
    "private": true,
    "description": "EQL patterns for CausalOps incident detection",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
        "build": "echo 'EQL build - implement in COP-1.3'",
        "dev": "echo 'EQL dev - implement in COP-1.3'",
        "lint": "echo 'EQL lint - implement in COP-1.3'",
        "typecheck": "echo 'EQL typecheck - implement in COP-1.3'",
        "test": "echo 'EQL test - implement in COP-6.1'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `packages/eql/src/index.ts`
**Changes**: Placeholder EQL patterns

```typescript
// COP-1.3 will implement EQL patterns here
export const EQL_PATTERNS = {
    CONFIG_CHANGE: 'config_change.eql',
    DB_POOL_EXHAUSTION: 'db_pool_exhaustion.eql',
    LATENCY_HOTSPOT: 'latency_hotspot.eql',
};

console.log('CausalOps EQL - Coming in COP-1.3');
```

#### 4. Prompts Package

**File**: `packages/prompts/package.json`
**Changes**: LLM prompt templates package

```json
{
    "name": "@repo/prompts",
    "version": "0.1.0",
    "private": true,
    "description": "LLM prompt templates for CausalOps",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
        "build": "echo 'Prompts build - implement in COP-2.5'",
        "dev": "echo 'Prompts dev - implement in COP-2.5'",
        "lint": "echo 'Prompts lint - implement in COP-2.5'",
        "typecheck": "echo 'Prompts typecheck - implement in COP-2.5'",
        "test": "echo 'Prompts test - implement in COP-6.3'"
    },
    "dependencies": {},
    "devDependencies": {}
}
```

**File**: `packages/prompts/src/index.ts`
**Changes**: Placeholder prompt templates

```typescript
// COP-2.5 and COP-2.6 will implement prompt templates here
export const PROMPT_TEMPLATES = {
    DIAGNOSE: 'diagnose.md',
    RUNBOOK: 'runbook.md',
};

console.log('CausalOps Prompts - Coming in COP-2.5');
```

### Success Criteria:

#### Automated Verification:

-   [ ] All packages compile successfully: `turbo run typecheck`
-   [ ] Package dependencies resolve: `pnpm list --depth=2`
-   [ ] Build commands execute: `turbo run build` (shows placeholder messages)
-   [ ] Shared TypeScript config can be imported by apps

#### Manual Verification:

-   [ ] Package exports are properly defined
-   [ ] TypeScript configurations extend shared configs correctly
-   [ ] All placeholder files are syntactically valid
-   [ ] Package structure follows workspace conventions

---

## Phase 4: Development Workflow Validation

### Overview

Update root README, validate all acceptance criteria, and ensure the monorepo foundation enables immediate development of subsequent tasks.

### Changes Required:

#### 1. Project README

**File**: `README.md`
**Changes**: Comprehensive project overview and setup instructions

````markdown
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
````

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
# - Elasticsearch Cloud ID and API key
# - Google Cloud Vertex AI service account
```

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

````

#### 2. Final Validation Script

**File**: `scripts/validate-setup.sh`
**Changes**: Comprehensive setup validation

```bash
#!/bin/bash
set -e

echo "🔍 Validating CausalOps monorepo setup..."

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required"; exit 1; }

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required, found v$NODE_VERSION"
  exit 1
fi

echo "✅ Node.js $(node --version)"
echo "✅ pnpm $(pnpm --version)"

# Validate workspace configuration
echo "📦 Validating workspace configuration..."
if [ ! -f "pnpm-workspace.yaml" ]; then
  echo "❌ pnpm-workspace.yaml missing"
  exit 1
fi

if [ ! -f "turbo.json" ]; then
  echo "❌ turbo.json missing"
  exit 1
fi

echo "✅ Workspace configuration files exist"

# Test dependency installation
echo "📦 Testing dependency installation..."
pnpm install

echo "✅ Dependencies installed successfully"

# Test workspace structure
echo "🏗️  Testing workspace structure..."
pnpm list --depth=0 | grep -q "@repo/agent" || { echo "❌ Agent app not found"; exit 1; }
pnpm list --depth=0 | grep -q "@repo/web" || { echo "❌ Web app not found"; exit 1; }
pnpm list --depth=0 | grep -q "@repo/ingestor" || { echo "❌ Ingestor app not found"; exit 1; }

echo "✅ All apps detected in workspace"

# Test Turborepo commands
echo "⚡ Testing Turborepo commands..."
turbo run typecheck --dry-run=json >/dev/null || { echo "❌ Turbo typecheck failed"; exit 1; }
turbo run build --dry-run=json >/dev/null || { echo "❌ Turbo build failed"; exit 1; }
turbo run dev --dry-run=json >/dev/null || { echo "❌ Turbo dev failed"; exit 1; }

echo "✅ Turborepo commands configured correctly"

# Test TypeScript compilation
echo "🔧 Testing TypeScript compilation..."
npx tsc --noEmit || { echo "❌ TypeScript compilation failed"; exit 1; }

echo "✅ TypeScript compilation successful"

echo ""
echo "🎉 CausalOps monorepo setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure credentials"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Begin implementing COP-1.x tasks (Elastic Data Plane)"
echo ""
````

**File**: `package.json` (update)
**Changes**: Add validation script

```json
{
    "scripts": {
        "build": "turbo run build",
        "dev": "turbo run dev",
        "lint": "turbo run lint",
        "typecheck": "turbo run typecheck",
        "test": "turbo run test",
        "clean": "turbo run clean",
        "seed": "turbo run seed",
        "validate": "bash scripts/validate-setup.sh"
    }
}
```

### Success Criteria:

#### Automated Verification:

-   [ ] `pnpm validate` script passes all checks
-   [ ] `pnpm install` completes without warnings or errors
-   [ ] `turbo run dev` executes all app placeholder commands
-   [ ] `turbo run build` executes all package placeholder commands
-   [ ] `turbo run typecheck` passes for all workspaces
-   [ ] `npx tsc --noEmit` compiles without errors at root level

#### Manual Verification:

-   [ ] README provides clear setup and development instructions
-   [ ] All acceptance criteria from COP-0.1 are demonstrably met
-   [ ] Project structure enables immediate work on COP-1.x tasks
-   [ ] Environment template includes all required variables from PRD
-   [ ] No TypeScript or configuration errors in any workspace

---

## Testing Strategy

### Unit Tests:

-   Workspace configuration validation
-   TypeScript compilation across all packages
-   Package resolution and dependency management

### Integration Tests:

-   End-to-end monorepo workflow: install → build → dev
-   Cross-package dependency resolution
-   Turborepo cache behavior and pipeline execution

### Manual Testing Steps:

1. Fresh clone and `pnpm install` on clean system
2. Verify all `turbo run` commands execute without errors
3. Test workspace commands (`pnpm --filter` operations)
4. Validate TypeScript IntelliSense works across package boundaries
5. Confirm `.env.example` contains all variables needed for subsequent tasks

## Performance Considerations

-   Turborepo cache configuration optimized for hackathon iteration speed
-   Persistent development servers with proper interruptible configuration
-   Shared TypeScript configuration reduces compilation overhead
-   pnpm workspace protocols minimize dependency installation time

## Migration Notes

N/A - This is a greenfield monorepo setup with no existing code to migrate.

## References

-   PRD requirement: `docs/prd.md` sections 13 (Architecture), 16 (Release Plan)
-   Task definition: `docs/master-tasks.md` COP-0.1 Bootstrap Monorepo
-   Turborepo best practices: 2024-2025 patterns for TypeScript monorepos
-   pnpm workspace configuration: Official documentation patterns
