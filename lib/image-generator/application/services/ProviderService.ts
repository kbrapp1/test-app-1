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

  async getModelsForProvider(providerId: ProviderId): Promise<ModelId[]> {
    const provider = this.providerRegistry.getProvider(providerId);
    if (!provider) return [];
    const models = await provider.getSupportedModels();
    return models.map(model => model.id);
  }

  async validateRequest(
    request: Omit<GenerationRequest, 'providerId' | 'modelId'>,
    config: ProviderConfiguration
  ): Promise<{ isValid: boolean; errors: string[] }> {
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

    return await provider.validateRequest(fullRequest);
  }

  async estimateCost(
    request: Omit<GenerationRequest, 'providerId' | 'modelId'>,
    config: ProviderConfiguration
  ): Promise<number> {
    const provider = this.providerRegistry.getProvider(config.providerId);
    if (!provider) {
      return 0;
    }

    const fullRequest: GenerationRequest = {
      ...request,
      providerId: config.providerId,
      modelId: config.modelId,
    };

    return await provider.estimateCost(fullRequest);
  }

  async getCheapestOption(): Promise<{ providerId: ProviderId; modelId: ModelId } | null> {
    const provider = await this.providerRegistry.findCheapestProvider();
    if (!provider) return null;

    const models = await provider.getSupportedModels();
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

  async getFastestOption(): Promise<{ providerId: ProviderId; modelId: ModelId } | null> {
    const provider = await this.providerRegistry.findFastestProvider();
    if (!provider) return null;

    const models = await provider.getSupportedModels();
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