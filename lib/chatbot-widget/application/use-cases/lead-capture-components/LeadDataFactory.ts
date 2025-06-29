/**
 * Lead Data Factory
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Transform session data into lead domain objects
 * - Pure transformation logic, no business rules
 * - Use value object factories for proper domain modeling
 * - Handle data mapping between session and lead contexts
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ContactInfo } from '../../../domain/value-objects/lead-management/ContactInfo';
import { QualificationData } from '../../../domain/value-objects/lead-management/QualificationData';
import { LeadSource } from '../../../domain/value-objects/lead-management/LeadSource';
import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';

export interface LeadDataFactoryInput {
  session: ChatSession;
  config: ChatbotConfig;
  contactInfo: {
    email?: string;
    phone?: string;
    name?: string;
    company?: string;
  };
}

export interface LeadDataFactoryResult {
  contactInfo: ContactInfo;
  qualificationData: QualificationData;
  source: LeadSource;
  conversationSummary: string;
}

export class LeadDataFactory {
  /**
   * Create complete lead data from session information
   */
  static createFromSession(input: LeadDataFactoryInput): LeadDataFactoryResult {
    const { session, config, contactInfo } = input;

    return {
      contactInfo: this.createContactInfo(session, contactInfo),
      qualificationData: this.createQualificationData(session),
      source: this.createLeadSource(session),
      conversationSummary: this.createConversationSummary(session)
    };
  }

  /**
   * Create contact info from session and provided data - MODERN: Use accumulated entities
   */
  private static createContactInfo(
    session: ChatSession,
    providedContactInfo: LeadDataFactoryInput['contactInfo']
  ): ContactInfo {
    // MODERN: Extract contact info from accumulated entities with proper deserialization
    const accumulatedEntities = session.contextData.accumulatedEntities
      ? AccumulatedEntities.fromObject(session.contextData.accumulatedEntities)
      : null;
    
    const contactData = {
      email: providedContactInfo.email || '',
      phone: providedContactInfo.phone || '',
      name: providedContactInfo.name || accumulatedEntities?.visitorName?.value || '',
      company: providedContactInfo.company || accumulatedEntities?.company?.value || ''
    };

    return ContactInfo.create(contactData);
  }

  /**
   * Create qualification data from session state
   */
  private static createQualificationData(session: ChatSession): QualificationData {
    const qualificationData = {
      painPoints: this.extractPainPoints(session),
      interests: session.contextData.interests || [],
      answeredQuestions: this.mapAnsweredQuestions(session),
      engagementLevel: this.determineEngagementLevel(session.contextData.engagementScore)
    };

    return QualificationData.create(qualificationData);
  }

  /**
   * Create lead source information
   */
  private static createLeadSource(session: ChatSession): LeadSource {
    const sourceData = {
      channel: 'chatbot_widget' as const,
      referrer: session.referrerUrl || '',
      pageUrl: session.currentUrl || '',
      pageTitle: this.extractPageTitle(session.currentUrl)
    };

    return LeadSource.create(sourceData);
  }

  /**
   * Create conversation summary from session
   */
  private static createConversationSummary(session: ChatSession): string {
    const conversationSummary = session.contextData.conversationSummary;
    
    if (conversationSummary) {
      // Use enhanced object format only
      return conversationSummary.fullSummary;
    }

    const topics = session.contextData.topics || [];
    if (topics.length > 0) {
      return `Chatbot session discussing: ${topics.join(', ')}`;
    }

    return 'General chatbot conversation session';
  }

  /**
   * Extract pain points from session context
   */
  private static extractPainPoints(session: ChatSession): string[] {
    // Extract pain points from conversation topics and context
    const painPointKeywords = ['problem', 'issue', 'challenge', 'difficulty', 'struggle'];
    const topics = session.contextData.topics || [];
    
    return topics.filter(topic => 
      painPointKeywords.some(keyword => 
        topic.toLowerCase().includes(keyword)
      )
    );
  }

  /**
   * Map session qualification answers to lead format
   */
  private static mapAnsweredQuestions(session: ChatSession) {
    return session.leadQualificationState.answeredQuestions.map(aq => ({
      questionId: aq.questionId,
      question: aq.question,
      answer: aq.answer,
      answeredAt: aq.answeredAt,
      scoringWeight: aq.scoringWeight,
      scoreContribution: aq.scoringWeight // Simple 1:1 mapping for now
    }));
  }

  /**
   * Determine engagement level from score
   */
  private static determineEngagementLevel(engagementScore: number): 'high' | 'medium' | 'low' {
    if (engagementScore > 70) return 'high';
    if (engagementScore > 40) return 'medium';
    return 'low';
  }

  /**
   * Extract page title from URL (simplified)
   */
  private static extractPageTitle(url?: string): string {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.split('/').pop() || urlObj.hostname;
    } catch {
      return url;
    }
  }
} 