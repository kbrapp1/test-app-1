/**
 * Conversation Context Service
 * 
 * Domain service orchestrating conversation context analysis and management.
 * Refactored following DDD principles with single responsibility components.
 * 
 * Single responsibility: Coordinate context analysis using focused domain services.
 */

import { ChatSession, SessionContext } from '../entities/ChatSession';
import { ChatMessage } from '../entities/ChatMessage';
import { ConversationContextWindow } from '../value-objects/ConversationContextWindow';
import { ITokenCountingService } from './ITokenCountingService';
import { IIntentClassificationService, IntentClassificationContext } from './IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeRetrievalContext } from './IKnowledgeRetrievalService';
import { IntentResult } from '../value-objects/IntentResult';
import { UserJourneyState, JourneyStage } from '../value-objects/UserJourneyState';
import { ChatbotConfig } from '../entities/ChatbotConfig';

// Import refactored services and value objects
import { 
  ContextAnalysis, 
  ConversationSummary, 
  ContextWindowResult,
  ContextAnalysisValueObject 
} from '../value-objects/ContextAnalysis';
import { MessageAnalysisService } from './MessageAnalysisService';
import { ConversationStageService } from './ConversationStageService';
import { ContextWindowService } from './ContextWindowService';

export class ConversationContextService {
  private readonly messageAnalysisService: MessageAnalysisService;
  private readonly conversationStageService: ConversationStageService;
  private readonly contextWindowService: ContextWindowService;

  constructor(
    private tokenCountingService: ITokenCountingService,
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.messageAnalysisService = new MessageAnalysisService();
    this.conversationStageService = new ConversationStageService();
    this.contextWindowService = new ContextWindowService(tokenCountingService);
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
   * Analyze conversation context from messages (synchronous version)
   */
  analyzeContext(messages: ChatMessage[]): ContextAnalysis {
    const userMessages = messages.filter(m => m.isFromUser());
    const totalMessages = messages.length;
    
    if (userMessages.length === 0) {
      return ContextAnalysisValueObject.createDefault().toPlainObject();
    }

    const topics = this.messageAnalysisService.extractTopics(userMessages);
    const interests = this.messageAnalysisService.extractInterests(userMessages);
    const sentiment = this.messageAnalysisService.analyzeSentiment(userMessages);
    const engagementLevel = this.messageAnalysisService.calculateEngagementLevel(userMessages, totalMessages);
    const userIntent = this.messageAnalysisService.detectUserIntent(userMessages);
    const urgency = this.messageAnalysisService.assessUrgency(userMessages);
    const conversationStage = this.conversationStageService.determineConversationStage(messages);

    const analysis = new ContextAnalysisValueObject(
      topics,
      interests,
      sentiment,
      engagementLevel,
      userIntent,
      urgency,
      conversationStage
    );

    return analysis.toPlainObject();
  }

  /**
   * Analyze conversation context with enhanced intent and knowledge (async version)
   */
  async analyzeContextEnhanced(
    messages: ChatMessage[],
    chatbotConfig?: ChatbotConfig,
    session?: ChatSession
  ): Promise<ContextAnalysis> {
    const baseAnalysis = this.analyzeContext(messages);
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return baseAnalysis;
    }

    // Enhanced analysis with intent classification and knowledge retrieval
    let intentResult: IntentResult | undefined;
    let journeyState: UserJourneyState | undefined;
    let relevantKnowledge: Array<{ title: string; content: string; relevanceScore: number; }> | undefined;

    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Classify intent if service is available
    if (this.intentClassificationService && chatbotConfig && session) {
      try {
        const context: IntentClassificationContext = {
          chatbotConfig,
          session,
          messageHistory: messages.slice(-5), // Last 5 messages for context
          currentMessage: lastUserMessage.content
        };
        
        intentResult = await this.intentClassificationService.classifyIntent(
          lastUserMessage.content,
          context
        );
      } catch (error) {
        // Intent classification failed - using fallback
      }
    }

    // Update journey state if we have intent result
    if (intentResult && session) {
      journeyState = this.updateJourneyState(session, intentResult, baseAnalysis);
    }

    // Retrieve relevant knowledge if service is available
    if (this.knowledgeRetrievalService && intentResult) {
      try {
        const knowledgeContext: KnowledgeRetrievalContext = {
          userQuery: lastUserMessage.content,
          intentResult,
          conversationHistory: userMessages.slice(-3).map(m => m.content),
          maxResults: 3,
          minRelevanceScore: 0.4
        };

        const knowledgeResult = await this.knowledgeRetrievalService.searchKnowledge(knowledgeContext);
        
        relevantKnowledge = knowledgeResult.items.map(item => ({
          title: item.title,
          content: item.content,
          relevanceScore: item.relevanceScore
        }));
      } catch (error) {
        // Knowledge retrieval failed - continuing without knowledge
      }
    }

    return {
      ...baseAnalysis,
      intentResult,
      journeyState,
      relevantKnowledge,
    };
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
    const userNeeds = this.messageAnalysisService.extractUserNeeds(userMessages);
    const painPoints = this.messageAnalysisService.extractPainPoints(userMessages);
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
    const analysis = this.analyzeContext([...allMessages, message]);
    const analysisValueObject = new ContextAnalysisValueObject(
      analysis.topics,
      analysis.interests,
      analysis.sentiment,
      analysis.engagementLevel,
      analysis.userIntent,
      analysis.urgency,
      analysis.conversationStage
    );
    
    let updatedSession = session
      .updateEngagementScore(analysisValueObject.calculateEngagementScore())
      .updateConversationSummary(this.conversationStageService.createConversationSummary(allMessages));

    // Add new topics
    analysis.topics.forEach(topic => {
      updatedSession = updatedSession.addTopic(topic);
    });

    // Add new interests
    analysis.interests.forEach(interest => {
      updatedSession = updatedSession.addInterest(interest);
    });

    return updatedSession;
  }

  /**
   * Update journey state based on intent result
   */
  private updateJourneyState(
    session: ChatSession,
    intentResult: IntentResult,
    baseAnalysis: ContextAnalysis
  ): UserJourneyState {
    const currentJourneyState = session.contextData.journeyState 
      ? UserJourneyState.create(
          session.contextData.journeyState.stage as JourneyStage,
          session.contextData.journeyState.confidence,
          session.contextData.journeyState.metadata
        )
      : UserJourneyState.create();

    const transitionResult = currentJourneyState.shouldTransitionBasedOnIntent(intentResult);
    
    if (transitionResult.shouldTransition && transitionResult.newStage) {
      return currentJourneyState.transitionTo(
        transitionResult.newStage,
        {
          type: 'intent',
          value: intentResult.intent,
          confidence: transitionResult.confidence
        }
      );
    } else {
      // Update engagement score
      const analysisValueObject = new ContextAnalysisValueObject(
        baseAnalysis.topics,
        baseAnalysis.interests,
        baseAnalysis.sentiment,
        baseAnalysis.engagementLevel,
        baseAnalysis.userIntent,
        baseAnalysis.urgency,
        baseAnalysis.conversationStage
      );
      
      const newEngagementScore = analysisValueObject.calculateEngagementScore();
      return currentJourneyState.updateEngagement(newEngagementScore);
    }
  }
} 