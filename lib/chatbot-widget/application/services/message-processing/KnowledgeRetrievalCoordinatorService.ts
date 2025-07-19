/**
 * Knowledge Retrieval Coordinator Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for coordinating knowledge retrieval operations
 * - Handles context building and search coordination for knowledge queries
 * - Follow @golden-rule patterns exactly - single responsibility for knowledge coordination
 * - Orchestrates knowledge services without implementing business logic
 */

import { IntentResult } from '../../../domain/value-objects/message-processing/IntentResult';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export interface KnowledgeQueryContext {
  userQuery: string;
  intentResult?: IntentResult;
  conversationHistory?: string[];
  userPreferences?: Record<string, unknown>;
  maxResults?: number;
  minRelevanceScore?: number;
}

export class KnowledgeRetrievalCoordinatorService {
  
  constructor(
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {}

  /**
   * Retrieve knowledge for query context with proper fallback handling
   * Coordinates between knowledge service and context building
   */
  async retrieveKnowledge(
    query: string, 
    context?: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.knowledgeRetrievalService) {
      return null;
    }

    const searchContext = this.buildKnowledgeSearchContext(query, context);
    const result = await this.knowledgeRetrievalService.searchKnowledge(searchContext);
    
    return result.items;
  }

  /**
   * Build comprehensive search context for knowledge retrieval
   * Extracts and normalizes context data for knowledge service
   */
  private buildKnowledgeSearchContext(
    query: string, 
    context?: Record<string, unknown>
  ): KnowledgeQueryContext {
    return {
      userQuery: query,
      intentResult: context?.intentResult as IntentResult,
      conversationHistory: context?.conversationHistory as string[],
      userPreferences: context?.userPreferences as Record<string, unknown>,
      maxResults: (context?.maxResults as number) || 5,
      minRelevanceScore: (context?.minRelevanceScore as number) || 0.5
    };
  }

  /**
   * Check if knowledge retrieval service is available
   * Useful for conditional knowledge enhancement
   */
  isKnowledgeServiceAvailable(): boolean {
    return Boolean(this.knowledgeRetrievalService);
  }

  /**
   * Retrieve knowledge with enhanced context for complex queries
   * Includes additional context enrichment for better search results
   */
  async retrieveKnowledgeWithEnhancedContext(
    query: string,
    conversationHistory: string[],
    userPreferences: Record<string, unknown>,
    intentResult?: IntentResult
  ): Promise<unknown> {
    if (!this.knowledgeRetrievalService) {
      return null;
    }

    const enhancedContext: KnowledgeQueryContext = {
      userQuery: query,
      intentResult,
      conversationHistory,
      userPreferences,
      maxResults: 10, // Higher limit for enhanced queries
      minRelevanceScore: 0.3 // Lower threshold for broader results
    };

    const result = await this.knowledgeRetrievalService.searchKnowledge(enhancedContext);
    return result.items;
  }
}