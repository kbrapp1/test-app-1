import { Result, success, error } from '../../common/Result';
import { ProviderConfig } from './ProviderConfigManager';
import { ProviderStatusResponse } from './ProviderStatusCache';

/**
 * Replicate Provider Client
 * Single Responsibility: Handle Replicate-specific API interactions
 * Infrastructure Layer - Replicate API integration
 */
export class ReplicateProviderClient {
  
  /**
   * Fetch status from Replicate API
   */
  async fetchStatus(
    config: ProviderConfig,
    predictionId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    try {
      const url = `${config.baseUrl}/predictions/${predictionId}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return error(`Prediction not found: ${predictionId}`);
        }
        
        const errorData = await response.text();
        return error(`Replicate API error ${response.status}: ${errorData}`);
      }

      const replicateData = await response.json();
      
      // Map Replicate response to standardized format
      const standardResponse: ProviderStatusResponse = {
        status: this.mapReplicateStatus(replicateData.status),
        imageUrl: this.extractImageUrl(replicateData.output),
        errorMessage: replicateData.error?.message || replicateData.error,
        progress: this.calculateProgress(replicateData.status),
        metadata: {
          original_status: replicateData.status,
          prediction_id: predictionId,
          created_at: replicateData.created_at,
          urls: replicateData.urls,
        }
      };

      return success(standardResponse);

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return error('Request timeout');
      }
      
      return error(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Map Replicate status to standardized status
   */
  private mapReplicateStatus(replicateStatus: string): ProviderStatusResponse['status'] {
    switch (replicateStatus) {
      case 'starting':
      case 'pending':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending'; // Default to pending for unknown status
    }
  }

  /**
   * Extract image URL from Replicate output
   */
  private extractImageUrl(output: any): string | undefined {
    if (!output) return undefined;
    
    // Handle different output formats from Replicate
    if (typeof output === 'string') {
      return output;
    }
    
    if (Array.isArray(output) && output.length > 0) {
      return output[0];
    }
    
    if (output.image_url) {
      return output.image_url;
    }
    
    return undefined;
  }

  /**
   * Calculate progress percentage based on status
   */
  private calculateProgress(status: string): number | undefined {
    switch (status) {
      case 'starting':
      case 'pending':
        return 0;
      case 'processing':
        return 50; // Approximate progress for processing
      case 'succeeded':
        return 100;
      case 'failed':
      case 'canceled':
        return 0;
      default:
        return undefined;
    }
  }

  /**
   * Add delay utility for retry logic
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 