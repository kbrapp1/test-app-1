import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '../../../../supabase/server';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatMessageCrudService } from './services/ChatMessageCrudService';
import { ChatMessageAnalyticsService } from './services/ChatMessageAnalyticsService';
import { ChatMessageQueryService } from './services/ChatMessageQueryService';
import { ChatMessageMapper } from './mappers/ChatMessageMapper';
import { DatabaseError } from '../../../../errors/base';
import { IChatbotLoggingService, IOperationLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';

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
  private readonly loggingService: IChatbotLoggingService;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient ?? createClient();
    this.crudService = new ChatMessageCrudService(this.supabase);
    this.analyticsService = new ChatMessageAnalyticsService(this.supabase);
    this.queryService = new ChatMessageQueryService(this.supabase);
    
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
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
  async save(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    // Check if message already exists
    const existingMessage = await this.findById(message.id);
    
    if (existingMessage) {
      // Message exists - update it
      return this.update(message, sharedLogFile);
    } else {
      // Message doesn't exist - create it
      return this.create(message, sharedLogFile);
    }
  }

  async update(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    // Create operation logger for database operations
    const logger = this.loggingService.createOperationLogger(
      'db-update-message',
      sharedLogFile,
      {
        operation: 'updateMessage',
        messageId: message.id
      }
    );

    // Create session logger for detailed database logging with shared log file
    const sessionLogger = this.loggingService.createSessionLogger(message.sessionId, sharedLogFile);
    sessionLogger.logHeader('💬 DATABASE OPERATION - UPDATE MESSAGE');
    
    try {
      logger.start({ messageId: message.id, sessionId: message.sessionId });
      const result = await this.crudService.update(message);
      logger.complete(result);
      sessionLogger.logStep('Message updated successfully');
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'updateMessage',
        messageId: message.id,
        sessionId: message.sessionId
      });
      logger.fail(error as Error);
      throw error;
    }
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

  async create(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    // Create operation logger for database operations
    const logger = this.loggingService.createOperationLogger(
      'db-create-message',
      sharedLogFile,
      {
        operation: 'createMessage',
        messageId: message.id
      }
    );

    // Create session logger for detailed database logging with shared log file
    const sessionLogger = this.loggingService.createSessionLogger(message.sessionId, sharedLogFile);
    sessionLogger.logHeader('💬 DATABASE OPERATION - CREATE MESSAGE');
    
    try {
      const insertData = ChatMessageMapper.toInsert(message);
      
      sessionLogger.logStep('Preparing SQL INSERT operation');
      sessionLogger.logMessage(`Table: chat_messages`);
      sessionLogger.logRaw(JSON.stringify(insertData, null, 2));
      
      const startTime = Date.now();
      logger.start({ messageId: message.id, sessionId: message.sessionId });

      const { data, error } = await this.supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      const duration = Date.now() - startTime;
      sessionLogger.logStep(`Database call completed in ${duration}ms`);

      if (error) {
        sessionLogger.logError(new DatabaseError(`Failed to create chat message: ${error.message}`), {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        logger.fail(new DatabaseError(`Failed to create chat message: ${error.message}`), error);
        throw new DatabaseError(`Failed to create chat message: ${error.message}`);
      }

      sessionLogger.logRaw(JSON.stringify(data, null, 2));

      const createdMessage = ChatMessageMapper.toDomain(data);
      
      sessionLogger.logRaw(JSON.stringify({
        id: createdMessage.id,
        messageType: createdMessage.messageType,
        content: createdMessage.content.substring(0, 100) + (createdMessage.content.length > 100 ? '...' : ''),
        sessionId: createdMessage.sessionId,
        timestamp: createdMessage.timestamp.toISOString()
      }, null, 2));

      sessionLogger.logStep('Message created successfully');
      logger.complete(createdMessage, { duration });
      return createdMessage;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'createMessage',
        messageId: message.id,
        sessionId: message.sessionId
      });
      logger.fail(error as Error);
      throw error;
    }
  }
} 