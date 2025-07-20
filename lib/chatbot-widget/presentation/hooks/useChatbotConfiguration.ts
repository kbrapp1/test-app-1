/**
 * Chatbot Configuration Management Hook
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates all chatbot configuration concerns
 * - Uses extracted services for separation of concerns
 * - Preserves organization security boundaries
 * - Provides clean interface for components
 * - Follows DDD patterns with proper orchestration
 */

'use client';

import { useOrganization } from '../../../organization/application/providers/OrganizationProvider';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ConfigurationDataTransformService } from '../services/ConfigurationDataTransformService';
import { ConfigurationValidationService, ConfigValidationResult } from '../services/ConfigurationValidationService';
import {
    BotConfigurationActions,
    BotConfigurationFormData as _BotConfigurationFormData,
    BotConfigurationViewState,
} from '../types/BotConfigurationTypes';
import { useChatbotConfigurationMutations } from './useChatbotConfigurationMutations';
import { useChatbotConfigurationQuery, useChatbotConfigs, useChatbotConfigById } from './useChatbotConfigurationQuery';
import { createViewState, useConfigurationFormState } from './useConfigurationFormState';

export interface UseChatbotConfigurationOptions {
  configId?: string;
  enableFormState?: boolean;
  autoLoad?: boolean;
}

export function useChatbotConfiguration(options: UseChatbotConfigurationOptions = {}) {
  const { activeOrganizationId } = useOrganization();
  const { enableFormState = true, autoLoad = true } = options;
  
  // Extract configuration data
  const { config: existingConfig, isLoading, error } = useChatbotConfigurationQuery(
    activeOrganizationId,
    { autoLoad }
  );

  // Extract form state management
  const {
    formData,
    isEditing,
    updateFormData,
    startEditing,
    cancelEditing,
  } = useConfigurationFormState({
    enableFormState,
    existingConfig,
  });

  // Extract mutation operations
  const {
    createMutation,
    updateMutation,
    deleteMutation: _deleteMutation,
    createConfig,
    updateConfig,
    deleteConfig,
    isCreating,
    isUpdating,
    isDeleting,
    isSaving,
  } = useChatbotConfigurationMutations(activeOrganizationId);

  const handleSaveConfiguration = () => {
    if (!activeOrganizationId) return;

    const validation = ConfigurationValidationService.validateFormData(formData);
    
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      
      const errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
      errorTrackingService.trackChatbotConfigurationError(
        'form_validation_failed',
        {
          organizationId: activeOrganizationId,
          metadata: {
            validationErrors: validation.errors,
            formData: {
              name: formData.name,
              description: formData.description,
              personality: formData.personality
            }
          }
        }
      ).catch(err => console.error('Failed to track validation error:', err));
      
      return;
    }

    if (existingConfig) {
      const updateData = ConfigurationDataTransformService.createUpdateDto(formData);
      updateMutation.mutate({
        id: existingConfig.id,
        data: updateData,
      });
    } else {
      const createData = ConfigurationDataTransformService.createCreateDto(formData, activeOrganizationId);
      createMutation.mutate(createData);
    }
  };

  const actions: BotConfigurationActions = {
    startEditing,
    cancelEditing,
    saveConfiguration: handleSaveConfiguration,
    updateFormData,
  };

  const viewState: BotConfigurationViewState = createViewState(
    isEditing,
    isLoading,
    !!existingConfig,
    error
  );

  return {
    config: existingConfig,
    isLoading,
    error,
    
    ...(enableFormState && {
      formData,
      viewState,
      actions,
      isSaving,
    }),
    
    createConfig,
    updateConfig,
    deleteConfig,
    
    validateConfig: ConfigurationValidationService.validateConfig,
    transformToDto: ConfigurationDataTransformService.transformToDto,
    
    isCreating,
    isUpdating,
    isDeleting,
  };
}

export { useChatbotConfigs, useChatbotConfigById };
export type { ConfigValidationResult }; 