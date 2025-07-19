/**
 * Vector Deletion Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector deletion operations
 * - Infrastructure service focused on Supabase vector deletion
 * - Handle pattern-based deletion and counting
 * - Stay under 150 lines
 * - Support multi-tenant isolation and error tracking
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ErrorTrackingFacade } from '../../application/services/ErrorTrackingFacade';
import { VectorQueryContext, VectorDeletionContext } from '../types/VectorRepositoryTypes';

/**
 * Vector Deletion Service
 * Handles deletion of vector storage items with pattern matching
 */
export class VectorDeletionService {
  
  constructor(
    private supabase: SupabaseClient,
    private errorTrackingService: ErrorTrackingFacade
  ) {}

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

  /** Delete existing items by IDs */
  async deleteExistingItems(
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

  /** Perform actual deletion operation */
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
   * Track deletion errors for monitoring
   * 
   * AI INSTRUCTIONS:
   * - Provide comprehensive error tracking
   * - Include context and metadata for debugging
   * - Support error monitoring and alerting
   * - Handle error tracking failures gracefully
   * - Enable operational insights
   */
  private async trackDeletionError(deletionContext: VectorDeletionContext, error: unknown): Promise<void> {
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
    } catch {
      // Error tracking failed - continue without it to avoid cascading failures
    }
  }
}