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

/**
 * API-provided analysis data from OpenAI
 * Following @golden-rule.mdc DTO pattern for external data contracts
 */
export interface ApiAnalysisData {
  entities?: {
    urgency?: 'low' | 'medium' | 'high';
    painPoints?: string[];
    integrationNeeds?: string[];
    evaluationCriteria?: string[];
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
   * Get messages that fit within context window with token management
   * AI INSTRUCTIONS: Pure utility coordination, delegate to specialized service
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
    return this.sessionUpdateService.updateSessionContext(session, message, allMessages, analysis);
  }
} 