import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../../errors/base';

/**
 * Supabase Vector Knowledge Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Uses chatbot_knowledge_vectors table for unified content + vector storage
 * - Single-table approach for optimal performance and consistency
 * - Provides efficient semantic search with complete content context
 * - Supports multi-tenant isolation by organization
 * - Follows 2025 RAG best practices for vector + content persistence
 */
export class SupabaseVectorKnowledgeRepository implements IVectorKnowledgeRepository {
  constructor(private supabase: SupabaseClient) {}

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
    }>
  ): Promise<void> {
    try {
      // Get the unique IDs of the items being upserted
      const knowledgeItemIds = items.map(item => item.knowledgeItemId);

      // Delete existing items to ensure clean upsert
      const { error: deleteError } = await this.supabase
        .from('chatbot_knowledge_vectors')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .in('knowledge_item_id', knowledgeItemIds);

      if (deleteError) {
        throw new BusinessRuleViolationError(
          `Failed to delete existing knowledge vectors before upsert: ${deleteError.message}`,
          { organizationId, chatbotConfigId, itemCount: items.length }
        );
      }

      // Insert new records with both content and vectors
      const records = items.map(item => ({
        organization_id: organizationId,
        chatbot_config_id: chatbotConfigId,
        knowledge_item_id: item.knowledgeItemId,
        title: item.title,
        content: item.content,
        category: item.category,
        source_type: item.sourceType,
        source_url: item.sourceUrl,
        vector: item.embedding,
        content_hash: item.contentHash,
        metadata: {},
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await this.supabase
        .from('chatbot_knowledge_vectors')
        .insert(records);

      if (insertError) {
        throw new BusinessRuleViolationError(
          `Failed to insert knowledge vectors: ${insertError.message}`,
          { organizationId, chatbotConfigId, itemCount: items.length }
        );
      }
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

  async searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    try {
      const { data, error } = await this.supabase.rpc('find_similar_vectors', {
        query_organization_id: organizationId,
        query_chatbot_config_id: chatbotConfigId,
        query_vector: queryEmbedding,
        similarity_threshold: options.threshold || 0.7,
        match_count: options.limit || 3
      });

      if (error) {
        throw new Error(`Failed to search knowledge vectors: ${error.message}`);
      }

      return data
        .filter((row: any) => {
          // Apply category filter if specified
          if (options.categoryFilter && row.category !== options.categoryFilter) {
            return false;
          }
          // Apply source type filter if specified
          if (options.sourceTypeFilter && row.source_type !== options.sourceTypeFilter) {
            return false;
          }
          return true;
        })
        .map((row: any) => ({
          item: {
            id: row.knowledge_item_id,
            title: row.title,
            content: row.content,
            category: row.category,
            tags: [],
            relevanceScore: row.similarity,
            source: row.source_url || 'stored',
            lastUpdated: new Date(row.updated_at)
          } as KnowledgeItem,
          similarity: row.similarity
        }));
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, options }
      );
    }
  }

  async getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{ item: KnowledgeItem; vector: number[]; }>> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_vectors')
        .select('knowledge_item_id, title, content, category, source_type, source_url, vector, updated_at')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId);

      if (error) {
        throw new Error(`Failed to get all knowledge vectors: ${error.message}`);
      }

      return data.map((row: any) => {
        // Validate vector dimensions to prevent cache corruption
        const vectorData = row.vector;
        let processedVector: number[];
        
        if (Array.isArray(vectorData)) {
          processedVector = vectorData as number[];
        } else if (typeof vectorData === 'string') {
          // Handle case where Supabase returns vector as string
          try {
            processedVector = JSON.parse(vectorData) as number[];
          } catch (e) {
            throw new Error(`Invalid vector format for ${row.knowledge_item_id}`);
          }
        } else {
          throw new Error(`Unexpected vector type for ${row.knowledge_item_id}: ${typeof vectorData}`);
        }
        
        // Validate vector dimensions (critical for preventing dimension mismatch errors)
        if (processedVector.length !== 1536) {
          throw new Error(`Vector dimension mismatch for ${row.knowledge_item_id}: ${processedVector.length} dimensions (expected 1536)`);
        }

        return {
          item: {
            id: row.knowledge_item_id,
            title: row.title,
            content: row.content,
            category: row.category,
            tags: [],
            relevanceScore: 1.0, // Default relevance for cache initialization
            source: row.source_url || 'stored',
            lastUpdated: new Date(row.updated_at)
          } as KnowledgeItem,
          vector: processedVector
        };
      });
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve all knowledge vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
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
        .from('chatbot_knowledge_vectors')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('source_type', sourceType);

      if (sourceUrl) {
        query = query.eq('source_url', sourceUrl);
      }

      const { error, count } = await query;

      if (error) {
        throw new Error(`Failed to delete knowledge vectors by source: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge vectors by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
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
        .from('chatbot_knowledge_vectors')
        .select('source_type, category, updated_at')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId);

      if (error) {
        throw new Error(`Failed to get knowledge vector stats: ${error.message}`);
      }

      // Get storage stats using existing RPC function
      let storageSize = 0;
      try {
        const { data: statsData, error: statsError } = await this.supabase.rpc('get_vector_stats', {
          query_organization_id: organizationId,
          query_chatbot_config_id: chatbotConfigId
        });
        
        if (!statsError && statsData && statsData.length > 0) {
          storageSize = statsData[0].storage_size || 0;
        }
      } catch (error) {
        // Storage size calculation failed - continue without it
        storageSize = 0;
      }

      const stats = {
        totalItems: data.length,
        itemsBySourceType: {} as Record<string, number>,
        itemsByCategory: {} as Record<string, number>,
        lastUpdated: null as Date | null,
        storageSize
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
        `Failed to get knowledge vector statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }
} 