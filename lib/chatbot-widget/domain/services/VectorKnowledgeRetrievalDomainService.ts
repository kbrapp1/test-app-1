/**
 * Vector Knowledge Retrieval Domain Service (Pure Domain Layer)
 * 
 * DOMAIN LAYER RESPONSIBILITIES:
 * - Pure business logic for knowledge retrieval validation
 * - Domain rules and constraints enforcement
 * - Business rule validation only
 * - No infrastructure, application, or cross-cutting concerns
 * 
 * DDD LAYER: Domain (pure business logic)
 * FILE SIZE: 60-80 lines
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service with business validation only
 * - No logging, caching, orchestration, or external dependencies
 * - Enforces business constraints and domain rules
 * - Throws domain-specific errors for business rule violations
 */

import { 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';

/**
 * Pure Domain Service for Knowledge Retrieval Business Rules
 * 
 * DOMAIN RESPONSIBILITIES:
 * - Validate search context against business rules
 * - Validate search results integrity
 * - Enforce domain constraints and limits
 * - Business rule validation only
 */
export class VectorKnowledgeRetrievalDomainService {
  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Domain validation for search context
   * Enforces business rules for knowledge search operations
   */
  validateSearchContext(context: KnowledgeRetrievalContext): void {
    // Business rule: Query must not be empty
    if (!context.userQuery?.trim()) {
      throw new BusinessRuleViolationError(
        'Search query cannot be empty',
        { organizationId: this.organizationId }
      );
    }

    // Business rule: Query length constraints
    if (context.userQuery.length > 1000) {
      throw new BusinessRuleViolationError(
        'Search query too long - maximum 1000 characters',
        { 
          organizationId: this.organizationId,
          queryLength: context.userQuery.length
        }
      );
    }

    // Business rule: Results limit constraints
    if (context.maxResults && context.maxResults > 50) {
      throw new BusinessRuleViolationError(
        'Maximum results cannot exceed 50',
        { 
          organizationId: this.organizationId,
          requestedResults: context.maxResults
        }
      );
    }
  }

  /**
   * Domain validation for search results
   * Enforces business rules for search result integrity
   */
  validateSearchResults(result: KnowledgeSearchResult): void {
    // Business rule: Validate result integrity
    if (!result.items) {
      throw new BusinessRuleViolationError(
        'Search result missing items array',
        { organizationId: this.organizationId }
      );
    }

    // Business rule: Validate relevance scores
    const invalidItems = result.items.filter(
      item => item.relevanceScore < 0 || item.relevanceScore > 1
    );
    
    if (invalidItems.length > 0) {
      throw new BusinessRuleViolationError(
        'Invalid relevance scores in search results',
        { 
          organizationId: this.organizationId,
          invalidItemCount: invalidItems.length
        }
      );
    }
  }

  /**
   * Business rule: Knowledge modifications not allowed in retrieval service
   */
  validateModificationOperation(): never {
    throw new BusinessRuleViolationError(
      'Knowledge modifications not supported by retrieval service',
      { 
        operation: 'modification',
        organizationId: this.organizationId,
        recommendation: 'Use VectorKnowledgeApplicationService for modifications'
      }
    );
  }
}