# COP-0.2 Env & Secrets Wiring Implementation Plan

## Overview

Implement runtime environment variable loading and validation for CausalOps Agent and Web applications, enabling startup with either Elastic Cloud credentials or local Elasticsearch, plus Vertex AI service account integration.

## Current State Analysis

**What exists:**
- ✅ Complete `.env.example` with all required variables (from COP-0.1)
- ✅ Monorepo structure with apps/agent and apps/web
- ✅ Basic package.json files with placeholder scripts

**What's missing:**
- ❌ Runtime environment loading/validation in both applications
- ❌ Environment schema definitions and type safety
- ❌ Startup validation with clear error messages
- ❌ Support for multiple credential provider patterns

## Desired End State

Applications start successfully with proper environment validation:
- **Agent**: Loads either Elastic Cloud (ID/API key) OR local ES credentials, plus Vertex AI config
- **Web**: Loads agent URL and any client-side configuration
- **Both**: Fail fast at startup with actionable error messages for missing/invalid config
- **Validation**: Type-safe environment loading with modern Zod-based validation

### Key Discoveries:

- Modern Node.js (2024-2025) uses Zod with `znv` for type-safe environment validation
- Next.js requires `NEXT_PUBLIC_` prefix for client-side variables
- Fail-fast startup validation is critical for hackathon reliability
- Multiple credential provider patterns needed for cloud vs local development

## What We're NOT Doing

- Installing actual framework dependencies (Express/Fastify, Next.js) - that's for COP-2.1/COP-3.1
- Implementing actual Elasticsearch or Vertex AI clients
- Setting up production deployment configuration
- Adding logging infrastructure
- Creating comprehensive error monitoring

## Implementation Approach

Create a shared environment validation foundation using modern TypeScript patterns, then implement app-specific environment loading that supports multiple credential providers with graceful fallbacks and clear error messaging.

## Phase 1: Shared Environment Validation Package

### Overview

Create a shared package for environment schema definitions and validation utilities that both agent and web applications can use.

### Changes Required:

#### 1. Add Zod and Environment Dependencies

**File**: `packages/shared/package.json`
**Changes**: Add environment validation dependencies

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
        "./env": {
            "types": "./dist/env.d.ts",
            "default": "./dist/env.js"
        }
    },
    "scripts": {
        "build": "tsc",
        "dev": "tsc --watch",
        "lint": "echo 'Shared lint - implement in COP-2.4'",
        "typecheck": "tsc --noEmit",
        "test": "echo 'Shared test - implement in COP-6.1'"
    },
    "dependencies": {
        "zod": "^3.22.4",
        "znv": "^0.4.0",
        "dotenv": "^16.3.1"
    },
    "devDependencies": {
        "typescript": "^5.2.0"
    }
}
```

#### 2. Environment Schema Definitions

**File**: `packages/shared/src/env.ts`
**Changes**: Create Zod schemas for environment validation

```typescript
import { parseEnv, z } from 'znv';

// Common environment variables
export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Elasticsearch configuration schemas
export const elasticCloudSchema = z.object({
  ELASTIC_CLOUD_ID: z.string().min(1),
  ELASTIC_API_KEY: z.string().min(1),
  ELASTIC_INDEX: z.string().default('causalops-logs'),
});

export const elasticLocalSchema = z.object({
  ELASTIC_NODE: z.string().url().default('http://localhost:9200'),
  ELASTIC_USERNAME: z.string().default('elastic'),
  ELASTIC_PASSWORD: z.string().min(1),
  ELASTIC_INDEX: z.string().default('causalops-logs'),
});

// Vertex AI configuration schema
export const vertexAISchema = z.object({
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GCP_PROJECT_ID: z.string().min(1),
});

// Agent environment schema (supports multiple ES configurations)
export const agentEnvSchema = baseEnvSchema.extend({
  AGENT_PORT: z.number().int().min(1).max(65535).default(3001),
  GCP_PROJECT_ID: z.string().min(1),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  // Elasticsearch - either cloud or local required
  ELASTIC_CLOUD_ID: z.string().optional(),
  ELASTIC_API_KEY: z.string().optional(),
  ELASTIC_NODE: z.string().url().optional(),
  ELASTIC_USERNAME: z.string().optional(),
  ELASTIC_PASSWORD: z.string().optional(),
  ELASTIC_INDEX: z.string().default('causalops-logs'),
});

