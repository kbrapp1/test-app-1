/**
 * Chat Message Advanced Analytics Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Advanced analytics queries for AI insights
 * - Handle intent detection, sentiment analysis, and model-specific queries
 * - Keep under 200-250 lines per @golden-rule patterns
 * - Focus on advanced analytics metadata filtering only
 * - Follow existing mapper and error patterns exactly
 * - Always validate organizationId for security isolation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatMessage } from '../../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../domain/errors/ChatbotWidgetDomainErrors';

export class ChatMessageAdvancedAnalyticsQueryService {
  private readonly tableName = 'chat_messages';

  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Find messages by detected intent for conversation analysis
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for intentDetected field
   * - Used for understanding user intent patterns
   * - Supports date filtering for trend analysis
   */
  async findByIntentDetected(
    organizationId: string,
    intent: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .eq('metadata->>intentDetected', intent);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by intent', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages by sentiment classification
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for sentiment field
   * - Used for customer satisfaction and mood analysis
   * - Supports filtering by positive, neutral, negative sentiment
   */
  async findBySentiment(
    organizationId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .eq('metadata->>sentiment', sentiment);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by sentiment', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages by AI model used for generation
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for aiModel field
   * - Used for model performance comparison and analysis
   * - Helps identify which models are being used
   */
  async findMessagesByModel(
    organizationId: string,
    model: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 100
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .eq('metadata->>aiModel', model);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find messages by model', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  /**
   * Find messages with low confidence scores for quality improvement
   * 
   * AI INSTRUCTIONS:
   * - Queries metadata for confidence field
   * - Used for identifying uncertain AI responses
   * - Helps improve chatbot training and response quality
   */
  async findLowConfidenceMessages(
    organizationId: string,
    maxConfidence: number = 0.5,
    dateFrom?: Date,
    dateTo?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    let query = this.supabase
      .from(this.tableName)
      .select(`
        *,
        chat_sessions!inner(
          chatbot_config_id,
          chatbot_configs!inner(organization_id)
        )
      `)
      .eq('chat_sessions.chatbot_configs.organization_id', organizationId)
      .lte('metadata->>confidence', maxConfidence.toString())
      .not('metadata->>confidence', 'is', null);

    if (dateFrom) {
      query = query.gte('timestamp', dateFrom.toISOString());
    }
    if (dateTo) {
      query = query.lte('timestamp', dateTo.toISOString());
    }

    const { data, error } = await query
      .order('metadata->>confidence', { ascending: true })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find low-confidence messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }
}