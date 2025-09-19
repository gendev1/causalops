// COP-2.4 will implement schemas and utilities here
export const CAUSAL_OPS_VERSION = '0.1.0';
export const DEFAULT_TIMEOUT = 10000;

// Environment validation exports
export {
  validateAgentEnvironment,
  validateWebEnvironment,
  type AgentEnvironment,
  type WebEnvironment,
} from './env.js';

export {
  createEnvironmentValidator,
  EnvironmentValidationError,
} from './startup.js';

// Elasticsearch schemas and types
export {
  EventActionSchema,
  LabelsSchema,
  MetricsSchema,
  ServiceSchema,
  EventSchema,
  LogDocumentSchema,
  BulkIndexRequestSchema,
  IndexCreationRequestSchema,
  sampleLogDocument,
  type EventAction,
  type Labels,
  type Metrics,
  type Service,
  type Event,
  type LogDocument,
  type BulkIndexRequest,
  type IndexCreationRequest,
} from './elastic-index.js';

// Elasticsearch client and utilities
export {
  ElasticIndexInitializer,
  initializeElasticIndex,
  type IndexInitOptions,
} from './elastic-client.js';

console.log('CausalOps Shared - Ready for Elasticsearch integration');