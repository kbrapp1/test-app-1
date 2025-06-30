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
import { createClient } from '../../../../supabase/server';
import { IChatSessionRepository } from '../../../domain/repositories/IChatSessionRepository';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatSessionMapper, RawChatSessionDbRecord } from './mappers/ChatSessionMapper';
import { DatabaseError } from '../../../../errors/base';
import { 
  ChatSessionQueryService,
  ChatSessionAnalyticsService,
  ChatSessionMaintenanceService
} from './services/chat-session';
import { IChatbotLoggingService, IOperationLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';

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
  private readonly loggingService: IChatbotLoggingService;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.queryService = new ChatSessionQueryService(this.supabase);
    this.analyticsService = new ChatSessionAnalyticsService(this.supabase);
    this.maintenanceService = new ChatSessionMaintenanceService(this.supabase);
    
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
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

  async save(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    // Skip logging if no log file provided (e.g., for simulations)
    if (!sharedLogFile) {
      return this.queryService.save(session);
    }

    // Create operation logger for database operations
    const logger = this.loggingService.createOperationLogger(
      'db-save-session',
      sharedLogFile,
      {
        operation: 'saveSession',
        sessionId: session.id
      }
    );

    // Create session logger for detailed database logging with shared log file
    const sessionLogger = this.loggingService.createSessionLogger(session.id, sharedLogFile);
    sessionLogger.logHeader('🗄️ DATABASE OPERATION - SAVE SESSION');
    
    try {
      logger.start({ sessionId: session.id });
      const result = await this.queryService.save(session);
      logger.complete(result);
      sessionLogger.logStep('Session saved successfully');
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'saveSession',
        sessionId: session.id
      });
      logger.fail(error as Error);
      throw error;
    }
  }

  async update(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    // Skip logging if no log file provided (e.g., for simulations)
    if (!sharedLogFile) {
      const updateData = ChatSessionMapper.toUpdate(session);
      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', session.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update chat session: ${error.message}`);
      }

      return ChatSessionMapper.toDomain(data);
    }

    // Create operation logger for database operations
    const logger = this.loggingService.createOperationLogger(
      'db-update-session',
      sharedLogFile,
      {
        operation: 'updateSession',
        sessionId: session.id
      }
    );

    // Create session logger for detailed database logging with shared log file
    const sessionLogger = this.loggingService.createSessionLogger(session.id, sharedLogFile);
    sessionLogger.logHeader('🗄️ DATABASE OPERATION - UPDATE SESSION');
    
    try {
      const updateData = ChatSessionMapper.toUpdate(session);
      
      sessionLogger.logStep('Preparing SQL UPDATE operation');
      sessionLogger.logMessage(`Table: chat_sessions`);
      sessionLogger.logMessage(`Session ID: ${session.id}`);
      sessionLogger.logRaw(JSON.stringify(updateData, null, 2));
      
      const startTime = Date.now();
      logger.start({ sessionId: session.id });

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .update(updateData)
        .eq('id', session.id)
        .select()
        .single();

      const duration = Date.now() - startTime;
      sessionLogger.logStep(`Database call completed in ${duration}ms`);

      if (error) {
        sessionLogger.logError(new DatabaseError(`Failed to update chat session: ${error.message}`), {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        logger.fail(new DatabaseError(`Failed to update chat session: ${error.message}`), error);
        throw new Error(`Failed to update chat session: ${error.message}`);
      }

      sessionLogger.logRaw(JSON.stringify(data, null, 2));

      const updatedSession = ChatSessionMapper.toDomain(data);
      
      sessionLogger.logRaw(JSON.stringify({
        id: updatedSession.id,
        status: updatedSession.status,
        lastActivityAt: updatedSession.lastActivityAt.toISOString(),
        contextData: updatedSession.contextData || {}
      }, null, 2));

      sessionLogger.logStep('Session updated successfully');
      logger.complete(updatedSession, { duration });
      return updatedSession;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'updateSession',
        sessionId: session.id
      });
      logger.fail(error as Error);
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

  async create(session: ChatSession, sharedLogFile: string): Promise<ChatSession> {
    // Create operation logger for database operations
    const logger = this.loggingService.createOperationLogger(
      'db-create-session',
      sharedLogFile,
      {
        operation: 'createSession',
        sessionId: session.id
      }
    );

    // Create session logger for detailed database logging with shared log file
    const sessionLogger = this.loggingService.createSessionLogger(session.id, sharedLogFile);
    sessionLogger.logHeader('🗄️ DATABASE OPERATION - CREATE SESSION');
    
    try {
      const insertData = ChatSessionMapper.toInsert(session);
      
      sessionLogger.logStep('Preparing SQL INSERT operation');
      sessionLogger.logMessage(`Table: chat_sessions`);
      sessionLogger.logRaw(JSON.stringify(insertData, null, 2));
      
      const startTime = Date.now();
      logger.start({ sessionId: session.id });

      const { data, error } = await this.supabase
        .from('chat_sessions')
        .insert(insertData)
        .select()
        .single();

      const duration = Date.now() - startTime;
      sessionLogger.logStep(`Database call completed in ${duration}ms`);

      if (error) {
        sessionLogger.logError(new DatabaseError(`Failed to create chat session: ${error.message}`), {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        logger.fail(new DatabaseError(`Failed to create chat session: ${error.message}`), error);
        throw new Error(`Failed to create chat session: ${error.message}`);
      }

      sessionLogger.logRaw(JSON.stringify(data, null, 2));

      const createdSession = ChatSessionMapper.toDomain(data);
      
      sessionLogger.logRaw(JSON.stringify({
        id: createdSession.id,
        status: createdSession.status,
        startedAt: createdSession.startedAt.toISOString(),
        lastActivityAt: createdSession.lastActivityAt.toISOString()
      }, null, 2));

      sessionLogger.logStep('Session created successfully');
      logger.complete(createdSession, { duration });
      return createdSession;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'createSession',
        sessionId: session.id
      });
      logger.fail(error as Error);
      throw error;
    }
  }
} 