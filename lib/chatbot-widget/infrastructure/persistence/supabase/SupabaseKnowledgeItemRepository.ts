import { SupabaseClient } from '@supabase/supabase-js';
import { IKnowledgeItemRepository } from '../../../domain/repositories/IKnowledgeItemRepository';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../domain/errors/ContextManagementErrors';

/**
 * Supabase Knowledge Item Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Implements persistent storage for knowledge items with content
 * - Uses chatbot_knowledge_items table for hybrid content + vector storage
 * - Provides efficient vector similarity search capabilities
 * - Supports multi-tenant isolation by organization
 * - Follows 2025 RAG best practices for content persistence
 */
export class SupabaseKnowledgeItemRepository implements IKnowledgeItemRepository {
  constructor(private supabase: SupabaseClient) {}

  async storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    items: Array<{
      knowledgeItemId: string;
      title: string;
      content: string;
      category: string;
      tags: string[];
      sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
      sourceUrl?: string;
      sourceMetadata?: Record<string, any>;
      intentRelevance?: string[];
      relevanceScore?: number;
      embedding: number[];
      contentHash: string;
    }>
  ): Promise<void> {
    try {
      // Get the unique IDs of the items being upserted
      const knowledgeItemIds = items.map(item => item.knowledgeItemId);

      // First, delete any existing items that match on the conflict keys.
      // This ensures that any stale data (like an empty content field) is completely removed before inserting the new version.
      const { error: deleteError } = await this.supabase
        .from('chatbot_knowledge_items')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .in('knowledge_item_id', knowledgeItemIds);

      if (deleteError) {
        throw new BusinessRuleViolationError(
          `Failed to delete existing knowledge items before upsert: ${deleteError.message}`,
          { organizationId, chatbotConfigId, itemCount: items.length }
        );
      }

      const records = items.map(item => ({
        organization_id: organizationId,
        chatbot_config_id: chatbotConfigId,
        knowledge_item_id: item.knowledgeItemId,
        title: item.title,
        content: item.content,
        category: item.category,
        tags: item.tags,
        source_type: item.sourceType,
        source_url: item.sourceUrl,
        source_metadata: item.sourceMetadata || {},
        intent_relevance: item.intentRelevance || [],
        relevance_score: item.relevanceScore || 0.8,
        embedding: item.embedding,
        content_hash: item.contentHash,
        updated_at: new Date().toISOString()
      }));

      // Now, insert the new, clean records. Since we've already deleted conflicts, this is a pure insert.
      const { error: insertError } = await this.supabase
        .from('chatbot_knowledge_items')
        .insert(records);

      if (insertError) {
        throw new BusinessRuleViolationError(
          `Failed to insert new knowledge items: ${insertError.message}`,
          { organizationId, chatbotConfigId, itemCount: items.length }
        );
      }
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        `Knowledge item storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, itemCount: items.length }
      );
    }
  }

  async getKnowledgeItem(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<KnowledgeItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('knowledge_item_id', knowledgeItemId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new Error(`Failed to get knowledge item: ${error.message}`);
      }

      return this.mapToKnowledgeItem(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No rows returned')) {
        return null;
      }
      throw new BusinessRuleViolationError(
        `Failed to retrieve knowledge item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, knowledgeItemId }
      );
    }
  }

  async getKnowledgeItemsByIds(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemIds: string[]
  ): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .in('knowledge_item_id', knowledgeItemIds);

      if (error) {
        throw new Error(`Failed to get knowledge items: ${error.message}`);
      }

      return data.map(item => this.mapToKnowledgeItem(item));
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve knowledge items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, knowledgeItemIds }
      );
    }
  }

  async getAllKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_items')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get all knowledge items: ${error.message}`);
      }

      return data.map(item => this.mapToKnowledgeItem(item));
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve all knowledge items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  async searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
      intentFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    try {
      const { data, error } = await this.supabase.rpc('match_knowledge_items', {
        query_organization_id: organizationId,
        query_chatbot_config_id: chatbotConfigId,
        query_embedding: queryEmbedding,
        match_threshold: options.threshold || 0.7,
        match_count: options.limit || 3,
        intent_filter: options.intentFilter,
        category_filter: options.categoryFilter,
        source_type_filter: options.sourceTypeFilter
      });

      if (error) {
        throw new Error(`Failed to search knowledge items: ${error.message}`);
      }

      return data.map((row: any) => ({
        item: {
          id: row.knowledge_item_id,
          title: row.title,
          content: row.content,
          category: row.category,
          tags: row.tags || [],
          relevanceScore: 0.8, // Default relevance score
          source: row.source_url || 'stored',
          lastUpdated: new Date()
        } as KnowledgeItem,
        similarity: row.similarity
      }));
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge item search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, options }
      );
    }
  }

  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      let query = this.supabase
        .from('chatbot_knowledge_items')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('source_type', sourceType);

      if (sourceUrl) {
        query = query.eq('source_url', sourceUrl);
      }

      const { data, error } = await query.select();

      if (error) {
        throw new Error(`Failed to delete knowledge items: ${error.message}`);
      }

      return data.length;
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge items by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
    }
  }

  async deleteKnowledgeItem(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('chatbot_knowledge_items')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('knowledge_item_id', knowledgeItemId);

      if (error) {
        throw new Error(`Failed to delete knowledge item: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, knowledgeItemId }
      );
    }
  }

  async knowledgeItemExists(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    contentHash: string
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_items')
        .select('content_hash')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('knowledge_item_id', knowledgeItemId)
        .eq('content_hash', contentHash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return false;
        }
        throw new Error(`Failed to check knowledge item existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      // If item doesn't exist, return false
      return false;
    }
  }

  async getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_items')
        .select('source_type, category, updated_at')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId);

      if (error) {
        throw new Error(`Failed to get knowledge item stats: ${error.message}`);
      }

      const stats = {
        totalItems: data.length,
        itemsBySourceType: {} as Record<string, number>,
        itemsByCategory: {} as Record<string, number>,
        lastUpdated: null as Date | null,
        storageSize: 0 // TODO: Calculate actual storage size
      };

      // Calculate statistics
      data.forEach(item => {
        // Count by source type
        stats.itemsBySourceType[item.source_type] = 
          (stats.itemsBySourceType[item.source_type] || 0) + 1;

        // Count by category
        stats.itemsByCategory[item.category] = 
          (stats.itemsByCategory[item.category] || 0) + 1;

        // Track latest update
        const updatedAt = new Date(item.updated_at);
        if (!stats.lastUpdated || updatedAt > stats.lastUpdated) {
          stats.lastUpdated = updatedAt;
        }
      });

      return stats;
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge item statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Map database record to KnowledgeItem domain object
   * 
   * AI INSTRUCTIONS:
   * - Transforms database format to domain format
   * - Handles type conversions and null values
   * - Maintains clean separation between infrastructure and domain
   */
  private mapToKnowledgeItem(data: any): KnowledgeItem {
    return {
      id: data.knowledge_item_id,
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      relevanceScore: data.relevance_score || 0.8,
      source: data.source_url || 'stored',
      lastUpdated: new Date(data.updated_at)
    };
  }
} 