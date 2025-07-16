/**
 * AI Instructions: Custom hook for managing advanced chatbot parameters
 * - Encapsulate state management logic for advanced parameters
 * - Handle parameter updates and synchronization with backend
 * - Follow single responsibility principle for focused functionality
 * - Use React Query for optimistic updates and cache management
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvancedParameters, ParameterUpdateHandler } from '../types/AdvancedParametersTypes';
import { updateChatbotConfig } from '../actions/configActions';
import { UpdateChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';

interface UseAdvancedParametersProps {
  existingConfig: unknown;
  activeOrganizationId: string | null;
}

interface UseAdvancedParametersReturn {
  parameters: AdvancedParameters;
  updateParameter: ParameterUpdateHandler;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleSave: () => void;
  updateMutation: {
    isPending: boolean;
    mutate: (variables: { id: string; data: UpdateChatbotConfigDto }) => void;
  };
}

const DEFAULT_PARAMETERS: AdvancedParameters = {
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.3,
  openaiMaxTokens: 1000,
  
  contextMaxTokens: 12000,
  contextSystemPromptTokens: 500,
  contextResponseReservedTokens: 3000,
  contextSummaryTokens: 200,
  
  intentConfidenceThreshold: 0.7,
  intentAmbiguityThreshold: 0.2,
  enableMultiIntentDetection: true,
  enablePersonaInference: true,
  
  enableAdvancedEntities: true,
  entityExtractionMode: 'comprehensive',
  customEntityTypes: [],
  
  maxConversationTurns: 20,
  inactivityTimeoutSeconds: 300,
  enableJourneyRegression: true,
  enableContextSwitchDetection: true,
  
  enableAdvancedScoring: true,
  entityCompletenessWeight: 0.3,
  personaConfidenceWeight: 0.2,
  journeyProgressionWeight: 0.25,
  
  enablePerformanceLogging: true,
  enableIntentAnalytics: true,
  enablePersonaAnalytics: true,
  responseTimeThresholdMs: 2000,
};

export function useAdvancedParameters({
  existingConfig,
  activeOrganizationId
}: UseAdvancedParametersProps): UseAdvancedParametersReturn {
  // AI: Security validation - activeOrganizationId must be provided
  if (!activeOrganizationId) {
    throw new Error('Active organization ID is required for advanced parameters management');
  }

  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState<AdvancedParameters>(DEFAULT_PARAMETERS);

  useEffect(() => {
    if (existingConfig) {
      const config = existingConfig as {
        personalitySettings?: {
          conversationFlow?: {
            maxConversationTurns?: number;
            inactivityTimeout?: number;
          };
        };
      };
      
      setParameters(prev => ({
        ...prev,
        maxConversationTurns: config.personalitySettings?.conversationFlow?.maxConversationTurns || prev.maxConversationTurns,
        inactivityTimeoutSeconds: config.personalitySettings?.conversationFlow?.inactivityTimeout || prev.inactivityTimeoutSeconds,
      }));
    }
  }, [existingConfig]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  const updateParameter: ParameterUpdateHandler = <K extends keyof AdvancedParameters>(
    key: K,
    value: AdvancedParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!activeOrganizationId || !existingConfig) return;
    
    const config = existingConfig as {
      id: string;
      personalitySettings?: {
        conversationFlow?: unknown;
        [key: string]: unknown;
      };
    };

    const updateData: UpdateChatbotConfigDto = {
      personalitySettings: {
        ...config.personalitySettings,
        conversationFlow: {
          ...(config.personalitySettings?.conversationFlow as Record<string, unknown> || {}),
          // Include all required ConversationFlowDto properties
          greetingMessage: String((config.personalitySettings?.conversationFlow as unknown as Record<string, unknown>)?.greetingMessage || 'Hello! How can I help you today?'),
          fallbackMessage: String((config.personalitySettings?.conversationFlow as unknown as Record<string, unknown>)?.fallbackMessage || 'I\'m not sure about that. Could you rephrase your question?'),
          escalationMessage: String((config.personalitySettings?.conversationFlow as unknown as Record<string, unknown>)?.escalationMessage || 'Let me connect you with a team member.'),
          endConversationMessage: String((config.personalitySettings?.conversationFlow as unknown as Record<string, unknown>)?.endConversationMessage || 'Thank you for chatting with us!'),
          leadCapturePrompt: String((config.personalitySettings?.conversationFlow as unknown as Record<string, unknown>)?.leadCapturePrompt || 'Can I get your contact information to follow up?'),
          // Update the specific parameters
          maxConversationTurns: parameters.maxConversationTurns,
          inactivityTimeout: parameters.inactivityTimeoutSeconds,
        },
      },
    };

    updateMutation.mutate({
      id: config.id,
      data: updateData,
    });
  };

  return {
    parameters,
    updateParameter,
    isEditing,
    setIsEditing,
    handleSave,
    updateMutation,
  };
} 