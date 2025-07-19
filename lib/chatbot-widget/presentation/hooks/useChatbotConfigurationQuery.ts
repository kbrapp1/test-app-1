/**
 * Chatbot Configuration Query Service
 * 
 * AI INSTRUCTIONS:
 * - Handles React Query operations for chatbot configurations
 * - Preserves organization security boundaries
 * - Focused on data fetching concerns only
 * - Follows presentation layer patterns
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getActiveChatbotConfigs,
  getChatbotConfigById,
  getChatbotConfigByOrganization
} from '../actions/configActions';

export interface UseChatbotConfigurationQueryOptions {
  configId?: string;
  autoLoad?: boolean;
}

export function useChatbotConfigurationQuery(
  activeOrganizationId: string | null,
  options: UseChatbotConfigurationQueryOptions = {}
) {
  const { autoLoad = true } = options;

  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId && autoLoad,
    staleTime: 10000, // AI: Reduced from 5 minutes to 10 seconds for more responsive updates during crawling
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  return {
    config: existingConfig,
    isLoading,
    error,
    configResult
  };
}

export function useChatbotConfigs(organizationId?: string) {
  return useQuery({
    queryKey: ['chatbot-configs', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await getActiveChatbotConfigs(organizationId);
      return result.success ? result.data || [] : [];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useChatbotConfigById(configId?: string, organizationId?: string) {
  return useQuery({
    queryKey: ['chatbot-config', configId],
    queryFn: async () => {
      if (!configId) return null;
      const result = await getChatbotConfigById(configId, organizationId);
      return result.success ? result.data : null;
    },
    enabled: !!configId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}