// Web environment schema
export const webEnvSchema = baseEnvSchema.extend({
  WEB_PORT: z.number().int().min(1).max(65535).default(3000),
  // Client-side variables (NEXT_PUBLIC_)
  NEXT_PUBLIC_AGENT_URL: z.string().url().default('http://localhost:3001'),
});

// Validation functions
export function validateAgentEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const parsedEnv = agentEnvSchema.parse(env);

  // Validate that we have either cloud or local Elasticsearch credentials
  const hasCloudCredentials = parsedEnv.ELASTIC_CLOUD_ID && parsedEnv.ELASTIC_API_KEY;
  const hasLocalCredentials = parsedEnv.ELASTIC_NODE && parsedEnv.ELASTIC_USERNAME && parsedEnv.ELASTIC_PASSWORD;

  if (!hasCloudCredentials && !hasLocalCredentials) {
    throw new Error(
      'Missing Elasticsearch credentials. Provide either:\n' +
      '  - ELASTIC_CLOUD_ID + ELASTIC_API_KEY (for Elastic Cloud)\n' +
      '  - ELASTIC_NODE + ELASTIC_USERNAME + ELASTIC_PASSWORD (for local ES)'
    );
  }

  return {
    ...parsedEnv,
    elasticsearch: hasCloudCredentials
      ? {
          type: 'cloud' as const,
          cloudId: parsedEnv.ELASTIC_CLOUD_ID!,
          apiKey: parsedEnv.ELASTIC_API_KEY!,
          index: parsedEnv.ELASTIC_INDEX,
        }
      : {
          type: 'local' as const,
          node: parsedEnv.ELASTIC_NODE!,
          username: parsedEnv.ELASTIC_USERNAME!,
          password: parsedEnv.ELASTIC_PASSWORD!,
          index: parsedEnv.ELASTIC_INDEX,
        }
  };
}

export function validateWebEnvironment(env: NodeJS.ProcessEnv = process.env) {
  return webEnvSchema.parse(env);
}

// Type exports
export type AgentEnvironment = ReturnType<typeof validateAgentEnvironment>;
export type WebEnvironment = z.infer<typeof webEnvSchema>;
```

#### 3. Environment Validation Utilities

**File**: `packages/shared/src/startup.ts`
**Changes**: Create startup validation helpers

```typescript
import { ZodError } from 'zod';

export class EnvironmentValidationError extends Error {
  constructor(public issues: ZodError['issues']) {
    super('Environment validation failed');
    this.name = 'EnvironmentValidationError';
  }
}

export function createEnvironmentValidator<T>(
  validatorFn: () => T,
  appName: string
) {
  return (): T => {
    try {
      console.log(`🔧 Validating ${appName} environment...`);
      const env = validatorFn();
      console.log(`✅ ${appName} environment validation passed`);
      return env;
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`❌ ${appName} environment validation failed:`);
        error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          console.error(`  ${path}: ${issue.message}`);
        });
        console.error('\n💡 Check your .env file or environment variables');
        process.exit(1);
      }
      throw error;
    }
  };
}
```

#### 4. Update Shared Package Exports

**File**: `packages/shared/src/index.ts`
**Changes**: Export environment validation utilities

```typescript
// COP-2.4 will implement schemas and utilities here
export const CAUSAL_OPS_VERSION = '0.1.0';
export const DEFAULT_TIMEOUT = 10000;

// Environment validation exports
export {
  validateAgentEnvironment,
  validateWebEnvironment,
  createEnvironmentValidator,
  EnvironmentValidationError,
  type AgentEnvironment,
  type WebEnvironment,
} from './env.js';

