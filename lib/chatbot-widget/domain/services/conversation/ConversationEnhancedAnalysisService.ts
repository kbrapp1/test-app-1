/**
 * Conversation Enhanced Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Handle enhanced conversation analysis with async operations
 * - Focus on intent classification and knowledge retrieval
 * - Keep under 200 lines following @golden-rule patterns
 * - Use domain-specific errors for classification failures
 * - Maintain single responsibility for enhanced analysis
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ContextAnalysis } from '../../value-objects/message-processing/ContextAnalysis';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';
import { UserJourneyState, JourneyStage } from '../../value-objects/session-management/UserJourneyState';
import { IIntentClassificationService, IntentClassificationContext } from '../interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeRetrievalContext } from '../interfaces/IKnowledgeRetrievalService';

export class ConversationEnhancedAnalysisService {
  constructor(
    private intentClassificationService?: IIntentClassificationService,
    private knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {}

  /**
   * Enhance base analysis with intent classification and knowledge retrieval
   */
  async enhanceAnalysis(
    baseAnalysis: ContextAnalysis,
    messages: ChatMessage[],
    chatbotConfig?: ChatbotConfig,
    session?: ChatSession
  ): Promise<ContextAnalysis> {
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return baseAnalysis;
    }

    let intentResult: IntentResult | undefined;
    let journeyState: UserJourneyState | undefined;
    let relevantKnowledge: Array<{ title: string; content: string; relevanceScore: number; }> | undefined;

    const lastUserMessage = userMessages[userMessages.length - 1];
    
    // Classify intent if service is available
    if (this.intentClassificationService && chatbotConfig && session) {
      intentResult = await this.classifyMessageIntent(
        lastUserMessage,
        messages,
        chatbotConfig,
        session
      );
    }

    // Update journey state if we have intent result
    if (intentResult && session) {
      journeyState = this.updateJourneyState(session, intentResult, baseAnalysis);
    }

    // Retrieve relevant knowledge if service is available
    if (this.knowledgeRetrievalService && intentResult) {
      relevantKnowledge = await this.retrieveRelevantKnowledge(
        lastUserMessage,
        userMessages,
        intentResult
      );
    }

    return {
      ...baseAnalysis,
      intentResult,
      journeyState,
      relevantKnowledge,
    };
  }

  /**
   * Classify intent for a message with context
   */
  private async classifyMessageIntent(
    message: ChatMessage,
    allMessages: ChatMessage[],
    chatbotConfig: ChatbotConfig,
    session: ChatSession
  ): Promise<IntentResult | undefined> {
    if (!this.intentClassificationService) {
      return undefined;
    }

    try {
      const context: IntentClassificationContext = {
        chatbotConfig,
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
   */
  private async retrieveRelevantKnowledge(
    message: ChatMessage,
    userMessages: ChatMessage[],
    intentResult: IntentResult
  ): Promise<Array<{ title: string; content: string; relevanceScore: number; }> | undefined> {
    if (!this.knowledgeRetrievalService) {
      return undefined;
    }

    try {
      const knowledgeContext: KnowledgeRetrievalContext = {
        userQuery: message.content,
        intentResult,
        conversationHistory: userMessages.slice(-3).map(m => m.content),
        maxResults: 3,
        minRelevanceScore: 0.4
      };

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
      // Update engagement score from base analysis 
      const newEngagementScore = typeof baseAnalysis.engagementLevel === 'number' 
        ? baseAnalysis.engagementLevel 
        : 0.5;
      return currentJourneyState.updateEngagement(newEngagementScore);
    }
  }
} 