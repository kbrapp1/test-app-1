import { ChatbotConfig, LeadQualificationQuestion } from '../../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../../domain/value-objects/session-management/OperatingHours';
import { AIConfiguration } from '../../../../domain/value-objects/ai-configuration/AIConfiguration';

// Raw database record structure from Supabase
export interface RawChatbotConfigDbRecord {
  id: string;
  organization_id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  personality_settings: unknown; // JSONB
  knowledge_base: unknown; // JSONB
  operating_hours: unknown; // JSONB
  lead_qualification_questions: unknown; // JSONB array
  ai_configuration: unknown; // JSONB
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Insert data structure for database operations
export interface InsertChatbotConfigData {
  id: string;
  organization_id: string;
  name: string;
  avatar_url?: string;
  description?: string;
  personality_settings: unknown;
  knowledge_base: unknown;
  operating_hours: unknown;
  lead_qualification_questions: unknown;
  ai_configuration: unknown;
  is_active: boolean;
}

// Update data structure for database operations
export interface UpdateChatbotConfigData {
  name?: string;
  avatar_url?: string;
  description?: string;
  personality_settings?: unknown;
  knowledge_base?: unknown;
  operating_hours?: unknown;
  lead_qualification_questions?: unknown;
  ai_configuration?: unknown;
  is_active?: boolean;
  updated_at?: string;
}

/**
 * AI Instructions: ChatbotConfigMapper for database/domain transformation
 * - Transform between Supabase JSONB records and domain entities
 * - Handle complex value object mapping with proper defaults
 * - Use domain entity factory methods for construction
 * - Follow @golden-rule infrastructure mapper patterns
 */

export class ChatbotConfigMapper {
  /** Transform database record to domain entity using factory method */
  static toDomainEntity(data: unknown): ChatbotConfig {
    const record = data as RawChatbotConfigDbRecord;
    return ChatbotConfig.fromPersistence({
      id: record.id,
      organizationId: record.organization_id,
      name: record.name,
      avatarUrl: record.avatar_url ?? undefined,
      description: record.description ?? undefined,
      personalitySettings: this.mapPersonalitySettings(record.personality_settings),
      knowledgeBase: this.mapKnowledgeBase(record.knowledge_base),
      operatingHours: this.mapOperatingHours(record.operating_hours),
      leadQualificationQuestions: this.mapLeadQuestions(record.lead_qualification_questions),
      aiConfiguration: this.mapAIConfiguration(record.ai_configuration),
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });
  }

  /** Transform domain entity to database record */
  static toDbRecord(config: ChatbotConfig): unknown {
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
      ai_configuration: config.aiConfiguration,
      is_active: config.isActive,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString()
    };
  }

  /** Transform domain entity to insert data */
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

  /** Transform domain entity to update data */
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

  /** Map JSONB personality settings to domain value object */
  private static mapPersonalitySettings(data: unknown): PersonalitySettings {
    const settings = data as Record<string, unknown> | null | undefined;
    return PersonalitySettings.create({
      tone: (settings?.tone as 'professional' | 'friendly' | 'casual' | 'formal') || 'professional',
      communicationStyle: (settings?.communicationStyle as 'helpful' | 'direct' | 'conversational' | 'sales-focused') || 'helpful',
      responseLength: (settings?.responseLength as 'adaptive' | 'brief' | 'detailed') || 'adaptive',
      escalationTriggers: (settings?.escalationTriggers as string[]) || [],
      responseBehavior: {
        useEmojis: ((settings?.responseBehavior as Record<string, unknown>)?.useEmojis as boolean) || false,
        askFollowUpQuestions: ((settings?.responseBehavior as Record<string, unknown>)?.askFollowUpQuestions as boolean) || true,
        proactiveOffering: ((settings?.responseBehavior as Record<string, unknown>)?.proactiveOffering as boolean) || true,
        personalizeResponses: ((settings?.responseBehavior as Record<string, unknown>)?.personalizeResponses as boolean) || true,
        acknowledgePreviousInteractions: ((settings?.responseBehavior as Record<string, unknown>)?.acknowledgePreviousInteractions as boolean) || true,
      },
      conversationFlow: {
        greetingMessage: ((settings?.conversationFlow as Record<string, unknown>)?.greetingMessage as string) || 'Hello! How can I help you today?',
        fallbackMessage: ((settings?.conversationFlow as Record<string, unknown>)?.fallbackMessage as string) || 'I\'m not sure about that. Could you rephrase your question?',
        escalationMessage: ((settings?.conversationFlow as Record<string, unknown>)?.escalationMessage as string) || 'Let me connect you with a team member.',
        endConversationMessage: ((settings?.conversationFlow as Record<string, unknown>)?.endConversationMessage as string) || 'Thank you for chatting with us!',
        leadCapturePrompt: ((settings?.conversationFlow as Record<string, unknown>)?.leadCapturePrompt as string) || 'Can I get your contact information to follow up?',
        maxConversationTurns: ((settings?.conversationFlow as Record<string, unknown>)?.maxConversationTurns as number) || 20,
        inactivityTimeout: ((settings?.conversationFlow as Record<string, unknown>)?.inactivityTimeout as number) || 300,
      },
      customInstructions: (settings?.customInstructions as string) || '',
    });
  }

