/**
 * Context Injection Helpers
 * 
 * Simple utility functions for context injection operations.
 * No complex logic - just data transformation and configuration.
 */

import { ChatMessage } from '../../domain/entities/ChatMessage';
import {
  ContextSelectionCriteria,
  EntityData,
  ContextGenerationOptions
} from '../../domain/services/interfaces/ContextInjectionTypes';

type UseCase = 'greeting' | 'qualification' | 'demonstration' | 'closing';

/** Build selection criteria from input parameters */
export const buildSelectionCriteria = (
  availableTokens: number,
  conversationHistory: ChatMessage[],
  entityData?: EntityData,
  leadScore?: number,
  qualificationStatus?: string
): ContextSelectionCriteria => {
  return {
    availableTokens,
    leadScore,
    qualificationStatus,
    messageCount: conversationHistory.length,
    entityData
  };
};

/** Get context generation options based on use case */
export const getUseCaseOptions = (useCase: UseCase): ContextGenerationOptions => {
  const baseOptions: ContextGenerationOptions = {
    includeUserProfile: true,
    includeCompanyContext: true,
    includeConversationPhase: true,
    includeLeadScoring: true,
    includeKnowledgeBase: true,
    includeIndustrySpecific: true,
    includeConversationHistory: true,
    includeBusinessHours: true,
    includeEngagementOptimization: true
  };
  
  switch (useCase) {
    case 'greeting':
      return { ...baseOptions, includeLeadScoring: false, includeConversationHistory: false };
    case 'qualification':
      return { ...baseOptions, includeLeadScoring: true, includeIndustrySpecific: true };
    case 'demonstration':
      return { ...baseOptions, includeKnowledgeBase: true, includeIndustrySpecific: true };
    case 'closing':
      return { ...baseOptions, includeLeadScoring: true, includeEngagementOptimization: true };
    default:
      return baseOptions;
  }
};

/** Adjust token allocation based on use case requirements */
export const adjustTokensForUseCase = (
  useCase: UseCase, 
  baseTokens: number, 
  leadScore?: number
): number => {
  switch (useCase) {
    case 'greeting':
      return Math.min(baseTokens, 800);
    case 'qualification':
      return baseTokens;
    case 'demonstration':
      return Math.max(baseTokens, 1200);
    case 'closing':
      return leadScore && leadScore > 70 ? Math.max(baseTokens, 1500) : baseTokens;
    default:
      return baseTokens;
  }
};