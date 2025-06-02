import { ProviderId, ModelId, ProviderValueObject } from '../value-objects/Provider';
import { ImageGenerationProvider } from '../repositories/ImageGenerationProvider';

export interface ProviderRegistryService {
  registerProvider(provider: ImageGenerationProvider): void;
  getProvider(providerId: ProviderId): ImageGenerationProvider | undefined;
  getAllProviders(): ImageGenerationProvider[];
  getAvailableModels(providerId: ProviderId): ModelId[];
  findCheapestProvider(): ImageGenerationProvider | undefined;
  findFastestProvider(): ImageGenerationProvider | undefined;
  findProviderByModel(modelId: ModelId): ImageGenerationProvider | undefined;
}

export class ProviderRegistry implements ProviderRegistryService {
  private providers = new Map<ProviderId, ImageGenerationProvider>();

  registerProvider(provider: ImageGenerationProvider): void {
    this.providers.set(provider.providerId, provider);
  }

  getProvider(providerId: ProviderId): ImageGenerationProvider | undefined {
    return this.providers.get(providerId);
  }

  getAllProviders(): ImageGenerationProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailableModels(providerId: ProviderId): ModelId[] {
    const provider = this.getProvider(providerId);
    return provider?.getSupportedModels().map(model => model.id) || [];
  }

  findCheapestProvider(): ImageGenerationProvider | undefined {
    const providers = this.getAllProviders();
    if (providers.length === 0) return undefined;

    return providers.reduce((cheapest, current) => {
      const cheapestModel = cheapest.getSupportedModels()[0];
      const currentModel = current.getSupportedModels()[0];
      
      return currentModel?.capabilities.costPerGeneration < cheapestModel?.capabilities.costPerGeneration
        ? current
        : cheapest;
    });
  }

  findFastestProvider(): ImageGenerationProvider | undefined {
    const providers = this.getAllProviders();
    if (providers.length === 0) return undefined;

    return providers.reduce((fastest, current) => {
      const fastestModel = fastest.getSupportedModels()[0];
      const currentModel = current.getSupportedModels()[0];
      
      return currentModel?.capabilities.estimatedTimeSeconds < fastestModel?.capabilities.estimatedTimeSeconds
        ? current
        : fastest;
    });
  }

  findProviderByModel(modelId: ModelId): ImageGenerationProvider | undefined {
    for (const provider of this.getAllProviders()) {
      if (provider.getModel(modelId)) {
        return provider;
      }
    }
    return undefined;
  }
} 