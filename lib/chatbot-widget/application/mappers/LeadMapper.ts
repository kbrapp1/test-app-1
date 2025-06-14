/**
 * Lead Application Mapper
 * 
 * Transforms between domain entities and DTOs for application layer boundaries.
 * Follows DDD principles by maintaining clear separation between domain and application layers.
 */

import { Lead } from '../../domain/entities/Lead';
import { ContactInfo, ContactInfoProps } from '../../domain/value-objects/ContactInfo';
import { QualificationData, QualificationDataProps, QualificationAnswer } from '../../domain/value-objects/QualificationData';
import { LeadSource, LeadSourceProps } from '../../domain/value-objects/LeadSource';
import { LeadNote } from '../../domain/value-objects/LeadMetadata';
import { LeadDto, ContactInfoDto, QualificationDataDto, AnsweredQuestionDto, LeadSourceDto, CreateLeadDto } from '../dto/LeadDto';

export class LeadMapper {
  /**
   * Convert domain entity to DTO
   */
  toDto(lead: Lead): LeadDto {
    return {
      id: lead.id,
      sessionId: lead.sessionId,
      organizationId: lead.organizationId,
      chatbotConfigId: lead.chatbotConfigId,
      contactInfo: this.mapContactInfoToDto(lead.contactInfo),
      qualificationData: this.mapQualificationDataToDto(lead.qualificationData),
      leadScore: lead.leadScore,
      qualificationStatus: lead.qualificationStatus,
      source: this.mapSourceToDto(lead.source),
      conversationSummary: lead.conversationSummary,
      capturedAt: lead.capturedAt.toISOString(),
      followUpStatus: lead.followUpStatus,
      assignedTo: lead.assignedTo,
      tags: [...lead.tags], // Create copy
      lastContactedAt: lead.lastContactedAt?.toISOString(),
    };
  }

  /**
   * Convert DTO to domain entity for creation
   */
  fromCreateDto(dto: CreateLeadDto): {
    sessionId: string;
    organizationId: string;
    chatbotConfigId: string;
    contactInfo: ContactInfoProps;
    qualificationData: QualificationDataProps;
    source: LeadSourceProps;
    conversationSummary: string;
  } {
    return {
      sessionId: dto.sessionId,
      organizationId: dto.organizationId,
      chatbotConfigId: dto.chatbotConfigId,
      contactInfo: this.mapContactInfoFromDto(dto.contactInfo),
      qualificationData: this.mapQualificationDataFromDto(dto.qualificationData),
      source: this.mapSourceFromDto(dto.source),
      conversationSummary: dto.conversationSummary,
    };
  }

  /**
   * Map domain ContactInfo to DTO
   */
  private mapContactInfoToDto(contactInfo: ContactInfo): ContactInfoDto {
    return {
      name: contactInfo.name,
      email: contactInfo.email,
      phone: contactInfo.phone,
      company: contactInfo.company,
      jobTitle: contactInfo.jobTitle,
      website: contactInfo.website,
      linkedinProfile: contactInfo.linkedin,
      address: contactInfo.address ? {
        street: contactInfo.address.street,
        city: contactInfo.address.city,
        state: contactInfo.address.state,
        zipCode: contactInfo.address.zipCode,
        country: contactInfo.address.country,
      } : undefined,
    };
  }

  /**
   * Map DTO ContactInfo to domain props
   */
  private mapContactInfoFromDto(dto: ContactInfoDto): ContactInfoProps {
    return {
      name: dto.name,
      firstName: dto.name?.split(' ')[0], // Simple extraction
      lastName: dto.name?.split(' ').slice(1).join(' ') || undefined,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      jobTitle: dto.jobTitle,
      website: dto.website,
      linkedin: dto.linkedinProfile,
      address: dto.address ? {
        street: dto.address.street,
        city: dto.address.city,
        state: dto.address.state,
        zipCode: dto.address.zipCode,
        country: dto.address.country,
      } : undefined,
    };
  }

  /**
   * Map domain QualificationData to DTO
   */
  private mapQualificationDataToDto(data: QualificationData): QualificationDataDto {
    return {
      answeredQuestions: data.answeredQuestions.map(this.mapAnsweredQuestionToDto.bind(this)),
      engagementLevel: data.engagementLevel,
      budget: data.budget,
      timeline: data.timeline,
      decisionMaker: data.decisionMaker,
      currentSolution: data.currentSolution,
      painPoints: [...data.painPoints],
      industry: data.industry,
      companySize: data.companySize,
      interests: [...data.interests],
    };
  }

  /**
   * Map DTO QualificationData to domain props
   */
  private mapQualificationDataFromDto(dto: QualificationDataDto): QualificationDataProps {
    return {
      budget: dto.budget,
      timeline: dto.timeline,
      decisionMaker: dto.decisionMaker,
      companySize: dto.companySize,
      industry: dto.industry,
      currentSolution: dto.currentSolution,
      painPoints: [...dto.painPoints],
      interests: [...dto.interests],
      answeredQuestions: dto.answeredQuestions.map(this.mapAnsweredQuestionFromDto.bind(this)),
      engagementLevel: dto.engagementLevel as 'low' | 'medium' | 'high',
    };
  }

  /**
   * Map domain QualificationAnswer to DTO
   */
  private mapAnsweredQuestionToDto(answer: QualificationAnswer): AnsweredQuestionDto {
    return {
      questionId: answer.questionId,
      question: answer.question,
      answer: Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer,
      answeredAt: answer.answeredAt.toISOString(),
      confidence: answer.scoreContribution / answer.scoringWeight, // Calculate confidence ratio
    };
  }

  /**
   * Map DTO AnsweredQuestion to domain
   */
  private mapAnsweredQuestionFromDto(dto: AnsweredQuestionDto): QualificationAnswer {
    return {
      questionId: dto.questionId,
      question: dto.question,
      answer: dto.answer,
      answeredAt: new Date(dto.answeredAt),
      scoringWeight: 10, // Default weight - should be configurable
      scoreContribution: Math.round(dto.confidence * 10), // Convert confidence back to score
    };
  }

  /**
   * Map domain LeadSource to DTO
   */
  private mapSourceToDto(source: LeadSource): LeadSourceDto {
    return {
      type: source.channel,
      chatbotName: source.campaign, // Map campaign to chatbotName for DTO
      referrerUrl: source.referrer,
      campaignSource: source.campaign,
      medium: 'chat', // Always chat for chatbot widget
      utmSource: source.utmSource,
      utmMedium: source.utmMedium,
      utmCampaign: source.utmCampaign,
      utmContent: undefined, // Not in domain model
      utmTerm: undefined, // Not in domain model
    };
  }

  /**
   * Map DTO LeadSource to domain props
   */
  private mapSourceFromDto(dto: LeadSourceDto): LeadSourceProps {
    return {
      channel: 'chatbot_widget',
      campaign: dto.campaignSource,
      referrer: dto.referrerUrl,
      utmSource: dto.utmSource,
      utmMedium: dto.utmMedium,
      utmCampaign: dto.utmCampaign,
      pageUrl: dto.referrerUrl || '', // Required field
      pageTitle: undefined, // Not available in DTO
    };
  }
} 