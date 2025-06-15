/**
 * Capture Lead Use Case
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate lead capture workflow only
 * - Delegate specialized tasks to focused components
 * - Handle error coordination and transaction management
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines by delegating to components
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { Lead } from '../../domain/entities/Lead';
import { ContactInfo } from '../../domain/value-objects/lead-management/ContactInfo';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { LeadScoringService } from '../../domain/services/lead-management/LeadScoringService';

// Specialized components
import {
  LeadDataFactory,
  QualificationProcessor,
  LeadQualificationAnalyzer,
  LeadRecommendationEngine,
  LeadNextStepsGenerator,
  QualificationAnswer,
  QualificationStatus,
  LeadRecommendation,
  NextStep
} from './lead-capture-components';

export interface CaptureLeadRequest {
  sessionId: string;
  contactInfo: {
    email?: string;
    phone?: string;
    name?: string;
    company?: string;
  };
  qualificationAnswers?: QualificationAnswer[];
}

export interface CaptureLeadResult {
  lead: Lead;
  updatedSession: ChatSession;
  leadScore: number;
  qualificationStatus: QualificationStatus;
  recommendations: LeadRecommendation[];
  nextSteps: NextStep[];
  processingStats: {
    qualificationAnswersProcessed: number;
    qualificationAnswersSkipped: number;
    validationErrors: string[];
  };
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
    // 1. Load and validate dependencies
    const { session, config } = await this.loadDependencies(request.sessionId);

    // 2. Validate business rules
    await this.validateBusinessRules(session);

    // 3. Process qualification answers if provided
    const { updatedSession, processingStats } = this.processQualificationAnswers(
      session,
      request.qualificationAnswers || [],
      config
    );

    // 4. Update session with contact information
    const sessionWithContact = this.updateSessionContact(updatedSession, request.contactInfo);

    // 5. Create lead from session data
    const lead = this.createLead(sessionWithContact, config, request.contactInfo);

    // 6. Analyze qualification status
    const qualificationAnalysis = LeadQualificationAnalyzer.analyzeQualification(
      lead,
      lead.leadScore
    );

    // 7. Generate recommendations and next steps
    const recommendations = LeadRecommendationEngine.generateRecommendations(
      lead,
      sessionWithContact,
      lead.leadScore
    );

    const nextSteps = LeadNextStepsGenerator.generateNextSteps(
      lead,
      qualificationAnalysis.status
    );

    // 8. Persist changes
    const { savedLead, finalSession } = await this.persistChanges(lead, sessionWithContact);

    return {
      lead: savedLead,
      updatedSession: finalSession,
      leadScore: lead.leadScore,
      qualificationStatus: qualificationAnalysis.status,
      recommendations,
      nextSteps,
      processingStats
    };
  }

  /**
   * Load and validate required dependencies
   */
  private async loadDependencies(sessionId: string): Promise<{
    session: ChatSession;
    config: ChatbotConfig;
  }> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }

    const config = await this.chatbotConfigRepository.findById(session.chatbotConfigId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for session ${sessionId}`);
    }

    return { session, config };
  }

  /**
   * Validate business rules for lead capture
   */
  private async validateBusinessRules(session: ChatSession): Promise<void> {
    // Check if lead already exists for this session
    const existingLead = await this.leadRepository.findBySessionId(session.id);
    if (existingLead) {
      throw new Error(`Lead already captured for session ${session.id}`);
    }

    // Additional business rule validations can be added here
  }

  /**
   * Process qualification answers using specialized processor
   */
  private processQualificationAnswers(
    session: ChatSession,
    answers: QualificationAnswer[],
    config: ChatbotConfig
  ): {
    updatedSession: ChatSession;
    processingStats: {
      qualificationAnswersProcessed: number;
      qualificationAnswersSkipped: number;
      validationErrors: string[];
    };
  } {
    const result = QualificationProcessor.processAnswers(session, answers, config);

    return {
      updatedSession: result.updatedSession,
      processingStats: {
        qualificationAnswersProcessed: result.processedAnswers,
        qualificationAnswersSkipped: result.skippedAnswers,
        validationErrors: result.validationErrors
      }
    };
  }

  /**
   * Update session with contact information
   */
  private updateSessionContact(
    session: ChatSession,
    contactInfo: CaptureLeadRequest['contactInfo']
  ): ChatSession {
    const sessionContactInfo = ContactInfo.create({
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      name: contactInfo.name || '',
      company: contactInfo.company || ''
    });

    return session.captureContactInfo(sessionContactInfo);
  }

  /**
   * Create lead entity using specialized factory
   */
  private createLead(
    session: ChatSession,
    config: ChatbotConfig,
    contactInfo: CaptureLeadRequest['contactInfo']
  ): Lead {
    const leadData = LeadDataFactory.createFromSession({
      session,
      config,
      contactInfo
    });

    return Lead.create(
      session.id,
      config.organizationId,
      session.chatbotConfigId,
      leadData.contactInfo,
      leadData.qualificationData,
      leadData.source,
      leadData.conversationSummary
    );
  }

  /**
   * Persist lead and session changes
   */
  private async persistChanges(
    lead: Lead,
    session: ChatSession
  ): Promise<{
    savedLead: Lead;
    finalSession: ChatSession;
  }> {
    // Save lead first
    const savedLead = await this.leadRepository.save(lead);

    // Update session
    const finalSession = await this.sessionRepository.update(session);

    return { savedLead, finalSession };
  }

  /**
   * Get capture eligibility for a session
   */
  async getCaptureEligibility(sessionId: string): Promise<{
    eligible: boolean;
    reason?: string;
    existingLeadId?: string;
  }> {
    try {
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        return {
          eligible: false,
          reason: 'Session not found'
        };
      }

      const existingLead = await this.leadRepository.findBySessionId(sessionId);
      if (existingLead) {
        return {
          eligible: false,
          reason: 'Lead already captured for this session',
          existingLeadId: existingLead.id
        };
      }

      return { eligible: true };
    } catch (error) {
      return {
        eligible: false,
        reason: 'Error checking eligibility'
      };
    }
  }
} 