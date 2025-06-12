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
import { ConversationContextWindow } from '../../domain/value-objects/ConversationContextWindow';
import { ITokenCountingService } from '../../domain/services/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/IKnowledgeRetrievalService';
import { IntentResult } from '../../domain/value-objects/IntentResult';
import { UserJourneyState } from '../../domain/value-objects/UserJourneyState';

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
  intentAnalysis?: {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    category: string;
  };
  journeyState?: {
    stage: string;
    confidence: number;
    isSalesReady: boolean;
    recommendedActions: string[];
  };
  relevantKnowledge?: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

export class ProcessChatMessageUseCase {
  private readonly contextWindow: ConversationContextWindow;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly conversationContextService: ConversationContextService,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    // Initialize context window with sensible defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 12000, // Safe for most models
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    });
  }

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

    // 6. Get token-aware messages for context
    const contextResult = await this.getTokenAwareContext(session.id, userMessage);

    // 7. Enhanced context analysis with intent classification and knowledge retrieval
    const enhancedContext = await this.conversationContextService.analyzeContextEnhanced(
      [...contextResult.messages, userMessage],
      config,
      updatedSession
    );

    // 8. Update session with journey state if available
    if (enhancedContext.journeyState) {
      updatedSession = this.updateSessionWithJourneyState(updatedSession, enhancedContext.journeyState);
    }

    // 9. Build conversation context with optimized message history and enhanced context
    const conversationContext: ConversationContext = {
      chatbotConfig: config,
      session: updatedSession,
      messageHistory: [...contextResult.messages, userMessage],
      systemPrompt: this.buildEnhancedSystemPrompt(
        config, 
        updatedSession, 
        contextResult.messages, 
        enhancedContext
      ),
      conversationSummary: contextResult.summary
    };

    // 10. Generate AI response
    const aiResponse = await this.aiConversationService.generateResponse(
      request.userMessage,
      conversationContext
    );

    // 11. Create and save bot response message
    const botMessage = await this.createAndSaveBotMessage(session, aiResponse);

    // 12. Update session with conversation context
    const allMessages = [...contextResult.messages, userMessage, botMessage];
    updatedSession = this.conversationContextService.updateSessionContext(
      updatedSession,
      botMessage,
      allMessages
    );

    // 13. Save updated session
    const finalSession = await this.sessionRepository.update(updatedSession);

    // 14. Determine if lead capture should be triggered
    const shouldCaptureLeadInfo = this.shouldTriggerLeadCapture(finalSession, config);

    // 15. Calculate conversation metrics
    const conversationMetrics = await this.calculateConversationMetrics(finalSession, allMessages);

    // 16. Generate suggested next actions
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
      conversationMetrics,
      intentAnalysis: enhancedContext.intentResult ? {
        intent: enhancedContext.intentResult.intent,
        confidence: enhancedContext.intentResult.confidence,
        entities: enhancedContext.intentResult.entities,
        category: enhancedContext.intentResult.getCategory()
      } : undefined,
      journeyState: enhancedContext.journeyState ? {
        stage: enhancedContext.journeyState.stage,
        confidence: enhancedContext.journeyState.confidence,
        isSalesReady: enhancedContext.journeyState.isSalesReady(),
        recommendedActions: enhancedContext.journeyState.getRecommendedActions()
      } : undefined,
      relevantKnowledge: enhancedContext.relevantKnowledge
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
   * Get token-aware context for conversation
   */
  private async getTokenAwareContext(
    sessionId: string, 
    newUserMessage: ChatMessage
  ): Promise<{
    messages: ChatMessage[];
    summary?: string;
    tokenUsage: { messagesTokens: number; summaryTokens: number; totalTokens: number };
    wasCompressed: boolean;
  }> {
    // Get all messages for this session
    const allMessages = await this.messageRepository.findBySessionId(sessionId);
    
    if (allMessages.length === 0) {
      return {
        messages: [],
        tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
        wasCompressed: false
      };
    }

    // Get existing conversation summary from session if available
    const session = await this.sessionRepository.findById(sessionId);
    const existingSummary = session?.contextData.conversationSummary;

    // Use conversation context service to get optimized message window
    const contextResult = await this.conversationContextService.getMessagesForContextWindow(
      allMessages,
      this.contextWindow,
      existingSummary
    );

    // If we need to compress and don't have a summary, create one
    if (contextResult.wasCompressed && !existingSummary && allMessages.length > 5) {
      const messagesToSummarize = allMessages.slice(0, -2); // Don't summarize the most recent messages
      const summary = await this.conversationContextService.createAISummary(
        messagesToSummarize,
        this.contextWindow.summaryTokens
      );

      // Update session with new summary
      if (session) {
        const updatedSession = session.updateConversationSummary(summary);
        await this.sessionRepository.update(updatedSession);
      }

      return {
        messages: contextResult.messages,
        summary,
        tokenUsage: {
          messagesTokens: contextResult.tokenUsage.messagesTokens,
          summaryTokens: await this.tokenCountingService.countTextTokens(summary),
          totalTokens: contextResult.tokenUsage.totalTokens
        },
        wasCompressed: true
      };
    }

    return {
      messages: contextResult.messages,
      summary: existingSummary,
      tokenUsage: contextResult.tokenUsage,
      wasCompressed: contextResult.wasCompressed
    };
  }

  /**
   * Get recent messages for context (legacy method - kept for compatibility)
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

  /**
   * Update session with journey state information
   */
  private updateSessionWithJourneyState(
    session: ChatSession,
    journeyState: UserJourneyState
  ): ChatSession {
    const updatedContextData = {
      ...session.contextData,
      journeyState: {
        stage: journeyState.stage,
        confidence: journeyState.confidence,
        metadata: journeyState.metadata
      }
    };

    return ChatSession.fromPersistence({
      ...session.toPlainObject(),
      contextData: updatedContextData,
      lastActivityAt: new Date()
    });
  }

  /**
   * Build enhanced system prompt with intent and knowledge context
   */
  private buildEnhancedSystemPrompt(
    config: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    enhancedContext: any
  ): string {
    // Start with base system prompt
    let systemPrompt = this.aiConversationService.buildSystemPrompt(config, session, messageHistory);

    // Add intent context if available
    if (enhancedContext.intentResult) {
      const intent = enhancedContext.intentResult;
      systemPrompt += `\n\nCURRENT USER INTENT: ${intent.intent} (confidence: ${intent.confidence.toFixed(2)})`;
      
      if (intent.entities && Object.keys(intent.entities).length > 0) {
        systemPrompt += `\nEXTRACTED ENTITIES: ${JSON.stringify(intent.entities)}`;
      }

      systemPrompt += `\nINTENT CATEGORY: ${intent.getCategory()}`;
      
      if (intent.isSalesIntent()) {
        systemPrompt += `\nNOTE: User is showing sales interest. Focus on qualification and next steps.`;
      } else if (intent.isSupportIntent()) {
        systemPrompt += `\nNOTE: User needs support. Provide helpful information and solutions.`;
      }
    }

    // Add journey state context if available
    if (enhancedContext.journeyState) {
      const journey = enhancedContext.journeyState;
      systemPrompt += `\n\nUSER JOURNEY STAGE: ${journey.stage} (confidence: ${journey.confidence.toFixed(2)})`;
      
      if (journey.isSalesReady()) {
        systemPrompt += `\nNOTE: User is sales-ready. Focus on closing and next steps.`;
      }

      const recommendedActions = journey.getRecommendedActions();
      if (recommendedActions.length > 0) {
        systemPrompt += `\nRECOMMENDED ACTIONS: ${recommendedActions.join(', ')}`;
      }
    }

    // Add relevant knowledge context if available
    if (enhancedContext.relevantKnowledge && enhancedContext.relevantKnowledge.length > 0) {
      systemPrompt += `\n\nRELEVANT KNOWLEDGE:`;
      enhancedContext.relevantKnowledge.forEach((knowledge: any, index: number) => {
        systemPrompt += `\n${index + 1}. ${knowledge.title} (relevance: ${knowledge.relevanceScore.toFixed(2)})`;
        systemPrompt += `\n   ${knowledge.content.substring(0, 200)}${knowledge.content.length > 200 ? '...' : ''}`;
      });
      systemPrompt += `\n\nUse this knowledge to provide accurate, helpful responses. Reference specific information when relevant.`;
    }

    return systemPrompt;
  }
} 