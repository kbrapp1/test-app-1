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
  async generateSpeech(request: SpeechRequest): Promise<{ predictionId: string }> {
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
          await this.storeRunResult(fakePredictionId, output);
          
          return { predictionId: fakePredictionId };
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
      const result = this.mapPredictionToTtsResult(cachedResult);
      return result;
    }


    
    // Otherwise, get from predictions API
    const provider = this.getProvider();
    
    try {
      const prediction = await provider.getPrediction(predictionId);

      return this.mapPredictionToTtsResult(prediction);
    } catch (error) {
      console.error('TTS DEBUG: Error getting prediction from API:', error);
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
    // Convert ReplicatePrediction to ReplicatePredictionResponse format
    // Provide defaults for missing fields required by the interface
    const replicateResponse = {
      id: prediction.id,
      status: this.mapReplicateStatusToExpected(prediction.status),
      output: this.validateOutput(prediction.output),
      error: prediction.error || null,
      created_at: new Date().toISOString(), // Default to current time since not available
      started_at: null, // Not available in ReplicatePrediction
      completed_at: null, // Not available in ReplicatePrediction
      urls: undefined, // Not available in ReplicatePrediction
      metrics: this.validateMetrics(prediction.metrics),
      logs: prediction.logs || undefined,
      input: undefined, // Not available in ReplicatePrediction
    };
    
    // Use the SpeechResult static factory method for Replicate
    return SpeechResult.fromReplicate(replicateResponse);
  }

  /**
   * Map Replicate status to expected status type
   */
  private mapReplicateStatusToExpected(status: string): "starting" | "processing" | "succeeded" | "completed" | "failed" | "canceled" {
    switch (status.toLowerCase()) {
      case 'succeeded':
        return 'succeeded';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'canceled':
      case 'cancelled':
        return 'canceled';
      case 'starting':
        return 'starting';
      case 'processing':
        return 'processing';
      default:
        return 'processing'; // Default to processing for unknown statuses
    }
  }

  /**
   * Validate and type the output properly
   */
  private validateOutput(output: unknown): string | string[] | null | undefined {
    if (output === null || output === undefined) {
      return output;
    }
    
    if (typeof output === 'string') {
      return output;
    }
    
    if (Array.isArray(output) && output.every(item => typeof item === 'string')) {
      return output as string[];
    }
    
    // If output is not the expected type, return null
    return null;
  }

  /**
   * Validate and type the metrics properly
   */
  private validateMetrics(metrics: unknown): { readonly predict_time?: number; readonly total_time?: number } | undefined {
    if (!metrics || typeof metrics !== 'object') {
      return undefined;
    }
    
    const metricsObj = metrics as Record<string, unknown>;
    const result: { predict_time?: number; total_time?: number } = {};
    
    if (typeof metricsObj.predict_time === 'number') {
      result.predict_time = metricsObj.predict_time;
    }
    
    if (typeof metricsObj.total_time === 'number') {
      result.total_time = metricsObj.total_time;
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
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
  private async storeRunResult(predictionId: string, output: any): Promise<void> {
    
    let processedOutput = output;
    
    // Handle ReadableStream from run API - convert to blob URL
    // More robust detection for ReadableStream
    if (output && typeof output === 'object' && 
        (output.constructor?.name === 'ReadableStream' || 
         output instanceof ReadableStream ||
         (typeof output.getReader === 'function' && typeof output.locked === 'boolean'))) {
      try {

        // Convert ReadableStream to blob
        const response = new Response(output);
        const blob = await response.blob();
        // Convert to ArrayBuffer then to base64 data URL for browser compatibility
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const dataUrl = `data:audio/wav;base64,${base64}`;
        processedOutput = dataUrl;

      } catch (error) {
        console.error('TTS DEBUG: Failed to convert ReadableStream:', error);
        processedOutput = null;
      }
    }
    // Handle FileOutput object that might contain a ReadableStream
    else if (output && typeof output === 'object' && output.constructor?.name === 'FileOutput') {
      try {

        // FileOutput might have a stream property or be iterable
        if (typeof output.stream === 'function') {
          const stream = output.stream();

          const response = new Response(stream);
          const blob = await response.blob();
          // Convert to ArrayBuffer then to base64 data URL for browser compatibility
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:audio/wav;base64,${base64}`;
          processedOutput = dataUrl;

        } else if (output[Symbol.asyncIterator]) {

          // Handle async iterable
          const chunks = [];
          for await (const chunk of output) {
            chunks.push(chunk);
          }
          const blob = new Blob(chunks);
          // Convert to ArrayBuffer then to base64 data URL for browser compatibility
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:audio/wav;base64,${base64}`;
          processedOutput = dataUrl;

        } else {

          processedOutput = null;
        }
      } catch (error) {
        console.error('TTS DEBUG: Failed to convert FileOutput:', error);
        processedOutput = null;
      }
    }
    
    this.runResultsCache.set(predictionId, {
      status: 'succeeded', // Use 'succeeded' to match Replicate's actual status
      output: processedOutput,
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