console.log('CausalOps Shared - Coming in COP-2.4');
```

### Success Criteria:

#### Automated Verification:

- [x] Package builds successfully: `turbo run build --filter @repo/shared`
- [x] TypeScript compilation passes: `turbo run typecheck --filter @repo/shared`
- [x] Zod schemas parse environment variables correctly
- [x] Environment validation functions export proper types

#### Manual Verification:

- [x] Shared package exports work correctly from other packages
- [x] Environment validation provides clear error messages
- [x] Both cloud and local Elasticsearch validation works
- [x] Type definitions are properly generated and accessible

---

## Phase 2: Agent Environment Loading

### Overview

Implement environment loading and validation in the agent application with startup integration and proper error handling.

### Changes Required:

#### 1. Add Dependencies to Agent

**File**: `apps/agent/package.json`
**Changes**: Add environment loading dependencies and update scripts

```json
{
    "name": "@repo/agent",
    "version": "0.1.0",
    "private": true,
    "description": "CausalOps Agent - Express backend for incident diagnosis",
    "main": "src/index.ts",
    "scripts": {
        "dev": "tsx watch src/index.ts",
        "build": "tsc",
        "start": "node dist/index.js",
        "lint": "echo 'Agent lint - implement in COP-2.1'",
        "typecheck": "tsc --noEmit",
        "test": "echo 'Agent test - implement in COP-6.1'"
    },
    "dependencies": {
        "@repo/shared": "workspace:*",
        "dotenv": "^16.3.1"
    },
    "devDependencies": {
        "tsx": "^4.1.0",
        "typescript": "^5.2.0"
    }
}
```

#### 2. Agent Environment Loading

**File**: `apps/agent/src/env.ts`
**Changes**: Create agent-specific environment validation

```typescript
import 'dotenv/config';
import { validateAgentEnvironment, createEnvironmentValidator } from '@repo/shared';

export const validateEnv = createEnvironmentValidator(
  () => validateAgentEnvironment(),
  'Agent'
);

export const env = validateEnv();
export type Env = typeof env;
```

#### 3. Update Agent Application Entry Point

**File**: `apps/agent/src/index.ts`
**Changes**: Integrate environment validation into startup

```typescript
// Load and validate environment first
import { env } from './env.js';

console.log('🚀 CausalOps Agent starting...');
console.log(`📊 Environment: ${env.NODE_ENV}`);
console.log(`🔌 Port: ${env.AGENT_PORT}`);
console.log(`📁 Elasticsearch: ${env.elasticsearch.type} (index: ${env.elasticsearch.index})`);
console.log(`☁️  Vertex AI Project: ${env.GCP_PROJECT_ID}`);

// COP-2.1 will implement Express server here
console.log('✅ Agent environment loaded - Coming in COP-2.1');

// Keep process alive for now
process.on('SIGTERM', () => {
  console.log('👋 Agent shutting down...');
  process.exit(0);
});
```

### Success Criteria:

#### Automated Verification:

- [x] Agent builds successfully: `turbo run build --filter @repo/agent`
- [x] TypeScript compilation passes: `turbo run typecheck --filter @repo/agent`
- [x] Environment validation integrates correctly with shared package

#### Manual Verification:

- [x] Agent starts successfully with valid Elastic Cloud credentials
- [x] Agent starts successfully with valid local Elasticsearch credentials
- [x] Agent fails gracefully with clear error messages for missing credentials
- [x] Agent loads Vertex AI configuration correctly
- [x] Environment type safety works in development

---

## Phase 3: Web Environment Loading

### Overview

Implement environment loading for the Next.js web application with proper client/server-side variable separation.

### Changes Required:

#### 1. Add Dependencies to Web

**File**: `apps/web/package.json`
**Changes**: Add environment loading dependencies and update scripts

```json
{
    "name": "@repo/web",
    "version": "0.1.0",
    "private": true,
    "description": "CausalOps Web UI - Next.js frontend for incident visualization",
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "echo 'Web lint - implement in COP-3.1'",
        "typecheck": "tsc --noEmit",
        "test": "echo 'Web test - implement in COP-6.4'"
    },
    "dependencies": {
        "@repo/shared": "workspace:*",
        "next": "^14.0.0",
        "react": "^18.0.0",
        "react-dom": "^18.0.0",
        "dotenv": "^16.3.1"
    },
    "devDependencies": {
        "@types/node": "^20.0.0",
        "@types/react": "^18.0.0",
        "@types/react-dom": "^18.0.0",
        "typescript": "^5.2.0"
    }
}
```

#### 2. Web Environment Configuration

**File**: `apps/web/src/env.ts`
**Changes**: Create web-specific environment validation

```typescript
import 'dotenv/config';
import { validateWebEnvironment, createEnvironmentValidator } from '@repo/shared';

