export type DomainStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface PredictionStatus {
  id: string;
  status: DomainStatus;
  output?: string | string[];
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
  };
}

export class StatusMapper {
  mapReplicateStatus(replicateStatus: string): DomainStatus {
    switch (replicateStatus) {
      case 'starting':
        return 'starting';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'succeeded';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'canceled';
      default:
        return 'processing'; // Default to processing for unknown statuses
    }
  }

  mapToPredictionStatus(replicatePrediction: {
    id: string;
    status: string;
    output?: unknown;
    error?: string;
    logs?: string;
    metrics?: unknown;
  }): PredictionStatus {
    return {
      id: replicatePrediction.id,
      status: this.mapReplicateStatus(replicatePrediction.status),
      output: replicatePrediction.output as string | string[],
      error: replicatePrediction.error,
      logs: replicatePrediction.logs,
      metrics: replicatePrediction.metrics as { predict_time?: number } | undefined,
    };
  }

  getImageUrl(predictionStatus: PredictionStatus): string | null {
    if (predictionStatus.status === 'succeeded' && predictionStatus.output) {
      // Handle both string and array outputs from different Replicate models
      if (typeof predictionStatus.output === 'string') {
        // Single string output (FLUX model returns this format)
        return predictionStatus.output;
      } else if (Array.isArray(predictionStatus.output) && predictionStatus.output.length > 0) {
        // Array output - take first element (other models might return this)
        return predictionStatus.output[0];
      }
    }
    
    return null;
  }
} 