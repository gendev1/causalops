# Elasticsearch Index Mapping & ECS-ish Fields Implementation Plan

## Overview

Implementing the foundational data layer for CausalOps Copilot by creating the Elasticsearch index mapping with ECS-like field structure and index initialization utilities. This establishes the core data model for incident log storage and enables subsequent EQL pattern matching and causal analysis features.

## Current State Analysis

The CausalOps monorepo has comprehensive environment validation and dual Elasticsearch configuration support (cloud/local) already implemented in COP-0.2. However, the actual Elasticsearch integration is not yet implemented:

### Key Discoveries:

- **Environment schemas complete**: `packages/shared/src/env.ts:9-63` provides validated ES configuration
- **Package structure ready**: `packages/eql/` exists with placeholder constants for EQL patterns
- **Build system established**: Turborepo with pnpm workspaces configured
- **TypeScript patterns**: Strict typing with Zod validation throughout
- **Missing implementation**: No actual `@elastic/elasticsearch` client or index mapping

### Current Constraints:

- Must support both Elastic Cloud (ID/API key) and local ES (node/username/password) configurations
- Default index name: `causalops-logs` (configurable via `ELASTIC_INDEX`)
- Follow existing TypeScript/Zod validation patterns

## Desired End State

After completing COP-1.1, the system will have:

1. **Elasticsearch Index**: `causalops-logs` created with ECS-like mapping supporting all required fields
2. **Index Initialization Utility**: Reusable class for creating/managing the index
3. **TypeScript Schemas**: Type-safe validation for log documents and index operations
4. **Write Capability**: Verified ability to write documents to the index

### Verification:
- Index exists in Elasticsearch with correct mapping
- Test documents can be written successfully
- TypeScript types provide compile-time safety
- CLI utility can recreate index on demand

## What We're NOT Doing

- EQL pattern implementation (COP-1.3)
- Bulk data seeding (COP-1.2)
- Elasticsearch client wrapper for queries (COP-2.2)
- Kibana deep-link building (COP-1.4)
- LLM schema validation (COP-2.4)

## Implementation Approach

1. **Schema-First Design**: Define TypeScript schemas that match Elasticsearch mapping
2. **Incremental Implementation**: Start with core mapping, add utility classes
3. **Environment Integration**: Leverage existing environment validation patterns
4. **Testing Strategy**: Verify with actual Elasticsearch writes

## Phase 1: Core Index Mapping and Schema Definition

### Overview

Create the fundamental Elasticsearch mapping and TypeScript schemas that define the data model for log documents.

### Changes Required:

#### 1. Elasticsearch Index Mapping

**File**: `data/mappings/elastic_index_mapping.json`
**Status**: ✅ Created
**Changes**: Complete ECS-like mapping with proper field types and analysis settings

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "message_analyzer": {
          "type": "standard",
          "stopwords": "_none_"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date", "format": "strict_date_optional_time||epoch_millis" },
      "service": { "properties": { "name": { "type": "keyword", "ignore_above": 256 } } },
      "event": { "properties": { "action": { "type": "keyword", "ignore_above": 256 } } },
      "message": { "type": "text", "analyzer": "message_analyzer" },
      "trace_id": { "type": "keyword", "ignore_above": 256 },
      "labels": { "type": "object", "dynamic": true },
      "metrics": { "type": "object", "dynamic": true }
    }
  }
}
```

#### 2. TypeScript Schema Definitions

**File**: `packages/shared/src/elastic-index.ts`
**Changes**: Add comprehensive Zod schemas for type safety

```typescript
// Core schemas for log documents
export const EventActionSchema = z.enum(['config_change', 'db_pool_low', 'latency_spike']);
export const LogDocumentSchema = z.object({
  '@timestamp': z.string().datetime(),
  service: z.object({ name: z.string().max(256) }),
  event: z.object({ action: EventActionSchema }),
  message: z.string().max(1024),
  trace_id: z.string().max(256).optional(),
  labels: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  metrics: z.record(z.string(), z.union([z.number(), z.string()])).optional()
});
```

### Success Criteria:

#### Automated Verification:

- [x] TypeScript compilation passes: `turbo build`
- [ ] Zod schema validation works: `pnpm test` (in shared package)
- [x] JSON mapping file validates against Elasticsearch standards
- [x] Package exports are accessible from other workspace packages

#### Manual Verification:

- [x] Mapping JSON structure matches PRD field specifications exactly
- [x] TypeScript IntelliSense provides correct autocompletion
- [ ] Schema validation catches invalid log documents during testing

---

## Phase 2: Index Initialization Utility

### Overview

Create a robust utility class for managing Elasticsearch index lifecycle with proper error handling and environment integration.

### Changes Required:

#### 1. Elasticsearch Client Integration

**File**: `packages/shared/src/elastic-client.ts`
**Changes**: Add Elasticsearch client factory using existing environment validation

```typescript
export class ElasticIndexInitializer {
  private client: Client;
  private env: ReturnType<typeof validateAgentEnvironment>;

  constructor() {
    this.env = validateAgentEnvironment(process.env);
    this.client = this.createElasticClient();
  }

