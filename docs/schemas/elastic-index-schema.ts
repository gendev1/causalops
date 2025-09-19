import { z } from 'zod';

/**
 * Schema for CausalOps log documents in Elasticsearch
 * Corresponds to the causalops-logs index mapping
 */

// Core event actions that trigger causal analysis
export const EventActionSchema = z.enum([
  'config_change',
  'db_pool_low',
  'latency_spike'
]);

// Dynamic labels object for additional metadata
export const LabelsSchema = z.record(z.string(), z.union([
  z.string(),
  z.number(),
  z.boolean()
]));

// Dynamic metrics object for measurements
export const MetricsSchema = z.record(z.string(), z.union([
  z.number(),
  z.string()
]));

// Service information
export const ServiceSchema = z.object({
  name: z.string().max(256)
});

// Event information
export const EventSchema = z.object({
  action: EventActionSchema
});

// Complete log document schema
export const LogDocumentSchema = z.object({
  '@timestamp': z.string().datetime(),
  service: ServiceSchema,
  event: EventSchema,
  message: z.string().max(1024),
  trace_id: z.string().max(256).optional(),
  labels: LabelsSchema.optional(),
  metrics: MetricsSchema.optional()
});

// Bulk indexing request schema
export const BulkIndexRequestSchema = z.object({
  index: z.string().default('causalops-logs'),
  documents: z.array(LogDocumentSchema).min(1)
});

// Index creation request schema
export const IndexCreationRequestSchema = z.object({
  index: z.string().default('causalops-logs'),
  mapping: z.object({
    settings: z.object({
      number_of_shards: z.number().int().positive().default(1),
      number_of_replicas: z.number().int().min(0).default(1)
    }),
    mappings: z.object({
      properties: z.record(z.string(), z.any())
    })
  })
});

// Type exports for use throughout the application
export type EventAction = z.infer<typeof EventActionSchema>;
export type Labels = z.infer<typeof LabelsSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type Service = z.infer<typeof ServiceSchema>;
export type Event = z.infer<typeof EventSchema>;
export type LogDocument = z.infer<typeof LogDocumentSchema>;
export type BulkIndexRequest = z.infer<typeof BulkIndexRequestSchema>;
export type IndexCreationRequest = z.infer<typeof IndexCreationRequestSchema>;

// Sample log document for testing and development
export const sampleLogDocument: LogDocument = {
  '@timestamp': '2025-09-18T10:00:00.000Z',
  service: {
    name: 'api'
  },
  event: {
    action: 'latency_spike'
  },
  message: 'Latency spike detected: p95=980ms',
  trace_id: 't-1001',
  labels: {
    db_pool_avail: 3,
    environment: 'staging'
  },
  metrics: {
    p95_ms: 980,
    request_count: 1500
  }
};