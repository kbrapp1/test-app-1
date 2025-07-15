import Replicate from 'replicate';
import { BaseProvider, ProviderType, ProviderConfig } from '../registry/types';

export interface ReplicateConfig extends ProviderConfig {
  apiKey: string;
}

export interface ReplicatePrediction {
  id: string;
  status: string;
  output?: unknown;
  error?: string;
  logs?: string;
  metrics?: unknown;
}

export interface CreatePredictionRequest {
  model: string;
  input: Record<string, unknown>;
}

/**
 * Shared Replicate provider for all domains
 * Handles authentication, basic API operations, and health checking
 */
export class ReplicateProvider implements BaseProvider {
  readonly type = ProviderType.REPLICATE;
  private client: Replicate | null = null;
  private config: ReplicateConfig;

  constructor(config: ReplicateConfig) {
    this.config = config;
  }

  get isConnected(): boolean {
    return this.client !== null;
  }

  async connect(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Replicate API key is required');
    }

    this.client = new Replicate({
      auth: this.config.apiKey,
    });
  }

  async disconnect(): Promise<void> {
    this.client = null;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Simple health check - try to get account info
      await this.client.accounts.current();
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Create a prediction on Replicate
   */
  async createPrediction(request: CreatePredictionRequest): Promise<ReplicatePrediction> {
    if (!this.client) {
      throw new Error('Replicate client not connected. Call connect() first.');
    }

    const prediction = await this.client.predictions.create({
      model: request.model,
      input: request.input,
    });

    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error as string | undefined,
      logs: prediction.logs as string | undefined,
      metrics: prediction.metrics,
    };
  }

  /**
   * Get prediction status and results
   */
  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    if (!this.client) {
      throw new Error('Replicate client not connected. Call connect() first.');
    }

    const prediction = await this.client.predictions.get(predictionId);
    
    return {
      id: prediction.id,
      status: prediction.status,
      output: prediction.output,
      error: prediction.error as string | undefined,
      logs: prediction.logs as string | undefined,
      metrics: prediction.metrics,
    };
  }

  /**
   * Cancel a running prediction
   */
  async cancelPrediction(predictionId: string): Promise<void> {
    if (!this.client) {
      throw new Error('Replicate client not connected. Call connect() first.');
    }

    try {
      await this.client.predictions.cancel(predictionId);
    } catch (error) {
      // Ignore errors for predictions that can't be cancelled
      const errorMessage = (error as Error).message?.toLowerCase() || '';
      const isNotCancellable = errorMessage.includes('cannot cancel') || 
                              errorMessage.includes('already completed') ||
                              errorMessage.includes('not found');
      
      if (!isNotCancellable) {
        throw error;
      }
    }
  }

  /**
   * Run a model synchronously (alternative to predictions API)
   */
  async run(model: `${string}/${string}` | `${string}/${string}:${string}`, input: Record<string, unknown>): Promise<any> {
    if (!this.client) {
      throw new Error('Replicate client not connected. Call connect() first.');
    }

    const output = await this.client.run(model, { input });
    return output;
  }

  /**
   * List available models
   */
  async listModels(): Promise<any[]> {
    if (!this.client) {
      throw new Error('Replicate client not connected. Call connect() first.');
    }

    try {
      const modelsPage = await this.client.models.list();
      return modelsPage.results || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${(error as Error).message}`);
    }
  }
} 