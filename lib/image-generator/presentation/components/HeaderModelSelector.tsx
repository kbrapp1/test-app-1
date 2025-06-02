import React from 'react';
import { createPortal } from 'react-dom';
import { ModelSelector } from './ModelSelector';
import { ProviderId, ModelId } from '../../domain/value-objects/Provider';

interface HeaderModelSelectorProps {
  selectedProviderId: ProviderId;
  selectedModelId: ModelId;
  availableProviders: any[];
  onProviderChange: (providerId: ProviderId, modelId: ModelId) => void;
  disabled: boolean;
}

/**
 * Header Model Selector Component
 * Single Responsibility: Render model selector in header via portal
 * Presentation Layer - Portal rendering coordination only
 */
export const HeaderModelSelector: React.FC<HeaderModelSelectorProps> = ({ 
  selectedProviderId, 
  selectedModelId, 
  availableProviders, 
  onProviderChange, 
  disabled 
}) => {
  const headerContainer = document.getElementById('image-generator-model-selector');
  
  if (!headerContainer) return null;

  return createPortal(
    <div className="mr-2">
      <ModelSelector
        selectedProviderId={selectedProviderId}
        selectedModelId={selectedModelId}
        availableProviders={availableProviders}
        onProviderChange={onProviderChange}
        disabled={disabled}
      />
    </div>,
    headerContainer
  );
}; 