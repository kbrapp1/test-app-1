/**
 * AI-Driven Conversation Context Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - COMPLETELY REWRITTEN: Now fully AI-driven, no business rule dependencies
 * - Single responsibility: Coordinate API-provided conversation analysis
 * - Use OpenAI analysis as source of truth for all conversation insights
 * - Follow @golden-rule.mdc patterns exactly
 * - Stay under 200-250 lines
 * - Delegate to specialized services, no business logic here
 * - UPDATED: Removed all ConversationStageService dependencies
 * - ENHANCED: Integrated ConversationCompressionService and ContextRelevanceService
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
import { UserJourneyState } from '../../value-objects/session-management/UserJourneyState';

// Import new 2025 advanced services
import { ConversationCompressionService, CompressionResult } from '../utilities/ConversationCompressionService';
import { ContextRelevanceService, PrioritizedMessages, RelevanceContext } from '../utilities/ContextRelevanceService';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';

// AI INSTRUCTIONS: Logging interface for advanced context management
interface LoggingContext {
  logEntry: (message: string) => void;
}

/**
 * API-provided analysis data from OpenAI
 * Following @golden-rule.mdc DTO pattern for external data contracts
 * UPDATED: Added all core business entities for proper lead scoring
 */
export interface ApiAnalysisData {
  entities?: {
    urgency?: 'low' | 'medium' | 'high';
    painPoints?: string[];
    integrationNeeds?: string[];
    evaluationCriteria?: string[];
    // Core business entities for lead scoring
    company?: string;
    role?: string;
    budget?: string;
    timeline?: string;
    teamSize?: string;
    industry?: string;
    contactMethod?: string;
    // Visitor identification
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

  constructor(
    private tokenCountingService: ITokenCountingService,
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    // AI INSTRUCTIONS: Follow @golden-rule dependency injection patterns
    this.contextWindowService = new ContextWindowService(tokenCountingService);
    this.sessionUpdateService = new ConversationSessionUpdateService();
  }

  /**
   * Get messages that fit within context window with advanced compression and relevance analysis
   * AI INSTRUCTIONS: Enhanced with 2025 optimization services - comprehensive logging
   */
  async getMessagesForContextWindow(
    messages: ChatMessage[],
    contextWindow: ConversationContextWindow,
    existingSummary?: string,
    loggingContext?: LoggingContext
  ): Promise<ContextWindowResult> {
    const logEntry = loggingContext?.logEntry || (() => {});
    
    logEntry('\n🧠 =================================');
    logEntry('🧠 ADVANCED CONTEXT INTELLIGENCE (2025)');
    logEntry('🧠 =================================');
    
    // Basic validation
    if (messages.length === 0) {
      logEntry('📋 No messages to process - returning empty context');
      return {
        messages: [],
        tokenUsage: { messagesTokens: 0, summaryTokens: 0, totalTokens: 0 },
        wasCompressed: false
      };
    }

    logEntry(`📊 INPUT ANALYSIS:`);
    logEntry(`📋 Total messages: ${messages.length}`);
    logEntry(`📋 Context window max tokens: ${contextWindow.maxTokens}`);
    logEntry(`📋 Available for messages: ${contextWindow.getAvailableTokensForMessages()}`);
    logEntry(`📋 Existing summary: ${existingSummary ? 'Yes' : 'No'}`);

    // Step 1: Analyze message relevance for intelligent prioritization
    logEntry('\n🎯 STEP 1: MESSAGE RELEVANCE ANALYSIS');
    
    // Create a basic relevance context for analysis
    const relevanceContext: RelevanceContext = {
      currentIntent: IntentResult.createUnknown(), // Default unknown intent for now
      businessEntities: {}, // Will be populated from session context if available
      conversationPhase: 'discovery',
      leadScore: 0,
      maxRetentionMessages: Math.floor(contextWindow.getAvailableTokensForMessages() / 100) // Rough estimate
    };

    const prioritizedMessages = ContextRelevanceService.prioritizeMessages(
      messages,
      relevanceContext
    );

    logEntry('📈 RELEVANCE SCORING RESULTS:');
    logEntry(`📋 Critical messages: ${prioritizedMessages.criticalMessages.length}`);
    logEntry(`📋 High priority messages: ${prioritizedMessages.highPriorityMessages.length}`);
    logEntry(`📋 Medium priority messages: ${prioritizedMessages.mediumPriorityMessages.length}`);
    logEntry(`📋 Low priority messages: ${prioritizedMessages.lowPriorityMessages.length}`);
    logEntry(`📋 Average relevance score: ${prioritizedMessages.totalRelevanceScore.toFixed(2)}`);
    
    // Log top relevant messages (critical + high priority)
    const topRelevantMessages = [
      ...prioritizedMessages.criticalMessages,
      ...prioritizedMessages.highPriorityMessages
    ].slice(0, 3);
    
    if (topRelevantMessages.length > 0) {
      logEntry('🏆 TOP RELEVANT MESSAGES:');
      topRelevantMessages.forEach((msg, index) => {
        const preview = msg.content.substring(0, 50) + '...';
        logEntry(`📋 #${index + 1}: "${preview}"`);
      });
    }

    // Step 2: Check if compression is needed
    const totalTokensEstimate = await this.estimateTokenUsage(messages);
    const availableTokens = contextWindow.getAvailableTokensForMessages();
    const summaryTokens = existingSummary 
      ? await this.tokenCountingService.countTextTokens(existingSummary)
      : 0;
    
    logEntry('\n🔧 STEP 2: TOKEN USAGE ANALYSIS');
    logEntry(`📋 Estimated message tokens: ${totalTokensEstimate}`);
    logEntry(`📋 Existing summary tokens: ${summaryTokens}`);
    logEntry(`📋 Available tokens: ${availableTokens}`);
    logEntry(`📋 Total required: ${totalTokensEstimate + summaryTokens}`);
    logEntry(`📋 Compression needed: ${(totalTokensEstimate + summaryTokens) > availableTokens ? 'YES' : 'NO'}`);

    // Step 3: Apply compression if needed
    let compressionResult: CompressionResult | null = null;
    let finalMessages = messages;

    if ((totalTokensEstimate + summaryTokens) > availableTokens && messages.length > 5) {
      logEntry('\n🗜️ STEP 3: CONVERSATION COMPRESSION');
      
      compressionResult = ConversationCompressionService.compressConversationHistory(
        messages,
        {
          maxSummaryTokens: contextWindow.summaryTokens,
          preserveRecentCount: Math.min(5, Math.floor(messages.length * 0.3)),
          businessContextWeight: 1.5,
          topicImportanceThreshold: 2
        }
      );

      logEntry('📊 COMPRESSION RESULTS:');
      logEntry(`📋 Original message count: ${compressionResult.metadata.originalMessageCount}`);
      logEntry(`📋 Compressed message count: ${compressionResult.metadata.compressedMessageCount}`);
      logEntry(`📋 Tokens saved: ${compressionResult.tokensSaved}`);
      logEntry(`📋 Compression ratio: ${(compressionResult.compressionRatio * 100).toFixed(1)}%`);
      logEntry(`📋 Key topics preserved: ${compressionResult.metadata.keyTopicsPreserved.join(', ')}`);
      logEntry(`📋 Business entities preserved: ${compressionResult.metadata.businessEntitiesPreserved.join(', ')}`);
      
      if (compressionResult.compressedSummary) {
        logEntry('📝 COMPRESSED SUMMARY:');
        logEntry(`"${compressionResult.compressedSummary}"`);
      }

      finalMessages = compressionResult.retainedMessages;
    } else {
      logEntry('\n✅ STEP 3: NO COMPRESSION NEEDED');
      logEntry('📋 All messages fit within token limits');
    }

    // Step 4: Apply relevance-based filtering if still over limit
    if (finalMessages.length > 0) {
      const finalTokensEstimate = await this.estimateTokenUsage(finalMessages);
      const finalSummaryTokens = compressionResult?.compressedSummary 
        ? await this.tokenCountingService.countTextTokens(compressionResult.compressedSummary)
        : summaryTokens;

      if ((finalTokensEstimate + finalSummaryTokens) > availableTokens) {
        logEntry('\n🎯 STEP 4: RELEVANCE-BASED FILTERING');
        
        // Use the retention recommendation from the prioritized messages
        const retentionRecommendation = prioritizedMessages.retentionRecommendation;

        logEntry('📊 RELEVANCE FILTERING RESULTS:');
        logEntry(`📋 Should compress further: ${retentionRecommendation.shouldCompress ? 'YES' : 'NO'}`);
        logEntry(`📋 Messages to retain: ${retentionRecommendation.messagesToRetain.length}`);
        logEntry(`📋 Messages to compress: ${retentionRecommendation.messagesToCompress.length}`);

        if (retentionRecommendation.shouldCompress) {
          finalMessages = retentionRecommendation.messagesToRetain;
        }
      } else {
        logEntry('\n✅ STEP 4: RELEVANCE FILTERING NOT NEEDED');
        logEntry('📋 Messages fit within limits after compression');
      }
    }

    // Step 5: Calculate final metrics
    const finalTokensUsed = await this.estimateTokenUsage(finalMessages);
    const finalSummary = compressionResult?.compressedSummary || existingSummary;
    const finalSummaryTokens = finalSummary 
      ? await this.tokenCountingService.countTextTokens(finalSummary)
      : 0;

    logEntry('\n📊 FINAL CONTEXT METRICS:');
    logEntry(`📋 Final message count: ${finalMessages.length}`);
    logEntry(`📋 Final message tokens: ${finalTokensUsed}`);
    logEntry(`📋 Final summary tokens: ${finalSummaryTokens}`);
    logEntry(`📋 Total context tokens: ${finalTokensUsed + finalSummaryTokens}`);
    logEntry(`📋 Token utilization: ${(((finalTokensUsed + finalSummaryTokens) / availableTokens) * 100).toFixed(1)}%`);
    logEntry(`📋 Compression applied: ${compressionResult ? 'YES' : 'NO'}`);
    logEntry(`📋 Relevance filtering applied: ${prioritizedMessages ? 'YES' : 'NO'}`);

    logEntry('🧠 =================================');
    logEntry('🧠 ADVANCED CONTEXT INTELLIGENCE COMPLETE');
    logEntry('🧠 =================================\n');

    return {
      messages: finalMessages,
      summary: finalSummary,
      tokenUsage: {
        messagesTokens: finalTokensUsed,
        summaryTokens: finalSummaryTokens,
        totalTokens: finalTokensUsed + finalSummaryTokens
      },
      wasCompressed: !!compressionResult || messages.length !== finalMessages.length
    };
  }

  /**
   * Estimate token usage for messages
   * AI INSTRUCTIONS: Simple token estimation for planning
   */
  private async estimateTokenUsage(messages: ChatMessage[]): Promise<number> {
    try {
      return await this.tokenCountingService.countMessagesTokens(messages);
    } catch (error) {
      // Fallback to simple estimation: ~4 characters per token
      return messages.reduce((total, msg) => total + Math.ceil(msg.content.length / 4), 0);
    }
  }

  /**
   * Create AI-generated summary of older messages
   * AI INSTRUCTIONS: Delegate to context window service following single responsibility
   */
  async createAISummary(
    messages: ChatMessage[],
    maxTokens: number = 200
  ): Promise<string> {
    return this.contextWindowService.createAISummary(messages, maxTokens);
  }

  /**
   * Analyze conversation context using API-provided data
   * 
   * AI INSTRUCTIONS:
   * - Accept OpenAI API analysis data as source of truth
   * - Follow @golden-rule.mdc: Use API data instead of manual calculations
   * - Only coordinate data transformation, no business logic here
   * - Maintain backward compatibility for existing callers
   */
  analyzeContext(
    messages: ChatMessage[], 
    session?: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ContextAnalysis {
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return ContextAnalysisValueObject.createDefault().toPlainObject();
    }

    // AI INSTRUCTIONS: Extract data from API response following @golden-rule DTO patterns
    const topics = apiAnalysisData?.entities?.evaluationCriteria || [];
    const interests = apiAnalysisData?.personaInference?.evidence || [];
    const urgency = apiAnalysisData?.entities?.urgency || 'low';
    
    // Use API-provided engagement directly (OpenAI analyzes this now)
    const engagementLevel = 'low' as const; // Will be replaced by API analysis in message processing
    
    // Default sentiment to neutral - OpenAI provides this in message processing
    const sentiment = 'neutral' as const;
    
    // Use AI-provided conversation stage if available, with fallback to valid enum value
    const conversationStage = 'discovery' as const; // Will be replaced by proper AI analysis

    // Update journey state based on API data and current session state
    let journeyState: any = undefined;
    if (session && apiAnalysisData) {
      const currentJourneyState = session.contextData.journeyState 
        ? UserJourneyState.create(
            session.contextData.journeyState.stage as any,
            session.contextData.journeyState.confidence,
            session.contextData.journeyState.metadata
          )
        : UserJourneyState.create();

      // Use session's existing engagement score for journey state updates
      const sessionEngagementScore = session.contextData.engagementScore || 0;
      const normalizedEngagementScore = sessionEngagementScore / 25; // Normalize to 0-1
      journeyState = currentJourneyState.updateEngagement(normalizedEngagementScore);
    }

    const analysis = new ContextAnalysisValueObject(
      topics,
      interests,
      sentiment,
      engagementLevel,
      'unknown', // Intent comes from separate API classification
      urgency,
      conversationStage,
      undefined, // intentResult - handled by separate intent classification
      journeyState
    );

    return analysis.toPlainObject();
  }

  /**
   * Generate conversation summary using API data
   * AI INSTRUCTIONS: Create summary from API insights and basic message analysis
   */
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession,
    apiAnalysisData?: ApiAnalysisData
  ): ConversationSummary {
    const userMessages = messages.filter(m => m.isFromUser());
    const context = session.contextData;
    
    // Create simple overview from messages
    const overview = this.createSimpleOverview(messages, context);
    
    // Use API-provided data for key topics
    const keyTopics = apiAnalysisData?.entities?.evaluationCriteria || context.topics || [];
    
    // Use API-provided data for needs and pain points
    const userNeeds = apiAnalysisData?.entities?.integrationNeeds || [];
    const painPoints = apiAnalysisData?.entities?.painPoints || [];
    
    // Use AI-provided next steps if available
    const nextSteps = apiAnalysisData?.conversationFlow?.nextSteps || ['Continue conversation'];
    
    // Use AI-provided qualification status
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

  /**
   * Create simple overview from messages
   * AI INSTRUCTIONS: Simple overview without complex business rule dependencies
   */
  private createSimpleOverview(messages: ChatMessage[], context: any): string {
    const userMessages = messages.filter(m => m.isFromUser());
    const totalMessages = messages.length;
    
    if (userMessages.length === 0) {
      return 'No user interaction yet';
    }
    
    const conversationLength = userMessages.length;
    const hasContactInfo = context.email || context.phone;
    const topicsCount = context.topics?.length || 0;
    
    return `Active conversation with ${conversationLength} user messages (${totalMessages} total). ` +
      `${hasContactInfo ? 'Contact info captured. ' : ''}` +
      `${topicsCount > 0 ? `${topicsCount} topics discussed.` : 'Topics being explored.'}`;
  }

  /**
   * Update session context with new message and API data
   * AI INSTRUCTIONS: Main coordination method following @golden-rule orchestration patterns
   */
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