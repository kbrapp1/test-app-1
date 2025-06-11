import { ChatMessage, ChatMessageProps, MessageType } from '../../../../domain/entities/ChatMessage';

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
    const props: ChatMessageProps = {
      id: record.id,
      sessionId: record.session_id,
      messageType: record.message_type as MessageType,
      content: record.content,
      metadata: record.metadata || {},
      timestamp: new Date(record.timestamp),
      isVisible: record.is_visible,
      processingTime: record.processing_time_ms || undefined,
    };

    return ChatMessage.fromPersistence(props);
  }

  /**
   * Transform domain entity to insert data
   */
  static toInsert(message: ChatMessage): InsertChatMessageData {
    return {
      id: message.id,
      session_id: message.sessionId,
      message_type: message.messageType,
      content: message.content,
      metadata: message.metadata,
      timestamp: message.timestamp.toISOString(),
      is_visible: message.isVisible,
      processing_time_ms: message.processingTime,
    };
  }

  /**
   * Transform domain entity to update data
   */
  static toUpdate(message: ChatMessage): UpdateChatMessageData {
    return {
      content: message.content,
      metadata: message.metadata,
      is_visible: message.isVisible,
      processing_time_ms: message.processingTime,
    };
  }
} 