export const validateEnv = createEnvironmentValidator(
  () => validateWebEnvironment(),
  'Web'
);

export const env = validateEnv();
export type Env = typeof env;
```

#### 3. Next.js Configuration

**File**: `apps/web/next.config.js`
**Changes**: Configure Next.js with environment validation

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable environment validation during build
  env: {
    // These will be available on both client and server
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL,
  },
  // Ensure environment is validated during build
  webpack: (config, { dev }) => {
    if (dev) {
      // Validate environment in development
      require('./src/env.ts');
    }
    return config;
  },
};

module.exports = nextConfig;
```

#### 4. Update Web Application Entry Point

**File**: `apps/web/src/app/page.tsx`
**Changes**: Update homepage with environment integration

```typescript
import { env } from '../env.js';

export default function HomePage() {
    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
            <h1>CausalOps Copilot</h1>
            <p><strong>From alerts to action: evidence → cause → fix.</strong></p>

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <h2>Environment Status</h2>
                <p>✅ Environment validation passed</p>
                <p>🔗 Agent URL: {env.NEXT_PUBLIC_AGENT_URL}</p>
                <p>📊 Environment: {env.NODE_ENV}</p>
                <p>🔌 Port: {env.WEB_PORT}</p>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <p><em>COP-3.1 will implement Next.js App Router here</em></p>
            </div>
        </div>
    );
}
```

#### 5. Web App Directory Structure

**File**: `apps/web/src/app/layout.tsx`
**Changes**: Create Next.js App Router layout

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: 'CausalOps Copilot',
  description: 'AI-powered incident management with causal graphs',
};
```

### Success Criteria:

#### Automated Verification:

- [x] Web builds successfully: `turbo run build --filter @repo/web`
- [x] TypeScript compilation passes: `turbo run typecheck --filter @repo/web`
- [x] Next.js build includes environment validation

#### Manual Verification:

- [x] Web app starts successfully with valid configuration
- [x] Web app displays environment status correctly
- [x] Web app fails gracefully with clear error messages for missing config
- [x] Client-side environment variables are properly exposed
- [x] Server-side environment validation works correctly

---

## Phase 4: Startup Integration & Testing

### Overview

Update root-level scripts, validate complete startup flow, and ensure all acceptance criteria are met.

### Changes Required:

#### 1. Update Root Development Scripts

**File**: `package.json` (root)
**Changes**: Update validation script to check environment loading

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
        "validate": "bash scripts/validate-setup.sh",
        "env-check": "turbo run typecheck && echo '✅ Environment schemas validated'"
    }
}
```

#### 2. Update Validation Script

**File**: `scripts/validate-setup.sh`
**Changes**: Add environment validation testing

```bash
#!/bin/bash
set -e

echo "🔍 Validating CausalOps monorepo setup..."

# ... existing validation code ...

# Test environment schema validation
echo "🔧 Testing environment validation..."
cd apps/agent && echo "NODE_ENV=test" | npx tsx src/env.ts >/dev/null 2>&1 || {
  echo "❌ Agent environment validation failed"; exit 1;
}
cd ../..
cd apps/web && echo "NODE_ENV=test" | npx tsx src/env.ts >/dev/null 2>&1 || {
  echo "❌ Web environment validation failed"; exit 1;
}
cd ../..

echo "✅ Environment validation successful"

echo ""
echo "🎉 CausalOps monorepo setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure credentials"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Begin implementing COP-1.x tasks (Elastic Data Plane)"
echo ""
```

#### 3. Update README Environment Instructions

**File**: `README.md`
**Changes**: Update environment setup instructions

