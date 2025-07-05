/**
 * Vector Storage Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector storage and deletion operations
 * - Infrastructure service focused on Supabase vector persistence
 * - Keep business logic pure, handle database-specific concerns
 * - Never exceed 250 lines per @golden-rule
 * - Support batch operations and transaction safety
 * - Handle error tracking and recovery strategies
 * - Provide efficient storage optimization and cleanup
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ErrorTrackingFacade } from '../../application/services/ErrorTrackingFacade';
import {
  VectorKnowledgeItem,
  VectorStorageRecord,
  VectorQueryContext,
  VectorDeletionContext,
  VectorOperationResult,
  VectorStorageConfig
} from '../types/VectorRepositoryTypes';

/**
 * Specialized Service for Vector Storage Operations
 * 
 * AI INSTRUCTIONS:
 * - Handle batch vector storage with transaction safety
 * - Provide efficient deletion by source patterns
 * - Support error tracking and recovery strategies
 * - Maintain data consistency and integrity
 * - Handle Supabase-specific storage patterns
 */
export class VectorStorageService {
  
  private static readonly DEFAULT_STORAGE_CONFIG: VectorStorageConfig = {
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
    enableValidation: true,
    dimensionConfig: {
      expectedDimensions: 1536,
      validateDimensions: true
    }
  };

  constructor(
    private supabase: SupabaseClient,
    private errorTrackingService: ErrorTrackingFacade
  ) {}

  /**
   * Store knowledge items with vectors in batch
   * 
   * AI INSTRUCTIONS:
   * - Use clean upsert strategy (delete then insert)
   * - Handle batch operations for performance
   * - Validate vector dimensions before storage
   * - Provide comprehensive error tracking
   * - Support transaction-like consistency
   */
  async storeKnowledgeItems(
    context: VectorQueryContext,
    items: VectorKnowledgeItem[]
  ): Promise<VectorOperationResult> {
    try {
      // Validate input items
      const validation = this.validateStorageItems(items);
      if (!validation.isValid) {
        throw new BusinessRuleViolationError(
          `Invalid storage items: ${validation.errors.join(', ')}`,
          { ...context, itemCount: items.length }
        );
      }

      // Get the unique IDs of the items being upserted
      const knowledgeItemIds = items.map(item => item.knowledgeItemId);

      // Delete existing items to ensure clean upsert
      await this.deleteExistingItems(context, knowledgeItemIds);

      // Insert new records with both content and vectors
      await this.insertVectorRecords(context, items);

      return {
        success: true,
        itemsProcessed: items.length,
        errors: [],
        warnings: validation.warnings,
        metadata: { operation: 'store_knowledge_items' }
      };
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        `Knowledge vector storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { ...context, itemCount: items.length }
      );
    }
  }

  /**
   * Delete knowledge items by source pattern
   * 
   * AI INSTRUCTIONS:
   * - Support pattern matching for URL-based deletion
   * - Provide detailed logging and error tracking
   * - Handle multi-tenant isolation properly
   * - Return accurate deletion counts
   * - Support both exact and pattern-based deletion
   */
  async deleteKnowledgeItemsBySource(
    deletionContext: VectorDeletionContext
  ): Promise<number> {
    try {
      // First, check what exists matching these criteria
      const existingCount = await this.countExistingItems(deletionContext);
      
      if (existingCount === 0) {
        return 0;
      }

      // Perform the actual deletion
      const deletedCount = await this.performDeletion(deletionContext);

      return deletedCount;
    } catch (error) {
      await this.trackDeletionError(deletionContext, error);
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge vectors by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        deletionContext
      );
    }
  }

  /**
   * Delete existing items by IDs
   * 
   * AI INSTRUCTIONS:
   * - Clean deletion before upsert operations
   * - Handle batch deletion efficiently
   * - Provide error tracking for failed deletions
   * - Support transaction-like consistency
   * - Maintain multi-tenant isolation
   */
  private async deleteExistingItems(
    context: VectorQueryContext,
    knowledgeItemIds: string[]
  ): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .delete()
      .eq('organization_id', context.organizationId)
      .eq('chatbot_config_id', context.chatbotConfigId)
      .in('knowledge_item_id', knowledgeItemIds);

    if (deleteError) {
      throw new BusinessRuleViolationError(
        `Failed to delete existing knowledge vectors before upsert: ${deleteError.message}`,
        { ...context, itemCount: knowledgeItemIds.length }
      );
    }
  }

  /**
   * Insert vector records in batch
   * 
   * AI INSTRUCTIONS:
   * - Transform domain objects to storage records
   * - Handle batch insertion for performance
   * - Provide comprehensive error handling
   * - Support metadata preservation
   * - Maintain data consistency
   */
  private async insertVectorRecords(
    context: VectorQueryContext,
    items: VectorKnowledgeItem[]
  ): Promise<void> {
    const records: VectorStorageRecord[] = items.map(item => ({
      organization_id: context.organizationId,
      chatbot_config_id: context.chatbotConfigId,
      knowledge_item_id: item.knowledgeItemId,
      title: item.title,
      content: item.content,
      category: item.category,
      source_type: item.sourceType,
      source_url: item.sourceUrl,
      vector: item.embedding,
      content_hash: item.contentHash,
      metadata: item.metadata || {},
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .insert(records);

    if (insertError) {
      throw new BusinessRuleViolationError(
        `Failed to insert knowledge vectors: ${insertError.message}`,
        { ...context, itemCount: items.length }
      );
    }
  }

  /**
   * Count existing items for deletion validation
   * 
   * AI INSTRUCTIONS:
   * - Provide accurate counts before deletion
   * - Support pattern matching for URLs
   * - Handle multi-tenant filtering
   * - Enable deletion validation and logging
   * - Support both exact and pattern-based counting
   */
  private async countExistingItems(deletionContext: VectorDeletionContext): Promise<number> {
    let countQuery = this.supabase
      .from('chatbot_knowledge_vectors')
      .select('id', { count: 'exact' })
      .eq('organization_id', deletionContext.organizationId)
      .eq('chatbot_config_id', deletionContext.chatbotConfigId)
      .eq('source_type', deletionContext.sourceType);

    if (deletionContext.sourceUrl) {
      // Use pattern matching to catch all URLs from this domain
      countQuery = countQuery.like('source_url', `${deletionContext.sourceUrl}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      await this.errorTrackingService.trackKnowledgeIndexingError(
        'vector_storage_query_failed',
        {
          organizationId: deletionContext.organizationId,
          metadata: {
            chatbotConfigId: deletionContext.chatbotConfigId,
            sourceType: deletionContext.sourceType,
            sourceUrl: deletionContext.sourceUrl,
            operation: 'check_existing_vectors',
            errorCode: countError.code,
            errorMessage: countError.message
          }
        }
      );
      
      throw new Error(`Failed to check existing knowledge vectors: ${countError.message}`);
    }

    return count || 0;
  }

