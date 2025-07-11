import { ProviderFactory } from '@/lib/infrastructure/providers/registry/ProviderFactory';
import { ProviderType } from '@/lib/infrastructure/providers/registry/types';
import { ReplicateProvider, ReplicatePrediction } from '@/lib/infrastructure/providers/replicate/ReplicateProvider';
import { SpeechRequest, SpeechResult } from '../../../domain';

/**
 * TTS-specific adapter for Replicate provider
 * Handles TTS domain logic, retry patterns, and error handling
 */
export class TtsReplicateAdapter {
  private readonly maxRetries = 3;
  private readonly retryDelay = 2000;
  private readonly defaultModel = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';
  private readonly provider: ReplicateProvider;
  private readonly runResultsCache = new Map<string, any>();

  constructor(provider: ReplicateProvider) {
    this.provider = provider;
  }

  /**
   * Get the Replicate provider instance
   */
  private getProvider(): ReplicateProvider {
    return this.provider;
  }

  /**
   * Generate speech from text with TTS-specific logic
   */
  async generateSpeech(request: SpeechRequest): Promise<{ predictionId: string; outputUrl?: string }> {
    const provider = this.getProvider();
    
    // Validate request for Replicate
    const validationError = request.validateForProvider('replicate');
    if (validationError) {
      throw new Error(validationError);
    }
    
    const replicateRequest = request.forProvider('replicate');
    const model = replicateRequest.model || this.defaultModel;
    const input = {
      text: replicateRequest.text,
      voice: replicateRequest.voiceId || 'af_nicole',
      speed: replicateRequest.replicateSettings.speed || 1,
    };

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Use run API for kokoro-82m model (synchronous)
        if (model.includes('kokoro-82m')) {
          const output = await provider.run(model as `${string}/${string}:${string}`, input);
          
          // For synchronous run, we generate a fake prediction ID and store the result
          const fakePredictionId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Store the result temporarily (in a real implementation, you might use a cache)
          this.storeRunResult(fakePredictionId, output);
          
          // Return both prediction ID and output URL for immediate completion
          return { 
            predictionId: fakePredictionId,
            outputUrl: typeof output === 'string' ? output : undefined
          };
        } else {
          // Use predictions API for other models
          const prediction = await provider.createPrediction({
            model,
            input,
          });

          return { predictionId: prediction.id };
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry validation errors
        if (this.isValidationError(error)) {
          throw new Error(`TTS validation error: ${lastError.message}`);
        }

        if (attempt < this.maxRetries) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    throw new Error(`TTS generation failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Get speech generation result with TTS-specific status mapping
   */
  async getSpeechResult(predictionId: string): Promise<SpeechResult> {
    // Check if this is a cached run result first
    if (this.runResultsCache.has(predictionId)) {
      const cachedResult = this.runResultsCache.get(predictionId);
      return this.mapPredictionToTtsResult(cachedResult);
    }

    // Otherwise, get from predictions API
    const provider = this.getProvider();
    
    try {
      const prediction = await provider.getPrediction(predictionId);
      return this.mapPredictionToTtsResult(prediction);
    } catch (error) {
      throw new Error(`Failed to get TTS result: ${(error as Error).message}`);
    }
  }

  /**
   * Cancel speech generation
   */
  async cancelSpeechGeneration(predictionId: string): Promise<void> {
    // If it's a run result, just remove it from cache
    if (this.runResultsCache.has(predictionId)) {
      this.runResultsCache.delete(predictionId);
      return;
    }

    // Otherwise, cancel the prediction
    const provider = this.getProvider();
    
    try {
      await provider.cancelPrediction(predictionId);
    } catch (error) {
      throw new Error(`Failed to cancel TTS generation: ${(error as Error).message}`);
    }
  }

  /**
   * Map Replicate prediction to TTS-specific result
   */
  private mapPredictionToTtsResult(prediction: ReplicatePrediction): SpeechResult {
    // Use the SpeechResult static factory method for Replicate
    return SpeechResult.fromReplicate({
      status: prediction.status,
      output: prediction.output,
      error: prediction.error,
      id: prediction.id,
    });
  }

  /**
   * Map Replicate status to TTS-specific status
   */
  private mapStatusToTtsStatus(status: string): 'completed' | 'processing' | 'failed' {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
        return 'completed';
      case 'failed':
      case 'canceled':
      case 'cancelled':
        return 'failed';
      default:
        return 'processing';
    }
  }

  /**
   * Extract duration from prediction metrics
   */
  private extractDuration(prediction: ReplicatePrediction): number | undefined {
    if (prediction.metrics && typeof prediction.metrics === 'object') {
      const metrics = prediction.metrics as Record<string, unknown>;
      return metrics.duration as number | undefined;
    }
    return undefined;
  }

  /**
   * Check if error is a validation error (should not retry)
   */
  private isValidationError(error: unknown): boolean {
    const errorMessage = (error as Error).message?.toLowerCase() || '';
    return errorMessage.includes('validation') || 
           errorMessage.includes('invalid') || 
           errorMessage.includes('bad request') ||
           errorMessage.includes('text too long');
  }

  /**
   * Store run result for later retrieval (used for synchronous run API)
   */
  private storeRunResult(predictionId: string, output: any): void {
    this.runResultsCache.set(predictionId, {
      status: 'completed',
      output,
      id: predictionId,
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 