/**
 * Bot Configuration Hook
 * 
 * AI INSTRUCTIONS:
 * - Handle all state management for bot configuration UI
 * - Coordinate between presentation and application layers
 * - Keep components focused on UI rendering only
 * - Use React Query for server state management
 * - Transform DTOs to/from view models at this boundary
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { getChatbotConfigByOrganization, updateChatbotConfig, createChatbotConfig } from '../actions/configActions';
import { CreateChatbotConfigDto, UpdateChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';
import {
  BotConfigurationFormData,
  BotConfigurationViewState,
  BotConfigurationActions,
  DEFAULT_FORM_DATA,
} from '../types/BotConfigurationTypes';

export function useBotConfiguration() {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BotConfigurationFormData>(DEFAULT_FORM_DATA);

  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  // Update form data when existingConfig changes
  useEffect(() => {
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
  }, [existingConfig]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateChatbotConfigDto) => createChatbotConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
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

  // Actions
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

  // View state
  const viewState: BotConfigurationViewState = {
    isEditing,
    isLoading,
    hasExistingConfig: !!existingConfig,
    error: error ? 'Failed to load chatbot configuration. Please try again.' : null,
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return {
    formData,
    viewState,
    actions,
    isSaving,
  };
} 