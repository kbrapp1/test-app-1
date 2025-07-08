/**
 * Chat Message DTO
 * 
 * AI INSTRUCTIONS:
 * - Application layer DTO for chat message data transfer across boundaries
 * - Encapsulates message content, AI metadata, processing metrics, and entity extraction
 * - Provides serializable format for API responses and frontend consumption
 * - Includes comprehensive message metadata for debugging and analytics
 * - Handles user/bot/system message types with processing time and confidence data
 */

export interface ChatMessageDto {
  readonly id: string;
  readonly sessionId: string;
  readonly messageType: MessageType;
  readonly content: string;
  readonly metadata: MessageMetadataDto;
  readonly timestamp: string;
  readonly isVisible: boolean;
  readonly processingTimeMs?: number;
}

export interface MessageMetadataDto {
  readonly aiModel?: string;
  readonly promptTokens?: number;
  readonly completionTokens?: number;
  readonly totalTokens?: number;
  readonly confidence?: number;
  readonly intentDetected?: string;
  readonly responseTime?: number;
  readonly sentiment?: string;
  readonly topics?: string[];
  readonly extractedEntities?: ExtractedEntityDto[];
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly errorCode?: string;
  readonly errorMessage?: string;
}

export interface ExtractedEntityDto {
  readonly type: string;
  readonly value: string;
  readonly confidence: number;
  readonly start?: number;
  readonly end?: number;
}

export type MessageType = 'user' | 'bot' | 'system' | 'lead_capture' | 'qualification';

/** DTO for creating a new chat message */
export interface CreateChatMessageDto {
  readonly sessionId: string;
  readonly messageType: MessageType;
  readonly content: string;
  readonly metadata?: Partial<MessageMetadataDto>;
  readonly isVisible?: boolean;
  readonly processingTimeMs?: number;
}

/** DTO for AI response with processing metadata */
export interface AiResponseDto {
  readonly content: string;
  readonly aiModel: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly confidence?: number;
  readonly intentDetected?: string;
  readonly processingTimeMs: number;
  readonly functionCall?: FunctionCallDto;
}

export interface FunctionCallDto {
  readonly name: string;
  readonly arguments: Record<string, any>;
}

/** DTO for conversation context */
export interface ConversationContextDto {
  readonly messages: ChatMessageDto[];
  readonly sessionContext: any;
  readonly botPersonality: any;
  readonly knowledgeBase: any;
} 