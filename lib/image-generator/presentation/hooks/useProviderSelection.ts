import { useState, useMemo } from 'react';
import { ProviderId, ModelId } from '../../domain/value-objects/Provider';
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
}

export function useProviderSelection(
  apiToken?: string,
  defaultProviderId: ProviderId = 'replicate',
  defaultModelId: ModelId = 'flux-schnell'
): UseProviderSelectionReturn {
  const [selectedProviderId, setSelectedProviderId] = useState<ProviderId>(defaultProviderId);
  const [selectedModelId, setSelectedModelId] = useState<ModelId>(defaultModelId);

  // Initialize provider registry and service
  const providerService = useMemo(() => {
    const registry = ProviderFactory.createProviderRegistry(apiToken);
    return new ProviderService(registry);
  }, [apiToken]);

  // Get available providers and convert to UI format
  const availableProviders = useMemo((): ProviderOption[] => {
    const providers = providerService.getAvailableProviders();
    const options: ProviderOption[] = [];

    providers.forEach(provider => {
      provider.getSupportedModels().forEach(model => {
        options.push({
          providerId: provider.providerId,
          modelId: model.id,
          name: model.name,
          description: model.description,
          costPerGeneration: model.capabilities.costPerGeneration,
          estimatedTimeSeconds: model.capabilities.estimatedTimeSeconds,
          isDefault: model.isDefault,
          isBeta: model.isBeta,
          supportsImageEditing: model.capabilities.supportsImageEditing,
          supportsStyleControls: model.capabilities.supportsStyleControls,
        });
      });
    });

    return options;
  }, [providerService]);

  const onProviderChange = (providerId: ProviderId, modelId: ModelId) => {
    setSelectedProviderId(providerId);
    setSelectedModelId(modelId);
  };

  const getSelectedCapabilities = () => {
    const selectedOption = availableProviders.find(
      p => p.providerId === selectedProviderId && p.modelId === selectedModelId
    );

    if (!selectedOption) {
      return {
        supportsImageEditing: false,
        supportsStyleControls: false,
        supportedAspectRatios: [],
        supportedOutputFormats: [],
      };
    }

    const provider = providerService.getAvailableProviders().find(p => p.providerId === selectedProviderId);
    const model = provider?.getModel(selectedModelId);

    return {
      supportsImageEditing: selectedOption.supportsImageEditing,
      supportsStyleControls: selectedOption.supportsStyleControls,
      maxSafetyTolerance: model?.capabilities.maxSafetyTolerance,
      minSafetyTolerance: model?.capabilities.minSafetyTolerance,
      supportedAspectRatios: model?.capabilities.supportedAspectRatios || [],
      supportedOutputFormats: model?.capabilities.supportedOutputFormats || [],
    };
  };

  return {
    selectedProviderId,
    selectedModelId,
    availableProviders,
    providerService,
    onProviderChange,
    getSelectedCapabilities,
  };
} 