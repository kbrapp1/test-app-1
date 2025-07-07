'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ProviderId, ModelId } from '../../../domain/value-objects/Provider';

interface ModelOption {
  providerId: ProviderId;
  modelId: ModelId;
  name: string;
  costPerGeneration: number;
  estimatedTimeSeconds: number;
}

interface ModelSelectorProps {
  selectedProviderId: ProviderId;
  selectedModelId: ModelId;
  availableProviders: ModelOption[];
  onProviderChange: (providerId: ProviderId, modelId: ModelId) => void;
  disabled?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedProviderId,
  selectedModelId,
  availableProviders,
  onProviderChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = availableProviders.find(
    p => p.providerId === selectedProviderId && p.modelId === selectedModelId
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatCost = (cost: number) => {
    return cost < 100 ? `${cost}¢` : `$${(cost / 100).toFixed(2)}`;
  };

  const formatTime = (seconds: number) => {
    return seconds < 60 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
  };

  const handleSelect = (option: ModelOption) => {
    onProviderChange(option.providerId, option.modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Option Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="min-w-[220px] px-3 py-2 text-sm border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="truncate">
            {selectedOption?.name || 'Select Model'}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200/60 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2 space-y-1">
            {availableProviders.map((option) => {
              const isSelected = option.providerId === selectedProviderId && option.modelId === selectedModelId;
              
              return (
                <div
                  key={`${option.providerId}|${option.modelId}`}
                  onClick={() => handleSelect(option)}
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:shadow-md border ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200/60 shadow-sm' 
                      : 'bg-white border-gray-200/60 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {option.name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Cost: {formatCost(option.costPerGeneration)}</span>
                        <span>Time: ~{formatTime(option.estimatedTimeSeconds)}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}; 