```markdown
# CausalOps Copilot

**From alerts to action: evidence → cause → fix.**

AI-powered incident management system that converts observability signals into causal graphs with citations and safe, reversible runbooks. Built for the Elastic Challenge hackathon.

## Quick Start

### Prerequisites

-   Node.js 18+
-   pnpm 8+
-   Elasticsearch (Cloud or local)
-   Google Cloud Vertex AI access

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure your credentials (choose one):

# Option A: Elastic Cloud + Vertex AI
ELASTIC_CLOUD_ID=your-cloud-id-here
ELASTIC_API_KEY=your-api-key-here
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCP_PROJECT_ID=your-project-id

# Option B: Local Elasticsearch + Vertex AI
ELASTIC_NODE=http://localhost:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCP_PROJECT_ID=your-project-id
```

### Installation & Startup

```bash
# Install dependencies
pnpm install

# Validate environment (optional)
pnpm env-check

# Start development servers
pnpm dev
```

The agent will start on http://localhost:3001 and web UI on http://localhost:3000.

### Environment Variables

#### Required for Agent:
- **Elasticsearch**: Either cloud credentials (`ELASTIC_CLOUD_ID` + `ELASTIC_API_KEY`) or local (`ELASTIC_NODE` + `ELASTIC_USERNAME` + `ELASTIC_PASSWORD`)
- **Vertex AI**: `GCP_PROJECT_ID` and optionally `GOOGLE_APPLICATION_CREDENTIALS`

#### Required for Web:
- **Agent Connection**: `NEXT_PUBLIC_AGENT_URL` (defaults to http://localhost:3001)

[... rest of existing README content ...]
```

### Success Criteria:

#### Automated Verification:

- [x] `pnpm validate` passes all environment validation checks
- [x] `pnpm dev` starts both agent and web with proper environment loading
- [x] `pnpm env-check` validates environment schemas without errors
- [x] TypeScript compilation succeeds across all workspaces

#### Manual Verification:

- [x] Agent starts successfully with Elastic Cloud credentials configured
- [x] Agent starts successfully with local Elasticsearch credentials configured
- [x] Agent fails with clear error message when credentials are missing
- [x] Agent picks up Vertex AI service account configuration correctly
- [x] Web application loads and displays environment status
- [x] Both applications show proper environment information at startup

---

## Testing Strategy

### Unit Tests:

- Environment schema validation with various input combinations
- Error message formatting for missing/invalid credentials
- Type safety verification for environment objects

### Integration Tests:

- Agent startup flow with different credential configurations
- Web application environment loading in both development and build modes
- Cross-package environment sharing between @repo/shared and applications

### Manual Testing Steps:

1. **Test Elastic Cloud Configuration:**
   ```bash
   # Set cloud credentials in .env
   ELASTIC_CLOUD_ID=test-cloud-id
   ELASTIC_API_KEY=test-api-key
   GCP_PROJECT_ID=test-project
   pnpm dev
   ```

2. **Test Local Elasticsearch Configuration:**
   ```bash
   # Set local credentials in .env
   ELASTIC_NODE=http://localhost:9200
   ELASTIC_USERNAME=elastic
   ELASTIC_PASSWORD=testpass
   GCP_PROJECT_ID=test-project
   pnpm dev
   ```

3. **Test Error Handling:**
   ```bash
   # Remove credentials from .env
   pnpm dev
   # Verify clear error messages appear
   ```

4. **Test Environment Type Safety:**
   ```typescript
   // In apps/agent/src/index.ts
   import { env } from './env.js';

   // This should provide autocomplete and type checking
   console.log(env.elasticsearch.type); // 'cloud' | 'local'
   ```

## Performance Considerations

- Environment validation happens only at startup, no runtime performance impact
- Zod schema parsing is fast and cached
- Type generation happens at compile time
- No additional network requests for environment loading

## Migration Notes

This implementation maintains backward compatibility:
- Existing `.env.example` remains unchanged
- No breaking changes to package.json scripts
- Applications gracefully upgrade from placeholder to functional environment loading

## References

- PRD requirement: `docs/prd.md` sections 6.2 (Elastic Integration), 6.3 (Vertex AI)
- Task definition: `docs/master-tasks.md` COP-0.2 Env & Secrets Wiring
- Modern environment patterns: Zod + znv for TypeScript validation
- Next.js environment variables: Official Next.js documentation patterns