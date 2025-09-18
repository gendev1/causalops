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