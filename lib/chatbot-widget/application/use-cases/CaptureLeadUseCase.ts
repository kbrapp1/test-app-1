/**
 * Capture Lead Use Case
 * 
 * Application Use Case: Handles the business logic for capturing a new lead
 * Single Responsibility: Lead capture workflow coordination
 * Following DDD application layer patterns
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { Lead } from '../../domain/entities/Lead';
import { ContactInfo } from '../../domain/value-objects/ContactInfo';
import { QualificationData } from '../../domain/value-objects/QualificationData';
import { LeadSource } from '../../domain/value-objects/LeadSource';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { LeadScoringService } from '../../domain/services/LeadScoringService';


export interface CaptureLeadRequest {
  sessionId: string;
  contactInfo: {
    email?: string;
    phone?: string;
    name?: string;
    company?: string;
  };
  qualificationAnswers?: Array<{
    questionId: string;
    answer: string | string[];
  }>;
}

export interface CaptureLeadResult {
  lead: Lead;
  updatedSession: ChatSession;
  leadScore: number;
  qualificationStatus: 'qualified' | 'unqualified' | 'needs_review';
  recommendations: string[];
  nextSteps: string[];
}

export class CaptureLeadUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly leadRepository: ILeadRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly leadScoringService: LeadScoringService
  ) {}

  /**
   * Execute the complete lead capture workflow
   */
  async execute(request: CaptureLeadRequest): Promise<CaptureLeadResult> {
    // 1. Load and validate session
    const session = await this.sessionRepository.findById(request.sessionId);
    if (!session) {
      throw new Error(`Chat session ${request.sessionId} not found`);
    }

    // 2. Load chatbot configuration for qualification questions
    const config = await this.chatbotConfigRepository.findById(session.chatbotConfigId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for session ${request.sessionId}`);
    }

    // 3. Validate that lead hasn't already been captured for this session
    const existingLead = await this.leadRepository.findBySessionId(session.id);
    if (existingLead) {
      throw new Error(`Lead already captured for session ${request.sessionId}`);
    }

    // 4. Update session with contact information
    let updatedSession = session.captureContactInfo(
      request.contactInfo.email,
      request.contactInfo.phone,
      request.contactInfo.name,
      request.contactInfo.company
    );

    // 5. Process qualification answers if provided
    if (request.qualificationAnswers) {
      updatedSession = this.processQualificationAnswers(
        updatedSession,
        request.qualificationAnswers,
        config
      );
    }

    // 6. Create lead entity from session and contact info
    const { contactInfo, qualificationData, source, conversationSummary } = this.createLeadFromSession(updatedSession, config, request.contactInfo);
    const lead = Lead.create(
      updatedSession.id,
      config.organizationId,
      updatedSession.chatbotConfigId,
      contactInfo,
      qualificationData,
      source,
      conversationSummary
    );

    // 7. Calculate lead score (already calculated in Lead.create)
    const leadScore = lead.leadScore;

    // 8. Determine qualification status
    const qualificationStatus = this.determineQualificationStatus(leadScore, lead);

    // 9. Save lead and updated session
    const savedLead = await this.leadRepository.save(lead);
    const finalSession = await this.sessionRepository.update(updatedSession);

    // 10. Generate recommendations and next steps
    const recommendations = this.generateRecommendations(savedLead, finalSession, leadScore);
    const nextSteps = this.generateNextSteps(savedLead, qualificationStatus);

    return {
      lead: savedLead,
      updatedSession: finalSession,
      leadScore,
      qualificationStatus,
      recommendations,
      nextSteps
    };
  }

  /**
   * Process qualification answers from the request
   */
  private processQualificationAnswers(
    session: ChatSession,
    answers: CaptureLeadRequest['qualificationAnswers'],
    config: ChatbotConfig
  ): ChatSession {
    if (!answers) return session;

    let updatedSession = session;

    for (const answer of answers) {
      // Find the question configuration
      const questionConfig = config.leadQualificationQuestions.find(q => q.id === answer.questionId);
      if (!questionConfig) {
        continue; // Skip unknown questions
      }

      // Add the answer to session's qualification state
      updatedSession = updatedSession.answerQualificationQuestion(
        answer.questionId,
        questionConfig.question,
        answer.answer,
        questionConfig.scoringWeight
      );
    }

    return updatedSession;
  }

  /**
   * Create lead data from session information
   */
  private createLeadFromSession(
    session: ChatSession,
    config: ChatbotConfig,
    contactInfo: CaptureLeadRequest['contactInfo']
  ): {
    contactInfo: ContactInfo;
    qualificationData: QualificationData;
    source: LeadSource;
    conversationSummary: string;
  } {
    const leadContactInfo = {
      email: contactInfo.email || session.contextData.email,
      phone: contactInfo.phone || session.contextData.phone,
      name: contactInfo.name || session.contextData.visitorName,
      company: contactInfo.company || session.contextData.company
    };

    const leadQualificationData = {
      painPoints: [],
      interests: session.contextData.interests,
      answeredQuestions: session.leadQualificationState.answeredQuestions.map(aq => ({
        questionId: aq.questionId,
        question: aq.question,
        answer: aq.answer,
        answeredAt: aq.answeredAt,
        scoringWeight: aq.scoringWeight,
        scoreContribution: aq.scoringWeight // Simple 1:1 mapping for now
      })),
      engagementLevel: (session.contextData.engagementScore > 70 ? 'high' : 
                      session.contextData.engagementScore > 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
    };

    const leadSource = {
      channel: 'chatbot_widget' as const,
      referrer: session.referrerUrl,
      pageUrl: session.currentUrl || '',
      pageTitle: session.currentUrl // Would need actual page title
    };

    const conversationSummary = session.contextData.conversationSummary || 
      `Chatbot session with ${session.contextData.topics.join(', ') || 'general inquiries'}`;

    return {
      contactInfo: ContactInfo.create(leadContactInfo),
      qualificationData: QualificationData.create(leadQualificationData),
      source: LeadSource.create(leadSource),
      conversationSummary
    };
  }

  /**
   * Determine qualification status based on score and criteria
   */
  private determineQualificationStatus(
    leadScore: number,
    lead: Lead
  ): 'qualified' | 'unqualified' | 'needs_review' {
    // High score leads are qualified
    if (leadScore >= 80) {
      return 'qualified';
    }

    // Very low score leads are unqualified
    if (leadScore < 30) {
      return 'unqualified';
    }

    // Check if minimum contact info is provided
    if (!lead.contactInfo.email && !lead.contactInfo.phone) {
      return 'unqualified';
    }

    // Medium scores need review
    return 'needs_review';
  }

  /**
   * Generate recommendations based on lead data
   */
  private generateRecommendations(
    lead: Lead,
    session: ChatSession,
    leadScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (leadScore >= 80) {
      recommendations.push('High-quality lead - prioritize immediate follow-up');
      recommendations.push('Schedule demo or sales call within 24 hours');
    } else if (leadScore >= 50) {
      recommendations.push('Moderate lead quality - nurture with targeted content');
      recommendations.push('Send personalized email sequence');
    } else {
      recommendations.push('Low lead score - add to general nurture campaign');
    }

    if (!lead.contactInfo.email) {
      recommendations.push('Missing email - attempt to capture in follow-up');
    }

    if (!lead.contactInfo.phone) {
      recommendations.push('Missing phone number - consider phone capture campaign');
    }

    if (session.contextData.interests.length > 0) {
      recommendations.push(`Focus on interests: ${session.contextData.interests.join(', ')}`);
    }

    if (session.contextData.company) {
      recommendations.push('B2B lead - research company for account-based approach');
    }

    return recommendations;
  }

  /**
   * Generate next steps based on qualification status
   */
  private generateNextSteps(
    lead: Lead,
    qualificationStatus: 'qualified' | 'unqualified' | 'needs_review'
  ): string[] {
    const nextSteps: string[] = [];

    switch (qualificationStatus) {
      case 'qualified':
        nextSteps.push('Assign to sales representative');
        nextSteps.push('Schedule follow-up call or demo');
        nextSteps.push('Add to high-priority lead list');
        nextSteps.push('Send personalized welcome sequence');
        break;

      case 'needs_review':
        nextSteps.push('Queue for manual review');
        nextSteps.push('Send additional qualification email');
        nextSteps.push('Add to nurture campaign');
        break;

      case 'unqualified':
        nextSteps.push('Add to general newsletter list');
        nextSteps.push('Monitor for future engagement');
        nextSteps.push('Consider re-qualification campaign in 3 months');
        break;
    }

    // Always add these general next steps
    nextSteps.push('Update CRM with lead information');
    nextSteps.push('Track engagement metrics');

    return nextSteps;
  }
} 