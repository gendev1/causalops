import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateAgentEnvironment } from './env.js';
import { IndexCreationRequestSchema, type IndexCreationRequest } from './elastic-index.js';

/**
 * Elasticsearch Index Initialization Utility
 *
 * Creates the causalops-logs index with proper mapping
 * Supports both Elastic Cloud and local ES configurations
 */

export interface IndexInitOptions {
  indexName?: string;
  mappingPath?: string;
  recreate?: boolean;
}

export class ElasticIndexInitializer {
  private client: Client;
  private env: ReturnType<typeof validateAgentEnvironment>;

  constructor() {
    this.env = validateAgentEnvironment(process.env);
    this.client = this.createElasticClient();
  }

  private createElasticClient(): Client {
    if (this.env.elasticsearch.type === 'cloud') {
      // Elastic Cloud configuration
      return new Client({
        cloud: {
          id: this.env.elasticsearch.cloudId
        },
        auth: {
          apiKey: this.env.elasticsearch.apiKey
        }
      });
    } else {
      // Local Elasticsearch configuration
      return new Client({
        node: this.env.elasticsearch.node,
        auth: {
          username: this.env.elasticsearch.username,
          password: this.env.elasticsearch.password
        }
      });
    }
  }

  private loadIndexMapping(mappingPath: string): IndexCreationRequest['mapping'] {
    try {
      const mappingContent = readFileSync(mappingPath, 'utf-8');
      const mapping = JSON.parse(mappingContent);

      // Validate the mapping structure
      const validatedRequest = IndexCreationRequestSchema.parse({
        index: this.env.elasticsearch.index,
        mapping
      });

      return validatedRequest.mapping;
    } catch (error) {
      throw new Error(`Failed to load index mapping from ${mappingPath}: ${error}`);
    }
  }

  async checkIndexExists(indexName: string): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: indexName
      });
      return response;
    } catch (error) {
      console.error(`Error checking if index ${indexName} exists:`, error);
      return false;
    }
  }

  async deleteIndex(indexName: string): Promise<void> {
    try {
      await this.client.indices.delete({
        index: indexName
      });
      console.log(`Index ${indexName} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting index ${indexName}:`, error);
      throw error;
    }
  }

  async createIndex(indexName: string, mapping: IndexCreationRequest['mapping']): Promise<void> {
    try {
      const response = await this.client.indices.create({
        index: indexName,
        body: mapping
      });

      if (response.acknowledged) {
        console.log(`Index ${indexName} created successfully`);
      } else {
        throw new Error(`Index creation not acknowledged for ${indexName}`);
      }
    } catch (error) {
      console.error(`Error creating index ${indexName}:`, error);
      throw error;
    }
  }

  async testIndexWrite(indexName: string): Promise<void> {
    try {
      const testDocument = {
        '@timestamp': new Date().toISOString(),
        service: { name: 'test' },
        event: { action: 'config_change' },
        message: 'Test document for index validation',
        trace_id: 'test-init-001'
      };

      const response = await this.client.index({
        index: indexName,
        body: testDocument,
        refresh: true
      });

      if (response._shards?.successful && response._shards.successful > 0) {
        console.log(`Test write to ${indexName} successful`);

        // Clean up the test document
        await this.client.delete({
          index: indexName,
          id: response._id,
          refresh: true
        });
        console.log('Test document cleaned up');
      } else {
        throw new Error(`Test write to ${indexName} failed`);
      }
    } catch (error) {
      console.error(`Error testing index write to ${indexName}:`, error);
      throw error;
    }
  }

  async initializeIndex(options: IndexInitOptions = {}): Promise<void> {
    const indexName = options.indexName || this.env.elasticsearch.index;
    const mappingPath = options.mappingPath || join(__dirname, '../../../data/mappings/elastic_index_mapping.json');
    const recreate = options.recreate || false;

    console.log(`Initializing Elasticsearch index: ${indexName}`);
    console.log(`Using mapping from: ${mappingPath}`);

    try {
      // Check if index already exists
      const exists = await this.checkIndexExists(indexName);

      if (exists && recreate) {
        console.log(`Index ${indexName} exists and recreate=true, deleting...`);
        await this.deleteIndex(indexName);
      } else if (exists) {
        console.log(`Index ${indexName} already exists, skipping creation`);
        return;
      }

      // Load and validate mapping
      const mapping = this.loadIndexMapping(mappingPath);

      // Create the index
      await this.createIndex(indexName, mapping);

      // Test that writes work
      await this.testIndexWrite(indexName);

      console.log(`Index initialization completed successfully for ${indexName}`);
    } catch (error) {
      console.error(`Index initialization failed for ${indexName}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

// CLI utility function for use in ingestor scripts
export async function initializeElasticIndex(options: IndexInitOptions = {}): Promise<void> {
  const initializer = new ElasticIndexInitializer();

  try {
    await initializer.initializeIndex(options);
  } finally {
    await initializer.close();
  }
}

// Export for use in other modules
export default ElasticIndexInitializer;