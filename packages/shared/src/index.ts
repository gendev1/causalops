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

console.log('CausalOps Shared - Coming in COP-2.4');