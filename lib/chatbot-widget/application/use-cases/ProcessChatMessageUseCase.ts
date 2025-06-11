/**
 * Process Chat Message Use Case
 * 
 * Application-specific business rules for chat message processing scenarios.
 * Orchestrates domain objects for message handling and response generation coordination.
 * 
 * Single Responsibility: Handles the complete message processing workflow
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IAIConversationService, ConversationContext, AIResponse } from '../../domain/services/IAIConversationService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';

export interface ProcessMessageRequest {
  sessionId: string;
  userMessage: string;
  clientInfo?: {
    userAgent?: string;
    ipAddress?: string;
    location?: string;
  };
}

export interface ProcessMessageResult {
  chatSession: ChatSession;
  userMessage: ChatMessage;
  botResponse: ChatMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: {
    messageCount: number;
    sessionDuration: number; // minutes
    engagementScore: number; // 0-100
    leadQualificationProgress: number; // 0-100
  };
}

export class ProcessChatMessageUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly conversationContextService: ConversationContextService
  ) {}

  /**
   * Execute the complete message processing workflow
   */
  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResult> {
    // 1. Load and validate session
    const session = await this.sessionRepository.findById(request.sessionId);
    if (!session) {
      throw new Error(`Chat session ${request.sessionId} not found`);
    }

    // 2. Load chatbot configuration
    const config = await this.chatbotConfigRepository.findById(session.chatbotConfigId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for session ${request.sessionId}`);
    }

    // 3. Validate operating hours
    if (!config.isWithinOperatingHours()) {
      throw new Error('Chatbot is currently outside operating hours');
    }

    // 4. Create and save user message
    const userMessage = await this.createAndSaveUserMessage(session, request);

    // 5. Update session activity
    let updatedSession = session.updateActivity();

    // 6. Get recent messages for context
    const recentMessages = await this.getRecentMessages(session.id);

    // 7. Build conversation context
    const conversationContext: ConversationContext = {
      chatbotConfig: config,
      session: updatedSession,
      messageHistory: [...recentMessages, userMessage],
      systemPrompt: this.aiConversationService.buildSystemPrompt(config, updatedSession, recentMessages)
    };

    // 8. Generate AI response
    const aiResponse = await this.aiConversationService.generateResponse(
      request.userMessage,
      conversationContext
    );

    // 9. Create and save bot response message
    const botMessage = await this.createAndSaveBotMessage(session, aiResponse);

    // 10. Update session with conversation context
    const allMessages = [...recentMessages, userMessage, botMessage];
    updatedSession = this.conversationContextService.updateSessionContext(
      updatedSession,
      botMessage,
      allMessages
    );

    // 11. Save updated session
    const finalSession = await this.sessionRepository.update(updatedSession);

    // 12. Determine if lead capture should be triggered
    const shouldCaptureLeadInfo = this.shouldTriggerLeadCapture(finalSession, config);

    // 13. Calculate conversation metrics
    const conversationMetrics = await this.calculateConversationMetrics(finalSession, allMessages);

    // 14. Generate suggested next actions
    const suggestedNextActions = this.generateSuggestedActions(
      finalSession,
      config,
      shouldCaptureLeadInfo
    );

    return {
      chatSession: finalSession,
      userMessage,
      botResponse: botMessage,
      shouldCaptureLeadInfo,
      suggestedNextActions,
      conversationMetrics
    };
  }

  /**
   * Create and save user message
   */
  private async createAndSaveUserMessage(
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
   * Create and save bot response message
   */
  private async createAndSaveBotMessage(
    session: ChatSession,
    aiResponse: AIResponse
  ): Promise<ChatMessage> {
    const botMessage = ChatMessage.createBotMessage(
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

    return await this.messageRepository.save(botMessage);
  }

  /**
   * Get recent messages for context
   */
  private async getRecentMessages(sessionId: string): Promise<ChatMessage[]> {
    // Get last 10 messages for context - using correct method signature
    const messages = await this.messageRepository.findBySessionId(sessionId);
    return messages.slice(-10); // Get last 10 messages
  }

  /**
   * Calculate engagement score for this interaction
   */
  private calculateEngagementScore(userMessage: string, aiResponse: AIResponse): number {
    let score = 0;

    // Message length indicates engagement
    if (userMessage.length > 50) score += 10;
    if (userMessage.length > 100) score += 10;

    // Questions indicate engagement
    if (userMessage.includes('?')) score += 15;

    // AI confidence in response
    score += Math.round(aiResponse.confidence * 20); // Convert 0-1 to 0-20

    // Specific keywords that indicate interest
    const interestKeywords = ['interested', 'price', 'cost', 'buy', 'purchase', 'demo', 'trial'];
    const hasInterestKeywords = interestKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    if (hasInterestKeywords) score += 25;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Determine if lead capture should be triggered
   */
  private shouldTriggerLeadCapture(session: ChatSession, config: ChatbotConfig): boolean {
    // Check if lead already captured
    if (session.hasContactInfo()) {
      return false;
    }

    // Check if already in qualification process
    if (session.leadQualificationState.qualificationStatus === 'in_progress' || 
        session.leadQualificationState.qualificationStatus === 'completed') {
      return false;
    }

    // Check engagement score threshold
    if (session.contextData.engagementScore >= 70) {
      return true;
    }

    // Check session duration (more than 5 minutes of active conversation)
    const sessionDuration = session.getSessionDuration();
    if (sessionDuration >= 5) {
      return true;
    }

    // Check if user shows buying intent
    const buyingIntentTopics = ['pricing', 'trial', 'demo', 'features'];
    const hasBuyingIntent = session.contextData.topics.some(topic => 
      buyingIntentTopics.includes(topic)
    );
    
    if (hasBuyingIntent && session.contextData.engagementScore >= 50) {
      return true;
    }

    return false;
  }

  /**
   * Calculate comprehensive conversation metrics
   */
  private async calculateConversationMetrics(
    session: ChatSession, 
    allMessages: ChatMessage[]
  ): Promise<ProcessMessageResult['conversationMetrics']> {
    const sessionDuration = session.getSessionDuration();

    // Calculate lead qualification progress
    const totalQuestions = session.leadQualificationState.answeredQuestions.length;
    const maxPossibleQuestions = 5; // Typical number of qualification questions
    const leadQualificationProgress = Math.round((totalQuestions / maxPossibleQuestions) * 100);

    return {
      messageCount: allMessages.length,
      sessionDuration,
      engagementScore: session.contextData.engagementScore,
      leadQualificationProgress: Math.min(leadQualificationProgress, 100)
    };
  }

  /**
   * Generate suggested next actions based on session state
   */
  private generateSuggestedActions(
    session: ChatSession,
    config: ChatbotConfig,
    shouldCaptureLeadInfo: boolean
  ): string[] {
    const actions: string[] = [];

    if (shouldCaptureLeadInfo) {
      actions.push('Initiate lead capture flow');
      actions.push('Ask for contact information');
    }

    if (session.contextData.engagementScore > 80) {
      actions.push('Offer product demo');
      actions.push('Connect with sales representative');
    }

    const sessionDuration = session.getSessionDuration();
    if (sessionDuration > 10) {
      actions.push('Suggest scheduling a call');
      actions.push('Provide comprehensive resource links');
    }

    if (session.leadQualificationState.answeredQuestions.length > 0) {
      const progress = session.leadQualificationState.answeredQuestions.length / config.leadQualificationQuestions.length;
      if (progress > 0.5) {
        actions.push('Continue qualification process');
      }
    }

    // Check for specific topics that warrant actions
    if (session.contextData.topics.includes('pricing')) {
      actions.push('Provide pricing information');
    }

    if (session.contextData.topics.includes('demo')) {
      actions.push('Schedule product demonstration');
    }

    if (session.contextData.topics.includes('support')) {
      actions.push('Connect with support team');
    }

    // Default actions if none specific
    if (actions.length === 0) {
      actions.push('Continue conversation');
      actions.push('Ask clarifying questions');
    }

    return actions;
  }
} 