export type ProviderId = 'replicate' | 'openai' | 'google' | 'anthropic' | 'stability';

export type ModelId = 
  // Replicate models
  | 'flux-kontext-max' 
  | 'flux-schnell' 
  | 'flux-dev' 
  | 'flux-pro'
  // OpenAI models
  | 'dall-e-3' 
  | 'dall-e-2'
  // Google models
  | 'imagen-3' 
  | 'imagen-2'
  // Stability models
  | 'stable-diffusion-xl'
  | 'stable-diffusion-3';

export interface ModelCapabilities {
  maxPromptLength: number;
  supportedAspectRatios: string[];
  defaultSettings: {
    aspectRatio: string;
    outputFormat: string;
    safetyTolerance?: number;
  };
  costPerGeneration: number; // in cents
  estimatedTimeSeconds: number;
  supportsImageEditing: boolean;
  supportsTextToImage: boolean;
  supportsCustomDimensions: boolean;
  supportsStyleControls: boolean;
  supportedOutputFormats: string[];
  maxSafetyTolerance?: number;
  minSafetyTolerance?: number;
}

export interface ProviderModel {
  id: ModelId;
  name: string;
  description: string;
  capabilities: ModelCapabilities;
  isDefault?: boolean;
  isBeta?: boolean;
}

export interface Provider {
  id: ProviderId;
  name: string;
  description: string;
  models: ProviderModel[];
  requiresApiKey: boolean;
  documentationUrl?: string;
  pricingUrl?: string;
}

export class ProviderValueObject {
  constructor(
    public readonly id: ProviderId,
    public readonly name: string,
    public readonly description: string,
    public readonly models: ProviderModel[],
    public readonly requiresApiKey: boolean,
    public readonly documentationUrl?: string,
    public readonly pricingUrl?: string
  ) {}

  getDefaultModel(): ProviderModel {
    return this.models.find(model => model.isDefault) || this.models[0];
  }

  getModel(modelId: ModelId): ProviderModel | undefined {
    return this.models.find(model => model.id === modelId);
  }

  supportsImageEditing(): boolean {
    return this.models.some(model => model.capabilities.supportsImageEditing);
  }

  getCheapestModel(): ProviderModel {
    return this.models.reduce((cheapest, current) => 
      current.capabilities.costPerGeneration < cheapest.capabilities.costPerGeneration 
        ? current 
        : cheapest
    );
  }

  getFastestModel(): ProviderModel {
    return this.models.reduce((fastest, current) => 
      current.capabilities.estimatedTimeSeconds < fastest.capabilities.estimatedTimeSeconds 
        ? current 
        : fastest
    );
  }
} 