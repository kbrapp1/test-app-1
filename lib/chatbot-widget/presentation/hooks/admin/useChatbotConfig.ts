'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChatbotConfigDto, 
  CreateChatbotConfigDto, 
  UpdateChatbotConfigDto 
} from '../../../application/dto/ChatbotConfigDto';
import {
  createChatbotConfig,
  updateChatbotConfig,
  getChatbotConfigById,
  getChatbotConfigByOrganization,
  getActiveChatbotConfigs,
  deleteChatbotConfig,
  getChatbotConfigStats
} from '../../actions/configActions';

export interface UseChatbotConfigOptions {
  organizationId?: string;
  configId?: string;
  enabled?: boolean;
}

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

export function useChatbotConfig(configId?: string, organizationId?: string) {
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

export function useCreateChatbotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChatbotConfigDto) => {
      const result = await createChatbotConfig(data);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create chatbot config');
      }
      return result.data;
    },
    onSuccess: (newConfig, variables) => {
      if (newConfig) {
        // Invalidate and refetch configs list
        queryClient.invalidateQueries({ 
          queryKey: ['chatbot-configs', variables.organizationId] 
        });
        
        // Add the new config to cache
        queryClient.setQueryData(
          ['chatbot-config', newConfig.id], 
          newConfig
        );
      }
    },
    onError: (error) => {
      // Error logged by error boundary
    },
  });
}

export function useUpdateChatbotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      configId, 
      data,
      organizationId 
    }: { 
      configId: string; 
      data: UpdateChatbotConfigDto;
      organizationId: string;
    }) => {
      const result = await updateChatbotConfig(configId, data, organizationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update chatbot config');
      }
      return result.data;
    },
    onSuccess: (updatedConfig, variables) => {
      if (updatedConfig) {
        // Update the specific config in cache
        queryClient.setQueryData(
          ['chatbot-config', updatedConfig.id], 
          updatedConfig
        );
        
        // Invalidate configs list to ensure consistency
        queryClient.invalidateQueries({ 
          queryKey: ['chatbot-configs', variables.organizationId] 
        });
      }
    },
    onError: (error) => {
      // Error logged by error boundary
    },
  });
}

export function useDeleteChatbotConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ configId, organizationId }: { configId: string; organizationId: string }) => {
      const result = await deleteChatbotConfig(configId, organizationId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete chatbot config');
      }
      return configId;
    },
    onSuccess: (configId, variables) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: ['chatbot-config', configId] 
      });
      
      // Invalidate configs list
      queryClient.invalidateQueries({ 
        queryKey: ['chatbot-configs', variables.organizationId] 
      });
    },
    onError: (error) => {
      // Error logged by error boundary
    },
  });
}

// Configuration validation utility
export function useConfigValidation() {
  const validateConfig = (config: Partial<CreateChatbotConfigDto | UpdateChatbotConfigDto>) => {
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

  return { validateConfig };
} 