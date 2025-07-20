// Vector Knowledge Retrieval Domain Service
//
// AI INSTRUCTIONS:
// - Pure domain service with business validation only
// - Enforces business constraints and domain rules for knowledge retrieval

import { 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';

// Pure domain service for knowledge retrieval business rules
export class VectorKnowledgeRetrievalDomainService {
  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  // Validate search context against business rules
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

  // Validate search results integrity
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

  // Business rule: No modifications allowed in retrieval service
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