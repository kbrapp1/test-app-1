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
import { LeadExtractionService } from '../lead-management/LeadExtractionService';
import { ContactInfo } from '../../value-objects/lead-management/ContactInfo';
import { IntentPersistenceService } from '../session-management/IntentPersistenceService';

export class ConversationSessionUpdateService {
  private readonly leadExtractionService: LeadExtractionService;

  constructor() {
    this.leadExtractionService = new LeadExtractionService();
  }

  /**
   * Update session context with new message using API-provided data
   */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[],
    analysis: ContextAnalysis
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

    // Extract and update lead information (company, visitor name, contact info)
    updatedSession = this.updateSessionWithLeadInfo(updatedSession, allMessages);

    return updatedSession;
  }

  /**
   * Extract and update session with lead information
   */
  private updateSessionWithLeadInfo(session: ChatSession, allMessages: ChatMessage[]): ChatSession {
    const extractedInfo = this.leadExtractionService.extractLeadInformation(allMessages);
    
    // Prepare contact info data
    const contactData = {
      email: extractedInfo.email || session.contextData.email,
      phone: extractedInfo.phone || session.contextData.phone,
      name: extractedInfo.name || session.contextData.visitorName || undefined,
      company: extractedInfo.company || session.contextData.company || undefined
    };
    
    // Only create ContactInfo if we have at least email or phone
    const hasRequiredContact = contactData.email || contactData.phone;
    
    // Only update if we have extracted some lead information AND have required contact info
    if ((extractedInfo.name || extractedInfo.email || extractedInfo.phone || extractedInfo.company) && hasRequiredContact) {
      const contactInfo = ContactInfo.create(contactData);
      return session.captureContactInfo(contactInfo);
    }
    
    return session;
  }

  /**
   * Convert API-provided engagement level to numerical score
   */
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

  /**
   * Update conversation summary from messages
   */
  updateConversationSummary(
    session: ChatSession,
    messages: ChatMessage[]
  ): ChatSession {
    const conversationSummary = this.createSimpleConversationSummary(messages);
    return session.updateConversationSummary(conversationSummary);
  }

  /**
   * Update session with intent data for persistence
   */
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

  /**
   * Update session context with enhanced analysis including intent persistence
   */
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

  /**
   * Create updated session with conversation summary
   */
  createSessionWithSummary(
    session: ChatSession,
    messages: ChatMessage[]
  ): ChatSession {
    const conversationSummary = this.createSimpleConversationSummary(messages);
    return session.updateConversationSummary(conversationSummary);
  }

  /**
   * Update session engagement metrics using API-provided data
   */
  updateSessionEngagement(
    session: ChatSession,
    analysis: ContextAnalysis
  ): ChatSession {
    const engagementScore = this.convertEngagementLevelToScore(analysis.engagementLevel);
    return session.updateEngagementScore(engagementScore);
  }
} 