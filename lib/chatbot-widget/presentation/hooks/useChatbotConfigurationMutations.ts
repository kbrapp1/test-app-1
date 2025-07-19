/**
 * Chatbot Configuration Mutations Service
 * 
 * AI INSTRUCTIONS:
 * - Handles React Query mutations for chatbot configurations
 * - Preserves organization security boundaries
 * - Manages cache invalidation and optimistic updates
 * - Focused on mutation concerns only
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto
} from '../../application/dto/ChatbotConfigDto';
import {
  createChatbotConfig,
  deleteChatbotConfig,
  updateChatbotConfig
} from '../actions/configActions';

export function useChatbotConfigurationMutations(activeOrganizationId: string | null) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateChatbotConfigDto) => createChatbotConfig(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
        queryClient.invalidateQueries({ queryKey: ['chatbot-configs', activeOrganizationId] });
      }
    },
  });

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
      }
    },
  });

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

  const executeCreate = async (data: CreateChatbotConfigDto) => {
    return createMutation.mutateAsync(data);
  };

  const executeUpdate = async (id: string, data: UpdateChatbotConfigDto) => {
    return updateMutation.mutateAsync({ id, data });
  };

  const executeDelete = async (configId: string) => {
    return deleteMutation.mutateAsync({ configId });
  };

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    
    // Async methods for programmatic use
    createConfig: executeCreate,
    updateConfig: executeUpdate,
    deleteConfig: executeDelete,
    
    // Status flags
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}