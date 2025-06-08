import { ProviderId, ModelId } from '../../domain/value-objects/Provider';

/**
 * Provider Option Interface
 * Presentation layer data structure for UI rendering
 */
export interface ProviderOption {
  providerId: ProviderId;
  modelId: ModelId;
  name: string;
  description: string;
  costPerGeneration?: number;
  estimatedTimeSeconds?: number;
  isDefault?: boolean;
  isBeta?: boolean;
  supportsImageEditing: boolean;
  supportsStyleControls: boolean;
  maxSafetyTolerance?: number;
  minSafetyTolerance?: number;
  supportedAspectRatios: string[];
  supportedOutputFormats: string[];
}

/**
 * Provider Selector Props
 * For the actual React component (can be created later)
 */
export interface ProviderSelectorProps {
  availableProviders: ProviderOption[];
  selectedProviderId: ProviderId;
  selectedModelId: ModelId;
  onProviderChange: (providerId: ProviderId, modelId: ModelId) => void;
  disabled?: boolean;
  className?: string;
} 