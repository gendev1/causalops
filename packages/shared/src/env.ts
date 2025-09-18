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