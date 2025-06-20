import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatbotConfigRepository } from '../../../domain/repositories/IChatbotConfigRepository';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { FAQ } from '../../../domain/value-objects/ai-configuration/KnowledgeBase';
import { ChatbotConfigMapper, RawChatbotConfigDbRecord } from './mappers/ChatbotConfigMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Supabase ChatbotConfig Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class ChatbotConfigSupabaseRepository implements IChatbotConfigRepository {
  private supabase: SupabaseClient;
  private readonly tableName = 'chatbot_configs';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  async findById(id: string): Promise<ChatbotConfig | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find chatbot config by ID', error.message);
    }

    return ChatbotConfigMapper.toDomain(data as RawChatbotConfigDbRecord);
  }

  async findByOrganizationId(organizationId: string): Promise<ChatbotConfig | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new DatabaseError('Failed to find chatbot config by organization ID', error.message);
    }

    return ChatbotConfigMapper.toDomain(data as RawChatbotConfigDbRecord);
  }

  async findActiveByOrganizationId(organizationId: string): Promise<ChatbotConfig[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new DatabaseError('Failed to find active chatbot configs', error.message);
    }

    return (data || []).map(record => ChatbotConfigMapper.toDomain(record as RawChatbotConfigDbRecord));
  }

  async save(config: ChatbotConfig): Promise<ChatbotConfig> {
    const insertData = ChatbotConfigMapper.toInsert(config);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save chatbot config', error.message);
    }

    return ChatbotConfigMapper.toDomain(data as RawChatbotConfigDbRecord);
  }

  async update(config: ChatbotConfig): Promise<ChatbotConfig> {
    const updateData = ChatbotConfigMapper.toUpdate(config);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', config.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update chatbot config', error.message);
    }

    return ChatbotConfigMapper.toDomain(data as RawChatbotConfigDbRecord);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete chatbot config', error.message);
    }
  }

  async existsByOrganizationId(organizationId: string): Promise<boolean> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      throw new DatabaseError('Failed to check chatbot config existence', error.message);
    }

    return (count || 0) > 0;
  }

  async findByNamePattern(pattern: string, organizationId?: string): Promise<ChatbotConfig[]> {
    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .ilike('name', `%${pattern}%`)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new DatabaseError('Failed to find chatbot configs by name pattern', error.message);
    }

    return (data || []).map(record => ChatbotConfigMapper.toDomain(record as RawChatbotConfigDbRecord));
  }

  async getStatistics(organizationId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalFaqs: number;
    avgLeadQuestions: number;
    lastUpdated: Date | null;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('organization_id', organizationId);

    if (error) {
      throw new DatabaseError('Failed to get chatbot config statistics', error.message);
    }

    if (!data || data.length === 0) {
      return {
        totalConfigs: 0,
        activeConfigs: 0,
        totalFaqs: 0,
        avgLeadQuestions: 0,
        lastUpdated: null,
      };
    }

    const configs = data.map(record => ChatbotConfigMapper.toDomain(record as RawChatbotConfigDbRecord));
    const activeConfigs = configs.filter(config => config.isActive);
    
    const totalFaqs = configs.reduce((sum, config) => 
      sum + config.knowledgeBase.faqs.filter((faq: FAQ) => faq.isActive).length, 0
    );
    
    const totalLeadQuestions = configs.reduce((sum, config) => 
      sum + config.leadQualificationQuestions.length, 0
    );
    
    const avgLeadQuestions = configs.length > 0 ? totalLeadQuestions / configs.length : 0;
    
    const lastUpdated = configs.reduce((latest, config) => {
      return !latest || config.updatedAt > latest ? config.updatedAt : latest;
    }, null as Date | null);

    return {
      totalConfigs: configs.length,
      activeConfigs: activeConfigs.length,
      totalFaqs,
      avgLeadQuestions: Math.round(avgLeadQuestions * 100) / 100,
      lastUpdated,
    };
  }
} 