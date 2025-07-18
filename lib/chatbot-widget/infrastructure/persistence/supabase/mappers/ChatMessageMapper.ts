import { ChatMessage, ChatMessageProps, MessageType } from '../../../../domain/entities/ChatMessage';
import { MessageAIMetadata } from '../../../../domain/value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../../../domain/value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../../../domain/value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../../../domain/value-objects/message-processing/MessageCostTracking';

/** Raw database record structure from Supabase */
export interface RawChatMessageDbRecord {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  metadata: unknown; // JSONB
  timestamp: string;
  is_visible: boolean;
  processing_time_ms: number | null;
  created_at: string;
}

/** Insert data structure for database operations */
export interface InsertChatMessageData {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  metadata: unknown;
  timestamp: string;
  is_visible: boolean;
  processing_time_ms?: number;
}

/** Update data structure for database operations */
export interface UpdateChatMessageData {
  content?: string;
  metadata?: unknown;
  is_visible?: boolean;
  processing_time_ms?: number;
}

/**
 * ChatMessage Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class ChatMessageMapper {
  /** Transform database record to domain entity */
  static toDomain(record: RawChatMessageDbRecord): ChatMessage {
    const metadata = (record.metadata as Record<string, unknown>) || {};
    
    // Extract AI metadata from the database metadata
    const aiMetadata = MessageAIMetadata.createFromTokens(
      metadata.aiModel as string || 'gpt-4o-mini',
      metadata.promptTokens as number || 0,
      metadata.completionTokens as number || 0,
      metadata.confidence as number,
      metadata.intentDetected as string
    );

    // Extract context metadata
    const contextMetadata = MessageContextMetadata.create({
      topicsDiscussed: (Array.isArray(metadata.topics) ? metadata.topics : []) as string[],
      sentiment: (metadata.sentiment as 'positive' | 'neutral' | 'negative') || undefined,
      urgency: (metadata.urgency as 'low' | 'medium' | 'high') || undefined,
      inputMethod: (metadata.inputMethod as 'text' | 'voice' | 'button') || undefined,
      errorType: metadata.errorType as string || undefined,
      errorCode: metadata.errorCode as string || undefined,
      errorMessage: metadata.errorMessage as string || undefined,
    });

    // Extract processing metrics
    const processingMetrics = MessageProcessingMetrics.createWithResponseTime(
      (metadata.responseTime as number) || (record.processing_time_ms as number) || 0
    );

    // Extract cost tracking
    const costTracking = MessageCostTracking.createFromTokens(
      (metadata.promptTokens as number) || 0,
      (metadata.completionTokens as number) || 0,
      (metadata.costPerToken as number) || 0.0001
    );

    const props: ChatMessageProps = {
      id: record.id,
      sessionId: record.session_id,
      messageType: record.message_type as MessageType,
      content: record.content,
      timestamp: new Date(record.timestamp),
      isVisible: record.is_visible,
      processingTime: record.processing_time_ms || undefined,
      aiMetadata,
      contextMetadata,
      processingMetrics,
      costTracking,
    };

    return ChatMessage.fromPersistence(props);
  }

  /** Transform domain entity to insert data */
  static toInsert(message: ChatMessage): InsertChatMessageData {
    const metadata = this.serializeMetadata(message);
    
    return {
      id: message.id,
      session_id: message.sessionId,
      message_type: message.messageType,
      content: message.content,
      metadata,
      timestamp: message.timestamp.toISOString(),
      is_visible: message.isVisible,
      processing_time_ms: message.processingTime,
    };
  }

  /** Transform domain entity to update data */
  static toUpdate(message: ChatMessage): UpdateChatMessageData {
    const metadata = this.serializeMetadata(message);
    
    return {
      content: message.content,
      metadata,
      is_visible: message.isVisible,
      processing_time_ms: message.processingTime,
    };
  }

  /** Serialize domain value objects to database metadata format */
  private static serializeMetadata(message: ChatMessage): unknown {
    return {
      // AI metadata
      aiModel: message.aiMetadata.aiModel,
      promptTokens: message.aiMetadata.promptTokens,
      completionTokens: message.aiMetadata.completionTokens,
      totalTokens: message.aiMetadata.totalTokens,
      confidence: message.aiMetadata.confidence,
      intentDetected: message.aiMetadata.intentDetected,
      entitiesExtracted: message.aiMetadata.entitiesExtracted,
      
      // Context metadata
      topics: message.contextMetadata.topicsDiscussed,
      sentiment: message.contextMetadata.sentiment,
      urgency: message.contextMetadata.urgency,
      inputMethod: message.contextMetadata.inputMethod,
      errorType: message.contextMetadata.errorType,
      errorCode: message.contextMetadata.errorCode,
      errorMessage: message.contextMetadata.errorMessage,
      
      // Processing metrics
      responseTime: message.processingMetrics.responseTime,
      processingSteps: message.processingMetrics.processingSteps,
      
      // Cost tracking
      costCents: message.costTracking.costCents,
      costBreakdown: message.costTracking.costBreakdown,
    };
  }
} 