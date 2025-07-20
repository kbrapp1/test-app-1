/**
 * Chatbot Configuration Mapper - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Main orchestrator now delegates to specialized value object mappers
 * - Maps between ChatbotConfig domain entities and DTOs using focused, testable mappers
 * - Maintains DDD principle: Application layer coordinates domain-external contract mapping
 * - Ensures type safety and proper validation during entity-DTO conversions
 * - Supports CQRS patterns with separate creation, update, and query DTO mappings
 * - Each complex value object transformation handled by dedicated mapper
 */

import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import {
  ChatbotConfigDto,
  CreateChatbotConfigDto,
} from '../dto/ChatbotConfigDto';
import { PersonalitySettingsMapper } from './PersonalitySettingsMapper';
import { KnowledgeBaseMapper } from './KnowledgeBaseMapper';
import { OperatingHoursMapper } from './OperatingHoursMapper';
import { AIConfigurationMapper } from './AIConfigurationMapper';

export class ChatbotConfigMapper {
  /** Convert domain entity to DTO using specialized mappers */
  static toDto(entity: ChatbotConfig): ChatbotConfigDto {
    const props = entity.toPlainObject();
    
    return {
      id: props.id,
      organizationId: props.organizationId, // SECURITY-CRITICAL: Organization isolation
      name: props.name,
      avatarUrl: props.avatarUrl,
      description: props.description,
      personalitySettings: PersonalitySettingsMapper.toDto(props.personalitySettings),
      knowledgeBase: KnowledgeBaseMapper.toDto(props.knowledgeBase),
      operatingHours: OperatingHoursMapper.toDto(props.operatingHours),
      leadQualificationQuestions: this.mapLeadQualificationQuestionsToDto(props.leadQualificationQuestions),
      aiConfiguration: AIConfigurationMapper.toDto(props.aiConfiguration),
      isActive: props.isActive,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }

  /** Convert DTO to domain entity using specialized mappers */
  static toDomain(dto: ChatbotConfigDto): ChatbotConfig {
    return ChatbotConfig.fromPersistence({
      id: dto.id,
      organizationId: dto.organizationId, // SECURITY-CRITICAL: Organization isolation
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      description: dto.description,
      personalitySettings: PersonalitySettingsMapper.fromDto(dto.personalitySettings),
      knowledgeBase: KnowledgeBaseMapper.fromDto(dto.knowledgeBase),
      operatingHours: OperatingHoursMapper.fromDto(dto.operatingHours),
      leadQualificationQuestions: this.mapLeadQualificationQuestionsFromDto(dto.leadQualificationQuestions),
      aiConfiguration: AIConfigurationMapper.fromDto(dto.aiConfiguration),
      isActive: dto.isActive,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /** Convert create DTO to domain entity using specialized mappers */
  static createDtoToDomain(dto: CreateChatbotConfigDto): ChatbotConfig {
    return ChatbotConfig.create({
      organizationId: dto.organizationId, // SECURITY-CRITICAL: Organization isolation
      name: dto.name,
      avatarUrl: dto.avatarUrl,
      description: dto.description,
      personalitySettings: PersonalitySettingsMapper.fromDto(dto.personalitySettings),
      knowledgeBase: KnowledgeBaseMapper.fromDto(dto.knowledgeBase),
      operatingHours: OperatingHoursMapper.fromDto(dto.operatingHours),
      leadQualificationQuestions: this.mapLeadQualificationQuestionsFromDto(dto.leadQualificationQuestions),
      aiConfiguration: dto.aiConfiguration ? AIConfigurationMapper.fromDto(dto.aiConfiguration) : undefined,
      isActive: true,
    });
  }

  /** Map lead qualification questions to DTO format */
  private static mapLeadQualificationQuestionsToDto(questions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    isRequired: boolean;
    order: number;
    scoringWeight?: number;
  }>) {
    return questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options,
      isRequired: q.isRequired,
      order: q.order,
      scoringWeight: q.scoringWeight,
    }));
  }

  /** Map lead qualification questions from DTO format */
  private static mapLeadQualificationQuestionsFromDto(dtoQuestions: Array<{
    id: string;
    question: string;
    type: string;
    options?: string[];
    isRequired: boolean;
    order: number;
    scoringWeight?: number;
  }>) {
    return dtoQuestions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type as 'text' | 'email' | 'phone' | 'select' | 'multiselect',
      options: q.options,
      isRequired: q.isRequired,
      order: q.order,
      scoringWeight: q.scoringWeight ?? 1,
    }));
  }
} 