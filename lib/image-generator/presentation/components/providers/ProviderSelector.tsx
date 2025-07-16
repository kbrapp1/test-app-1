'use client';

import React from 'react';
import { Zap, DollarSign, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProviderId, ModelId } from '../../../domain/value-objects/Provider';
import { useCostEstimation } from '../../hooks/queries/useCostEstimation';

export interface ProviderOption {
  providerId: ProviderId;
  modelId: ModelId;
  name: string;
  description: string;
  costPerGeneration: number; // in cents
  estimatedTimeSeconds: number;
  isDefault?: boolean;
  isBeta?: boolean;
  supportsImageEditing: boolean;
  supportsStyleControls: boolean;
  supportsMultipleImages?: boolean; // NEW: For dual-image models
  requiredImages?: number; // NEW: Number of required images
  maxSafetyTolerance?: number;
  minSafetyTolerance?: number;
  supportedAspectRatios: string[];
  supportedOutputFormats: string[];
}

interface ProviderSelectorProps {
  selectedProviderId: ProviderId;
  selectedModelId: ModelId;
  availableProviders: ProviderOption[];
  onProviderChange: (providerId: ProviderId, modelId: ModelId) => void;
  isGenerating?: boolean;
  // Real-time cost estimation parameters
  currentPrompt?: string;
  aspectRatio?: string;
  hasBaseImage?: boolean;
  outputFormat?: string;
  safetyTolerance?: number;
}

/**
 * ProviderSelector Component
 * Single Responsibility: Provider and model selection with cost/speed indicators
 */
export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProviderId,
  selectedModelId,
  availableProviders,
  onProviderChange,
  isGenerating = false,
  currentPrompt = '',
  aspectRatio,
  hasBaseImage,
  outputFormat,
  safetyTolerance,
}) => {
  const selectedOption = availableProviders.find(
    p => p.providerId === selectedProviderId && p.modelId === selectedModelId
  );

  // Real-time cost estimation for the selected provider
  const { estimate: realTimeCost, isLoading: isCostLoading } = useCostEstimation({
    prompt: currentPrompt,
    providerId: selectedProviderId,
    modelId: selectedModelId,
    aspectRatio,
    hasBaseImage,
    outputFormat,
    safetyTolerance,
    enabled: !!currentPrompt.trim(),
  });

  const handleSelectionChange = (value: string) => {
    const [providerId, modelId] = value.split('|') as [ProviderId, ModelId];
    onProviderChange(providerId, modelId);
  };

  const formatCost = (cents: number) => {
    if (cents < 100) return `${cents}¢`;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  // Get the actual cost to display (real-time if available, otherwise base cost)
  const getDisplayCost = (option: ProviderOption) => {
    if (option.providerId === selectedProviderId && option.modelId === selectedModelId && realTimeCost) {
      return realTimeCost.estimatedCents;
    }
    return option.costPerGeneration;
  };

  // Check if cost has changed from base price
  const getCostIndicator = (option: ProviderOption) => {
    if (option.providerId === selectedProviderId && option.modelId === selectedModelId && realTimeCost) {
      const baseCost = option.costPerGeneration;
      const realCost = realTimeCost.estimatedCents;
      
      if (realCost > baseCost) {
        return { icon: TrendingUp, color: 'text-orange-500', tooltip: 'Higher cost due to selected options' };
      } else if (realCost < baseCost) {
        return { icon: TrendingDown, color: 'text-green-500', tooltip: 'Lower cost due to selected options' };
      }
    }
    return null;
  };

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI Model</span>
        </div>
        
        <Select
          value={`${selectedProviderId}|${selectedModelId}`}
          onValueChange={handleSelectionChange}
          disabled={isGenerating}
        >
          <SelectTrigger className="w-64 bg-background border-border text-foreground">
            <SelectValue>
              {selectedOption && (
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{selectedOption.name}</span>
                  <div className="flex items-center gap-2 ml-2">
                    {selectedOption.isBeta && (
                      <Badge variant="secondary" className="text-xs">Beta</Badge>
                    )}
                    {selectedOption.isDefault && (
                      <Badge variant="outline" className="text-xs">Default</Badge>
                    )}
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          
          <SelectContent className="bg-popover border-border w-80">
            {availableProviders.map((option) => (
              <SelectItem
                key={`${option.providerId}|${option.modelId}`}
                value={`${option.providerId}|${option.modelId}`}
                className="text-foreground p-3"
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{option.name}</span>
                      {option.isBeta && (
                        <Badge variant="secondary" className="text-xs">Beta</Badge>
                      )}
                      {option.isDefault && (
                        <Badge variant="outline" className="text-xs">Default</Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className={isCostLoading && option.providerId === selectedProviderId && option.modelId === selectedModelId ? 'opacity-50' : ''}>
                        {formatCost(getDisplayCost(option))}
                      </span>
                      {(() => {
                        const indicator = getCostIndicator(option);
                        if (!indicator) return null;
                        const IconComponent = indicator.icon;
                        return (
                          <div title={indicator.tooltip}>
                            <IconComponent className={`w-3 h-3 ${indicator.color}`} />
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>~{formatTime(option.estimatedTimeSeconds)}</span>
                    </div>
                    <div className="flex gap-1">
                      {option.supportsImageEditing && (
                        <Badge variant="outline" className="text-xs">Edit</Badge>
                      )}
                      {option.supportsStyleControls && (
                        <Badge variant="outline" className="text-xs">Style</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedOption && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-600" />
              <span className={isCostLoading ? 'opacity-50' : ''}>
                {formatCost(getDisplayCost(selectedOption))} per image
              </span>
              {(() => {
                const indicator = getCostIndicator(selectedOption);
                if (!indicator) return null;
                const IconComponent = indicator.icon;
                return (
                  <div title={indicator.tooltip}>
                    <IconComponent className={`w-3 h-3 ${indicator.color}`} />
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>~{formatTime(selectedOption.estimatedTimeSeconds)}</span>
            </div>
            {realTimeCost?.breakdown && (
              <div className="text-xs text-muted-foreground/70">
                {realTimeCost.breakdown.editingMultiplier && realTimeCost.breakdown.editingMultiplier > 1 && (
                  <span>+20% editing</span>
                )}
                {realTimeCost.breakdown.dimensionMultiplier && realTimeCost.breakdown.dimensionMultiplier > 1 && (
                  <span>+10% resolution</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 