/**
 * Context Injection Use Case Configuration Service
 * 
 * Application service responsible for use case-specific configuration and token adjustment.
 * Single responsibility: Use case orchestration and configuration management.
 */

import { ContextGenerationOptions } from '../../../domain/services/interfaces/ContextInjectionTypes';
import { UseCase } from '../../types/ContextInjectionApplicationTypes';

export class ContextInjectionUseCaseConfigurationService {

  /**
   * Get context generation options based on use case requirements
   */
  getUseCaseOptions(useCase: UseCase): ContextGenerationOptions {
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
  }

  /**
   * Adjust token allocation based on use case requirements and context
   */
  adjustTokensForUseCase(
    useCase: UseCase, 
    baseTokens: number, 
    leadScore?: number
  ): number {
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
  }
}