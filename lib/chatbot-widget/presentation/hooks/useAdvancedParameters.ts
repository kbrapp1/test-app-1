/**
 * Advanced Parameters Hook
 * 
 * Custom hook for managing advanced chatbot parameters state and operations.
 * Encapsulates state management logic following single responsibility principle.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdvancedParameters, ParameterUpdateHandler } from '../types/AdvancedParametersTypes';
import { updateChatbotConfig } from '../actions/configActions';
import { UpdateChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';

interface UseAdvancedParametersProps {
  existingConfig: any;
  activeOrganizationId: string | null;
}

interface UseAdvancedParametersReturn {
  parameters: AdvancedParameters;
  updateParameter: ParameterUpdateHandler;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  handleSave: () => void;
  updateMutation: any;
}

const DEFAULT_PARAMETERS: AdvancedParameters = {
  // OpenAI Configuration
  openaiModel: 'gpt-4o-mini',
  openaiTemperature: 0.3,
  openaiMaxTokens: 1000,
  
  // Context Window Configuration
  contextMaxTokens: 12000,
  contextSystemPromptTokens: 500,
  contextResponseReservedTokens: 3000,
  contextSummaryTokens: 200,
  
  // Intent Classification
  intentConfidenceThreshold: 0.7,
  intentAmbiguityThreshold: 0.2,
  enableMultiIntentDetection: true,
  enablePersonaInference: true,
  
  // Entity Extraction
  enableAdvancedEntities: true,
  entityExtractionMode: 'comprehensive',
  customEntityTypes: [],
  
  // Conversation Flow
  maxConversationTurns: 20,
  inactivityTimeoutSeconds: 300,
  enableJourneyRegression: true,
  enableContextSwitchDetection: true,
  
  // Lead Scoring
  enableAdvancedScoring: true,
  entityCompletenessWeight: 0.3,
  personaConfidenceWeight: 0.2,
  journeyProgressionWeight: 0.25,
  
  // Performance & Monitoring
  enablePerformanceLogging: true,
  enableIntentAnalytics: true,
  enablePersonaAnalytics: true,
  responseTimeThresholdMs: 2000,
};

export function useAdvancedParameters({
  existingConfig,
  activeOrganizationId
}: UseAdvancedParametersProps): UseAdvancedParametersReturn {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [parameters, setParameters] = useState<AdvancedParameters>(DEFAULT_PARAMETERS);

  // Update parameters when config loads
  useEffect(() => {
    if (existingConfig) {
      setParameters(prev => ({
        ...prev,
        maxConversationTurns: existingConfig.personalitySettings?.conversationFlow?.maxConversationTurns || prev.maxConversationTurns,
        inactivityTimeoutSeconds: existingConfig.personalitySettings?.conversationFlow?.inactivityTimeout || prev.inactivityTimeoutSeconds,
      }));
    }
  }, [existingConfig]);

  // Update mutation
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

    // Map advanced parameters back to config structure
    const updateData: UpdateChatbotConfigDto = {
      personalitySettings: {
        ...existingConfig.personalitySettings,
        conversationFlow: {
          ...existingConfig.personalitySettings.conversationFlow,
          maxConversationTurns: parameters.maxConversationTurns,
          inactivityTimeout: parameters.inactivityTimeoutSeconds,
        },
      },
    };

    updateMutation.mutate({
      id: existingConfig.id,
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