import { ChatMessage, ChatMessageProps, MessageType } from '../../../../domain/entities/ChatMessage';
import { MessageAIMetadata } from '../../../../domain/value-objects/message-processing/MessageAIMetadata';
import { MessageContextMetadata } from '../../../../domain/value-objects/message-processing/MessageContextMetadata';
import { MessageProcessingMetrics } from '../../../../domain/value-objects/message-processing/MessageProcessingMetrics';
import { MessageCostTracking } from '../../../../domain/value-objects/message-processing/MessageCostTracking';

/**
 * Raw database record structure from Supabase
 */
export interface RawChatMessageDbRecord {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  metadata: any; // JSONB
  timestamp: string;
  is_visible: boolean;
  processing_time_ms: number | null;
  created_at: string;
}

/**
 * Insert data structure for database operations
 */
export interface InsertChatMessageData {
  id: string;
  session_id: string;
  message_type: string;
  content: string;
  metadata: any;
  timestamp: string;
  is_visible: boolean;
  processing_time_ms?: number;
}

/**
 * Update data structure for database operations
 */
export interface UpdateChatMessageData {
  content?: string;
  metadata?: any;
  is_visible?: boolean;
  processing_time_ms?: number;
}

/**
 * ChatMessage Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class ChatMessageMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(record: RawChatMessageDbRecord): ChatMessage {
    const metadata = record.metadata || {};
    
    // Extract AI metadata from the database metadata
    const aiMetadata = MessageAIMetadata.createFromTokens(
      metadata.aiModel || 'gpt-4o-mini',
      metadata.promptTokens || 0,
      metadata.completionTokens || 0,
      metadata.confidence,
      metadata.intentDetected
    );

    // Extract context metadata
    const contextMetadata = MessageContextMetadata.create({
      topicsDiscussed: metadata.topics || [],
      sentiment: metadata.sentiment,
      urgency: metadata.urgency,
      inputMethod: metadata.inputMethod,
      errorType: metadata.errorType,
      errorCode: metadata.errorCode,
      errorMessage: metadata.errorMessage,
    });

    // Extract processing metrics
    const processingMetrics = MessageProcessingMetrics.createWithResponseTime(
      metadata.responseTime || record.processing_time_ms || 0
    );

    // Extract cost tracking
    const costTracking = MessageCostTracking.createFromTokens(
      metadata.promptTokens || 0,
      metadata.completionTokens || 0,
      metadata.costPerToken || 0.0001
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

  /**
   * Transform domain entity to insert data
   */
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

  /**
   * Transform domain entity to update data
   */
  static toUpdate(message: ChatMessage): UpdateChatMessageData {
    const metadata = this.serializeMetadata(message);
    
    return {
      content: message.content,
      metadata,
      is_visible: message.isVisible,
      processing_time_ms: message.processingTime,
    };
  }

  /**
   * Serialize domain value objects to database metadata format
   */
  private static serializeMetadata(message: ChatMessage): any {
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