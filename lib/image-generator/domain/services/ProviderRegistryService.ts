import { ProviderId, ModelId, ProviderValueObject } from '../value-objects/Provider';
import { ImageGenerationProvider } from '../repositories/ImageGenerationProvider';

export interface ProviderRegistryService {
  registerProvider(provider: ImageGenerationProvider): void;
  getProvider(providerId: ProviderId): ImageGenerationProvider | undefined;
  getAllProviders(): ImageGenerationProvider[];
  getAvailableModels(providerId: ProviderId): Promise<ModelId[]>;
  findCheapestProvider(): Promise<ImageGenerationProvider | undefined>;
  findFastestProvider(): Promise<ImageGenerationProvider | undefined>;
  findProviderByModel(modelId: ModelId): Promise<ImageGenerationProvider | undefined>;
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

  async getAvailableModels(providerId: ProviderId): Promise<ModelId[]> {
    const provider = this.getProvider(providerId);
    if (!provider) return [];
    const models = await provider.getSupportedModels();
    return models.map(model => model.id);
  }

  async findCheapestProvider(): Promise<ImageGenerationProvider | undefined> {
    const providers = this.getAllProviders();
    if (providers.length === 0) return undefined;

    let cheapestProvider = providers[0];
    let cheapestCost = Infinity;

    for (const provider of providers) {
      const models = await provider.getSupportedModels();
      if (models.length > 0) {
        const minCost = Math.min(...models.map(m => m.capabilities.costPerGeneration));
        if (minCost < cheapestCost) {
          cheapestCost = minCost;
          cheapestProvider = provider;
        }
      }
    }

    return cheapestProvider;
  }

  async findFastestProvider(): Promise<ImageGenerationProvider | undefined> {
    const providers = this.getAllProviders();
    if (providers.length === 0) return undefined;

    let fastestProvider = providers[0];
    let fastestTime = Infinity;

    for (const provider of providers) {
      const models = await provider.getSupportedModels();
      if (models.length > 0) {
        const minTime = Math.min(...models.map(m => m.capabilities.estimatedTimeSeconds));
        if (minTime < fastestTime) {
          fastestTime = minTime;
          fastestProvider = provider;
        }
      }
    }

    return fastestProvider;
  }

  async findProviderByModel(modelId: ModelId): Promise<ImageGenerationProvider | undefined> {
    for (const provider of this.getAllProviders()) {
      const model = await provider.getModel(modelId);
      if (model) {
        return provider;
      }
    }
    return undefined;
  }
} 