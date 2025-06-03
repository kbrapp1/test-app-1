'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ModelSelector } from './ModelSelector';
import { ProviderId, ModelId } from '../../../domain/value-objects/Provider';

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
  const [headerContainer, setHeaderContainer] = useState<HTMLElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're mounted on the client before trying to access DOM
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find the header container once mounted
  useEffect(() => {
    if (isMounted) {
      const container = document.getElementById('image-generator-model-selector');
      setHeaderContainer(container);
    }
  }, [isMounted]);
  
  // Don't render if not mounted or no container found
  if (!isMounted || !headerContainer) return null;

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