/**
 * Vector Statistics Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle all database queries for vector statistics
 * - Infrastructure service focused on Supabase data retrieval
 * - Keep queries optimized and efficient
 * - Never exceed 250 lines per @golden-rule
 * - Handle error propagation without business logic
 * - Provide clean data access interface for statistics
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { VectorQueryContext } from '../types/VectorRepositoryTypes';

/**
 * Specialized Query Service for Vector Statistics Data Retrieval
 * 
 * AI INSTRUCTIONS:
 * - Handle all database queries for vector analytics
 * - Optimize queries for statistics and analytics
 * - Provide clean data access interface
 * - Handle database errors without transformation
 * - Support multiple query patterns for different analytics
 */
export class VectorStatisticsQueryService {
  
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get basic statistics data from database
   * 
   * AI INSTRUCTIONS:
   * - Query fundamental data efficiently
   * - Return raw data for metrics calculation
   * - Handle empty datasets gracefully
   * - Optimize for aggregation queries
   * - Provide foundation data for statistics
   */
  async getBasicStatisticsData(context: VectorQueryContext): Promise<Array<{
    source_type: string;
    category: string;
    updated_at: string;
  }>> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('source_type, category, updated_at')
      .eq('organization_id', context.organizationId)
      .eq('chatbot_config_id', context.chatbotConfigId);

    if (error) {
      throw new Error(`Failed to get knowledge vector stats: ${error.message}`);
    }

    return data || [];
  }

  /** Get optimization data for storage analysis */
  async getOptimizationData(context: VectorQueryContext): Promise<Array<{
    vector: any;
    content_hash: string;
    created_at: string;
    updated_at: string;
  }>> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('vector, content_hash, created_at, updated_at')
      .eq('organization_id', context.organizationId)
      .eq('chatbot_config_id', context.chatbotConfigId);

    if (error) {
      throw new Error(`Failed to get storage optimization metrics: ${error.message}`);
    }

    return data || [];
  }

  /** Get health metrics data for content analysis */
  async getHealthMetricsData(context: VectorQueryContext): Promise<Array<{
    updated_at: string;
    created_at: string;
    category: string;
    source_type: string;
  }>> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('updated_at, created_at, category, source_type')
      .eq('organization_id', context.organizationId)
      .eq('chatbot_config_id', context.chatbotConfigId);

    if (error) {
      throw new Error(`Failed to get health metrics: ${error.message}`);
    }

    return data || [];
  }

  /** Get usage analytics data for pattern analysis */
  async getUsageAnalyticsData(context: VectorQueryContext): Promise<Array<{
    knowledge_item_id: string;
    title: string;
    category: string;
    updated_at: string;
  }>> {
    const { data, error } = await this.supabase
      .from('chatbot_knowledge_vectors')
      .select('knowledge_item_id, title, category, updated_at')
      .eq('organization_id', context.organizationId)
      .eq('chatbot_config_id', context.chatbotConfigId);

    if (error) {
      throw new Error(`Failed to get usage analytics: ${error.message}`);
    }

    return data || [];
  }

  /** Get storage size using RPC function */
  async getStorageSize(context: VectorQueryContext): Promise<number> {
    try {
      const { data: statsData, error: statsError } = await this.supabase.rpc('get_vector_stats', {
        query_organization_id: context.organizationId,
        query_chatbot_config_id: context.chatbotConfigId
      });
      
      if (!statsError && statsData && statsData.length > 0) {
        return statsData[0].storage_size || 0;
      }
    } catch (error) {
      // Storage size calculation failed - continue without it
    }
    
    return 0;
  }
}