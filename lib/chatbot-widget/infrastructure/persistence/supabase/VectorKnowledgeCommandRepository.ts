import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeCommandRepository } from '../../../domain/repositories/IVectorKnowledgeCommandRepository';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../../../application/services/ErrorTrackingFacade';
import { VectorStorageService } from '../../services/VectorStorageService';
import {
  VectorKnowledgeItem,
  VectorQueryContext,
  VectorDeletionContext
} from '../../types/VectorRepositoryTypes';

/**
 * Vector Knowledge Command Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Handles all write operations for vector knowledge
 * - Delegates to VectorStorageService for implementation
 * - Maintains clean separation of concerns
 * - Follows CQRS pattern for command responsibility
 * - Support multi-tenant isolation by organization
 * - Keep under 150 lines per DDD splitting guidelines
 */
export class VectorKnowledgeCommandRepository implements IVectorKnowledgeCommandRepository {
  private readonly errorTrackingService: ErrorTrackingFacade;
  private readonly storageService: VectorStorageService;

  constructor(private supabase: SupabaseClient) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
    this.storageService = new VectorStorageService(supabase, this.errorTrackingService);
  }

  /** Store knowledge items with vectors */
  async storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    items: Array<{
      knowledgeItemId: string;
      title: string;
      content: string;
      category: string;
      sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
      sourceUrl?: string;
      embedding: number[];
      contentHash: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      const vectorItems: VectorKnowledgeItem[] = items.map(item => ({
        knowledgeItemId: item.knowledgeItemId,
        title: item.title,
        content: item.content,
        category: item.category,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        embedding: item.embedding,
        contentHash: item.contentHash,
        metadata: item.metadata
      }));

      await this.storageService.storeKnowledgeItems(context, vectorItems);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        `Knowledge vector storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, itemCount: items.length }
      );
    }
  }

  /** Delete knowledge items by source pattern */
  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      const deletionContext: VectorDeletionContext = {
        organizationId,
        chatbotConfigId,
        sourceType,
        sourceUrl
      };

      return await this.storageService.deleteKnowledgeItemsBySource(deletionContext);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge vectors by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
    }
  }
}