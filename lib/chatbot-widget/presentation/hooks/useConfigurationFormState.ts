/**
 * Configuration Form State Hook
 * 
 * AI INSTRUCTIONS:
 * - Manages local form state for chatbot configuration
 * - Handles form data synchronization with server state
 * - Focused on form state management concerns only
 * - Preserves React Hooks rules and patterns
 */

'use client';

import { useEffect, useState } from 'react';
import { ChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';
import {
  BotConfigurationFormData,
  BotConfigurationViewState,
  DEFAULT_FORM_DATA,
} from '../types/BotConfigurationTypes';

export interface UseConfigurationFormStateOptions {
  enableFormState?: boolean;
  existingConfig?: ChatbotConfigDto | null;
}

export function useConfigurationFormState(options: UseConfigurationFormStateOptions = {}) {
  const { enableFormState = true, existingConfig } = options;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BotConfigurationFormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (existingConfig && enableFormState) {
      setFormData({
        name: existingConfig.name || DEFAULT_FORM_DATA.name,
        description: existingConfig.description || DEFAULT_FORM_DATA.description,
        personality: existingConfig.personalitySettings?.tone || DEFAULT_FORM_DATA.personality,
        operatingHours: { 
          enabled: false, 
          timezone: existingConfig.operatingHours?.timezone || DEFAULT_FORM_DATA.operatingHours.timezone,
        },
        isActive: existingConfig.isActive ?? DEFAULT_FORM_DATA.isActive,
      });
    }
  }, [existingConfig, enableFormState]);

  const updateFormData = (updates: Partial<BotConfigurationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const resetFormToExisting = () => {
    if (existingConfig) {
      setFormData({
        name: existingConfig.name || DEFAULT_FORM_DATA.name,
        description: existingConfig.description || DEFAULT_FORM_DATA.description,
        personality: existingConfig.personalitySettings?.tone || DEFAULT_FORM_DATA.personality,
        operatingHours: { 
          enabled: false, 
          timezone: existingConfig.operatingHours?.timezone || DEFAULT_FORM_DATA.operatingHours.timezone,
        },
        isActive: existingConfig.isActive ?? DEFAULT_FORM_DATA.isActive,
      });
    }
  };

  const startEditing = () => setIsEditing(true);
  
  const cancelEditing = () => {
    setIsEditing(false);
    resetFormToExisting();
  };

  return {
    formData,
    isEditing,
    updateFormData,
    startEditing,
    cancelEditing,
    resetFormToExisting,
  };
}

export function createViewState(
  isEditing: boolean,
  isLoading: boolean,
  hasExistingConfig: boolean,
  error: any
): BotConfigurationViewState {
  return {
    isEditing,
    isLoading,
    hasExistingConfig,
    error: error ? 'Failed to load chatbot configuration. Please try again.' : null,
  };
}