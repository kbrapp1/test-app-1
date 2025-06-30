import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../../supabase/server';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { ChatMessageMapper, RawChatMessageDbRecord } from '../mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../../errors/base';

/**
 * Chat Message CRUD Service
 * 
 * Single responsibility: Basic CRUD operations for chat messages
 * Following DDD infrastructure layer patterns with ~200 lines
 */
export class ChatMessageCrudService {
  private supabase: SupabaseClient;
  private readonly tableName = 'chat_messages';

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
  }

  async findById(id: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to find chat message by ID', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find chat messages by session ID', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_visible', true)
      .order('timestamp', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find visible chat messages', error.message);
    }

    return (data || []).map(record => ChatMessageMapper.toDomain(record as RawChatMessageDbRecord));
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new DatabaseError('Failed to find last message by session', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async save(message: ChatMessage): Promise<ChatMessage> {
    const insertData = ChatMessageMapper.toInsert(message);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save chat message', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async update(message: ChatMessage): Promise<ChatMessage> {
    const updateData = ChatMessageMapper.toUpdate(message);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updateData)
      .eq('id', message.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update chat message', error.message);
    }

    return ChatMessageMapper.toDomain(data as RawChatMessageDbRecord);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete chat message', error.message);
    }
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('session_id', sessionId);

    if (error) {
      throw new DatabaseError('Failed to delete chat messages by session', error.message);
    }
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('message_type')
      .eq('session_id', sessionId);

    if (error) {
      throw new DatabaseError('Failed to count messages by type', error.message);
    }

    const counts = {
      user: 0,
      bot: 0,
      system: 0,
      lead_capture: 0,
      qualification: 0,
    };

    (data || []).forEach(record => {
      if (counts.hasOwnProperty(record.message_type)) {
        counts[record.message_type as keyof typeof counts]++;
      }
    });

    return counts;
  }
} 