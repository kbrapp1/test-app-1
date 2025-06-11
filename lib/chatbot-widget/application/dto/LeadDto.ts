/**
 * Lead DTO
 * 
 * Data Transfer Object for lead data across application boundaries.
 * Handles contact information, qualification data, and lead scoring.
 */

export interface LeadDto {
  readonly id: string;
  readonly sessionId: string;
  readonly organizationId: string;
  readonly chatbotConfigId: string;
  readonly contactInfo: ContactInfoDto;
  readonly qualificationData: QualificationDataDto;
  readonly leadScore: number;
  readonly qualificationStatus: LeadQualificationStatus;
  readonly source: LeadSourceDto;
  readonly conversationSummary: string;
  readonly capturedAt: string;
  readonly followUpStatus: FollowUpStatus;
  readonly assignedTo?: string;
  readonly tags: string[];
  readonly lastContactedAt?: string;
}

export interface ContactInfoDto {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  readonly jobTitle?: string;
  readonly website?: string;
  readonly linkedinProfile?: string;
  readonly address?: AddressDto;
}

export interface AddressDto {
  readonly street?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly country?: string;
}

export interface QualificationDataDto {
  readonly answeredQuestions: AnsweredQuestionDto[];
  readonly engagementLevel: string;
  readonly budget?: string;
  readonly timeline?: string;
  readonly decisionMaker?: boolean;
  readonly currentSolution?: string;
  readonly painPoints: string[];
  readonly industry?: string;
  readonly companySize?: string;
  readonly urgency?: string;
  readonly interests: string[];
}

export interface AnsweredQuestionDto {
  readonly questionId: string;
  readonly question: string;
  readonly answer: string;
  readonly answeredAt: string;
  readonly confidence: number;
}

export interface LeadSourceDto {
  readonly type: string;
  readonly chatbotName?: string;
  readonly referrerUrl?: string;
  readonly campaignSource?: string;
  readonly medium: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
  readonly utmContent?: string;
  readonly utmTerm?: string;
}

export type LeadQualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';
export type FollowUpStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost' | 'nurturing';

/**
 * DTO for creating a new lead
 */
export interface CreateLeadDto {
  readonly sessionId: string;
  readonly organizationId: string;
  readonly chatbotConfigId: string;
  readonly contactInfo: ContactInfoDto;
  readonly qualificationData: QualificationDataDto;
  readonly conversationSummary: string;
  readonly source: LeadSourceDto;
}

/**
 * DTO for updating lead information
 */
export interface UpdateLeadDto {
  readonly contactInfo?: Partial<ContactInfoDto>;
  readonly qualificationData?: Partial<QualificationDataDto>;
  readonly leadScore?: number;
  readonly qualificationStatus?: LeadQualificationStatus;
  readonly conversationSummary?: string;
  readonly followUpStatus?: FollowUpStatus;
  readonly assignedTo?: string;
  readonly tags?: string[];
  readonly lastContactedAt?: string;
}

/**
 * DTO for lead analytics and reporting
 */
export interface LeadAnalyticsDto {
  readonly totalLeads: number;
  readonly qualifiedLeads: number;
  readonly conversionRate: number;
  readonly averageScore: number;
  readonly leadsBySource: Record<string, number>;
  readonly leadsByStatus: Record<string, number>;
  readonly topPerformingChatbots: Array<{
    chatbotId: string;
    chatbotName: string;
    leadCount: number;
    conversionRate: number;
  }>;
} 