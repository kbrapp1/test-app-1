import { ProviderId, ModelId, ProviderModel } from '../value-objects/Provider';

export interface GenerationRequest {
  prompt: string;
  providerId: ProviderId;
  modelId: ModelId;
  baseImageUrl?: string;
  aspectRatio?: string;
  outputFormat?: string;
  outputQuality?: number;
  safetyTolerance?: number;
  seed?: number;
  styles?: string[];
}

export interface GenerationResult {
  id: string;
  status: 'pending' | 'starting' | 'processing' | 'completed' | 'failed' | 'cancelled';
  imageUrl?: string;
  errorMessage?: string;
  estimatedTimeSeconds?: number;
}

export interface ImageGenerationProvider {
  readonly providerId: ProviderId;
  
  generateImage(request: GenerationRequest): Promise<GenerationResult>;
  checkStatus(generationId: string): Promise<GenerationResult>;
  cancelGeneration(generationId: string): Promise<void>;
  
  getSupportedModels(): ProviderModel[];
  getModel(modelId: ModelId): ProviderModel | undefined;
  validateRequest(request: GenerationRequest): { isValid: boolean; errors: string[] };
  estimateCost(request: GenerationRequest): number;
} 