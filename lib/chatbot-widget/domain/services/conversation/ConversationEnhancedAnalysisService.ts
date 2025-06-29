/**
 * Conversation Enhanced Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Enhance basic context analysis with intent classification and knowledge retrieval
 * - This service triggers the vector embeddings pipeline through knowledge retrieval
 * - Follow @golden-rule.mdc patterns exactly
 * - Keep under 200-250 lines
 * - Delegate to specialized services, no business logic here
 * - PERFORMANCE: Coordinate async operations efficiently
 */

import { ContextAnalysis } from '../../value-objects/message-processing/ContextAnalysis';
import { ChatMessage } from '../../entities/ChatMessage';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';
import { UserJourneyState } from '../../value-objects/session-management/UserJourneyState';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { IIntentClassificationService } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';

export class ConversationEnhancedAnalysisService {
  constructor(
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {}

  /**
   * Enhance base analysis with intent classification and knowledge retrieval
   * 
   * AI INSTRUCTIONS:
   * - This method triggers the vector embeddings pipeline
   * - Coordinate async services while maintaining single responsibility
   * - Handle service failures gracefully with fallbacks
   */
  async enhanceAnalysis(
    baseAnalysis: ContextAnalysis,
    messages: ChatMessage[],
    chatbotConfig?: ChatbotConfig,
    session?: ChatSession,
    sharedLogFile?: string
  ): Promise<ContextAnalysis> {
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return baseAnalysis;
    }

    let intentResult: IntentResult | undefined;
    let journeyState: UserJourneyState | undefined;
    let relevantKnowledge: Array<{ title: string; content: string; relevanceScore: number; }> | undefined;

    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Step 1: Classify intent if service is available
    if (this.intentClassificationService && chatbotConfig && session) {
      intentResult = await this.classifyMessageIntent(
        lastUserMessage,
        messages,
        chatbotConfig,
        session
      );
    }

    // Step 2: Update journey state if we have intent result
    if (intentResult && session) {
      journeyState = this.updateJourneyState(session, intentResult, baseAnalysis);
    }

    // Step 3: Retrieve relevant knowledge if service is available
    // AI INSTRUCTIONS: This step triggers the vector embeddings pipeline
    if (this.knowledgeRetrievalService) {
      relevantKnowledge = await this.retrieveRelevantKnowledge(
        lastUserMessage,
        userMessages,
        intentResult, // Can be undefined - service will handle it
        sharedLogFile
      );
    }

    // Create enhanced analysis with all collected data
    return {
      ...baseAnalysis,
      intentResult,
      journeyState,
      relevantKnowledge
    };
  }

  /**
   * Classify message intent using intent classification service
   * AI INSTRUCTIONS: Delegate to intent service, handle failures gracefully
   */
  private async classifyMessageIntent(
    message: ChatMessage,
    allMessages: ChatMessage[],
    config: ChatbotConfig,
    session: ChatSession
  ): Promise<IntentResult | undefined> {
    if (!this.intentClassificationService) {
      return undefined;
    }

    try {
      const context = {
        chatbotConfig: config,
        session,
        messageHistory: allMessages.slice(-5), // Last 5 messages for context
        currentMessage: message.content
      };
      
      return await this.intentClassificationService.classifyIntent(
        message.content,
        context
      );
    } catch (error) {
      // Intent classification failed - using fallback
      return undefined;
    }
  }

  /**
   * Retrieve relevant knowledge based on user query and intent
   * 
   * AI INSTRUCTIONS:
   * - THIS METHOD TRIGGERS THE VECTOR EMBEDDINGS PIPELINE
   * - Calls SimpleKnowledgeRetrievalService.searchKnowledge
   * - Which initializes vector embeddings and performs semantic search
   * - Includes comprehensive logging of the embeddings process
   */
  private async retrieveRelevantKnowledge(
    message: ChatMessage,
    userMessages: ChatMessage[],
    intentResult?: IntentResult,
    sharedLogFile?: string
  ): Promise<Array<{ title: string; content: string; relevanceScore: number; }> | undefined> {
    if (!this.knowledgeRetrievalService) {
      return undefined;
    }

    try {
      const knowledgeContext: KnowledgeRetrievalContext = {
        userQuery: message.content,
        intentResult,
        conversationHistory: userMessages.slice(-3).map(m => m.content),
        maxResults: 7, // ✅ BEST PRACTICE: 5-10 results for better coverage
        minRelevanceScore: 0.15, // Slightly lower for initial retrieval
        sharedLogFile
      };

      // AI INSTRUCTIONS: This call triggers the complete vector embeddings pipeline:
      // 1. SimpleKnowledgeRetrievalService.searchKnowledge()
      // 2. Lazy initialization of OpenAI embeddings 
      // 3. Vector similarity search with comprehensive logging
      // 4. Knowledge relevance scoring and ranking
      const knowledgeResult = await this.knowledgeRetrievalService.searchKnowledge(knowledgeContext);
      
      return knowledgeResult.items.map(item => ({
        title: item.title,
        content: item.content,
        relevanceScore: item.relevanceScore
      }));
    } catch (error) {
      // Knowledge retrieval failed - continuing without knowledge
      return undefined;
    }
  }

  /**
   * Update journey state based on intent result
   * AI INSTRUCTIONS: Simple journey state coordination following DDD patterns
   */
  private updateJourneyState(
    session: ChatSession,
    intentResult: IntentResult,
    baseAnalysis: ContextAnalysis
  ): UserJourneyState | undefined {
    try {
      // Get current journey state or create new one
      const currentJourneyState = session.contextData.journeyState 
        ? UserJourneyState.create(
            session.contextData.journeyState.stage as any,
            session.contextData.journeyState.confidence,
            session.contextData.journeyState.metadata
          )
        : UserJourneyState.create();

      // Check if we should transition to a new stage based on intent
      const transitionResult = currentJourneyState.shouldTransitionBasedOnIntent(intentResult);
      
      if (transitionResult.shouldTransition && transitionResult.newStage) {
        // Transition to new stage
        const trigger = {
          type: 'intent' as const,
          value: intentResult.intent,
          confidence: intentResult.confidence
        };
        
        return currentJourneyState.transitionTo(
          transitionResult.newStage,
          trigger,
          intentResult.confidence * 100 // Convert to 0-100 scale for engagement score
        );
      } else {
        // Update engagement score based on intent confidence
        const engagementScore = intentResult.confidence * 100; // Convert to 0-100 scale
        return currentJourneyState.updateEngagement(engagementScore);
      }
    } catch (error) {
      // Journey state update failed - return undefined
      return undefined;
    }
  }
} 