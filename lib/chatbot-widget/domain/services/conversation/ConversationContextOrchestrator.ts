/**
 * AI-Driven Conversation Context Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate API-provided conversation analysis
 * - Use OpenAI analysis as source of truth for all conversation insights
 * - Follow @golden-rule.mdc patterns exactly
 * - Keep under 200-250 lines - CLEANED UP from 450+ lines
 * - Delegate to specialized services, no business logic here
 */

import { ChatSession } from '../../entities/ChatSession';
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
import { ContextWindowService } from '../utilities/ContextWindowService';
import { ConversationSessionUpdateService } from './ConversationSessionUpdateService';
// Removed UserJourneyState import - using pure API-driven approach
import { ContextRelevanceService } from '../utilities/ContextRelevanceService';
import { RelevanceContext } from '../utilities/types/RelevanceTypes';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { ConversationEnhancedAnalysisService } from './ConversationEnhancedAnalysisService';

interface LoggingContext {
  logEntry: (message: string) => void;
}

/** API-provided analysis data from OpenAI */
export interface ApiAnalysisData {
  entities?: {
    urgency?: 'low' | 'medium' | 'high';
    painPoints?: string[];
    integrationNeeds?: string[];
    evaluationCriteria?: string[];
    company?: string;
    role?: string;
    budget?: string;
    timeline?: string;
    teamSize?: string;
    industry?: string;
    contactMethod?: string;
    visitorName?: string;
    email?: string;
    phone?: string;
  };
  personaInference?: {
    role?: string;
    industry?: string;
    evidence?: string[];
  };
  leadScore?: {
    scoreBreakdown?: {
      engagementLevel?: number;
    };
  };
  conversationFlow?: {
    currentStage?: string;
    nextSteps?: string[];
    qualificationStatus?: string;
  };
}

export class ConversationContextOrchestrator {
  private readonly contextWindowService: ContextWindowService;
  private readonly sessionUpdateService: ConversationSessionUpdateService;
  private tokenCountingService: ITokenCountingService;
  private enhancedAnalysisService?: ConversationEnhancedAnalysisService;
  
  // AI: Performance optimization - cache token counts to avoid redundant calculations
  private tokenCountCache = new Map<string, number>();

  constructor(
    tokenCountingService: ITokenCountingService,
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.tokenCountingService = tokenCountingService;
    this.contextWindowService = new ContextWindowService(tokenCountingService);
    this.sessionUpdateService = new ConversationSessionUpdateService();
    
    // Initialize enhanced analysis service if dependencies are available
    if (this.intentClassificationService || this.knowledgeRetrievalService) {
      this.enhancedAnalysisService = new ConversationEnhancedAnalysisService(
        this.intentClassificationService,
        this.knowledgeRetrievalService
      );
    }
  }

