/**
 * Consolidated Chatbot Configuration Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Complete chatbot configuration management
 * - Handles both form state and CRUD operations
 * - Encapsulates React Query logic and state management
 * - Provides clean interface for components
 * - Follows @golden-rule DDD patterns exactly
 * - Under 250 lines - focused and maintainable
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../../organization/application/providers/OrganizationProvider';
import { 
  getChatbotConfigByOrganization, 
  updateChatbotConfig, 
  createChatbotConfig,
  getChatbotConfigById,
  getActiveChatbotConfigs,
  deleteChatbotConfig
} from '../actions/configActions';
import { 
  ChatbotConfigDto,
  CreateChatbotConfigDto, 
  UpdateChatbotConfigDto 
} from '../../application/dto/ChatbotConfigDto';
import {
  BotConfigurationFormData,
  BotConfigurationViewState,
  BotConfigurationActions,
  DEFAULT_FORM_DATA,
} from '../types/BotConfigurationTypes';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

// Hook Options Interface
export interface UseChatbotConfigurationOptions {
  configId?: string;
  enableFormState?: boolean;
  autoLoad?: boolean;
}

// Validation Interface
export interface ConfigValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Main chatbot configuration hook
 */
export function useChatbotConfiguration(options: UseChatbotConfigurationOptions = {}) {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const { configId, enableFormState = true, autoLoad = true } = options;
  
  // Form state (only when needed)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BotConfigurationFormData>(DEFAULT_FORM_DATA);

  // Query for organization's chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId && autoLoad,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  // Update form data when existingConfig changes (only if form state enabled)
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

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateChatbotConfigDto) => createChatbotConfig(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
        queryClient.invalidateQueries({ queryKey: ['chatbot-configs', activeOrganizationId] });
        setIsEditing(false);
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
        queryClient.invalidateQueries({ queryKey: ['chatbot-configs', activeOrganizationId] });
        if (result.data) {
          queryClient.setQueryData(['chatbot-config', result.data.id], result.data);
        }
        setIsEditing(false);
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ configId }: { configId: string }) => 
      deleteChatbotConfig(configId, activeOrganizationId || ''),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.removeQueries({ queryKey: ['chatbot-config', variables.configId] });
        queryClient.invalidateQueries({ queryKey: ['chatbot-configs', activeOrganizationId] });
      }
    },
  });

  // Transform form data to DTOs
  const transformToDto = (formData: BotConfigurationFormData) => ({
    personalitySettings: {
      tone: formData.personality,
      communicationStyle: 'professional' as const,
      responseLength: 'medium' as const,
      escalationTriggers: [],
      responseBehavior: {
        useEmojis: false,
        askFollowUpQuestions: true,
        proactiveOffering: true,
        personalizeResponses: true,
        acknowledgePreviousInteractions: true,
      },
      conversationFlow: {
        greetingMessage: 'Hello! How can I help you today?',
        fallbackMessage: 'I\'m not sure about that. Could you rephrase your question?',
        escalationMessage: 'Let me connect you with a team member.',
        endConversationMessage: 'Thank you for chatting with us!',
        leadCapturePrompt: 'Can I get your contact information to follow up?',
        maxConversationTurns: 20,
        inactivityTimeout: 300,
      },
      customInstructions: '',
    },
    operatingHours: {
      timezone: formData.operatingHours.timezone,
      businessHours: [],
      holidaySchedule: [],
      outsideHoursMessage: 'We\'re currently offline. Please leave a message!',
    },
  });

  // Configuration validation
  const validateConfig = (config: Partial<CreateChatbotConfigDto | UpdateChatbotConfigDto>): ConfigValidationResult => {
    const errors: Record<string, string> = {};

    if ('name' in config) {
      if (!config.name || config.name.trim().length === 0) {
        errors.name = 'Bot name is required';
      } else if (config.name.length > 100) {
        errors.name = 'Bot name must be less than 100 characters';
      }
    }

    if (config.personalitySettings?.conversationFlow?.greetingMessage) {
      const greeting = config.personalitySettings.conversationFlow.greetingMessage;
      if (greeting.length > 500) {
        errors.greetingMessage = 'Greeting message must be less than 500 characters';
      }
    }

    if (config.knowledgeBase?.companyInfo) {
      const companyInfo = config.knowledgeBase.companyInfo;
      if (companyInfo.length > 5000) {
        errors.companyInfo = 'Company info must be less than 5000 characters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  // Actions (only when form state enabled)
  const actions: BotConfigurationActions = {
    startEditing: () => setIsEditing(true),
    cancelEditing: () => {
      setIsEditing(false);
      // Reset form data to existing config
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
    },
    saveConfiguration: () => {
      if (!activeOrganizationId) return;

      const baseDto = transformToDto(formData);
      const validation = validateConfig({ name: formData.name, ...baseDto });
      
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors);
        
        // Track chatbot configuration error to database
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
        // Update existing config
        updateMutation.mutate({
          id: existingConfig.id,
          data: {
            name: formData.name,
            description: formData.description,
            isActive: formData.isActive,
            ...baseDto,
          },
        });
      } else {
        // Create new config
        createMutation.mutate({
          organizationId: activeOrganizationId,
          name: formData.name,
          description: formData.description,
          knowledgeBase: {
            companyInfo: '',
            productCatalog: '',
            faqs: [],
            supportDocs: '',
            complianceGuidelines: '',
            websiteSources: [],
          },
          leadQualificationQuestions: [],
          ...baseDto,
        });
      }
    },
    updateFormData: (updates: Partial<BotConfigurationFormData>) => {
      setFormData(prev => ({ ...prev, ...updates }));
    },
  };

  // View state (only when form state enabled)
  const viewState: BotConfigurationViewState = {
    isEditing,
    isLoading,
    hasExistingConfig: !!existingConfig,
    error: error ? 'Failed to load chatbot configuration. Please try again.' : null,
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return {
    // Core data
    config: existingConfig,
    isLoading,
    error,
    
    // Form state (when enabled)
    ...(enableFormState && {
      formData,
      viewState,
      actions,
      isSaving,
    }),
    
    // CRUD operations
    createConfig: createMutation.mutateAsync,
    updateConfig: updateMutation.mutateAsync,
    deleteConfig: deleteMutation.mutateAsync,
    
    // Utilities
    validateConfig,
    transformToDto,
    
    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Hook for fetching multiple configs (admin use)
 */
export function useChatbotConfigs(organizationId?: string) {
  return useQuery({
    queryKey: ['chatbot-configs', organizationId],
    queryFn: async () => {
      const result = await getActiveChatbotConfigs(organizationId!);
      return result.success ? result.data || [] : [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching specific config by ID
 */
export function useChatbotConfigById(configId?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['chatbot-config', configId],
    queryFn: async () => {
      const result = await getChatbotConfigById(configId!, organizationId);
      return result.success ? result.data : null;
    },
    enabled: !!configId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 