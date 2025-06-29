import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorRepository } from '../../../domain/repositories/IVectorRepository';
import { KnowledgeVector } from '../../../domain/entities/KnowledgeVector';

/**
 * Supabase Vector Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Implements vector storage using Supabase pgvector extension
 * - Handles vector similarity search with cosine distance
 * - Provides efficient caching with content hash validation
 * - Supports multi-tenant isolation by organization
 */
export class SupabaseVectorRepository implements IVectorRepository {
  constructor(private supabase: SupabaseClient) {}

  async storeVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    vector: number[],
    contentHash: string,
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeVector> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .upsert({
        organization_id: organizationId,
        chatbot_config_id: chatbotConfigId,
        knowledge_item_id: knowledgeItemId,
        vector: vector,
        content_hash: contentHash,
        metadata: metadata,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,chatbot_config_id,knowledge_item_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to store vector: ${error.message}`);
    }

    return this.mapToKnowledgeVector(data);
  }

  async getVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<KnowledgeVector | null> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('knowledge_item_id', knowledgeItemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get vector: ${error.message}`);
    }

    return this.mapToKnowledgeVector(data);
  }

  async getVectorsByIds(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemIds: string[]
  ): Promise<KnowledgeVector[]> {
    if (knowledgeItemIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .in('knowledge_item_id', knowledgeItemIds);

    if (error) {
      throw new Error(`Failed to get vectors by IDs: ${error.message}`);
    }

    return data.map(row => this.mapToKnowledgeVector(row));
  }

  async getAllVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeVector[]> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get all vectors: ${error.message}`);
    }

    return data.map(row => this.mapToKnowledgeVector(row));
  }

  async deleteVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .delete()
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('knowledge_item_id', knowledgeItemId);

    if (error) {
      throw new Error(`Failed to delete vector: ${error.message}`);
    }

    return true;
  }

  async deleteAllVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<number> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .delete()
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .select('id');

    if (error) {
      throw new Error(`Failed to delete all vectors: ${error.message}`);
    }

    return data?.length || 0;
  }

  async deleteVectorsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      // First, get the knowledge item IDs that match the source criteria
      let knowledgeItemsQuery = this.supabase
        .from('chatbot_knowledge_items')
        .select('knowledge_item_id')
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .eq('source_type', sourceType);

      if (sourceUrl) {
        knowledgeItemsQuery = knowledgeItemsQuery.eq('source_url', sourceUrl);
      }

      const { data: knowledgeItems, error: itemsError } = await knowledgeItemsQuery;

      if (itemsError) {
        throw new Error(`Failed to get knowledge items for deletion: ${itemsError.message}`);
      }

      if (!knowledgeItems || knowledgeItems.length === 0) {
        return 0; // No items to delete
      }

      // Extract the knowledge item IDs
      const knowledgeItemIds = knowledgeItems.map(item => item.knowledge_item_id);

      // Delete vectors that match these knowledge item IDs
      const { data: deletedVectors, error: deleteError } = await this.supabase
        .from('chatbot_knowledge_vectors')
        .delete()
        .eq('organization_id', organizationId)
        .eq('chatbot_config_id', chatbotConfigId)
        .in('knowledge_item_id', knowledgeItemIds)
        .select('id');

      if (deleteError) {
        throw new Error(`Failed to delete vectors by source: ${deleteError.message}`);
      }

      return deletedVectors?.length || 0;
    } catch (error) {
      throw new Error(`Failed to delete vectors by source: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async vectorExists(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    contentHash: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('chatbot_config_id', chatbotConfigId)
      .eq('knowledge_item_id', knowledgeItemId)
      .eq('content_hash', contentHash)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return false;
      }
      throw new Error(`Failed to check vector existence: ${error.message}`);
    }

    return !!data;
  }

  async findSimilarVectors(
    organizationId: string,
    chatbotConfigId: string,
    queryVector: number[],
    threshold: number,
    limit: number
  ): Promise<Array<{ vector: KnowledgeVector; similarity: number; }>> {
    // Use pgvector's cosine similarity operator (<=>)
    // Convert cosine distance to similarity: similarity = 1 - distance
    const { data, error } = await this.supabase.rpc('find_similar_vectors', {
      query_organization_id: organizationId,
      query_chatbot_config_id: chatbotConfigId,
      query_vector: queryVector,
      similarity_threshold: threshold,
      match_count: limit
    });

    if (error) {
      throw new Error(`Failed to find similar vectors: ${error.message}`);
    }

    return data.map((row: any) => ({
      vector: this.mapToKnowledgeVector(row),
      similarity: row.similarity
    }));
  }

  async getVectorStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalVectors: number;
    lastUpdated: Date | null;
    avgVectorAge: number;
    storageSize: number;
  }> {
    const { data, error } = await this.supabase.rpc('get_vector_stats', {
      query_organization_id: organizationId,
      query_chatbot_config_id: chatbotConfigId
    });

    if (error) {
      throw new Error(`Failed to get vector stats: ${error.message}`);
    }

    const stats = data[0];
    return {
      totalVectors: stats?.total_vectors || 0,
      lastUpdated: stats?.last_updated ? new Date(stats.last_updated) : null,
      avgVectorAge: stats?.avg_vector_age || 0,
      storageSize: stats?.storage_size || 0
    };
  }

  /**
   * Map database row to KnowledgeVector domain entity
   * 
   * AI INSTRUCTIONS:
   * - Converts Supabase row format to domain entity
   * - Handles type conversions and validation
   * - Maintains data integrity between layers
   */
  private mapToKnowledgeVector(row: any): KnowledgeVector {
    // Ensure vector is properly parsed from pgvector format
    let vector: number[];
    if (typeof row.vector === 'string') {
      // pgvector might return as string, need to parse
      try {
        vector = JSON.parse(row.vector);
      } catch (e) {
        // Try parsing as PostgreSQL array format
        vector = row.vector
          .replace(/^\[|\]$/g, '') // Remove brackets
          .split(',')
          .map((n: string) => parseFloat(n.trim()));
      }
    } else if (Array.isArray(row.vector)) {
      vector = row.vector;
    } else {
      throw new Error(`Unexpected vector format: ${typeof row.vector}`);
    }
    
    return new KnowledgeVector(
      row.id,
      row.organization_id,
      row.chatbot_config_id,
      row.knowledge_item_id,
      vector,
      row.content_hash,
      row.metadata || {},
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
} 