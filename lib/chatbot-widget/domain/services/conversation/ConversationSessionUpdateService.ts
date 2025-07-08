/**
 * Conversation Session Update Service
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Added intent persistence for smart context maintenance
 * - Use IntentPersistenceService to maintain business context across turns
 * - Update session context with new message using API-provided data
 * - Extract and update lead information (company, visitor name)
 * - Single responsibility: Session state updates based on conversation analysis
 * - Keep under 200 lines following @golden-rule patterns
 * - Create simple conversation summaries without business rule dependencies
 * - Maintain clean separation of concerns
 */

import { ChatSession } from '../../entities/ChatSession';
import { ChatMessage } from '../../entities/ChatMessage';
import { ContextAnalysis, ContextAnalysisValueObject } from '../../value-objects/message-processing/ContextAnalysis';
import { ContactInfo } from '../../value-objects/lead-management/ContactInfo';
import { IntentPersistenceService } from '../session-management/IntentPersistenceService';
import { ApiAnalysisData } from './ConversationContextOrchestrator';

export class ConversationSessionUpdateService {

  constructor() {
  }

  /** Update session context with new message using API-provided data */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    analysis: ContextAnalysis,
    apiAnalysisData?: ApiAnalysisData, // Pass API data directly
  ): ChatSession {
    // Convert API-provided engagement level to numerical score for session storage
    const engagementScore = this.convertEngagementLevelToScore(analysis.engagementLevel);
    
    let updatedSession = session
      .updateEngagementScore(engagementScore)
      .updateConversationSummary(this.createSimpleConversationSummary(allMessages));

    // Add new topics
    analysis.topics.forEach(topic => {
      updatedSession = updatedSession.addTopic(topic);
    });

    // Add new interests
    analysis.interests.forEach(interest => {
      updatedSession = updatedSession.addInterest(interest);
    });

    // Extract and update lead information from API data if available
    if (apiAnalysisData?.entities) {
      updatedSession = this.updateSessionWithLeadInfo(updatedSession, apiAnalysisData.entities);
    }

    return updatedSession;
  }

  /**
   * Extract and update session with lead information from API analysis
   * AI INSTRUCTIONS: Use API-provided entities as the single source of truth, removing redundancy.
   */
  private updateSessionWithLeadInfo(session: ChatSession, entities: NonNullable<ApiAnalysisData['entities']>): ChatSession {
    
    // MODERN: Contact info and entity data is now handled through accumulated entities only
    // Extract entities that would indicate contact information
    const hasContactEntities = entities.visitorName || entities.email || entities.phone || entities.company;
    
    if (hasContactEntities) {
      // Contact info is now managed via EntityAccumulationService in the main processing flow
      // This service no longer directly updates legacy context fields
      return session;
    }

    return session;
  }

  /** Convert API-provided engagement level to numerical score */
  private convertEngagementLevelToScore(engagementLevel: 'low' | 'medium' | 'high'): number {
    switch (engagementLevel) {
      case 'high': return 85;
      case 'medium': return 55;
      case 'low': return 25;
      default: return 25;
    }
  }

  /**
   * Create simple conversation summary from messages
   * AI INSTRUCTIONS: Simple summary without complex business rule dependencies
   */
  private createSimpleConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.isFromUser());
    const botMessages = messages.filter(m => !m.isFromUser());
    
    if (userMessages.length === 0) {
      return 'No user messages yet';
    }
    
    const totalMessages = messages.length;
    const conversationLength = userMessages.length;
    
    // Simple summary based on message count and basic patterns
    const summary = `Conversation with ${conversationLength} user messages (${totalMessages} total). ` +
      `Latest user message: "${userMessages[userMessages.length - 1]?.content.substring(0, 100)}..."`;
    
    return summary;
  }

  /** Update conversation summary from messages */
  updateConversationSummary(
    session: ChatSession,
    messages: ChatMessage[]
  ): ChatSession {
    const conversationSummary = this.createSimpleConversationSummary(messages);
    return session.updateConversationSummary(conversationSummary);
  }

  /** Update session with intent data for persistence */
  updateSessionWithIntentData(
    session: ChatSession,
    message: ChatMessage,
    intentData: any,
    turnNumber: number
  ): ChatSession {
    // Update intent history using the persistence service
    const updatedContextData = IntentPersistenceService.updateIntentHistory(
      session.contextData,
      intentData,
      message.id,
      turnNumber
    );

    return session.updateContextData(updatedContextData);
  }

  /** Update session context with enhanced analysis including intent persistence */
  updateSessionWithEnhancedAnalysisAndIntent(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    enhancedAnalysis: ContextAnalysis,
    intentData?: any
  ): ChatSession {
    // First apply base context updates
    let updatedSession = this.updateSessionContext(session, message, allMessages, enhancedAnalysis);

    // Add intent persistence if intent data is available
    if (intentData) {
      const turnNumber = allMessages.length + 1; // Current turn number
      updatedSession = this.updateSessionWithIntentData(updatedSession, message, intentData, turnNumber);
    }

    return updatedSession;
  }

  /** Create updated session with conversation summary */
  createSessionWithSummary(
    session: ChatSession,
    messages: ChatMessage[]
  ): ChatSession {
    const conversationSummary = this.createSimpleConversationSummary(messages);
    return session.updateConversationSummary(conversationSummary);
  }

  /** Update session engagement metrics using API-provided data */
  updateSessionEngagement(
    session: ChatSession,
    analysis: ContextAnalysis
  ): ChatSession {
    const engagementScore = this.convertEngagementLevelToScore(analysis.engagementLevel);
    return session.updateEngagementScore(engagementScore);
  }
} 