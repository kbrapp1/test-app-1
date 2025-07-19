/**
 * AI Instructions: ChatbotConfigSupabaseRepository infrastructure implementation
 * - Implement domain repository interface with Supabase persistence
 * - Delegate to KnowledgeContentService for structured content operations
 * - Use ChatbotConfigMapper for domain/database entity conversion
 * - Follow @golden-rule patterns with proper error handling and separation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../supabase/server';
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { DatabaseError } from './errors/DatabaseError';
import { ChatbotConfigMapper } from './mappers/ChatbotConfigMapper';
import { KnowledgeContentService } from './services/KnowledgeContentService';
import { StructuredKnowledgeContent } from './types/KnowledgeContentTypes';

export class ChatbotConfigSupabaseRepository implements IChatbotConfigRepository {
  private readonly supabase: SupabaseClient;
  private readonly tableName = 'chatbot_configs';
  private readonly knowledgeContentService: KnowledgeContentService;

  constructor(
    supabaseClient?: SupabaseClient,
    knowledgeContentService?: KnowledgeContentService
  ) {
    this.supabase = supabaseClient ?? createClient();
    
    if (knowledgeContentService) {
      this.knowledgeContentService = knowledgeContentService;
    } else {
      // Import domain services dynamically to avoid circular dependency
      const { UserContentSanitizationService } = require('../../../domain/services/content-processing/UserContentSanitizationService');
      const { ContentValidationService } = require('../../../domain/services/content-processing/ContentValidationService');
      
      this.knowledgeContentService = new KnowledgeContentService(
        this.supabase,
        new UserContentSanitizationService(),
        new ContentValidationService()
      );
    }
  }

  /** Find chatbot config by ID */
  async findById(id: string): Promise<ChatbotConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to fetch chatbot config by ID', { error, id });
      }

      return ChatbotConfigMapper.toDomainEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching chatbot config by ID', { error, id });
    }
  }

  /** Find chatbot config by organization ID */
  async findByOrganizationId(organizationId: string): Promise<ChatbotConfig | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError('Failed to fetch chatbot config', { error, organizationId });
      }

      return ChatbotConfigMapper.toDomainEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching chatbot config', { error, organizationId });
    }
  }

  /** Get structured knowledge content with sanitization */
  async getStructuredKnowledgeContent(organizationId: string): Promise<StructuredKnowledgeContent> {
    return this.knowledgeContentService.getStructuredKnowledgeContent(organizationId);
  }

  /** Find all active configs for organization */
  async findActiveByOrganizationId(organizationId: string): Promise<ChatbotConfig[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (error) {
        throw new DatabaseError('Failed to fetch active chatbot configs', { error, organizationId });
      }

      return data.map(record => ChatbotConfigMapper.toDomainEntity(record));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error fetching active configs', { error, organizationId });
    }
  }

  /** Save new chatbot config */
  async save(config: ChatbotConfig): Promise<ChatbotConfig> {
    try {
      const insertData = ChatbotConfigMapper.toInsert(config);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to save chatbot config', { error, configId: config.id });
      }

      return ChatbotConfigMapper.toDomainEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error saving chatbot config', { error, configId: config.id });
    }
  }

  /** Update existing chatbot config */
  async update(config: ChatbotConfig): Promise<ChatbotConfig> {
    try {
      const updateData = ChatbotConfigMapper.toUpdate(config);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', config.id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update chatbot config', { error, configId: config.id });
      }

      return ChatbotConfigMapper.toDomainEntity(data);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error updating chatbot config', { error, configId: config.id });
    }
  }

  /** Delete chatbot config */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new DatabaseError('Failed to delete chatbot config', { error, configId: id });
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error deleting chatbot config', { error, configId: id });
    }
  }

  /** Check if config exists for organization */
  async existsByOrganizationId(organizationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1);

      if (error) {
        throw new DatabaseError('Failed to check config existence', { error, organizationId });
      }

      return data.length > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error checking config existence', { error, organizationId });
    }
  }

  /** Find configs by name pattern */
  async findByNamePattern(pattern: string, organizationId?: string): Promise<ChatbotConfig[]> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .ilike('name', `%${pattern}%`);

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError('Failed to search configs by pattern', { error, pattern, organizationId });
      }

      return data.map(record => ChatbotConfigMapper.toDomainEntity(record));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error searching configs', { error, pattern, organizationId });
    }
  }

  /** Get configuration statistics */
  async getStatistics(organizationId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalFaqs: number;
    avgLeadQuestions: number;
    lastUpdated: Date | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('is_active, updated_at')
        .eq('organization_id', organizationId);

      if (error) {
        throw new DatabaseError('Failed to get config statistics', { error, organizationId });
      }

      const totalConfigs = data.length;
      const activeConfigs = data.filter(config => config.is_active).length;
      const lastUpdated = data.length > 0 
        ? new Date(Math.max(...data.map(config => new Date(config.updated_at).getTime())))
        : null;

      return {
        totalConfigs,
        activeConfigs,
        totalFaqs: 0, // FAQ counting not implemented
        avgLeadQuestions: 0, // Lead questions not implemented
        lastUpdated
      };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError('Unexpected error getting statistics', { error, organizationId });
    }
  }

} 