/**
 * Chatbot Configuration Mapper
 * 
 * AI INSTRUCTIONS:
 * - Maps between ChatbotConfig domain entities and DTOs for clean architecture boundaries
 * - Handles bidirectional transformation preserving business rules and value object integrity
 * - Maintains DDD principle: Application layer coordinates domain-external contract mapping
 * - Ensures type safety and proper validation during entity-DTO conversions
 * - Supports CQRS patterns with separate creation, update, and query DTO mappings
 */

import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../domain/value-objects/session-management/OperatingHours';
import { AIConfiguration } from '../../domain/value-objects/ai-configuration/AIConfiguration';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
  PersonalitySettingsDto,
  KnowledgeBaseDto,
  OperatingHoursDto,
  LeadQualificationQuestionDto,
  AIConfigurationDto,
} from '../dto/ChatbotConfigDto';

export class ChatbotConfigMapper {
  // Convert domain entity to DTO
  static toDto(entity: ChatbotConfig): ChatbotConfigDto {
    const props = entity.toPlainObject();
    
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      avatarUrl: props.avatarUrl,
      description: props.description,
      personalitySettings: this.personalityToDto(props.personalitySettings),
      knowledgeBase: this.knowledgeBaseToDto(props.knowledgeBase),
      operatingHours: this.operatingHoursToDto(props.operatingHours),
      leadQualificationQuestions: props.leadQualificationQuestions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        options: q.options,
        isRequired: q.isRequired,
        order: q.order,
        scoringWeight: q.scoringWeight,
      })),
      aiConfiguration: this.aiConfigurationToDto(props.aiConfiguration),
      isActive: props.isActive,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  // Convert DTO to domain entity
  static toDomain(dto: ChatbotConfigDto): ChatbotConfig {
    return ChatbotConfig.fromPersistence({
      id: dto.id,
      organizationId: dto.organizationId,
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      description: dto.description,
      personalitySettings: this.personalityFromDto(dto.personalitySettings),
      knowledgeBase: this.knowledgeBaseFromDto(dto.knowledgeBase),
      operatingHours: this.operatingHoursFromDto(dto.operatingHours),
      leadQualificationQuestions: dto.leadQualificationQuestions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type as 'text' | 'email' | 'phone' | 'select' | 'multiselect',
        options: q.options,
        isRequired: q.isRequired,
        order: q.order,
        scoringWeight: q.scoringWeight ?? 1,
      })),
      aiConfiguration: this.aiConfigurationFromDto(dto.aiConfiguration),
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // Convert create DTO to domain entity
  static createDtoToDomain(dto: CreateChatbotConfigDto): ChatbotConfig {
    return ChatbotConfig.create({
      organizationId: dto.organizationId,
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      description: dto.description,
      personalitySettings: this.personalityFromDto(dto.personalitySettings),
      knowledgeBase: this.knowledgeBaseFromDto(dto.knowledgeBase),
      operatingHours: this.operatingHoursFromDto(dto.operatingHours),
      leadQualificationQuestions: dto.leadQualificationQuestions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type as 'text' | 'email' | 'phone' | 'select' | 'multiselect',
        options: q.options,
        isRequired: q.isRequired,
        order: q.order,
        scoringWeight: q.scoringWeight ?? 1,
      })),
      aiConfiguration: dto.aiConfiguration ? this.aiConfigurationFromDto(dto.aiConfiguration) : undefined,
      isActive: true,
    });
  }

  static personalityToDto(personality: any): PersonalitySettingsDto {
    return {
      tone: personality.tone,
      communicationStyle: personality.communicationStyle,
      responseLength: personality.responseLength,
      escalationTriggers: personality.escalationTriggers,
      responseBehavior: {
        useEmojis: personality.responseBehavior.useEmojis,
        askFollowUpQuestions: personality.responseBehavior.askFollowUpQuestions,
        proactiveOffering: personality.responseBehavior.proactiveOffering,
        personalizeResponses: personality.responseBehavior.personalizeResponses,
        acknowledgePreviousInteractions: personality.responseBehavior.acknowledgePreviousInteractions,
      },
      conversationFlow: {
        greetingMessage: personality.conversationFlow.greetingMessage,
        fallbackMessage: personality.conversationFlow.fallbackMessage,
        escalationMessage: personality.conversationFlow.escalationMessage,
        endConversationMessage: personality.conversationFlow.endConversationMessage,
        leadCapturePrompt: personality.conversationFlow.leadCapturePrompt,
        maxConversationTurns: personality.conversationFlow.maxConversationTurns,
        inactivityTimeout: personality.conversationFlow.inactivityTimeout,
      },
      customInstructions: personality.customInstructions,
    };
  }

  static personalityFromDto(dto: PersonalitySettingsDto): PersonalitySettings {
    return PersonalitySettings.create({
      tone: dto.tone as 'professional' | 'friendly' | 'casual' | 'formal',
      communicationStyle: dto.communicationStyle as 'direct' | 'conversational' | 'helpful' | 'sales-focused',
      responseLength: dto.responseLength as 'brief' | 'detailed' | 'adaptive',
      escalationTriggers: dto.escalationTriggers,
      responseBehavior: dto.responseBehavior,
      conversationFlow: dto.conversationFlow,
      customInstructions: dto.customInstructions,
    });
  }

  static knowledgeBaseToDto(kb: any): KnowledgeBaseDto {
    return {
      companyInfo: kb.companyInfo,
      productCatalog: kb.productCatalog,
      faqs: kb.faqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        keywords: faq.keywords,
        priority: faq.priority,
      })),
      supportDocs: kb.supportDocs,
      complianceGuidelines: kb.complianceGuidelines,
      websiteSources: kb.websiteSources.map((ws: any) => ({
        id: ws.id,
        url: ws.url,
        name: ws.name,
        description: ws.description,
        isActive: ws.isActive,
        crawlSettings: {
          maxPages: ws.crawlSettings.maxPages,
          maxDepth: ws.crawlSettings.maxDepth,
          includePatterns: ws.crawlSettings.includePatterns,
          excludePatterns: ws.crawlSettings.excludePatterns,
          respectRobotsTxt: ws.crawlSettings.respectRobotsTxt,
          crawlFrequency: ws.crawlSettings.crawlFrequency,
          includeImages: ws.crawlSettings.includeImages,
          includePDFs: ws.crawlSettings.includePDFs,
        },
        lastCrawled: ws.lastCrawled?.toISOString(),
        pageCount: ws.pageCount,
        status: ws.status,
        errorMessage: ws.errorMessage,
      })),
    };
  }

  static knowledgeBaseFromDto(dto: KnowledgeBaseDto): KnowledgeBase {
    return KnowledgeBase.create({
      companyInfo: dto.companyInfo,
      productCatalog: dto.productCatalog,
      faqs: dto.faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        isActive: true,
      })),
      supportDocs: dto.supportDocs,
      complianceGuidelines: dto.complianceGuidelines,
      websiteSources: dto.websiteSources.map(ws => ({
        id: ws.id,
        url: ws.url,
        name: ws.name,
        description: ws.description,
        isActive: ws.isActive,
        crawlSettings: {
          maxPages: ws.crawlSettings.maxPages,
          maxDepth: ws.crawlSettings.maxDepth,
          includePatterns: ws.crawlSettings.includePatterns,
          excludePatterns: ws.crawlSettings.excludePatterns,
          respectRobotsTxt: ws.crawlSettings.respectRobotsTxt,
          crawlFrequency: ws.crawlSettings.crawlFrequency,
          includeImages: ws.crawlSettings.includeImages,
          includePDFs: ws.crawlSettings.includePDFs,
        },
        lastCrawled: ws.lastCrawled ? new Date(ws.lastCrawled) : undefined,
        pageCount: ws.pageCount,
        status: ws.status,
        errorMessage: ws.errorMessage,
      })),
    });
  }

  static operatingHoursToDto(oh: any): OperatingHoursDto {
    return {
      timezone: oh.timezone,
      businessHours: oh.businessHours.map((bh: any) => ({
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isOpen: bh.isOpen,
      })),
      holidaySchedule: oh.holidaySchedule.map((h: any) => ({
        date: h.date,
        name: h.name,
        isRecurring: h.isRecurring,
      })),
      outsideHoursMessage: oh.outsideHoursMessage,
    };
  }

  static operatingHoursFromDto(dto: OperatingHoursDto): OperatingHours {
    return OperatingHours.create({
      timezone: dto.timezone,
      businessHours: dto.businessHours.map(bh => ({
        dayOfWeek: bh.dayOfWeek,
        startTime: bh.startTime,
        endTime: bh.endTime,
        isActive: bh.isOpen,
      })),
      holidaySchedule: dto.holidaySchedule,
      outsideHoursMessage: dto.outsideHoursMessage,
    });
  }

  private static aiConfigurationToDto(aiConfig: any): AIConfigurationDto {
    return {
      openaiModel: aiConfig.openaiModel,
      openaiTemperature: aiConfig.openaiTemperature,
      openaiMaxTokens: aiConfig.openaiMaxTokens,
      contextMaxTokens: aiConfig.contextMaxTokens,
      contextSystemPromptTokens: aiConfig.contextSystemPromptTokens,
      contextResponseReservedTokens: aiConfig.contextResponseReservedTokens,
      contextSummaryTokens: aiConfig.contextSummaryTokens,
      intentConfidenceThreshold: aiConfig.intentConfidenceThreshold,
      intentAmbiguityThreshold: aiConfig.intentAmbiguityThreshold,
      enableMultiIntentDetection: aiConfig.enableMultiIntentDetection,
      enablePersonaInference: aiConfig.enablePersonaInference,
      enableAdvancedEntities: aiConfig.enableAdvancedEntities,
      entityExtractionMode: aiConfig.entityExtractionMode,
      customEntityTypes: aiConfig.customEntityTypes,
      maxConversationTurns: aiConfig.maxConversationTurns,
      inactivityTimeoutSeconds: aiConfig.inactivityTimeoutSeconds,
      enableJourneyRegression: aiConfig.enableJourneyRegression,
      enableContextSwitchDetection: aiConfig.enableContextSwitchDetection,
      enableAdvancedScoring: aiConfig.enableAdvancedScoring,
      entityCompletenessWeight: aiConfig.entityCompletenessWeight,
      personaConfidenceWeight: aiConfig.personaConfidenceWeight,
      journeyProgressionWeight: aiConfig.journeyProgressionWeight,
      enablePerformanceLogging: aiConfig.enablePerformanceLogging,
      enableIntentAnalytics: aiConfig.enableIntentAnalytics,
      enablePersonaAnalytics: aiConfig.enablePersonaAnalytics,
      responseTimeThresholdMs: aiConfig.responseTimeThresholdMs,
    };
  }

  private static aiConfigurationFromDto(dto: AIConfigurationDto): AIConfiguration {
    return AIConfiguration.create({
      openaiModel: dto.openaiModel as 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo',
      openaiTemperature: dto.openaiTemperature,
      openaiMaxTokens: dto.openaiMaxTokens,
      contextMaxTokens: dto.contextMaxTokens,
      contextSystemPromptTokens: dto.contextSystemPromptTokens,
      contextResponseReservedTokens: dto.contextResponseReservedTokens,
      contextSummaryTokens: dto.contextSummaryTokens,
      intentConfidenceThreshold: dto.intentConfidenceThreshold,
      intentAmbiguityThreshold: dto.intentAmbiguityThreshold,
      enableMultiIntentDetection: dto.enableMultiIntentDetection,
      enablePersonaInference: dto.enablePersonaInference,
      enableAdvancedEntities: dto.enableAdvancedEntities,
      entityExtractionMode: dto.entityExtractionMode as 'basic' | 'comprehensive' | 'custom',
      customEntityTypes: dto.customEntityTypes,
      maxConversationTurns: dto.maxConversationTurns,
      inactivityTimeoutSeconds: dto.inactivityTimeoutSeconds,
      enableJourneyRegression: dto.enableJourneyRegression,
      enableContextSwitchDetection: dto.enableContextSwitchDetection,
      enableAdvancedScoring: dto.enableAdvancedScoring,
      entityCompletenessWeight: dto.entityCompletenessWeight,
      personaConfidenceWeight: dto.personaConfidenceWeight,
      journeyProgressionWeight: dto.journeyProgressionWeight,
      enablePerformanceLogging: dto.enablePerformanceLogging,
      enableIntentAnalytics: dto.enableIntentAnalytics,
      enablePersonaAnalytics: dto.enablePersonaAnalytics,
      responseTimeThresholdMs: dto.responseTimeThresholdMs,
    });
  }
} 