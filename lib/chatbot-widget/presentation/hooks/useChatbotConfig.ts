/**
 * Chatbot Config Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Chatbot configuration data management
 * - Encapsulate React Query logic for config operations
 * - Return clean interface for components
 * - Handle loading and error states consistently
 * - Follow @golden-rule patterns exactly
 */

import { useQuery } from '@tanstack/react-query';
import { getChatbotConfigByOrganization } from '../actions/configActions';

export function useChatbotConfig(organizationId: string | null) {
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', organizationId],
    queryFn: () => organizationId ? getChatbotConfigByOrganization(organizationId) : null,
    enabled: !!organizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  return {
    configResult,
    isLoading,
    error,
    existingConfig,
  };
} 