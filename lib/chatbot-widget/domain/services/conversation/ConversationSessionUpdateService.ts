/**
 * Conversation Session Update Service
 * 
 * AI INSTRUCTIONS:
 * - Handle session context updates with new messages
 * - Focus on session state management and context updates
 * - Keep under 200 lines following @golden-rule patterns
 * - Maintain single responsibility for session updates
 * - Use domain-specific value objects for context analysis
 */

import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { ContextAnalysis, ContextAnalysisValueObject } from '../../value-objects/message-processing/ContextAnalysis';
import { ConversationStageService } from './ConversationStageService';

export class ConversationSessionUpdateService {
  constructor(
    private conversationStageService: ConversationStageService
  ) {}

  /**
   * Update session context with new message
   */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    analysis: ContextAnalysis
  ): ChatSession {
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
   * Update session with enhanced analysis results
   */
  updateSessionWithEnhancedAnalysis(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    enhancedAnalysis: ContextAnalysis
  ): ChatSession {
    // First apply base context updates
    let updatedSession = this.updateSessionContext(session, message, allMessages, enhancedAnalysis);

    // Apply enhanced analysis updates if available
    // Note: Enhanced analysis data is already included in the context
    // Journey state and intent result are part of the context analysis
    // but don't require separate session updates as they're handled through context

    return updatedSession;
  }

  /**
   * Create updated session with conversation summary
   */
  createSessionWithSummary(
    session: ChatSession,
    messages: ChatMessage[]
  ): ChatSession {
    const conversationSummary = this.conversationStageService.createConversationSummary(messages);
    return session.updateConversationSummary(conversationSummary);
  }

  /**
   * Update session engagement metrics
   */
  updateSessionEngagement(
    session: ChatSession,
    analysis: ContextAnalysis
  ): ChatSession {
    const analysisValueObject = new ContextAnalysisValueObject(
      analysis.topics,
      analysis.interests,
      analysis.sentiment,
      analysis.engagementLevel,
      analysis.userIntent,
      analysis.urgency,
      analysis.conversationStage
    );

    const engagementScore = analysisValueObject.calculateEngagementScore();
    return session.updateEngagementScore(engagementScore);
  }
} 