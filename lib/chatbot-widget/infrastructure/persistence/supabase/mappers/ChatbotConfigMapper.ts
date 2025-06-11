import { ChatbotConfig, ChatbotConfigProps, PersonalitySettings, KnowledgeBase, FAQ, OperatingHours, BusinessHours, Holiday, LeadQualificationQuestion } from '../../../../domain/entities/ChatbotConfig';

/**
 * Raw database record structure from Supabase
 */
export interface RawChatbotConfigDbRecord {
  id: string;
  organization_id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  personality_settings: any; // JSONB
  knowledge_base: any; // JSONB
  operating_hours: any; // JSONB
  lead_qualification_questions: any; // JSONB array
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Insert data structure for database operations
 */
export interface InsertChatbotConfigData {
  id: string;
  organization_id: string;
  name: string;
  avatar_url?: string;
  description?: string;
  personality_settings: any;
  knowledge_base: any;
  operating_hours: any;
  lead_qualification_questions: any;
  is_active: boolean;
}

/**
 * Update data structure for database operations
 */
export interface UpdateChatbotConfigData {
  name?: string;
  avatar_url?: string;
  description?: string;
  personality_settings?: any;
  knowledge_base?: any;
  operating_hours?: any;
  lead_qualification_questions?: any;
  is_active?: boolean;
  updated_at?: string;
}

/**
 * ChatbotConfig Domain-Database Mapper
 * Handles transformation between domain entities and database records
 */
export class ChatbotConfigMapper {
  /**
   * Transform database record to domain entity
   */
  static toDomain(record: RawChatbotConfigDbRecord): ChatbotConfig {
    const props: ChatbotConfigProps = {
      id: record.id,
      organizationId: record.organization_id,
      name: record.name,
      avatarUrl: record.avatar_url || undefined,
      description: record.description || undefined,
      personalitySettings: this.mapPersonalitySettings(record.personality_settings),
      knowledgeBase: this.mapKnowledgeBase(record.knowledge_base),
      operatingHours: this.mapOperatingHours(record.operating_hours),
      leadQualificationQuestions: this.mapLeadQuestions(record.lead_qualification_questions),
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };

    return ChatbotConfig.fromPersistence(props);
  }

  /**
   * Transform domain entity to insert data
   */
  static toInsert(config: ChatbotConfig): InsertChatbotConfigData {
    return {
      id: config.id,
      organization_id: config.organizationId,
      name: config.name,
      avatar_url: config.avatarUrl,
      description: config.description,
      personality_settings: config.personalitySettings,
      knowledge_base: config.knowledgeBase,
      operating_hours: config.operatingHours,
      lead_qualification_questions: config.leadQualificationQuestions,
      is_active: config.isActive,
    };
  }

  /**
   * Transform domain entity to update data
   */
  static toUpdate(config: ChatbotConfig): UpdateChatbotConfigData {
    return {
      name: config.name,
      avatar_url: config.avatarUrl,
      description: config.description,
      personality_settings: config.personalitySettings,
      knowledge_base: config.knowledgeBase,
      operating_hours: config.operatingHours,
      lead_qualification_questions: config.leadQualificationQuestions,
      is_active: config.isActive,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Map JSONB personality settings to domain object
   */
  private static mapPersonalitySettings(data: any): PersonalitySettings {
    return {
      tone: data?.tone || 'professional',
      communicationStyle: data?.communicationStyle || 'helpful',
      responseLength: data?.responseLength || 'adaptive',
      escalationTriggers: data?.escalationTriggers || [],
    };
  }

  /**
   * Map JSONB knowledge base to domain object
   */
  private static mapKnowledgeBase(data: any): KnowledgeBase {
    return {
      companyInfo: data?.companyInfo || '',
      productCatalog: data?.productCatalog || '',
      faqs: (data?.faqs || []).map((faq: any) => this.mapFAQ(faq)),
      supportDocs: data?.supportDocs || '',
      complianceGuidelines: data?.complianceGuidelines || '',
    };
  }

  /**
   * Map FAQ object
   */
  private static mapFAQ(faq: any): FAQ {
    return {
      id: faq?.id || crypto.randomUUID(),
      question: faq?.question || '',
      answer: faq?.answer || '',
      category: faq?.category || 'general',
      isActive: faq?.isActive !== undefined ? faq.isActive : true,
    };
  }

  /**
   * Map JSONB operating hours to domain object
   */
  private static mapOperatingHours(data: any): OperatingHours {
    return {
      timezone: data?.timezone || 'UTC',
      businessHours: (data?.businessHours || []).map((hours: any) => this.mapBusinessHours(hours)),
      holidaySchedule: (data?.holidaySchedule || []).map((holiday: any) => this.mapHoliday(holiday)),
      outsideHoursMessage: data?.outsideHoursMessage || 'We are currently closed. Please leave a message and we will get back to you.',
    };
  }

  /**
   * Map business hours object
   */
  private static mapBusinessHours(hours: any): BusinessHours {
    return {
      dayOfWeek: hours?.dayOfWeek || 0,
      startTime: hours?.startTime || '09:00',
      endTime: hours?.endTime || '17:00',
      isActive: hours?.isActive !== undefined ? hours.isActive : true,
    };
  }

  /**
   * Map holiday object
   */
  private static mapHoliday(holiday: any): Holiday {
    return {
      date: holiday?.date || '',
      name: holiday?.name || '',
      isRecurring: holiday?.isRecurring !== undefined ? holiday.isRecurring : false,
    };
  }

  /**
   * Map JSONB lead qualification questions to domain objects
   */
  private static mapLeadQuestions(data: any): LeadQualificationQuestion[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((question: any) => this.mapLeadQuestion(question));
  }

  /**
   * Map lead qualification question object
   */
  private static mapLeadQuestion(question: any): LeadQualificationQuestion {
    return {
      id: question?.id || crypto.randomUUID(),
      question: question?.question || '',
      type: question?.type || 'text',
      options: question?.options || undefined,
      isRequired: question?.isRequired !== undefined ? question.isRequired : false,
      order: question?.order || 0,
      scoringWeight: question?.scoringWeight || 1,
    };
  }
} 