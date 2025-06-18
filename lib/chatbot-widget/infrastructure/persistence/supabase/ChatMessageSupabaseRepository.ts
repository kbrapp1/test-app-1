import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatMessageCrudService } from './services/ChatMessageCrudService';
import { ChatMessageAnalyticsService } from './services/ChatMessageAnalyticsService';
import { ChatMessageQueryService } from './services/ChatMessageQueryService';
import { ChatMessageMapper } from './mappers/ChatMessageMapper';
import { DatabaseError } from '@/lib/errors/base';

/**
 * Refactored ChatMessage Repository Implementation
 * 
 * Follows DDD principles with focused services:
 * - Single Responsibility: Delegates to specialized services
 * - Clean Architecture: Maintains repository interface while using composition
 * - Under 200 lines: Focused coordination instead of monolithic implementation
 */
export class ChatMessageSupabaseRepository implements IChatMessageRepository {
  private crudService: ChatMessageCrudService;
  private analyticsService: ChatMessageAnalyticsService;
  private queryService: ChatMessageQueryService;
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.crudService = new ChatMessageCrudService(this.supabase);
    this.analyticsService = new ChatMessageAnalyticsService(this.supabase);
    this.queryService = new ChatMessageQueryService(this.supabase);
  }

  // Basic CRUD operations - delegated to CrudService
  async findById(id: string): Promise<ChatMessage | null> {
    return this.crudService.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.crudService.findBySessionId(sessionId);
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.crudService.findVisibleBySessionId(sessionId);
  }

  // Query operations - delegated to QueryService
  async findBySessionIdWithPagination(
    sessionId: string,
    page: number,
    limit: number
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.queryService.findBySessionIdWithPagination(sessionId, page, limit);
  }

  // CRUD operations continued - delegated to CrudService
  async save(message: ChatMessage, sharedLogFile?: string): Promise<ChatMessage> {
    return this.create(message, sharedLogFile);
  }

  async update(message: ChatMessage): Promise<ChatMessage> {
    return this.crudService.update(message);
  }

  async delete(id: string): Promise<void> {
    return this.crudService.delete(id);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    return this.crudService.deleteBySessionId(sessionId);
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    return this.queryService.findRecentByOrganizationId(organizationId, limit);
  }

  async searchByContent(
    organizationId: string,
    searchTerm: string,
    filters?: {
      messageType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      sessionId?: string;
    }
  ): Promise<ChatMessage[]> {
    return this.queryService.searchByContent(organizationId, searchTerm, filters);
  }

  // Analytics operations - delegated to AnalyticsService
  async getAnalytics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalMessages: number;
    userMessages: number;
    botMessages: number;
    systemMessages: number;
    avgResponseTime: number;
    avgTokensPerMessage: number;
    totalTokenCost: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topIntents: Array<{ intent: string; count: number }>;
    errorRate: number;
  }> {
    return this.analyticsService.getAnalytics(organizationId, dateFrom, dateTo);
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    return this.crudService.findLastBySessionId(sessionId);
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    return this.crudService.countByTypeAndSessionId(sessionId);
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.analyticsService.findMessagesWithErrors(organizationId, dateFrom, dateTo);
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    return this.analyticsService.getResponseTimeMetrics(organizationId, dateFrom, dateTo, groupBy);
  }

  async create(message: ChatMessage, sharedLogFile?: string): Promise<ChatMessage> {
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
    
    const logEntry = (logMessage: string) => {
      // Check if file logging is disabled via environment variable
      const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
      if (!fileLoggingEnabled) return;
      
      const logLine = `[${timestamp}] ${logMessage}\n`;
      fs.appendFileSync(logFile, logLine);
    };
    
    logEntry('\n💬 =================================');
    logEntry('💬 DATABASE OPERATION - CREATE MESSAGE');
    logEntry('💬 =================================');
    
    try {
      const insertData = ChatMessageMapper.toInsert(message);
      
      logEntry('📤 SQL INSERT OPERATION:');
      logEntry('🔗 Table: chat_messages');
      logEntry('📋 Insert Data:');
      logEntry(JSON.stringify(insertData, null, 2));
      
      const startTime = Date.now();
      logEntry(`⏱️  Database Call Started: ${new Date().toISOString()}`);

      const { data, error } = await this.supabase
        .from('chat_messages')
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
        throw new DatabaseError(`Failed to create chat message: ${error.message}`);
      }

      logEntry('📥 DATABASE RESPONSE:');
      logEntry(JSON.stringify(data, null, 2));

      const createdMessage = ChatMessageMapper.toDomain(data);
      
      logEntry('✨ MAPPED DOMAIN ENTITY:');
      logEntry(JSON.stringify({
        id: createdMessage.id,
        messageType: createdMessage.messageType,
        content: createdMessage.content.substring(0, 100) + (createdMessage.content.length > 100 ? '...' : ''),
        sessionId: createdMessage.sessionId,
        timestamp: createdMessage.timestamp.toISOString()
      }, null, 2));

      logEntry('💬 =================================');
      logEntry('💬 MESSAGE CREATED SUCCESSFULLY');
      logEntry('💬 =================================\n');

      return createdMessage;
    } catch (error) {
      logEntry('\n❌ =================================');
      logEntry('❌ DATABASE MESSAGE CREATE FAILED');
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