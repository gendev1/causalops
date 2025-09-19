#!/usr/bin/env node

import { initializeElasticIndex, type IndexInitOptions, validateAgentEnvironment } from '@repo/shared';
import { createEnvironmentValidator } from '@repo/shared';

interface CliArgs {
  recreate?: boolean;
  index?: string;
  mapping?: string;
  help?: boolean;
}

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--recreate':
        parsed.recreate = true;
        break;
      case '--index':
        parsed.index = args[++i];
        break;
      case '--mapping':
        parsed.mapping = args[++i];
        break;
      case '--help':
      case '-h':
        parsed.help = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`
CausalOps Index Initializer

Usage: index-init [options]

Options:
  --recreate          Delete and recreate the index if it exists
  --index <name>      Specify the index name (defaults to ELASTIC_INDEX env var)
  --mapping <path>    Path to the mapping JSON file (defaults to data/mappings/elastic_index_mapping.json)
  --help, -h          Show this help message

Environment Variables:
  Either provide Elastic Cloud credentials:
    ELASTIC_CLOUD_ID      Your Elastic Cloud deployment ID
    ELASTIC_API_KEY       Your Elastic Cloud API key
    ELASTIC_INDEX         Index name (default: causalops-logs)

  Or provide local Elasticsearch credentials:
    ELASTIC_NODE          Elasticsearch node URL (default: http://localhost:9200)
    ELASTIC_USERNAME      Elasticsearch username (default: elastic)
    ELASTIC_PASSWORD      Elasticsearch password
    ELASTIC_INDEX         Index name (default: causalops-logs)

Examples:
  # Initialize index with default settings
  index-init

  # Recreate index if it exists
  index-init --recreate

  # Use custom index name
  index-init --index my-custom-logs

  # Use custom mapping file
  index-init --mapping ./custom-mapping.json
`);
}

async function main() {
  try {
    const args = parseCliArgs();

    if (args.help) {
      printHelp();
      process.exit(0);
    }

    // Validate environment
    const validateEnv = createEnvironmentValidator(() => validateAgentEnvironment(), 'Ingestor');
    validateEnv();

    console.log('🔧 Initializing Elasticsearch index...\n');

    const options: IndexInitOptions = {
      recreate: args.recreate,
      indexName: args.index,
      mappingPath: args.mapping
    };

    await initializeElasticIndex(options);

    console.log('✅ Index initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Index initialization failed:');

    if (error instanceof Error) {
      console.error(`   ${error.message}`);

      // Provide helpful hints for common errors
      if (error.message.includes('ECONNREFUSED')) {
        console.error('\n💡 Hint: Make sure Elasticsearch is running and accessible');
      } else if (error.message.includes('authentication')) {
        console.error('\n💡 Hint: Check your Elasticsearch credentials');
      } else if (error.message.includes('environment')) {
        console.error('\n💡 Hint: Check your environment variables (.env file)');
      }
    } else {
      console.error(`   ${error}`);
    }

    process.exit(1);
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}

export { main };
export default main;