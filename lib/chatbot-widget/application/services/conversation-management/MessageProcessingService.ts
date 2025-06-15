/**
 * Message Processing Service
 * 
 * Application service for message creation and persistence operations.
 * Single responsibility: Handle message creation, saving, and basic processing.
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { AIResponse } from '../../../domain/services/interfaces/IAIConversationService';
import { MessageCostCalculationService, CostBreakdown } from '../../../domain/services/utilities/MessageCostCalculationService';

export interface ProcessMessageRequest {
  sessionId: string;
  userMessage: string;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}

export class MessageProcessingService {
  constructor(
    private readonly messageRepository: IChatMessageRepository
  ) {}

  /**
   * Create and save user message
   */
  async createAndSaveUserMessage(
    session: ChatSession,
    request: ProcessMessageRequest
  ): Promise<ChatMessage> {
    const userMessage = ChatMessage.createUserMessage(
      session.id,
      request.userMessage,
      'text' // Default input method, could be derived from clientInfo
    );

    return await this.messageRepository.save(userMessage);
  }

  /**
   * Create and save bot response message with robust metadata
   * Following DDD: Uses domain service for cost calculation
   */
  async createAndSaveBotMessage(
    session: ChatSession,
    aiResponse: AIResponse
  ): Promise<ChatMessage> {
    // Calculate cost using domain service
    const costBreakdown = MessageCostCalculationService.calculateCostBreakdown(
      aiResponse.metadata.model,
      aiResponse.metadata.promptTokens,
      aiResponse.metadata.completionTokens
    );

    // Create bot message with enhanced metadata
    let botMessage = ChatMessage.createBotMessage(
      session.id,
      aiResponse.content,
      {
        model: aiResponse.metadata.model,
        promptTokens: aiResponse.metadata.promptTokens,
        completionTokens: aiResponse.metadata.completionTokens,
        confidence: aiResponse.confidence,
        intentDetected: aiResponse.intentDetected,
        processingTime: aiResponse.processingTimeMs
      }
    );

    // Add cost tracking using domain method
    botMessage = botMessage.addCostTracking(costBreakdown.totalCents, costBreakdown);

    // Add sentiment if provided
    if (aiResponse.sentiment) {
      botMessage = botMessage.updateSentiment(aiResponse.sentiment);
    }

    return await this.messageRepository.save(botMessage);
  }

  /**
   * Get recent messages for context (legacy method - kept for compatibility)
   */
  async getRecentMessages(sessionId: string): Promise<ChatMessage[]> {
    // Get last 10 messages for context - using correct method signature
    const messages = await this.messageRepository.findBySessionId(sessionId);
    return messages.slice(-10); // Get last 10 messages
  }
} 