  private createElasticClient(): Client {
    if ('ELASTIC_CLOUD_ID' in this.env) {
      return new Client({
        cloud: { id: this.env.ELASTIC_CLOUD_ID },
        auth: { apiKey: this.env.ELASTIC_API_KEY }
      });
    } else {
      return new Client({
        node: this.env.ELASTIC_NODE,
        auth: { username: this.env.ELASTIC_USERNAME, password: this.env.ELASTIC_PASSWORD }
      });
    }
  }
}
```

#### 2. Index Management Operations

**File**: `packages/shared/src/elastic-client.ts` (continued)
**Changes**: Add methods for index creation, deletion, and testing

```typescript
async checkIndexExists(indexName: string): Promise<boolean>
async deleteIndex(indexName: string): Promise<void>
async createIndex(indexName: string, mapping: IndexCreationRequest['mapping']): Promise<void>
async testIndexWrite(indexName: string): Promise<void>
async initializeIndex(options: IndexInitOptions = {}): Promise<void>
```

#### 3. CLI Integration

**File**: `apps/ingestor/src/index-init.ts`
**Changes**: Create CLI command for index initialization

```typescript
import { initializeElasticIndex } from '@repo/shared/elastic-client';

export async function main() {
  const options = parseCliArgs();
  await initializeElasticIndex(options);
}
```

#### 4. Package Dependencies

**File**: `packages/shared/package.json`
**Changes**: Add Elasticsearch client dependency

```json
{
  "dependencies": {
    "@elastic/elasticsearch": "^8.10.0"
  }
}
```

### Success Criteria:

#### Automated Verification:

- [x] Shared package builds successfully: `turbo build --filter=@repo/shared`
- [x] TypeScript types are correctly exported: `turbo typecheck`
- [x] Ingestor CLI builds without errors: `turbo build --filter=@repo/ingestor`
- [x] All workspace dependencies resolve correctly

#### Manual Verification:

- [ ] Index creation works with both cloud and local ES configurations
- [ ] CLI command `pnpm index-init` successfully creates index
- [ ] Error handling provides clear messages for connection failures
- [ ] Test document write/delete cycle completes successfully

---

## Phase 3: Integration and Validation

### Overview

Integrate the index initialization with the ingestor CLI and validate the complete workflow.

### Changes Required:

#### 1. Ingestor CLI Commands

**File**: `apps/ingestor/package.json`
**Changes**: Update CLI commands to use new utilities

```json
{
  "bin": {
    "seed": "./dist/seed.js",
    "index-init": "./dist/index-init.js"
  }
}
```

#### 2. Root Package Scripts

**File**: `package.json`
**Changes**: Add convenience scripts for index management

```json
{
  "scripts": {
    "index:init": "turbo run index-init --filter=@repo/ingestor",
    "index:recreate": "turbo run index-init --filter=@repo/ingestor -- --recreate"
  }
}
```

#### 3. Documentation Updates

**File**: `README.md`
**Changes**: Add setup instructions for index initialization

```markdown
## Setup

1. Configure environment variables (see .env.example)
2. Initialize Elasticsearch index: `pnpm index:init`
3. Verify index creation in Kibana or ES dashboard
```

### Success Criteria:

#### Automated Verification:

- [x] Root build completes successfully: `turbo build`
- [ ] CLI commands are executable: `which index-init`
- [x] Package linking works correctly in monorepo: `pnpm list --depth=0`
- [x] Environment validation passes: `pnpm env-check` (if implemented)

#### Manual Verification:

- [ ] Index initialization runs successfully end-to-end
- [ ] Created index appears in Elasticsearch cluster
- [ ] Index mapping matches PRD specifications when inspected
- [x] CLI help text and error messages are clear and actionable

---

## Testing Strategy

### Unit Tests:

- **Schema Validation**: Test Zod schemas with valid/invalid log documents
- **Client Factory**: Test Elasticsearch client creation with both config types
- **Index Operations**: Mock Elasticsearch responses for create/delete/exists operations
- **Error Handling**: Test graceful failures for network/auth errors

### Integration Tests:

- **End-to-End Index Creation**: Full workflow with real Elasticsearch instance
- **Dual Configuration**: Test both cloud and local ES configurations
- **Index Recreation**: Test delete and recreate workflow
- **Document Write**: Verify successful document indexing after creation

### Manual Testing Steps:

1. **Configure Local ES**: Set up local Elasticsearch and test index creation
2. **Configure Cloud ES**: Test with Elastic Cloud credentials
3. **CLI Workflow**: Run `pnpm index:init` and verify index in Kibana
4. **Error Scenarios**: Test with invalid credentials, network failures
5. **Cleanup**: Test index deletion and recreation

## Performance Considerations

- **Single Shard**: Use 1 shard for development/demo to minimize overhead
- **Minimal Replicas**: Default to 1 replica for durability without excessive storage
- **Custom Analyzer**: Standard analyzer without stopwords for better incident search
- **Field Limits**: Reasonable size limits on keyword fields to prevent bloat

## Migration Notes

- **Index Recreation**: Utility supports `--recreate` flag for development iterations
- **Mapping Updates**: Future mapping changes will require reindexing strategy
- **Data Preservation**: Default behavior preserves existing indices

## References

- PRD requirement: `docs/prd.md` section 6.2 (Elastic Integration)
- Environment schemas: `packages/shared/src/env.ts:9-63`
- ECS field mapping: `docs/prd.md` section 10 (Data Model)
- Master task: `docs/master-tasks.md` COP-1.1