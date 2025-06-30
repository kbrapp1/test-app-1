/**
 * Chat Session Maintenance Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Session maintenance and cleanup operations
 * - Handle expired sessions and cleanup tasks
 * - Keep under 200-250 lines
 * - Focus on maintenance operations only
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ChatSession } from '../../../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from '../../mappers/ChatSessionMapper';
import { DatabaseError } from '../../../../../../errors/base';

export class ChatSessionMaintenanceService {
  private readonly tableName = 'chat_sessions';

  constructor(private readonly supabase: SupabaseClient) {}

  async findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]> {
    const cutoffTime = this.calculateCutoffTime(timeoutMinutes);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('status', 'active')
      .lt('last_activity_at', cutoffTime.toISOString())
      .order('last_activity_at', { ascending: true });

    if (error) {
      throw new DatabaseError('Failed to find expired sessions', error.message);
    }

    return (data || []).map(record => ChatSessionMapper.toDomain(record as RawChatSessionDbRecord));
  }

  async markExpiredAsAbandoned(timeoutMinutes: number): Promise<number> {
    const cutoffTime = this.calculateCutoffTime(timeoutMinutes);
    const now = new Date();
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status: 'abandoned',
        ended_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('status', 'active')
      .lt('last_activity_at', cutoffTime.toISOString())
      .select('id');

    if (error) {
      throw new DatabaseError('Failed to mark expired sessions as abandoned', error.message);
    }

    return data?.length || 0;
  }

  async cleanupOldSessions(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .lt('started_at', cutoffDate.toISOString())
      .neq('status', 'active')
      .select('id');

    if (error) {
      throw new DatabaseError('Failed to cleanup old sessions', error.message);
    }

    return data?.length || 0;
  }

  async archiveCompletedSessions(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'completed')
      .lt('ended_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new DatabaseError('Failed to archive completed sessions', error.message);
    }

    return data?.length || 0;
  }

  async getMaintenanceStats(): Promise<{
    activeSessions: number;
    expiredSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    archivedSessions: number;
  }> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('status');

    if (error) {
      throw new DatabaseError('Failed to get maintenance stats', error.message);
    }

    const stats = {
      activeSessions: 0,
      expiredSessions: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      archivedSessions: 0,
    };

    (data || []).forEach(record => {
      switch (record.status) {
        case 'active':
          stats.activeSessions++;
          break;
        case 'completed':
          stats.completedSessions++;
          break;
        case 'abandoned':
          stats.abandonedSessions++;
          break;
        case 'archived':
          stats.archivedSessions++;
          break;
      }
    });

    return stats;
  }

  private calculateCutoffTime(timeoutMinutes: number): Date {
    return new Date(Date.now() - timeoutMinutes * 60 * 1000);
  }
} 