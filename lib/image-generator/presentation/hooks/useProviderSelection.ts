import { useState, useEffect } from 'react';
import { ProviderId, ModelId, ProviderModel } from '../../domain/value-objects/Provider';
import { ProviderService } from '../../application/services/ProviderService';
import { ProviderFactory } from '../../infrastructure/providers/ProviderFactory';
import { ProviderOption } from '../components/ProviderSelector';

export interface UseProviderSelectionReturn {
  selectedProviderId: ProviderId;
  selectedModelId: ModelId;
  availableProviders: ProviderOption[];
  providerService: ProviderService;
  onProviderChange: (providerId: ProviderId, modelId: ModelId) => void;
  getSelectedCapabilities: () => {
    supportsImageEditing: boolean;
    supportsStyleControls: boolean;
    maxSafetyTolerance?: number;
    minSafetyTolerance?: number;
    supportedAspectRatios: string[];
    supportedOutputFormats: string[];
  };
  isLoading: boolean;
}

export function useProviderSelection(
  apiToken?: string,
  defaultProviderId: ProviderId = 'replicate',
  defaultModelId: ModelId = 'flux-schnell'
): UseProviderSelectionReturn {
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>(defaultProviderId);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(defaultModelId);
  const [providerService, setProviderService] = useState<ProviderService>(
    new ProviderService(ProviderFactory.createProviderRegistry(apiToken))
  );
  const [availableProviders, setAvailableProviders] = useState<ProviderOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize provider registry and service with lazy loading
  useEffect(() => {
    let isMounted = true;

    const initializeProviders = async () => {
      try {
        // Create service
        const registry = ProviderFactory.createProviderRegistry(apiToken);
        const service = new ProviderService(registry);
        if (isMounted) {
          setProviderService(service);
        }
        // Load providers and models
        const providers = service.getAvailableProviders();
        const options: ProviderOption[] = [];
        for (const prov of providers) {
          const models = await prov.getSupportedModels();
          models.forEach((model: ProviderModel) => {
            options.push({
              providerId: prov.providerId,
              modelId: model.id,
              name: model.name,
              description: model.description,
              costPerGeneration: model.capabilities.costPerGeneration,
              estimatedTimeSeconds: model.capabilities.estimatedTimeSeconds,
              isDefault: model.isDefault,
              isBeta: model.isBeta,
              supportsImageEditing: model.capabilities.supportsImageEditing,
              supportsStyleControls: model.capabilities.supportsStyleControls,
              maxSafetyTolerance: model.capabilities.maxSafetyTolerance,
              minSafetyTolerance: model.capabilities.minSafetyTolerance,
              supportedAspectRatios: model.capabilities.supportedAspectRatios,
              supportedOutputFormats: model.capabilities.supportedOutputFormats,
            });
          });
        }
        if (isMounted) {
          setAvailableProviders(options);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to initialize providers:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeProviders();

    return () => {
      isMounted = false;
    };
  }, [apiToken]);

  const onProviderChange = (providerId: ProviderId, modelId: ModelId) => {
    setSelectedProviderId(providerId);
    setSelectedModelId(modelId);
  };

  const getSelectedCapabilities = () => {
    // Find the option for selected provider and model
    const option = availableProviders.find(
      opt => opt.providerId === selectedProviderId && opt.modelId === selectedModelId
    );
    if (option) {
      return {
        supportsImageEditing: option.supportsImageEditing,
        supportsStyleControls: option.supportsStyleControls,
        maxSafetyTolerance: option.maxSafetyTolerance,
        minSafetyTolerance: option.minSafetyTolerance,
        supportedAspectRatios: option.supportedAspectRatios,
        supportedOutputFormats: option.supportedOutputFormats,
      };
    }
    // Default while no matching option
    return {
      supportsImageEditing: false,
      supportsStyleControls: false,
      supportedAspectRatios: ['1:1'],
      supportedOutputFormats: ['webp'],
    };
  };

  return {
    selectedProviderId,
    selectedModelId,
    availableProviders,
    providerService,
    onProviderChange,
    getSelectedCapabilities,
    isLoading,
  };
} 