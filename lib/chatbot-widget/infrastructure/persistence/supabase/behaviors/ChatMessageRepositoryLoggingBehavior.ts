import { IChatMessageRepository } from '../../../../domain/repositories/IChatMessageRepository';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { IChatbotLoggingService } from '../../../../domain/services/interfaces/IChatbotLoggingService';

/**
 * DDD Repository Behavior Pattern: Logging Decorator
 * 
 * Extracts logging concerns from the repository implementation.
 * Follows the Decorator pattern for cross-cutting concerns.
 * Preserves all security patterns and organizational context.
 */
export class ChatMessageRepositoryLoggingBehavior implements IChatMessageRepository {
  constructor(
    private readonly innerRepository: IChatMessageRepository,
    private readonly loggingService: IChatbotLoggingService
  ) {}

  async save(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    const sessionLogger = this.loggingService.createSessionLogger(message.sessionId, sharedLogFile);
    sessionLogger.logMessage('💬 REPOSITORY OPERATION - SAVE MESSAGE');
    
    try {
      const startTime = Date.now();
      const result = await this.innerRepository.save(message, sharedLogFile);
      const duration = Date.now() - startTime;
      
      sessionLogger.logStep('Message saved successfully');
      sessionLogger.logMetrics('saveMessage', { duration });
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'saveMessage',
        messageId: message.id,
        sessionId: message.sessionId
      });
      throw error;
    }
  }

  async update(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    const sessionLogger = this.loggingService.createSessionLogger(message.sessionId, sharedLogFile);
    sessionLogger.logMessage('💬 REPOSITORY OPERATION - UPDATE MESSAGE');
    
    try {
      const startTime = Date.now();
      const result = await this.innerRepository.update(message, sharedLogFile);
      const duration = Date.now() - startTime;
      
      sessionLogger.logStep('Message updated successfully');
      sessionLogger.logMetrics('updateMessage', { duration });
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'updateMessage',
        messageId: message.id,
        sessionId: message.sessionId
      });
      throw error;
    }
  }

  async create(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    const sessionLogger = this.loggingService.createSessionLogger(message.sessionId, sharedLogFile);
    sessionLogger.logMessage('💬 REPOSITORY OPERATION - CREATE MESSAGE');
    
    try {
      const startTime = Date.now();
      const result = await this.innerRepository.create(message, sharedLogFile);
      const duration = Date.now() - startTime;
      
      sessionLogger.logStep('Message created successfully');
      sessionLogger.logMetrics('createMessage', { duration });
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, {
        operation: 'createMessage',
        messageId: message.id,
        sessionId: message.sessionId
      });
      throw error;
    }
  }

  // Pass-through methods (no logging needed for read operations)
  async findById(id: string): Promise<ChatMessage | null> {
    return this.innerRepository.findById(id);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.innerRepository.findBySessionId(sessionId);
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.innerRepository.findVisibleBySessionId(sessionId);
  }

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
    return this.innerRepository.findBySessionIdWithPagination(sessionId, page, limit);
  }

  async delete(id: string): Promise<void> {
    return this.innerRepository.delete(id);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    return this.innerRepository.deleteBySessionId(sessionId);
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    return this.innerRepository.findRecentByOrganizationId(organizationId, limit);
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
    return this.innerRepository.searchByContent(organizationId, searchTerm, filters);
  }

  async getMessagesForOrganization(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.innerRepository.getMessagesForOrganization(organizationId, dateFrom, dateTo);
  }

  async getMessagesByTypeWithDateRange(
    organizationId: string,
    messageType: 'user' | 'bot' | 'system',
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.innerRepository.getMessagesByTypeWithDateRange(organizationId, messageType, dateFrom, dateTo);
  }

  async findByIntentDetected(
    organizationId: string,
    intent: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findByIntentDetected(organizationId, intent, dateFrom, dateTo, limit);
  }

  async findBySentiment(
    organizationId: string,
    sentiment: 'positive' | 'neutral' | 'negative',
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findBySentiment(organizationId, sentiment, dateFrom, dateTo, limit);
  }

  async findMessagesByModel(
    organizationId: string,
    model: string,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findMessagesByModel(organizationId, model, dateFrom, dateTo, limit);
  }

  async findHighCostMessages(
    organizationId: string,
    minCostCents: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findHighCostMessages(organizationId, minCostCents, dateFrom, dateTo, limit);
  }

  async findSlowResponseMessages(
    organizationId: string,
    minResponseTimeMs: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findSlowResponseMessages(organizationId, minResponseTimeMs, dateFrom, dateTo, limit);
  }

  async findMessagesByTokenUsage(
    organizationId: string,
    minTokens: number,
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findMessagesByTokenUsage(organizationId, minTokens, dateFrom, dateTo, limit);
  }

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
    return this.innerRepository.getAnalytics(organizationId, dateFrom, dateTo);
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    return this.innerRepository.findLastBySessionId(sessionId);
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    return this.innerRepository.countByTypeAndSessionId(sessionId);
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    return this.innerRepository.findMessagesWithErrors(organizationId, dateFrom, dateTo);
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    return this.innerRepository.getResponseTimeMetrics(organizationId, dateFrom, dateTo, groupBy);
  }
}