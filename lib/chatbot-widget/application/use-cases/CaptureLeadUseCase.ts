/**
 * Capture Lead Use Case (Application)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead capture orchestration only
 * - Orchestrate domain services without business logic
 * - Handle workflow coordination, delegate all business logic
 * - Use domain-specific errors with proper context
 * - Stay under 200-250 lines
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scores are now provided externally from OpenAI API
 */

import { Lead } from '../../domain/entities/Lead';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { LeadCaptureService } from '../services/lead-management/LeadCaptureService';
import { LeadDto } from '../dto/LeadDto';
import { LeadMapper } from '../mappers/LeadMapper';
import { BusinessRuleViolationError } from '../../domain/errors/BusinessRuleViolationError';
import { ContactInfo } from '../../domain/value-objects/lead-management/ContactInfo';
import { LeadSource } from '../../domain/value-objects/lead-management/LeadSource';
import { QualificationData } from '../../domain/value-objects/lead-management/QualificationData';

export interface CaptureLeadRequest {
  sessionId: string;
  organizationId: string;
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  conversationSummary: string;
  source: {
    channel: string;
    page?: string;
    referrer?: string;
  };
  // API-provided scoring data
  leadScore?: number;
  qualificationStatus?: 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';
  engagementScore?: number;
  tags?: string[];
}

export class CaptureLeadUseCase {
  constructor(
    private leadRepository: ILeadRepository,
    private leadCaptureService: LeadCaptureService,
    private leadMapper: LeadMapper
  ) {}

  /**
   * Execute lead capture use case
   */
  async execute(request: CaptureLeadRequest): Promise<LeadDto> {
    try {
      // Check if lead already exists for this session
      const existingLead = await this.leadRepository.findBySessionId(request.sessionId);
      if (existingLead) {
        // Update existing lead with new information
        return this.updateExistingLead(existingLead, request);
      }

      // Create ContactInfo and other value objects
      const contactInfo = ContactInfo.create({
        email: request.contactInfo.email || '',
        phone: request.contactInfo.phone || '',
        name: request.contactInfo.name || '',
        company: request.contactInfo.company || ''
      });

      const source = LeadSource.create({
        channel: 'chatbot_widget',
        pageUrl: request.source.page || 'https://example.com',
        pageTitle: request.source.channel,
        campaign: request.source.page,
        referrer: request.source.referrer
      });

      // Create qualification data with API-provided scores
      const qualificationData = QualificationData.create({
        painPoints: [],
        interests: [],
        answeredQuestions: [],
        engagementLevel: 'low'
      });

      // Use LeadCaptureService to capture the lead
      const savedLead = await this.leadCaptureService.captureLead({
        sessionId: request.sessionId,
        organizationId: request.organizationId,
        chatbotConfigId: 'default', // Would need to get this from session
        contactInfo,
        qualificationData,
        conversationSummary: request.conversationSummary,
        source,
        leadScore: request.leadScore,
        qualificationStatus: request.qualificationStatus
      });

      return savedLead;

    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      throw new BusinessRuleViolationError(
        `Failed to capture lead: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update existing lead with new information
   */
  private async updateExistingLead(
    existingLead: Lead,
    request: CaptureLeadRequest
  ): Promise<LeadDto> {
    try {
      // Update lead with new conversation summary and contact info if provided
      let updatedLead = existingLead;
      
      if (request.conversationSummary) {
        updatedLead = updatedLead.updateConversationSummary(request.conversationSummary);
      }

      // Update contact info if provided
      if (request.contactInfo.email || request.contactInfo.phone || request.contactInfo.name || request.contactInfo.company) {
        const newContactInfo = ContactInfo.create({
          email: request.contactInfo.email || existingLead.contactInfo.email,
          phone: request.contactInfo.phone || existingLead.contactInfo.phone,
          name: request.contactInfo.name || existingLead.contactInfo.name,
          company: request.contactInfo.company || existingLead.contactInfo.company
        });
        updatedLead = updatedLead.updateContactInfo(newContactInfo);
      }

      const savedLead = await this.leadRepository.update(updatedLead);
      return this.leadMapper.toDto(savedLead);

    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to update existing lead: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate capture request
   */
  private validateRequest(request: CaptureLeadRequest): void {
    if (!request.sessionId) {
      throw new BusinessRuleViolationError('Session ID is required for lead capture');
    }

    if (!request.organizationId) {
      throw new BusinessRuleViolationError('Organization ID is required for lead capture');
    }

    if (!request.contactInfo.email && !request.contactInfo.phone) {
      throw new BusinessRuleViolationError('Either email or phone is required for lead capture');
    }

    if (!request.conversationSummary) {
      throw new BusinessRuleViolationError('Conversation summary is required for lead capture');
    }
  }

  /**
   * Get lead capture analytics
   */
  async getCaptureAnalytics(organizationId: string, dateFrom: Date, dateTo: Date): Promise<{
    totalCaptured: number;
    avgLeadScore: number;
    qualificationBreakdown: Record<string, number>;
    sourceBreakdown: Record<string, number>;
  }> {
    const analytics = await this.leadRepository.getAnalytics(organizationId, dateFrom, dateTo);
    
    return {
      totalCaptured: analytics.totalLeads,
      avgLeadScore: analytics.avgLeadScore,
      qualificationBreakdown: analytics.qualificationDistribution,
      sourceBreakdown: analytics.sourceBreakdown.reduce((acc: Record<string, number>, item: any) => {
        acc[item.source] = item.count;
        return acc;
      }, {})
    };
  }
} 