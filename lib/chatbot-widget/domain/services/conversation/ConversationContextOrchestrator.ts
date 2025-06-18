/**
 * Conversation Context Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Main orchestrator for conversation context analysis and management
 * - Coordinate all context operations using focused domain services
 * - Keep under 200 lines following @golden-rule patterns
 * - Delegate complex operations to specialized services
 * - Maintain single responsibility for coordination
 */

import { ChatSession, SessionContext } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { ConversationContextWindow } from '../../value-objects/session-management/ConversationContextWindow';
import { ITokenCountingService } from '../interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../entities/ChatbotConfig';

// Import refactored services and value objects
import { 
  ContextAnalysis, 
  ConversationSummary, 
  ContextWindowResult,
  ContextAnalysisValueObject 
} from '../../value-objects/message-processing/ContextAnalysis';
import { MessageAnalysisOrchestrator } from '../message-processing/MessageAnalysisOrchestrator';
import { ConversationStageService } from './ConversationStageService';
import { ContextWindowService } from '../utilities/ContextWindowService';
import { ConversationSessionUpdateService } from './ConversationSessionUpdateService';
import { UserJourneyState } from '../../value-objects/session-management/UserJourneyState';

export class ConversationContextOrchestrator {
  private readonly messageAnalysisOrchestrator: MessageAnalysisOrchestrator;
  private readonly conversationStageService: ConversationStageService;
  private readonly contextWindowService: ContextWindowService;
  private readonly sessionUpdateService: ConversationSessionUpdateService;

  constructor(
    private tokenCountingService: ITokenCountingService,
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.messageAnalysisOrchestrator = new MessageAnalysisOrchestrator();
    this.conversationStageService = new ConversationStageService();
    this.contextWindowService = new ContextWindowService(tokenCountingService);
    this.sessionUpdateService = new ConversationSessionUpdateService(
      this.conversationStageService
    );
  }

  /**
   * Get messages that fit within context window with token management
   */
  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string
  ): Promise<ContextWindowResult> {
    return this.contextWindowService.getMessagesForContextWindow(
      messages, 
      contextWindow, 
      existingSummary
    );
  }

  /**
   * Create AI-generated summary of older messages
   */
  async createAISummary(
    messages: ChatMessage[],
    maxTokens: number = 200
  ): Promise<string> {
    return this.contextWindowService.createAISummary(messages, maxTokens);
  }

  /**
   * Analyze conversation context from messages with journey state update
   */
  analyzeContext(messages: ChatMessage[], session?: ChatSession): ContextAnalysis {
    const userMessages = messages.filter(m => m.isFromUser());
    const totalMessages = messages.length;
    
    if (userMessages.length === 0) {
      return ContextAnalysisValueObject.createDefault().toPlainObject();
    }

    const topics = this.messageAnalysisOrchestrator.extractTopics(userMessages);
    const interests = this.messageAnalysisOrchestrator.extractInterests(userMessages);
    const sentiment = this.messageAnalysisOrchestrator.analyzeSentiment(userMessages);
    const engagementLevel = this.messageAnalysisOrchestrator.calculateEngagementLevel(userMessages, totalMessages);
    const urgency = this.messageAnalysisOrchestrator.assessUrgency(userMessages);
    const conversationStage = this.conversationStageService.determineConversationStage(messages);

    // Update journey state based on current session state (lightweight, no API calls)
    let journeyState: any = undefined;
    if (session) {
      const currentJourneyState = session.contextData.journeyState 
        ? UserJourneyState.create(
            session.contextData.journeyState.stage as any,
            session.contextData.journeyState.confidence,
            session.contextData.journeyState.metadata
          )
        : UserJourneyState.create();

      const newEngagementScore = typeof engagementLevel === 'number' ? engagementLevel : 0.5;
      journeyState = currentJourneyState.updateEngagement(newEngagementScore);
    }

    const analysis = new ContextAnalysisValueObject(
      topics,
      interests,
      sentiment,
      engagementLevel,
      'unknown', // No preliminary intent guessing - let OpenAI handle it
      urgency,
      conversationStage,
      journeyState
    );

    return analysis.toPlainObject();
  }



  /**
   * Generate conversation summary
   */
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession
  ): ConversationSummary {
    const userMessages = messages.filter(m => m.isFromUser());
    const context = session.contextData;
    
    const overview = this.conversationStageService.createOverview(messages, context);
    const keyTopics = this.conversationStageService.identifyKeyTopics(userMessages, context.topics);
    const userNeeds = this.messageAnalysisOrchestrator.extractUserNeeds(userMessages);
    const painPoints = this.messageAnalysisOrchestrator.extractPainPoints(userMessages);
    const nextSteps = this.conversationStageService.suggestNextSteps(session, messages);
    const qualificationStatus = this.conversationStageService.assessQualificationStatus(session);

    return {
      overview,
      keyTopics,
      userNeeds,
      painPoints,
      nextSteps,
      qualificationStatus,
    };
  }

  /**
   * Update session context with new message
   */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[]
  ): ChatSession {
    const analysis = this.analyzeContext([...allMessages, message], session);
    return this.sessionUpdateService.updateSessionContext(session, message, allMessages, analysis);
  }

  /**
   * Update session context with enhanced analysis
   * @deprecated Use updateSessionContext instead - enhanced analysis is now integrated
   */
  async updateSessionContextEnhanced(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    chatbotConfig?: ChatbotConfig
  ): Promise<ChatSession> {
    // Enhanced analysis is now integrated into base analyzeContext
    const analysis = this.analyzeContext([...allMessages, message], session);
    
    return this.sessionUpdateService.updateSessionWithEnhancedAnalysis(
      session,
      message,
      allMessages,
      analysis
    );
  }
} 