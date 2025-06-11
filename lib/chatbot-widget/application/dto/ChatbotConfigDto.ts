/**
 * Chatbot Configuration DTO
 * 
 * Data Transfer Object for chatbot configuration data across application boundaries.
 * Following DDD principles: DTOs are used at application layer boundaries to
 * decouple domain entities from external contracts.
 */

export interface ChatbotConfigDto {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly description?: string;
  readonly personalitySettings: PersonalitySettingsDto;
  readonly knowledgeBase: KnowledgeBaseDto;
  readonly operatingHours: OperatingHoursDto;
  readonly leadQualificationQuestions: LeadQualificationQuestionDto[];
  readonly isActive: boolean;
  readonly createdAt: string; // ISO string for serialization
  readonly updatedAt: string; // ISO string for serialization
}

export interface PersonalitySettingsDto {
  readonly tone: string;
  readonly communicationStyle: string;
  readonly responseLength: string;
  readonly escalationTriggers: string[];
  readonly responseBehavior: ResponseBehaviorDto;
  readonly conversationFlow: ConversationFlowDto;
  readonly customInstructions: string;
}

export interface ResponseBehaviorDto {
  readonly useEmojis: boolean;
  readonly askFollowUpQuestions: boolean;
  readonly proactiveOffering: boolean;
  readonly personalizeResponses: boolean;
  readonly acknowledgePreviousInteractions: boolean;
}

export interface ConversationFlowDto {
  readonly greetingMessage: string;
  readonly fallbackMessage: string;
  readonly escalationMessage: string;
  readonly endConversationMessage: string;
  readonly leadCapturePrompt: string;
  readonly maxConversationTurns: number;
  readonly inactivityTimeout: number;
}

export interface KnowledgeBaseDto {
  readonly companyInfo: string;
  readonly productCatalog: string;
  readonly faqs: FaqDto[];
  readonly supportDocs: string;
  readonly complianceGuidelines: string;
}

export interface FaqDto {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
  readonly category: string;
  readonly keywords: string[];
  readonly priority: number;
}

export interface OperatingHoursDto {
  readonly timezone: string;
  readonly businessHours: BusinessHourDto[];
  readonly holidaySchedule: HolidayDto[];
  readonly outsideHoursMessage: string;
}

export interface BusinessHourDto {
  readonly dayOfWeek: number; // 0-6 (Sunday-Saturday)
  readonly startTime: string; // HH:mm format
  readonly endTime: string; // HH:mm format
  readonly isOpen: boolean;
}

export interface HolidayDto {
  readonly date: string; // YYYY-MM-DD format
  readonly name: string;
  readonly isRecurring: boolean;
}

export interface LeadQualificationQuestionDto {
  readonly id: string;
  readonly question: string;
  readonly type: string;
  readonly options?: string[];
  readonly isRequired: boolean;
  readonly order: number;
  readonly scoringWeight?: number;
}

/**
 * DTO for creating a new chatbot configuration
 */
export interface CreateChatbotConfigDto {
  readonly organizationId: string;
  readonly name: string;
  readonly avatarUrl?: string;
  readonly description?: string;
  readonly personalitySettings: PersonalitySettingsDto;
  readonly knowledgeBase: KnowledgeBaseDto;
  readonly operatingHours: OperatingHoursDto;
  readonly leadQualificationQuestions: LeadQualificationQuestionDto[];
}

/**
 * DTO for updating chatbot configuration
 */
export interface UpdateChatbotConfigDto {
  readonly name?: string;
  readonly avatarUrl?: string;
  readonly description?: string;
  readonly personalitySettings?: Partial<PersonalitySettingsDto>;
  readonly knowledgeBase?: Partial<KnowledgeBaseDto>;
  readonly operatingHours?: Partial<OperatingHoursDto>;
  readonly leadQualificationQuestions?: LeadQualificationQuestionDto[];
  readonly isActive?: boolean;
} 