  /**
   * Perform actual deletion operation
   * 
   * AI INSTRUCTIONS:
   * - Execute deletion with pattern matching
   * - Handle multi-tenant isolation
   * - Provide accurate deletion counts
   * - Support error tracking and recovery
   * - Maintain data consistency
   */
  private async performDeletion(deletionContext: VectorDeletionContext): Promise<number> {
    let deleteQuery = this.supabase
      .from('chatbot_knowledge_vectors')
      .delete()
      .eq('organization_id', deletionContext.organizationId)
      .eq('chatbot_config_id', deletionContext.chatbotConfigId)
      .eq('source_type', deletionContext.sourceType);

    if (deletionContext.sourceUrl) {
      // Use pattern matching to delete all URLs from this domain
      deleteQuery = deleteQuery.like('source_url', `${deletionContext.sourceUrl}%`);
    }

    const { error: deleteError, count: deletedCount } = await deleteQuery;

    if (deleteError) {
      await this.errorTrackingService.trackKnowledgeIndexingError(
        'vector_storage_delete_failed',
        {
          organizationId: deletionContext.organizationId,
          metadata: {
            chatbotConfigId: deletionContext.chatbotConfigId,
            sourceType: deletionContext.sourceType,
            sourceUrl: deletionContext.sourceUrl,
            operation: 'delete_vectors_by_source',
            errorCode: deleteError.code,
            errorMessage: deleteError.message
          }
        }
      );
      
      throw new Error(`Failed to delete knowledge vectors by source: ${deleteError.message}`);
    }

    return deletedCount || 0;
  }

  /**
   * Validate storage items before insertion
   * 
   * AI INSTRUCTIONS:
   * - Check vector dimensions and format
   * - Validate required fields and data types
   * - Provide detailed validation results
   * - Support data integrity checks
   * - Enable early error detection
   */
  private validateStorageItems(items: VectorKnowledgeItem[]): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Items array is empty or invalid');
      return { isValid: false, errors, warnings };
    }

    items.forEach((item, index) => {
      // Validate required fields
      if (!item.knowledgeItemId) {
        errors.push(`Item ${index}: knowledge item ID is required`);
      }
      if (!item.title) {
        errors.push(`Item ${index}: title is required`);
      }
      if (!item.content) {
        errors.push(`Item ${index}: content is required`);
      }
      if (!item.category) {
        errors.push(`Item ${index}: category is required`);
      }
      if (!item.contentHash) {
        errors.push(`Item ${index}: content hash is required`);
      }

      // Validate vector dimensions
      if (!Array.isArray(item.embedding)) {
        errors.push(`Item ${index}: embedding must be an array`);
      } else if (item.embedding.length !== VectorStorageService.DEFAULT_STORAGE_CONFIG.dimensionConfig.expectedDimensions) {
        errors.push(
          `Item ${index}: vector dimension mismatch (${item.embedding.length} vs ${VectorStorageService.DEFAULT_STORAGE_CONFIG.dimensionConfig.expectedDimensions})`
        );
      }

      // Validate source type
      const validSourceTypes = ['faq', 'company_info', 'product_catalog', 'support_docs', 'website_crawled'];
      if (!validSourceTypes.includes(item.sourceType)) {
        errors.push(`Item ${index}: invalid source type '${item.sourceType}'`);
      }

      // Check for optional warnings
      if (!item.sourceUrl && item.sourceType === 'website_crawled') {
        warnings.push(`Item ${index}: website crawled item missing source URL`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Track deletion errors for monitoring
   * 
   * AI INSTRUCTIONS:
   * - Provide comprehensive error tracking
   * - Include context and metadata for debugging
   * - Support error monitoring and alerting
   * - Handle error tracking failures gracefully
   * - Enable operational insights
   */
  private async trackDeletionError(deletionContext: VectorDeletionContext, error: any): Promise<void> {
    try {
      await this.errorTrackingService.trackKnowledgeIndexingError(
        'vector_storage_deletion_failed',
        {
          organizationId: deletionContext.organizationId,
          metadata: {
            chatbotConfigId: deletionContext.chatbotConfigId,
            sourceType: deletionContext.sourceType,
            sourceUrl: deletionContext.sourceUrl,
            operation: 'delete_knowledge_items_by_source',
            errorMessage: error instanceof Error ? error.message : String(error)
          }
        }
      );
    } catch (trackingError) {
      // Error tracking failed - continue without it to avoid cascading failures
    }
  }
} 