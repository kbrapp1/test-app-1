/**
 * Chatbot Configuration Mapper
 * 
 * Maps between ChatbotConfig domain entities and DTOs.
 * Following DDD principle: Application layer handles transformations
 * between domain entities and external contracts (DTOs).
 */

import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { BotPersonality } from '../../domain/value-objects/BotPersonality';
import { OperatingHours } from '../../domain/value-objects/OperatingHours';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
  UpdateChatbotConfigDto,
  PersonalitySettingsDto,
  KnowledgeBaseDto,
  OperatingHoursDto,
  LeadQualificationQuestionDto,
} from '../dto/ChatbotConfigDto';

export class ChatbotConfigMapper {
  /**
   * Convert domain entity to DTO
   */
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
      isActive: props.isActive,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  /**
   * Convert DTO to domain entity
   */
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
        scoringWeight: q.scoringWeight ?? 1, // Default scoring weight from DTO
      })),
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * Convert create DTO to domain entity
   */
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
        scoringWeight: q.scoringWeight ?? 1, // Default scoring weight from DTO
      })),
      isActive: true,
    });
  }

  private static personalityToDto(personality: any): PersonalitySettingsDto {
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

  private static personalityFromDto(dto: PersonalitySettingsDto): any {
    return {
      tone: dto.tone,
      communicationStyle: dto.communicationStyle,
      responseLength: dto.responseLength,
      escalationTriggers: dto.escalationTriggers,
      responseBehavior: dto.responseBehavior,
      conversationFlow: dto.conversationFlow,
      customInstructions: dto.customInstructions,
    };
  }

  private static knowledgeBaseToDto(kb: any): KnowledgeBaseDto {
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
    };
  }

  private static knowledgeBaseFromDto(dto: KnowledgeBaseDto): any {
    return {
      companyInfo: dto.companyInfo,
      productCatalog: dto.productCatalog,
      faqs: dto.faqs,
      supportDocs: dto.supportDocs,
      complianceGuidelines: dto.complianceGuidelines,
    };
  }

  private static operatingHoursToDto(oh: any): OperatingHoursDto {
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

  private static operatingHoursFromDto(dto: OperatingHoursDto): any {
    return {
      timezone: dto.timezone,
      businessHours: dto.businessHours,
      holidaySchedule: dto.holidaySchedule,
      outsideHoursMessage: dto.outsideHoursMessage,
    };
  }
} 