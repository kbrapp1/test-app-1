/**
 * Chat Session Supabase Repository
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Core chat session data access coordination
 * - Delegate specialized operations to focused services
 * - Keep under 200-250 lines by extracting query services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from './mappers/ChatSessionMapper';
import { DatabaseError } from '@/lib/errors/base';
import { 
  ChatSessionQueryService,
  ChatSessionAnalyticsService,
  ChatSessionMaintenanceService
} from './services/chat-session';

/**
 * Supabase ChatSession Repository Implementation
 * Follows DDD principles with clean separation of concerns
 */
export class ChatSessionSupabaseRepository implements IChatSessionRepository {
  private readonly queryService: ChatSessionQueryService;
  private readonly analyticsService: ChatSessionAnalyticsService;
  private readonly maintenanceService: ChatSessionMaintenanceService;
  private readonly tableName = 'chat_sessions';
  private readonly supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.queryService = new ChatSessionQueryService(this.supabase);
    this.analyticsService = new ChatSessionAnalyticsService(this.supabase);
    this.maintenanceService = new ChatSessionMaintenanceService(this.supabase);
  }

  async findById(id: string): Promise<ChatSession | null> {
    return this.queryService.findById(id);
  }

  async findBySessionToken(sessionToken: string): Promise<ChatSession | null> {
    return this.queryService.findBySessionToken(sessionToken);
  }

  async findActiveByChatbotConfigId(chatbotConfigId: string): Promise<ChatSession[]> {
    return this.queryService.findActiveByChatbotConfigId(chatbotConfigId);
  }

  async findByVisitorId(visitorId: string): Promise<ChatSession[]> {
    return this.queryService.findByVisitorId(visitorId);
  }

  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
      hasLead?: boolean;
    }
  ): Promise<{
    sessions: ChatSession[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.queryService.findByOrganizationIdWithPagination(
      organizationId,
      page,
      limit,
      filters
    );
  }

  async save(session: ChatSession): Promise<ChatSession> {
    return this.queryService.save(session);
  }

  async update(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let logFile: string;
    if (sharedLogFile) {
      // Use the shared log file directly (it should be a full filename)
      logFile = path.join(logDir, sharedLogFile);
    } else {
      // Create new log file only if no shared file provided
      const logFileName = `chatbot-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
      logFile = path.join(logDir, logFileName);
    }
    
    const logEntry = (message: string) => {
      // Check if file logging is disabled via environment variable
      const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
      if (!fileLoggingEnabled) return;
      
      const logLine = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(logFile, logLine);
    };
    
    logEntry('\n🗄️  =================================');
    logEntry('🗄️  DATABASE OPERATION - UPDATE SESSION');
    logEntry('🗄️  =================================');
    
    try {
      const updateData = ChatSessionMapper.toUpdate(session);
      
      logEntry('📤 SQL UPDATE OPERATION:');
      logEntry('🔗 Table: chat_sessions');
      logEntry('🆔 Session ID: ' + session.id);
      logEntry('📋 Update Data:');
      logEntry(JSON.stringify(updateData, null, 2));
      
      const startTime = Date.now();
      logEntry(`⏱️  Database Call Started: ${new Date().toISOString()}`);

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', session.id)
        .select()
        .single();

      const duration = Date.now() - startTime;
      logEntry(`✅ Database Call Completed: ${new Date().toISOString()}`);
      logEntry(`⚡ Duration: ${duration}ms`);

      if (error) {
        logEntry('❌ DATABASE ERROR:');
        logEntry(JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        }, null, 2));
        throw new Error(`Failed to update chat session: ${error.message}`);
      }

      logEntry('📥 DATABASE RESPONSE:');
      logEntry(JSON.stringify(data, null, 2));

      const updatedSession = ChatSessionMapper.toDomain(data);
      
      logEntry('✨ MAPPED DOMAIN ENTITY:');
      logEntry(JSON.stringify({
        id: updatedSession.id,
        status: updatedSession.status,
        lastActivityAt: updatedSession.lastActivityAt.toISOString(),
        contextData: Object.keys(updatedSession.contextData || {})
      }, null, 2));

      logEntry('🗄️  =================================');
      logEntry('🗄️  SESSION UPDATED SUCCESSFULLY');
      logEntry('🗄️  =================================\n');

      return updatedSession;
    } catch (error) {
      logEntry('\n❌ =================================');
      logEntry('❌ DATABASE UPDATE FAILED');
      logEntry('❌ =================================');
      logEntry('🚨 Error Details:');
      logEntry(JSON.stringify({
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, null, 2));
      logEntry('❌ =================================\n');
      
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    return this.queryService.delete(id);
  }

  async findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]> {
    return this.maintenanceService.findExpiredSessions(timeoutMinutes);
  }

  async markExpiredAsAbandoned(timeoutMinutes: number): Promise<number> {
    return this.maintenanceService.markExpiredAsAbandoned(timeoutMinutes);
  }

  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    abandonedSessions: number;
    avgSessionDuration: number;
    avgEngagementScore: number;
    conversionRate: number;
    topTopics: Array<{ topic: string; count: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  }> {
    return this.analyticsService.getAnalytics(organizationId, dateFrom, dateTo);
  }

  async findRecentByVisitorId(visitorId: string, limit: number): Promise<ChatSession[]> {
    return this.queryService.findRecentByVisitorId(visitorId, limit);
  }

  async countActiveByChatbotConfigId(chatbotConfigId: string): Promise<number> {
    return this.queryService.countActiveByChatbotConfigId(chatbotConfigId);
  }

  async create(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let logFile: string;
    if (sharedLogFile) {
      // Use the shared log file directly (it should be a full filename)
      logFile = path.join(logDir, sharedLogFile);
    } else {
      // Create new log file only if no shared file provided
      const logFileName = `chatbot-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
      logFile = path.join(logDir, logFileName);
    }
    
    const logEntry = (message: string) => {
      // Check if file logging is disabled via environment variable
      const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
      if (!fileLoggingEnabled) return;
      
      const logLine = `[${timestamp}] ${message}\n`;
      fs.appendFileSync(logFile, logLine);
    };
    
    logEntry('\n🗄️  =================================');
    logEntry('🗄️  DATABASE OPERATION - CREATE SESSION');
    logEntry('🗄️  =================================');
    
    try {
      const insertData = ChatSessionMapper.toInsert(session);
      
      logEntry('📤 SQL INSERT OPERATION:');
      logEntry('🔗 Table: chat_sessions');
      logEntry('📋 Insert Data:');
      logEntry(JSON.stringify(insertData, null, 2));
      
      const startTime = Date.now();
      logEntry(`⏱️  Database Call Started: ${new Date().toISOString()}`);

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert(insertData)
        .select()
        .single();

      const duration = Date.now() - startTime;
      logEntry(`✅ Database Call Completed: ${new Date().toISOString()}`);
      logEntry(`⚡ Duration: ${duration}ms`);

      if (error) {
        logEntry('❌ DATABASE ERROR:');
        logEntry(JSON.stringify({
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          timestamp: new Date().toISOString()
        }, null, 2));
        throw new Error(`Failed to create chat session: ${error.message}`);
      }

      logEntry('📥 DATABASE RESPONSE:');
      logEntry(JSON.stringify(data, null, 2));

      const createdSession = ChatSessionMapper.toDomain(data);
      
      logEntry('✨ MAPPED DOMAIN ENTITY:');
      logEntry(JSON.stringify({
        id: createdSession.id,
        status: createdSession.status,
        startedAt: createdSession.startedAt.toISOString(),
        lastActivityAt: createdSession.lastActivityAt.toISOString()
      }, null, 2));

      logEntry('🗄️  =================================');
      logEntry('🗄️  SESSION CREATED SUCCESSFULLY');
      logEntry('🗄️  =================================\n');

      return createdSession;
    } catch (error) {
      logEntry('\n❌ =================================');
      logEntry('❌ DATABASE CREATE FAILED');
      logEntry('❌ =================================');
      logEntry('🚨 Error Details:');
      logEntry(JSON.stringify({
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, null, 2));
      logEntry('❌ =================================\n');
      
      throw error;
    }
  }
} 