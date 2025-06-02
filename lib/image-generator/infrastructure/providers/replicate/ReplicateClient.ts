import Replicate from 'replicate';

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

export class ReplicateClient {
  private replicate: Replicate;
  private readonly maxRetries = 3;

  constructor(apiToken?: string) {
    if (!apiToken && !process.env.REPLICATE_API_TOKEN) {
      throw new Error('Replicate API token is required. Set REPLICATE_API_TOKEN environment variable or pass token to constructor.');
    }

    this.replicate = new Replicate({
      auth: apiToken || process.env.REPLICATE_API_TOKEN!,
    });
  }

  async createPrediction(request: CreatePredictionRequest): Promise<ReplicatePrediction> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const prediction = await this.replicate.predictions.create({
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
      } catch (error) {
        lastError = error as Error;
        
        if (this.isValidationError(error)) {
          throw error;
        }

        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Failed to create prediction after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    try {
      const prediction = await this.replicate.predictions.get(predictionId);
      
      return {
        id: prediction.id,
        status: prediction.status,
        output: prediction.output,
        error: prediction.error as string | undefined,
        logs: prediction.logs as string | undefined,
        metrics: prediction.metrics,
      };
    } catch (error) {
      throw new Error(`Failed to get prediction: ${(error as Error).message}`);
    }
  }

  async cancelPrediction(predictionId: string): Promise<void> {
    try {
      await this.replicate.predictions.cancel(predictionId);
    } catch (error) {
      if (!this.isPredictionNotCancellableError(error)) {
        throw new Error(`Failed to cancel prediction: ${(error as Error).message}`);
      }
    }
  }

  private isValidationError(error: unknown): boolean {
    const errorMessage = (error as Error).message?.toLowerCase() || '';
    return errorMessage.includes('validation') || 
           errorMessage.includes('invalid') || 
           errorMessage.includes('bad request');
  }

  private isPredictionNotCancellableError(error: unknown): boolean {
    const errorMessage = (error as Error).message?.toLowerCase() || '';
    return errorMessage.includes('cannot cancel') || 
           errorMessage.includes('already completed') ||
           errorMessage.includes('not found');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 