/**
 * Vector Insertion Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector insertion operations
 * - Infrastructure service focused on Supabase vector insertion
 * - Handle batch operations and transaction safety
 * - Stay under 100 lines
 * - Support data transformation and error handling
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { VectorKnowledgeItem, VectorStorageRecord, VectorQueryContext } from '../types/VectorRepositoryTypes';

/**
 * Vector Insertion Service
 * Handles insertion of vector storage records in batch operations
 */
export class VectorInsertionService {
  
  constructor(private supabase: SupabaseClient) {}

  /** Insert vector records in batch */
  async insertVectorRecords(
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

  /** Transform knowledge items to storage records */
  private transformToStorageRecords(
    context: VectorQueryContext,
    items: VectorKnowledgeItem[]
  ): VectorStorageRecord[] {
    return items.map(item => ({
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
  }
}