  /** Get messages for context window with compression and relevance analysis */
  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string,
    loggingContext?: LoggingContext
  ): Promise<ContextWindowResult> {
    const logEntry = loggingContext?.logEntry || (() => {});
    
    if (messages.length === 0) {
      return {
        messages: [],
        tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
        wasCompressed: false
      };
    }

    logEntry(`🧠 DOMAIN CONTEXT ANALYSIS: ${messages.length} messages, ${contextWindow.maxTokens} max tokens`);

    // Step 1: Analyze message relevance for intelligent prioritization
    const relevanceContext: RelevanceContext = {
      currentIntent: IntentResult.createUnknown(),
      businessEntities: {},
      conversationPhase: 'discovery',
      leadScore: 0,
      maxRetentionMessages: Math.floor(contextWindow.getAvailableTokensForMessages() / 100)
    };

    const prioritizedMessages = ContextRelevanceService.prioritizeMessages(
      messages,
      relevanceContext
    );

    logEntry(`📈 RELEVANCE: Critical=${prioritizedMessages.criticalMessages.length}, High=${prioritizedMessages.highPriorityMessages.length}`);

    // Step 2: Token analysis
    const totalTokensEstimate = await this.estimateTokenUsage(messages);
    const availableTokens = contextWindow.getAvailableTokensForMessages();
    const summaryTokens = existingSummary 
      ? await this.tokenCountingService.countTextTokens(existingSummary)
      : 0;
    
    logEntry(`🔧 TOKEN ANALYSIS: ${totalTokensEstimate} msg + ${summaryTokens} summary = ${totalTokensEstimate + summaryTokens}/${availableTokens}`);

    let finalMessages = messages;
    let compressionRecommendation = false;

    if ((totalTokensEstimate + summaryTokens) > availableTokens && messages.length > 5) {
      compressionRecommendation = true;
      const retentionRecommendation = prioritizedMessages.retentionRecommendation;
      if (retentionRecommendation.shouldCompress) {
        finalMessages = retentionRecommendation.messagesToRetain;
        logEntry(`📋 COMPRESSION: Recommend retaining ${finalMessages.length} most relevant messages`);
      }
    }

    const finalTokensUsed = await this.estimateTokenUsage(finalMessages);
    const finalSummaryTokens = existingSummary 
      ? await this.tokenCountingService.countTextTokens(existingSummary)
      : summaryTokens;

    logEntry(`✅ COMPLETE: ${finalMessages.length} messages, ${finalTokensUsed + finalSummaryTokens} tokens, compressed=${compressionRecommendation}`);

    return {
      messages: finalMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.messageType === 'user' ? 'user' as const : 
              msg.messageType === 'bot' ? 'assistant' as const : 'system' as const,
        timestamp: msg.timestamp,
        metadata: { 
          sessionId: msg.sessionId,
          processingTime: msg.processingTime,
          isVisible: msg.isVisible
        }
      })),
      summary: existingSummary,
      tokenUsage: {
        messagesTokens: finalTokensUsed,
        summaryTokens: finalSummaryTokens,
        totalTokens: finalTokensUsed + finalSummaryTokens
      },
      wasCompressed: messages.length !== finalMessages.length
    };
  }

  /** Estimate token usage for messages */
  private async estimateTokenUsage(messages: ChatMessage[]): Promise<number> {
    try {
      // AI: Performance optimization - cache token counts to avoid redundant API calls
      const cacheKey = messages.map(m => `${m.id}:${m.content.length}`).join('|');
      
      if (this.tokenCountCache.has(cacheKey)) {
        return this.tokenCountCache.get(cacheKey)!;
      }
      
      const tokenCount = await this.tokenCountingService.countMessagesTokens(messages);
      this.tokenCountCache.set(cacheKey, tokenCount);
      
      // AI: Limit cache size to prevent memory leaks
      if (this.tokenCountCache.size > 100) {
        const firstKey = this.tokenCountCache.keys().next().value;
        if (firstKey) {
          this.tokenCountCache.delete(firstKey);
        }
      }
      
      return tokenCount;
    } catch (error) {
      // Fallback to character-based estimation
      return messages.reduce((total, msg) => total + Math.ceil(msg.content.length / 4), 0);
    }
  }

  /** Create AI-generated summary of older messages */
  async createAISummary(messages: ChatMessage[], maxTokens: number = 200): Promise<string> {
    return this.contextWindowService.createAISummary(messages, maxTokens);
  }

  /** Analyze conversation context using API-provided data */
  analyzeContext(
    messages: ChatMessage[], 
    session?: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ContextAnalysis {
    // Safety check: Filter out any non-ChatMessage objects
    const validMessages = messages.filter(m => m && typeof m.isFromUser === 'function');
    const userMessages = validMessages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return ContextAnalysisValueObject.createDefault().toPlainObject();
    }

    // Extract data from API response following @golden-rule DTO patterns
    const topics = apiAnalysisData?.entities?.evaluationCriteria || [];
    const interests = apiAnalysisData?.personaInference?.evidence || [];
    const urgency = apiAnalysisData?.entities?.urgency || 'low';
    
    // Determine engagement level from API data or fallback to message-based logic
    let engagementLevel: 'low' | 'medium' | 'high' = 'low';
    if (apiAnalysisData?.leadScore?.scoreBreakdown?.engagementLevel) {
      const apiEngagement = apiAnalysisData.leadScore.scoreBreakdown.engagementLevel;
      if (apiEngagement >= 8) {
        engagementLevel = 'high';
      } else if (apiEngagement >= 5) {
        engagementLevel = 'medium';
      }
    } else {
      // Fallback: Basic engagement calculation based on message count and topics
      const messageCount = userMessages.length;
      const topicCount = topics.length;
      
      if (messageCount >= 8 || (messageCount >= 5 && topicCount >= 3)) {
        engagementLevel = 'high';
      } else if (messageCount >= 4 || (messageCount >= 2 && topicCount >= 2)) {
        engagementLevel = 'medium';
      }
    }
    
    // Removed journey state tracking - using pure API-driven approach

    const analysis = new ContextAnalysisValueObject(
      topics,
      interests,
      'neutral', // Sentiment from API
      engagementLevel, // Now properly using calculated engagement level
      'unknown', // Intent from separate classification
      urgency,
      'discovery' // Stage from API
      // Removed journeyState parameter - using pure API-driven approach
    );

    return analysis.toPlainObject();
  }

  /** Enhanced context analysis that triggers vector embeddings pipeline */
  async analyzeContextEnhanced(
    messages: ChatMessage[], 
    config: any,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<any> {
    try {
      // First get basic context analysis
      const baseAnalysis = this.analyzeContext(messages, session);
      
      // If we have enhanced analysis service, use it to get intent + knowledge
      if (this.enhancedAnalysisService) {
        // AI INSTRUCTIONS: This call triggers the vector embeddings pipeline
        // via ConversationEnhancedAnalysisService.retrieveRelevantKnowledge()
        const enhancedResult = await this.enhancedAnalysisService.enhanceAnalysis(
          baseAnalysis,
          messages,
          config,
          session,
          sharedLogFile
        );
        
        return enhancedResult;
      }
      
      // Fallback to basic analysis if enhanced service not available
      return baseAnalysis;
    } catch (error) {
      // Log through proper logging context if available, fallback to basic analysis
      return this.analyzeContext(messages, session);
    }
  }

  /** Generate conversation summary using API data */
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ConversationSummary {
    const context = session.contextData;
    
    const overview = this.createSimpleOverview(messages, context);
    const keyTopics = apiAnalysisData?.entities?.evaluationCriteria || context.topics || [];
    const userNeeds = apiAnalysisData?.entities?.integrationNeeds || [];
    const painPoints = apiAnalysisData?.entities?.painPoints || [];
    const nextSteps = apiAnalysisData?.conversationFlow?.nextSteps || ['Continue conversation'];
    const qualificationStatus = apiAnalysisData?.conversationFlow?.qualificationStatus || 'unknown';

    return {
      overview,
      keyTopics,
      userNeeds,
      painPoints,
      nextSteps,
      qualificationStatus,
    };
  }

  /** Create simple overview from messages */
  private createSimpleOverview(messages: ChatMessage[], context: any): string {
    // Safety check: Filter out any non-ChatMessage objects
    const validMessages = messages.filter(m => m && typeof m.isFromUser === 'function');
    const userMessages = validMessages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return 'No user interaction yet';
    }
    
    const conversationLength = userMessages.length;
    const hasContactInfo = context.email || context.phone;
    const topicsCount = context.topics?.length || 0;
    
    return `Active conversation with ${conversationLength} user messages (${messages.length} total). ` +
      `${hasContactInfo ? 'Contact info captured. ' : ''}` +
      `${topicsCount > 0 ? `${topicsCount} topics discussed.` : 'Topics being explored.'}`;
  }

  /** Update session context with new message and API data */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    apiAnalysisData?: ApiAnalysisData
  ): ChatSession {
    const analysis = this.analyzeContext([...allMessages, message], session, apiAnalysisData);
    const updatedSession = this.sessionUpdateService.updateSessionContext(
      session, 
      message, 
      allMessages, 
      analysis, 
      apiAnalysisData
    );
    return updatedSession.updateActivity();
  }
} 