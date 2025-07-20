/**
 * Knowledge Error Handler
 * 
 * AI INSTRUCTIONS:
 * - Application layer helper for knowledge management error handling
 * - Standardizes error handling patterns across knowledge operations
 * - Single responsibility: error transformation and context preservation
 * - Preserves organization security context in all error scenarios
 */

import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

export interface KnowledgeOperationContext {
  organizationId: string;
  chatbotConfigId: string;
  operation: string;
  additionalContext?: Record<string, unknown>;
}

export class KnowledgeErrorHandler {
  /**
   * Handle knowledge retrieval errors with proper context preservation
   */
  static handleKnowledgeRetrievalError(
    error: unknown,
    context: KnowledgeOperationContext,
    specificOperation: string
  ): never {
    // Handle validation errors (pass through with enhanced context)
    if (error instanceof Error && error.message.includes('required')) {
      throw new BusinessRuleViolationError(
        error.message,
        { 
          ...context.additionalContext,
          organizationId: context.organizationId,
          chatbotConfigId: context.chatbotConfigId,
          operation: context.operation
        }
      );
    }
    
    // Handle general errors with security context preservation
    throw new BusinessRuleViolationError(
      `Failed to ${specificOperation}`,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context.additionalContext,
        organizationId: context.organizationId,
        chatbotConfigId: context.chatbotConfigId,
        operation: context.operation
      }
    );
  }

  /**
   * Handle knowledge deletion errors with proper context preservation
   */
  static handleKnowledgeDeletionError(
    error: unknown,
    context: KnowledgeOperationContext
  ): never {
    return this.handleKnowledgeRetrievalError(
      error,
      context,
      'delete knowledge items'
    );
  }

  /**
   * Handle knowledge statistics errors with proper context preservation
   */
  static handleKnowledgeStatisticsError(
    error: unknown,
    context: KnowledgeOperationContext
  ): never {
    return this.handleKnowledgeRetrievalError(
      error,
      context,
      'retrieve knowledge statistics'
    );
  }

  /**
   * Create error context for knowledge operations
   */
  static createKnowledgeOperationContext(
    organizationId: string,
    chatbotConfigId: string,
    operation: string,
    additionalContext?: Record<string, unknown>
  ): KnowledgeOperationContext {
    return {
      organizationId,
      chatbotConfigId,
      operation,
      additionalContext
    };
  }

  /**
   * Create context for category-based operations
   */
  static createCategoryOperationContext(
    organizationId: string,
    chatbotConfigId: string,
    category: string
  ): KnowledgeOperationContext {
    return this.createKnowledgeOperationContext(
      organizationId,
      chatbotConfigId,
      'getKnowledgeByCategory',
      { category }
    );
  }

  /**
   * Create context for tag-based operations
   */
  static createTagOperationContext(
    organizationId: string,
    chatbotConfigId: string,
    tags: string[]
  ): KnowledgeOperationContext {
    return this.createKnowledgeOperationContext(
      organizationId,
      chatbotConfigId,
      'getKnowledgeByTags',
      { tags }
    );
  }

  /**
   * Create context for source-based operations
   */
  static createSourceOperationContext(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): KnowledgeOperationContext {
    return this.createKnowledgeOperationContext(
      organizationId,
      chatbotConfigId,
      'deleteKnowledgeBySource',
      { sourceType, sourceUrl }
    );
  }
}