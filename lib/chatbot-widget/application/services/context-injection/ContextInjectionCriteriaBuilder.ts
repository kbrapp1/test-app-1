/**
 * Context Injection Criteria Builder
 * 
 * Application service responsible for building selection criteria from input parameters.
 * Single responsibility: Data transformation and criteria construction.
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { 
  ContextSelectionCriteria, 
  EntityData 
} from '../../../domain/services/interfaces/ContextInjectionTypes';

export class ContextInjectionCriteriaBuilder {

  /**
   * Build selection criteria from input parameters
   * Transforms raw input data into structured criteria for context selection
   */
  buildSelectionCriteria(
    availableTokens: number,
    conversationHistory: ChatMessage[],
    entityData?: EntityData,
    leadScore?: number,
    qualificationStatus?: string
  ): ContextSelectionCriteria {
    return {
      availableTokens,
      leadScore,
      qualificationStatus,
      messageCount: conversationHistory.length,
      entityData
    };
  }
}