  /** Map JSONB knowledge base to domain value object */
  private static mapKnowledgeBase(data: unknown): KnowledgeBase {
    const kb = data as Record<string, unknown> | null | undefined;
    // Handle case where knowledge_base JSONB field is null in database
    if (!kb || kb === null) {
      return KnowledgeBase.create({
        companyInfo: '',
        productCatalog: '',
        faqs: [],
        supportDocs: '',
        complianceGuidelines: '',
        websiteSources: [],
      });
    }
    
    return KnowledgeBase.create({
      companyInfo: (kb?.companyInfo as string) || '',
      productCatalog: (kb?.productCatalog as string) || '',
      faqs: ((kb?.faqs as unknown[]) || []).map((faq: unknown) => ({
        id: ((faq as Record<string, unknown>)?.id as string) || crypto.randomUUID(),
        question: ((faq as Record<string, unknown>)?.question as string) || '',
        answer: ((faq as Record<string, unknown>)?.answer as string) || '',
        category: ((faq as Record<string, unknown>)?.category as string) || 'general',
        isActive: ((faq as Record<string, unknown>)?.isActive as boolean) !== undefined ? ((faq as Record<string, unknown>)?.isActive as boolean) : true,
      })),
      supportDocs: (kb?.supportDocs as string) || '',
      complianceGuidelines: (kb?.complianceGuidelines as string) || '',
      websiteSources: (kb?.websiteSources as unknown[] || []).map((source: unknown) => ({
          id: (source as Record<string, unknown>)?.id as string || crypto.randomUUID(),
          url: (source as Record<string, unknown>)?.url as string || '',
          name: (source as Record<string, unknown>)?.name as string || '',
          description: (source as Record<string, unknown>)?.description as string || '',
          isActive: (source as Record<string, unknown>)?.isActive !== undefined ? (source as Record<string, unknown>).isActive as boolean : true,
          crawlSettings: {
            maxPages: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.maxPages as number || 10,
            maxDepth: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.maxDepth as number || 3,
            includePatterns: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.includePatterns as string[] || [],
            excludePatterns: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.excludePatterns as string[] || [],
            respectRobotsTxt: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.respectRobotsTxt as boolean ?? true,
            crawlFrequency: (((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.crawlFrequency as 'manual' | 'daily' | 'weekly' | 'monthly') || 'weekly',
            includeImages: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.includeImages as boolean ?? false,
            includePDFs: ((source as Record<string, unknown>)?.crawlSettings as Record<string, unknown>)?.includePDFs as boolean ?? true,
          },
          lastCrawled: (source as Record<string, unknown>)?.lastCrawled ? new Date((source as Record<string, unknown>).lastCrawled as string) : undefined,
          status: ((source as Record<string, unknown>)?.status as 'pending' | 'crawling' | 'vectorizing' | 'completed' | 'error') || 'pending',
          pageCount: (source as Record<string, unknown>)?.pageCount as number || 0,
          errorMessage: (source as Record<string, unknown>)?.errorMessage as string,
        })),
    });
  }

  /** Map JSONB operating hours to domain value object */
  private static mapOperatingHours(data: unknown): OperatingHours {
    const hours = data as Record<string, unknown> | null | undefined;
    return OperatingHours.create({
      timezone: hours?.timezone as string || 'UTC',
      businessHours: (hours?.businessHours as unknown[] || []).map((hours: unknown) => ({
        dayOfWeek: (hours as Record<string, unknown>)?.dayOfWeek as number || 0,
        startTime: (hours as Record<string, unknown>)?.startTime as string || '09:00',
        endTime: (hours as Record<string, unknown>)?.endTime as string || '17:00',
        isActive: (hours as Record<string, unknown>)?.isActive !== undefined ? (hours as Record<string, unknown>).isActive as boolean : true,
      })),
      holidaySchedule: (hours?.holidaySchedule as unknown[] || []).map((holiday: unknown) => ({
        date: (holiday as Record<string, unknown>)?.date as string || '',
        name: (holiday as Record<string, unknown>)?.name as string || '',
        isRecurring: (holiday as Record<string, unknown>)?.isRecurring !== undefined ? (holiday as Record<string, unknown>).isRecurring as boolean : false,
      })),
      outsideHoursMessage: hours?.outsideHoursMessage as string || 'We are currently closed. Please leave a message and we will get back to you.',
    });
  }

  /** Map JSONB AI configuration to domain value object */
  private static mapAIConfiguration(data: unknown): AIConfiguration {
    if (!data) {
      return AIConfiguration.createDefault();
    }
    
    const config = data as Record<string, unknown>;
    return AIConfiguration.create({
      openaiModel: (config?.openaiModel as 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo') || 'gpt-4o-mini',
      openaiTemperature: config?.openaiTemperature as number || 0.3,
      openaiMaxTokens: config?.openaiMaxTokens as number || 1000,
      contextMaxTokens: config?.contextMaxTokens as number || 12000,
      contextSystemPromptTokens: config?.contextSystemPromptTokens as number || 500,
      contextResponseReservedTokens: config?.contextResponseReservedTokens as number || 3000,
      contextSummaryTokens: config?.contextSummaryTokens as number || 200,
      intentConfidenceThreshold: config?.intentConfidenceThreshold as number || 0.7,
      intentAmbiguityThreshold: config?.intentAmbiguityThreshold as number || 0.2,
      enableMultiIntentDetection: config?.enableMultiIntentDetection !== undefined ? config.enableMultiIntentDetection as boolean : true,
      enablePersonaInference: config?.enablePersonaInference !== undefined ? config.enablePersonaInference as boolean : true,
      enableAdvancedEntities: config?.enableAdvancedEntities !== undefined ? config.enableAdvancedEntities as boolean : true,
      entityExtractionMode: (config?.entityExtractionMode as 'comprehensive' | 'basic' | 'custom') || 'comprehensive',
      customEntityTypes: config?.customEntityTypes as string[] || [],
      maxConversationTurns: config?.maxConversationTurns as number || 20,
      inactivityTimeoutSeconds: config?.inactivityTimeoutSeconds as number || 300,
      enableJourneyRegression: config?.enableJourneyRegression !== undefined ? config.enableJourneyRegression as boolean : true,
      enableContextSwitchDetection: config?.enableContextSwitchDetection !== undefined ? config.enableContextSwitchDetection as boolean : true,
      enableAdvancedScoring: config?.enableAdvancedScoring !== undefined ? config.enableAdvancedScoring as boolean : true,
      entityCompletenessWeight: config?.entityCompletenessWeight as number || 0.3,
      personaConfidenceWeight: config?.personaConfidenceWeight as number || 0.2,
      journeyProgressionWeight: config?.journeyProgressionWeight as number || 0.25,
      enablePerformanceLogging: config?.enablePerformanceLogging !== undefined ? config.enablePerformanceLogging as boolean : true,
      enableIntentAnalytics: config?.enableIntentAnalytics !== undefined ? config.enableIntentAnalytics as boolean : true,
      enablePersonaAnalytics: config?.enablePersonaAnalytics !== undefined ? config.enablePersonaAnalytics as boolean : true,
      responseTimeThresholdMs: config?.responseTimeThresholdMs as number || 2000,
    });
  }

  /** Map JSONB lead qualification questions to domain objects */
  private static mapLeadQuestions(data: unknown): LeadQualificationQuestion[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((question: unknown) => this.mapLeadQuestion(question));
  }

  /** Map lead qualification question object */
  private static mapLeadQuestion(question: unknown): LeadQualificationQuestion {
    const q = question as Record<string, unknown>;
    return {
      id: q?.id as string || crypto.randomUUID(),
      question: q?.question as string || '',
      type: (q?.type as 'text' | 'email' | 'phone' | 'select' | 'multiselect') || 'text',
      options: q?.options as string[] || undefined,
      isRequired: q?.isRequired !== undefined ? q.isRequired as boolean : false,
      order: q?.order as number || 0,
      scoringWeight: q?.scoringWeight as number || 1,
    };
  }
} 