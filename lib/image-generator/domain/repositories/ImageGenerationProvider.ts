import { ProviderId, ModelId, ProviderModel } from '../value-objects/Provider';

export interface GenerationRequest {
  prompt: string;
  providerId: ProviderId;
  modelId: ModelId;
  baseImageUrl?: string;
  secondImageUrl?: string; // NEW: For dual-image models
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
  
  getSupportedModels(): Promise<ProviderModel[]>;
  getModel(modelId: ModelId): Promise<ProviderModel | undefined>;
  validateRequest(request: GenerationRequest): Promise<{ isValid: boolean; errors: string[] }>;
  estimateCost(request: GenerationRequest): Promise<number>;
} 