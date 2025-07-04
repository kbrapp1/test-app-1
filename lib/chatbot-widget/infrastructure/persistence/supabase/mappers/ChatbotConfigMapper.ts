import { ChatbotConfig, ChatbotConfigProps, LeadQualificationQuestion } from '../../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../../domain/value-objects/session-management/OperatingHours';
import { AIConfiguration } from '../../../../domain/value-objects/ai-configuration/AIConfiguration';

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
  ai_configuration: any; // JSONB
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
  ai_configuration: any;
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
  ai_configuration?: any;
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
      aiConfiguration: this.mapAIConfiguration(record.ai_configuration),
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
      personality_settings: config.personalitySettings.toPlainObject(),
      knowledge_base: config.knowledgeBase.toPlainObject(),
      operating_hours: config.operatingHours.toPlainObject(),
      lead_qualification_questions: config.leadQualificationQuestions,
      ai_configuration: config.aiConfiguration.toPlainObject(),
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
      personality_settings: config.personalitySettings.toPlainObject(),
      knowledge_base: config.knowledgeBase.toPlainObject(),
      operating_hours: config.operatingHours.toPlainObject(),
      lead_qualification_questions: config.leadQualificationQuestions,
      ai_configuration: config.aiConfiguration.toPlainObject(),
      is_active: config.isActive,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Map JSONB personality settings to domain value object
   */
  private static mapPersonalitySettings(data: any): PersonalitySettings {
    return PersonalitySettings.create({
      tone: data?.tone || 'professional',
      communicationStyle: data?.communicationStyle || 'helpful',
      responseLength: data?.responseLength || 'adaptive',
      escalationTriggers: data?.escalationTriggers || [],
      responseBehavior: {
        useEmojis: data?.responseBehavior?.useEmojis || false,
        askFollowUpQuestions: data?.responseBehavior?.askFollowUpQuestions || true,
        proactiveOffering: data?.responseBehavior?.proactiveOffering || true,
        personalizeResponses: data?.responseBehavior?.personalizeResponses || true,
        acknowledgePreviousInteractions: data?.responseBehavior?.acknowledgePreviousInteractions || true,
      },
      conversationFlow: {
        greetingMessage: data?.conversationFlow?.greetingMessage || 'Hello! How can I help you today?',
        fallbackMessage: data?.conversationFlow?.fallbackMessage || 'I\'m not sure about that. Could you rephrase your question?',
        escalationMessage: data?.conversationFlow?.escalationMessage || 'Let me connect you with a team member.',
        endConversationMessage: data?.conversationFlow?.endConversationMessage || 'Thank you for chatting with us!',
        leadCapturePrompt: data?.conversationFlow?.leadCapturePrompt || 'Can I get your contact information to follow up?',
        maxConversationTurns: data?.conversationFlow?.maxConversationTurns || 20,
        inactivityTimeout: data?.conversationFlow?.inactivityTimeout || 300,
      },
      customInstructions: data?.customInstructions || '',
    });
  }

  /**
   * Map JSONB knowledge base to domain value object
   */
  private static mapKnowledgeBase(data: any): KnowledgeBase {
    return KnowledgeBase.create({
      companyInfo: data?.companyInfo || '',
      productCatalog: data?.productCatalog || '',
      faqs: (data?.faqs || []).map((faq: any) => ({
        id: faq?.id || crypto.randomUUID(),
        question: faq?.question || '',
        answer: faq?.answer || '',
        category: faq?.category || 'general',
        isActive: faq?.isActive !== undefined ? faq.isActive : true,
      })),
      supportDocs: data?.supportDocs || '',
      complianceGuidelines: data?.complianceGuidelines || '',
              websiteSources: (data?.websiteSources || []).map((source: any) => ({
          id: source?.id || crypto.randomUUID(),
          url: source?.url || '',
          name: source?.name || '',
          description: source?.description || '',
          isActive: source?.isActive !== undefined ? source.isActive : true,
          crawlSettings: {
            maxPages: source?.crawlSettings?.maxPages || 50,
            maxDepth: source?.crawlSettings?.maxDepth || 3,
            includePatterns: source?.crawlSettings?.includePatterns || [],
            excludePatterns: source?.crawlSettings?.excludePatterns || [],
            respectRobotsTxt: source?.crawlSettings?.respectRobotsTxt !== undefined ? source.crawlSettings.respectRobotsTxt : true,
            crawlFrequency: source?.crawlSettings?.crawlFrequency || 'manual',
            includeImages: source?.crawlSettings?.includeImages !== undefined ? source.crawlSettings.includeImages : false,
            includePDFs: source?.crawlSettings?.includePDFs !== undefined ? source.crawlSettings.includePDFs : true,
          },
          lastCrawled: source?.lastCrawled ? new Date(source.lastCrawled) : undefined,
          status: source?.status || 'pending',
          pageCount: source?.pageCount || 0,
          errorMessage: source?.errorMessage,
        })),
    });
  }

  /**
   * Map JSONB operating hours to domain value object
   */
  private static mapOperatingHours(data: any): OperatingHours {
    return OperatingHours.create({
      timezone: data?.timezone || 'UTC',
      businessHours: (data?.businessHours || []).map((hours: any) => ({
        dayOfWeek: hours?.dayOfWeek || 0,
        startTime: hours?.startTime || '09:00',
        endTime: hours?.endTime || '17:00',
        isActive: hours?.isActive !== undefined ? hours.isActive : true,
      })),
      holidaySchedule: (data?.holidaySchedule || []).map((holiday: any) => ({
        date: holiday?.date || '',
        name: holiday?.name || '',
        isRecurring: holiday?.isRecurring !== undefined ? holiday.isRecurring : false,
      })),
      outsideHoursMessage: data?.outsideHoursMessage || 'We are currently closed. Please leave a message and we will get back to you.',
    });
  }

  /**
   * Map JSONB AI configuration to domain value object
   */
  private static mapAIConfiguration(data: any): AIConfiguration {
    if (!data) {
      return AIConfiguration.createDefault();
    }
    
    return AIConfiguration.create({
      // OpenAI Configuration
      openaiModel: data?.openaiModel || 'gpt-4o-mini',
      openaiTemperature: data?.openaiTemperature || 0.3,
      openaiMaxTokens: data?.openaiMaxTokens || 1000,
      
      // Context Window Configuration
      contextMaxTokens: data?.contextMaxTokens || 12000,
      contextSystemPromptTokens: data?.contextSystemPromptTokens || 500,
      contextResponseReservedTokens: data?.contextResponseReservedTokens || 3000,
      contextSummaryTokens: data?.contextSummaryTokens || 200,
      
      // Intent Classification
      intentConfidenceThreshold: data?.intentConfidenceThreshold || 0.7,
      intentAmbiguityThreshold: data?.intentAmbiguityThreshold || 0.2,
      enableMultiIntentDetection: data?.enableMultiIntentDetection !== undefined ? data.enableMultiIntentDetection : true,
      enablePersonaInference: data?.enablePersonaInference !== undefined ? data.enablePersonaInference : true,
      
      // Entity Extraction
      enableAdvancedEntities: data?.enableAdvancedEntities !== undefined ? data.enableAdvancedEntities : true,
      entityExtractionMode: data?.entityExtractionMode || 'comprehensive',
      customEntityTypes: data?.customEntityTypes || [],
      
      // Conversation Flow
      maxConversationTurns: data?.maxConversationTurns || 20,
      inactivityTimeoutSeconds: data?.inactivityTimeoutSeconds || 300,
      enableJourneyRegression: data?.enableJourneyRegression !== undefined ? data.enableJourneyRegression : true,
      enableContextSwitchDetection: data?.enableContextSwitchDetection !== undefined ? data.enableContextSwitchDetection : true,
      
      // Lead Scoring
      enableAdvancedScoring: data?.enableAdvancedScoring !== undefined ? data.enableAdvancedScoring : true,
      entityCompletenessWeight: data?.entityCompletenessWeight || 0.3,
      personaConfidenceWeight: data?.personaConfidenceWeight || 0.2,
      journeyProgressionWeight: data?.journeyProgressionWeight || 0.25,
      
      // Performance & Monitoring
      enablePerformanceLogging: data?.enablePerformanceLogging !== undefined ? data.enablePerformanceLogging : true,
      enableIntentAnalytics: data?.enableIntentAnalytics !== undefined ? data.enableIntentAnalytics : true,
      enablePersonaAnalytics: data?.enablePersonaAnalytics !== undefined ? data.enablePersonaAnalytics : true,
      responseTimeThresholdMs: data?.responseTimeThresholdMs || 2000,
    });
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