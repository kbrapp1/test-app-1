import { ChatbotConfig, LeadQualificationQuestion } from '../../../../domain/entities/ChatbotConfig';
import { PersonalitySettings } from '../../../../domain/value-objects/ai-configuration/PersonalitySettings';
import { KnowledgeBase } from '../../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { OperatingHours } from '../../../../domain/value-objects/session-management/OperatingHours';
import { AIConfiguration } from '../../../../domain/value-objects/ai-configuration/AIConfiguration';
import { PersonalitySettingsMapper } from './PersonalitySettingsMapper';
import { KnowledgeBaseMapper } from './KnowledgeBaseMapper';
import { OperatingHoursMapper } from './OperatingHoursMapper';
import { AIConfigurationMapper } from './AIConfigurationMapper';
import { LeadQualificationMapper } from './LeadQualificationMapper';

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
 * Chatbot Config Infrastructure Mapper - DDD-Refactored
 * 
 * REFACTORED: Main mapper now orchestrates specialized value object mappers.
 * Each complex JSONB mapping is handled by focused, testable mappers.
 * All organizationId security fields preserved during refactoring.
 */

export class ChatbotConfigMapper {
  /** Transform database record to domain entity using specialized mappers */
  static toDomainEntity(data: unknown): ChatbotConfig {
    const record = data as RawChatbotConfigDbRecord;
    return ChatbotConfig.fromPersistence({
      id: record.id,
      organizationId: record.organization_id, // SECURITY-CRITICAL: Organization isolation
      name: record.name,
      avatarUrl: record.avatar_url ?? undefined,
      description: record.description ?? undefined,
      personalitySettings: PersonalitySettingsMapper.fromJsonb(record.personality_settings),
      knowledgeBase: KnowledgeBaseMapper.fromJsonb(record.knowledge_base),
      operatingHours: OperatingHoursMapper.fromJsonb(record.operating_hours),
      leadQualificationQuestions: LeadQualificationMapper.fromJsonb(record.lead_qualification_questions),
      aiConfiguration: AIConfigurationMapper.fromJsonb(record.ai_configuration),
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at)
    });
  }

  /** Transform domain entity to database record using specialized mappers */
  static toDbRecord(config: ChatbotConfig): unknown {
    return {
      id: config.id,
      organization_id: config.organizationId, // SECURITY-CRITICAL: Organization isolation
      name: config.name,
      avatar_url: config.avatarUrl,
      description: config.description,
      personality_settings: PersonalitySettingsMapper.toJsonb(config.personalitySettings),
      knowledge_base: KnowledgeBaseMapper.toJsonb(config.knowledgeBase),
      operating_hours: OperatingHoursMapper.toJsonb(config.operatingHours),
      lead_qualification_questions: LeadQualificationMapper.toJsonb(config.leadQualificationQuestions),
      ai_configuration: AIConfigurationMapper.toJsonb(config.aiConfiguration),
      is_active: config.isActive,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString()
    };
  }

  /** Transform domain entity to insert data using specialized mappers */
  static toInsert(config: ChatbotConfig): InsertChatbotConfigData {
    return {
      id: config.id,
      organization_id: config.organizationId, // SECURITY-CRITICAL: Organization isolation
      name: config.name,
      avatar_url: config.avatarUrl,
      description: config.description,
      personality_settings: PersonalitySettingsMapper.toJsonb(config.personalitySettings),
      knowledge_base: KnowledgeBaseMapper.toJsonb(config.knowledgeBase),
      operating_hours: OperatingHoursMapper.toJsonb(config.operatingHours),
      lead_qualification_questions: LeadQualificationMapper.toJsonb(config.leadQualificationQuestions),
      ai_configuration: AIConfigurationMapper.toJsonb(config.aiConfiguration),
      is_active: config.isActive,
    };
  }

  /** Transform domain entity to update data using specialized mappers */
  static toUpdate(config: ChatbotConfig): UpdateChatbotConfigData {
    return {
      name: config.name,
      avatar_url: config.avatarUrl,
      description: config.description,
      personality_settings: PersonalitySettingsMapper.toJsonb(config.personalitySettings),
      knowledge_base: KnowledgeBaseMapper.toJsonb(config.knowledgeBase),
      operating_hours: OperatingHoursMapper.toJsonb(config.operatingHours),
      lead_qualification_questions: LeadQualificationMapper.toJsonb(config.leadQualificationQuestions),
      ai_configuration: AIConfigurationMapper.toJsonb(config.aiConfiguration),
      is_active: config.isActive,
      updated_at: new Date().toISOString(),
    };
  }

} 