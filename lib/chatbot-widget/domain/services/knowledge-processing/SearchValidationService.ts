/**
 * Search Validation Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Validate search context and parameters
 * - Pure domain validation with no external dependencies
 * - Enforce business rules for knowledge search operations
 * - Never exceed 250 lines per @golden-rule
 */

import { KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Specialized service for validating knowledge search operations
 * 
 * AI INSTRUCTIONS:
 * - Validates search context and parameters according to business rules
 * - Throws domain-specific errors for validation failures
 * - Pure validation logic with no side effects
 * - Security: Preserves organizationId for all validation operations
 */
export class SearchValidationService {
  private static readonly MAX_QUERY_LENGTH = 2000;
  private static readonly MIN_QUERY_LENGTH = 1;
  private static readonly MAX_RESULTS_LIMIT = 50;
  private static readonly MIN_RELEVANCE_SCORE = 0.0;
  private static readonly MAX_RELEVANCE_SCORE = 1.0;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Validate complete search context for knowledge retrieval
   * 
   * AI INSTRUCTIONS:
   * - Validates all required fields and business constraints
   * - Throws specific domain errors for each validation failure
   * - Preserves security context in all error messages
   */
  validateSearchContext(context: KnowledgeRetrievalContext): void {
    this.validateUserQuery(context.userQuery);
    this.validateLogFile(context.sharedLogFile);
    this.validateSearchParameters(context);
  }

  /**
   * Validate user query meets business requirements
   */
  private validateUserQuery(query?: string): void {
    if (!query?.trim()) {
      throw new BusinessRuleViolationError(
        'Query is required for knowledge search',
        { 
          query,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < SearchValidationService.MIN_QUERY_LENGTH) {
      throw new BusinessRuleViolationError(
        `Query must be at least ${SearchValidationService.MIN_QUERY_LENGTH} character`,
        { 
          query: trimmedQuery,
          length: trimmedQuery.length,
          organizationId: this.organizationId
        }
      );
    }

    if (trimmedQuery.length > SearchValidationService.MAX_QUERY_LENGTH) {
      throw new BusinessRuleViolationError(
        `Query exceeds maximum length of ${SearchValidationService.MAX_QUERY_LENGTH} characters`,
        { 
          query: trimmedQuery.substring(0, 100) + '...',
          length: trimmedQuery.length,
          organizationId: this.organizationId
        }
      );
    }
  }

  /**
   * Validate shared log file requirement
   */
  private validateLogFile(sharedLogFile?: string): void {
    if (!sharedLogFile) {
      throw new BusinessRuleViolationError(
        'SharedLogFile is required for knowledge search operations - all logging must be conversation-specific',
        { 
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Validate search parameters meet business constraints
   */
  private validateSearchParameters(context: KnowledgeRetrievalContext): void {
    if (context.maxResults !== undefined) {
      if (context.maxResults <= 0 || context.maxResults > SearchValidationService.MAX_RESULTS_LIMIT) {
        throw new BusinessRuleViolationError(
          `maxResults must be between 1 and ${SearchValidationService.MAX_RESULTS_LIMIT}`,
          { 
            maxResults: context.maxResults,
            organizationId: this.organizationId
          }
        );
      }
    }

    if (context.minRelevanceScore !== undefined) {
      if (context.minRelevanceScore < SearchValidationService.MIN_RELEVANCE_SCORE || 
          context.minRelevanceScore > SearchValidationService.MAX_RELEVANCE_SCORE) {
        throw new BusinessRuleViolationError(
          `minRelevanceScore must be between ${SearchValidationService.MIN_RELEVANCE_SCORE} and ${SearchValidationService.MAX_RELEVANCE_SCORE}`,
          { 
            minRelevanceScore: context.minRelevanceScore,
            organizationId: this.organizationId
          }
        );
      }
    }
  }
}