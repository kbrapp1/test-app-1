import { ProviderRegistryService } from '../../domain/services/ProviderRegistryService';
import { ImageGenerationProvider, GenerationRequest, GenerationResult } from '../../domain/repositories/ImageGenerationProvider';
import { ProviderId, ModelId } from '../../domain/value-objects/Provider';

export interface ProviderConfiguration {
  providerId: ProviderId;
  modelId: ModelId;
  apiToken?: string;
}

export class ProviderService {
  constructor(private readonly providerRegistry: ProviderRegistryService) {}

  async generateImage(
    request: Omit<GenerationRequest, 'providerId' | 'modelId'>,
    config: ProviderConfiguration
  ): Promise<GenerationResult> {
    const provider = this.providerRegistry.getProvider(config.providerId);
    if (!provider) {
      throw new Error(`Provider ${config.providerId} not found`);
    }

    const fullRequest: GenerationRequest = {
      ...request,
      providerId: config.providerId,
      modelId: config.modelId,
    };

    return provider.generateImage(fullRequest);
  }

  async checkGenerationStatus(
    generationId: string,
    providerId: ProviderId
  ): Promise<GenerationResult> {
    const provider = this.providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return provider.checkStatus(generationId);
  }

  async cancelGeneration(
    generationId: string,
    providerId: ProviderId
  ): Promise<void> {
    const provider = this.providerRegistry.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return provider.cancelGeneration(generationId);
  }

  getAvailableProviders(): ImageGenerationProvider[] {
    return this.providerRegistry.getAllProviders();
  }

  getModelsForProvider(providerId: ProviderId): ModelId[] {
    return this.providerRegistry.getAvailableModels(providerId);
  }

  validateRequest(
    request: Omit<GenerationRequest, 'providerId' | 'modelId'>,
    config: ProviderConfiguration
  ): { isValid: boolean; errors: string[] } {
    const provider = this.providerRegistry.getProvider(config.providerId);
    if (!provider) {
      return {
        isValid: false,
        errors: [`Provider ${config.providerId} not found`],
      };
    }

    const fullRequest: GenerationRequest = {
      ...request,
      providerId: config.providerId,
      modelId: config.modelId,
    };

    return provider.validateRequest(fullRequest);
  }

  estimateCost(
    request: Omit<GenerationRequest, 'providerId' | 'modelId'>,
    config: ProviderConfiguration
  ): number {
    const provider = this.providerRegistry.getProvider(config.providerId);
    if (!provider) {
      return 0;
    }

    const fullRequest: GenerationRequest = {
      ...request,
      providerId: config.providerId,
      modelId: config.modelId,
    };

    return provider.estimateCost(fullRequest);
  }

  getCheapestOption(): { providerId: ProviderId; modelId: ModelId } | null {
    const provider = this.providerRegistry.findCheapestProvider();
    if (!provider) return null;

    const models = provider.getSupportedModels();
    const cheapestModel = models.reduce((cheapest, current) =>
      current.capabilities.costPerGeneration < cheapest.capabilities.costPerGeneration
        ? current
        : cheapest
    );

    return {
      providerId: provider.providerId,
      modelId: cheapestModel.id,
    };
  }

  getFastestOption(): { providerId: ProviderId; modelId: ModelId } | null {
    const provider = this.providerRegistry.findFastestProvider();
    if (!provider) return null;

    const models = provider.getSupportedModels();
    const fastestModel = models.reduce((fastest, current) =>
      current.capabilities.estimatedTimeSeconds < fastest.capabilities.estimatedTimeSeconds
        ? current
        : fastest
    );

    return {
      providerId: provider.providerId,
      modelId: fastestModel.id,
    };
  }
} 