/**
 * Mock Services for Chatbot Widget Testing
 * 
 * Provides consistent mocks for external dependencies and complex services
 */

import { IAIConversationService, ConversationContext, AIResponse, LeadCaptureRequest } from '../../domain/services/interfaces/IAIConversationService';
import { ITokenCountingService, TokenUsage } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService, IntentClassificationContext } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService, KnowledgeItem, KnowledgeSearchResult, KnowledgeRetrievalContext } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { Lead } from '../../domain/entities/Lead';
import { IntentResult } from '../../domain/value-objects/message-processing/IntentResult';

// AI Service Mocks
export class MockOpenAIProvider implements IAIConversationService {
  private responses: Map<string, string> = new Map();
  private shouldFail = false;
  private callCount = 0;

  setResponse(input: string, response: string): void {
    this.responses.set(input, response);
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  getCallCount(): number {
    return this.callCount;
  }

  async generateResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    this.callCount++;

    if (this.shouldFail) {
      throw new Error('Mock AI service failure');
    }

    const response = this.responses.get(userMessage) || 'Mock AI response to: ' + userMessage;

    return {
      content: response,
      confidence: 0.95,
      intentDetected: 'sales_inquiry',
      sentiment: 'neutral',
      processingTimeMs: 100,
      metadata: {
        model: 'gpt-4o-mini',
        promptTokens: 150,
        completionTokens: 50,
        totalTokens: 200
      }
    };
  }

  buildSystemPrompt(chatbotConfig: ChatbotConfig, session: ChatSession, messageHistory: ChatMessage[]): string {
    return 'Mock system prompt';
  }

  async analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'> {
    return 'neutral';
  }

  async analyzeUrgency(userMessage: string): Promise<'low' | 'medium' | 'high'> {
    return 'medium';
  }

  async analyzeEngagement(userMessage: string, conversationHistory?: ChatMessage[]): Promise<'low' | 'medium' | 'high'> {
    return 'medium';
  }

  async extractLeadInformation(
    messageHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<Partial<LeadCaptureRequest>> {
    return {
      sessionId: context.session.id,
      contactInfo: {
        name: undefined,
        email: undefined,
        phone: undefined,
        company: undefined
      },
      qualificationData: {}
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.callCount++;
    // Return deterministic embedding for testing
    return new Array(1536).fill(0).map((_, i) => Math.sin(i * 0.1) * text.length);
  }
}

export class MockTokenCountingService implements ITokenCountingService {
  private shouldFail = false;
  private tokenResponses: Map<string, TokenUsage> = new Map();

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setTokenResponse(text: string, usage: TokenUsage): void {
    this.tokenResponses.set(text, usage);
  }

  async countMessageTokens(message: ChatMessage): Promise<number> {
    if (this.shouldFail) throw new Error('Mock token counting failure');
    
    // Simple mock: ~4 characters per token
    return Math.ceil((message.content || '').length / 4);
  }

  async countMessagesTokens(messages: ChatMessage[]): Promise<number> {
    let total = 0;
    for (const msg of messages) {
      total += await this.countMessageTokens(msg);
    }
    return total;
  }

  async countTextTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  estimateTextTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async getTokenUsage(messages: ChatMessage[]): Promise<TokenUsage> {
    if (this.shouldFail) throw new Error('Mock token counting failure');
    
    // Check if we have a specific response set for this context
    const firstMessage = messages[0]?.content || '';
    const customResponse = this.tokenResponses.get(firstMessage);
    if (customResponse) return customResponse;
    
    const totalTokens = await this.countMessagesTokens(messages);
    return {
      messageTokens: totalTokens,
      totalTokens,
      estimatedCost: totalTokens * 0.0001
    };
  }
}

export class MockIntentClassificationService implements IIntentClassificationService {
  private intents: Map<string, IntentResult> = new Map();

  setIntent(text: string, intent: IntentResult): void {
    this.intents.set(text, intent);
  }

  setIntentResponse(intent: string, confidence: number, entities: Record<string, any>): void {
    const result = IntentResult.create(
      'unknown' as any, // Cast to any to handle test flexibility
      confidence,
      entities,
      `Mock classification for ${intent}`,
      {
        model: 'mock-classifier',
        processingTimeMs: 50,
        alternativeIntents: []
      }
    );
    this.intents.set('mock_current_message', result);
  }

  async classifyIntent(
    message: string, 
    context: IntentClassificationContext
  ): Promise<IntentResult> {
    const customIntent = this.intents.get(message) || this.intents.get('mock_current_message');
    if (customIntent) return customIntent;

    // Default mock classification
    if (message.toLowerCase().includes('pricing') || message.toLowerCase().includes('cost')) {
      return IntentResult.create(
        'faq_pricing',
        0.95,
        { budget: 'pricing_inquiry' },
        'Detected pricing inquiry based on keywords',
        {
          model: 'mock-classifier',
          processingTimeMs: 50,
          alternativeIntents: []
        }
      );
    }

    if (message.toLowerCase().includes('help') || message.toLowerCase().includes('support')) {
      return IntentResult.create(
        'support_request',
        0.90,
        { urgency: 'medium' },
        'Detected support request based on keywords',
        {
          model: 'mock-classifier',
          processingTimeMs: 50,
          alternativeIntents: []
        }
      );
    }

    return IntentResult.create(
      'unknown',
      0.75,
      {},
      'No specific pattern matched',
      {
        model: 'mock-classifier',
        processingTimeMs: 50,
        alternativeIntents: []
      }
    );
  }
}

export class MockKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private knowledgeItems: KnowledgeItem[] = [];
  private shouldFail = false;
  private vectorCacheReady = false;
  private embeddingCacheStats = { size: 0 };
  private warmCacheFunction: ((logFile: string) => Promise<void>) | null = null;

  setKnowledgeItems(items: KnowledgeItem[]): void {
    this.knowledgeItems = items;
  }

  setKnowledgeResponse(items: KnowledgeItem[]): void {
    this.knowledgeItems = items;
  }

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  // Cache warming methods for testing
  isVectorCacheReady(): boolean {
    return this.vectorCacheReady;
  }

  setVectorCacheReady(ready: boolean): void {
    this.vectorCacheReady = ready;
  }

  getEmbeddingService(): any {
    return {
      getCacheStats: () => this.embeddingCacheStats
    };
  }

  setEmbeddingCacheSize(size: number): void {
    this.embeddingCacheStats.size = size;
  }

  async warmCache(logFile: string): Promise<void> {
    if (this.warmCacheFunction) {
      return this.warmCacheFunction(logFile);
    }
    // Default mock behavior - just return successfully
  }

  setWarmCacheFunction(fn: (logFile: string) => Promise<void>): void {
    this.warmCacheFunction = fn;
  }

  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    if (this.shouldFail) throw new Error('Mock knowledge service failure');
    
    const startTime = Date.now();
    const limit = context.maxResults || 5;
    const minScore = context.minRelevanceScore || 0.7;
    
    // Mock search logic
    let relevantItems = this.knowledgeItems;
    
    if (context.userQuery.toLowerCase().includes('pricing')) {
      relevantItems = [
        {
          id: 'pricing-1',
          title: 'Pricing Plans',
          content: 'We offer three plans: Starter ($29/mo), Professional ($99/mo), and Enterprise (custom pricing).',
          category: 'pricing' as const,
          tags: ['pricing', 'plans'],
          relevanceScore: 0.95,
          source: 'knowledge_base',
          lastUpdated: new Date()
        }
      ];
    }
    
    const filteredItems = relevantItems
      .filter(item => item.relevanceScore >= minScore)
      .slice(0, limit);
    
    return {
      items: filteredItems,
      totalFound: filteredItems.length,
      searchQuery: context.userQuery,
      searchTimeMs: Date.now() - startTime
    };
  }

  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    return this.knowledgeItems
      .filter(item => item.category === category)
      .slice(0, limit);
  }

  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    return this.knowledgeItems
      .filter(item => item.category === 'faq')
      .slice(0, limit);
  }

  async findSimilarContent(
    query: string,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    return this.knowledgeItems
      .filter(item => !excludeIds.includes(item.id))
      .filter(item => item.content.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit);
  }

  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    return this.knowledgeItems
      .filter(item => tags.some(tag => item.tags.includes(tag)))
      .slice(0, limit);
  }

  async upsertKnowledgeItem(
    item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>
  ): Promise<KnowledgeItem> {
    const newItem: KnowledgeItem = {
      ...item,
      id: `mock-${Date.now()}`,
      lastUpdated: new Date()
    };
    
    this.knowledgeItems.push(newItem);
    return newItem;
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}

// Logging Mocks
export class MockSessionLogger implements ISessionLogger {
  public logs: Array<{ type: string; message: string; data?: any }> = [];

  logHeader(title: string): void {
    this.logs.push({ type: 'header', message: title });
  }

  logSeparator(): void {
    this.logs.push({ type: 'separator', message: '===' });
  }

  logRaw(message: string): void {
    this.logs.push({ type: 'raw', message });
  }

  logMessage(message: string, data?: any): void {
    this.logs.push({ type: 'message', message, data });
  }

  logStep(step: string, data?: any): void {
    this.logs.push({ type: 'step', message: step, data });
  }

  logError(error: Error, context?: any): void {
    this.logs.push({ type: 'error', message: error.message, data: context });
  }

  logMetrics(operation: string, metrics: any): void {
    this.logs.push({ type: 'metrics', message: operation, data: metrics });
  }

  logApiCall(endpoint: string, request: any, response: any, duration: number): void {
    this.logs.push({ type: 'api_call', message: endpoint, data: { request, response, duration } });
  }

  logCache(operation: string, key: string, details?: any): void {
    this.logs.push({ type: 'cache', message: `${operation}:${key}`, data: details });
  }

  logDomainEvent(eventName: string, eventData: any): void {
    this.logs.push({ type: 'domain_event', message: eventName, data: eventData });
  }

  async flush(): Promise<void> {
    // No-op for mock
  }

  getCorrelationId(): string {
    return 'mock-correlation-id';
  }

  getLogs(): Array<{ type: string; message: string; data?: any }> {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export class MockLoggingService implements IChatbotLoggingService {
  private sessionLoggers: Map<string, MockSessionLogger> = new Map();

  createSessionLogger(sessionId: string, sharedLogFile: string, context?: any): ISessionLogger {
    const logger = new MockSessionLogger();
    this.sessionLoggers.set(sessionId, logger);
    return logger;
  }

  createOperationLogger(operation: string, sharedLogFile: string, context?: any): any {
    return new MockSessionLogger();
  }

  isLoggingEnabled(): boolean {
    return true;
  }

  getLoggingConfig(): any {
    return { enabled: true, level: 'info', outputFormat: 'text' };
  }

  getSessionLogger(sessionId: string): MockSessionLogger | undefined {
    return this.sessionLoggers.get(sessionId);
  }
}

// Repository Mocks
export class MockChatbotConfigRepository implements IChatbotConfigRepository {
  private configs: Map<string, ChatbotConfig> = new Map();
  private shouldFail = false;

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  async findById(id: string): Promise<ChatbotConfig | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return this.configs.get(id) || null;
  }

  async findByOrganizationId(organizationId: string): Promise<ChatbotConfig | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.configs.values())
      .find(config => config.organizationId === organizationId) || null;
  }

  async findActiveByOrganizationId(organizationId: string): Promise<ChatbotConfig[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.configs.values())
      .filter(config => config.organizationId === organizationId && config.isActive);
  }

  async save(config: ChatbotConfig): Promise<ChatbotConfig> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.configs.set(config.id, config);
    return config;
  }

  async update(config: ChatbotConfig): Promise<ChatbotConfig> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.configs.set(config.id, config);
    return config;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.configs.delete(id);
  }

  async existsByOrganizationId(organizationId: string): Promise<boolean> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.configs.values())
      .some(config => config.organizationId === organizationId);
  }

  async findByNamePattern(pattern: string, organizationId?: string): Promise<ChatbotConfig[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.configs.values())
      .filter(config => {
        const nameMatch = config.name.toLowerCase().includes(pattern.toLowerCase());
        const orgMatch = !organizationId || config.organizationId === organizationId;
        return nameMatch && orgMatch;
      });
  }

  async getStatistics(organizationId: string): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    totalFaqs: number;
    avgLeadQuestions: number;
    lastUpdated: Date | null;
  }> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const orgConfigs = Array.from(this.configs.values())
      .filter(config => config.organizationId === organizationId);
    
    return {
      totalConfigs: orgConfigs.length,
      activeConfigs: orgConfigs.filter(c => c.isActive).length,
      totalFaqs: orgConfigs.reduce((sum, c) => sum + (c.knowledgeBase.faqs?.length || 0), 0),
      avgLeadQuestions: 3, // Mock average
      lastUpdated: orgConfigs.length > 0 ? new Date() : null
    };
  }

  // Helper methods for testing
  addConfig(config: ChatbotConfig): void {
    this.configs.set(config.id, config);
  }

  clear(): void {
    this.configs.clear();
  }

  getAll(): ChatbotConfig[] {
    return Array.from(this.configs.values());
  }
}

export class MockChatSessionRepository implements IChatSessionRepository {
  private sessions: Map<string, ChatSession> = new Map();
  private shouldFail = false;

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  async findById(id: string): Promise<ChatSession | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return this.sessions.get(id) || null;
  }

  async findBySessionToken(sessionToken: string): Promise<ChatSession | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.sessions.values())
      .find(session => session.sessionToken === sessionToken) || null;
  }

  async findActiveByChatbotConfigId(chatbotConfigId: string): Promise<ChatSession[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.sessions.values())
      .filter(session => session.chatbotConfigId === chatbotConfigId && session.status === 'active');
  }

  async findByVisitorId(visitorId: string): Promise<ChatSession[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.sessions.values())
      .filter(session => session.visitorId === visitorId);
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
    if (this.shouldFail) throw new Error('Mock repository failure');
    let filteredSessions = Array.from(this.sessions.values());
    
    // Apply filters (simplified for mock)
    if (filters?.status) {
      filteredSessions = filteredSessions.filter(s => s.status === filters.status);
    }
    
    const total = filteredSessions.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const sessions = filteredSessions.slice(startIndex, startIndex + limit);
    
    return { sessions, total, page, limit, totalPages };
  }

  async save(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.sessions.set(session.id, session);
    return session;
  }

  async update(session: ChatSession, sharedLogFile?: string): Promise<ChatSession> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.sessions.set(session.id, session);
    return session;
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.sessions.delete(id);
  }

  async findExpiredSessions(timeoutMinutes: number): Promise<ChatSession[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    return Array.from(this.sessions.values())
      .filter(session => session.startedAt < cutoffTime && session.status === 'active');
  }

  async markExpiredAsAbandoned(timeoutMinutes: number): Promise<number> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const expiredSessions = await this.findExpiredSessions(timeoutMinutes);
    return expiredSessions.length; // Mock implementation
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
    if (this.shouldFail) throw new Error('Mock repository failure');
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => s.status === 'active').length,
      completedSessions: Array.from(this.sessions.values()).filter(s => s.status === 'completed').length,
      abandonedSessions: Array.from(this.sessions.values()).filter(s => s.status === 'abandoned').length,
      avgSessionDuration: 300, // 5 minutes mock
      avgEngagementScore: 7.5,
      conversionRate: 0.15,
      topTopics: [{ topic: 'pricing', count: 5 }],
      hourlyDistribution: [{ hour: 14, count: 3 }]
    };
  }

  async findRecentByVisitorId(visitorId: string, limit: number): Promise<ChatSession[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.sessions.values())
      .filter(session => session.visitorId === visitorId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async countActiveByChatbotConfigId(chatbotConfigId: string): Promise<number> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.sessions.values())
      .filter(session => session.chatbotConfigId === chatbotConfigId && session.status === 'active').length;
  }

  // Helper methods
  addSession(session: ChatSession): void {
    this.sessions.set(session.id, session);
  }

  getAll(): ChatSession[] {
    return Array.from(this.sessions.values());
  }

  clear(): void {
    this.sessions.clear();
  }
}

export class MockChatMessageRepository implements IChatMessageRepository {
  private messages: Map<string, ChatMessage> = new Map();
  private shouldFail = false;

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  async findById(id: string): Promise<ChatMessage | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return this.messages.get(id) || null;
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async findVisibleBySessionId(sessionId: string): Promise<ChatMessage[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId && msg.isVisible)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
    if (this.shouldFail) throw new Error('Mock repository failure');
    const sessionMessages = Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    const total = sessionMessages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const messages = sessionMessages.slice(startIndex, startIndex + limit);
    
    return { messages, total, page, limit, totalPages };
  }

  async save(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.messages.set(message.id, message);
    return message;
  }

  async update(message: ChatMessage, sharedLogFile: string): Promise<ChatMessage> {
    return this.save(message, sharedLogFile);
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.messages.delete(id);
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    Array.from(this.messages.entries())
      .filter(([_, msg]) => msg.sessionId === sessionId)
      .forEach(([id, _]) => this.messages.delete(id));
  }

  async findRecentByOrganizationId(organizationId: string, limit: number): Promise<ChatMessage[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.messages.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
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
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.messages.values())
      .filter(msg => {
        const contentMatch = msg.content.toLowerCase().includes(searchTerm.toLowerCase());
        const sessionMatch = !filters?.sessionId || msg.sessionId === filters.sessionId;
        const typeMatch = !filters?.messageType || msg.messageType === filters.messageType;
        return contentMatch && sessionMatch && typeMatch;
      });
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
    if (this.shouldFail) throw new Error('Mock repository failure');
    const messages = Array.from(this.messages.values());
    
    return {
      totalMessages: messages.length,
      userMessages: messages.filter(m => m.messageType === 'user').length,
      botMessages: messages.filter(m => m.messageType === 'bot').length,
      systemMessages: messages.filter(m => m.messageType === 'system').length,
      avgResponseTime: 1500, // 1.5 seconds mock
      avgTokensPerMessage: 25,
      totalTokenCost: 0.05,
      sentimentDistribution: {
        positive: Math.floor(messages.length * 0.6),
        neutral: Math.floor(messages.length * 0.3),
        negative: Math.floor(messages.length * 0.1)
      },
      topIntents: [{ intent: 'sales_inquiry', count: 5 }],
      errorRate: 0.02
    };
  }

  async findLastBySessionId(sessionId: string): Promise<ChatMessage | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const sessionMessages = Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return sessionMessages[0] || null;
  }

  async countByTypeAndSessionId(sessionId: string): Promise<{
    user: number;
    bot: number;
    system: number;
    lead_capture: number;
    qualification: number;
  }> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const sessionMessages = Array.from(this.messages.values())
      .filter(msg => msg.sessionId === sessionId);
    
    return {
      user: sessionMessages.filter(m => m.messageType === 'user').length,
      bot: sessionMessages.filter(m => m.messageType === 'bot').length,
      system: sessionMessages.filter(m => m.messageType === 'system').length,
      lead_capture: sessionMessages.filter(m => m.messageType === 'lead_capture').length,
      qualification: sessionMessages.filter(m => m.messageType === 'qualification').length
    };
  }

  async findMessagesWithErrors(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<ChatMessage[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.messages.values())
      .filter(msg => {
        const dateMatch = msg.timestamp >= dateFrom && msg.timestamp <= dateTo;
        const hasError = false; // Mock: no errors
        return dateMatch && hasError;
      });
  }

  async getResponseTimeMetrics(
    organizationId: string,
    dateFrom: Date,
    dateTo: Date,
    groupBy: 'hour' | 'day' | 'week'
  ): Promise<Array<{ period: string; avgResponseTime: number; messageCount: number }>> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return [
      { period: '2024-01-01', avgResponseTime: 1200, messageCount: 45 },
      { period: '2024-01-02', avgResponseTime: 1350, messageCount: 38 }
    ];
  }

  // Helper methods
  addMessage(message: ChatMessage): void {
    this.messages.set(message.id, message);
  }

  getAll(): ChatMessage[] {
    return Array.from(this.messages.values());
  }

  clear(): void {
    this.messages.clear();
  }
}

export class MockLeadRepository implements ILeadRepository {
  private leads: Map<string, Lead> = new Map();
  private shouldFail = false;

  setFailure(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  async findById(id: string): Promise<Lead | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return this.leads.get(id) || null;
  }

  async findBySessionId(sessionId: string): Promise<Lead | null> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .find(lead => lead.sessionId === sessionId) || null;
  }

  async findByOrganizationId(organizationId: string): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId);
  }

  async findByOrganizationIdWithPagination(
    organizationId: string,
    page: number,
    limit: number,
    filters?: any
  ): Promise<{
    leads: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const orgLeads = Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId);
    
    const total = orgLeads.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const leads = orgLeads.slice(startIndex, startIndex + limit);
    
    return { leads, total, page, limit, totalPages };
  }

  async findByEmail(email: string, organizationId: string): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId && lead.contactInfo.email === email);
  }

  async findByAssignedTo(userId: string, organizationId: string): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId);
  }

  async save(lead: Lead): Promise<Lead> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.leads.set(lead.id, lead);
    return lead;
  }

  async create(lead: Lead): Promise<Lead> {
    return this.save(lead);
  }

  async update(lead: Lead): Promise<Lead> {
    return this.save(lead);
  }

  async delete(id: string): Promise<void> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    this.leads.delete(id);
  }

  async getAnalytics(organizationId: string, dateFrom: Date, dateTo: Date): Promise<any> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return {
      totalLeads: this.leads.size,
      qualifiedLeads: Math.floor(this.leads.size * 0.6),
      convertedLeads: Math.floor(this.leads.size * 0.2)
    };
  }

  async findForExport(organizationId: string, filters?: any): Promise<Lead[]> {
    return this.findByOrganizationId(organizationId);
  }

  async findRequiringFollowUp(organizationId: string, daysSinceLastContact: number): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return [];
  }

  async findTopByScore(organizationId: string, limit: number): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId)
      .slice(0, limit);
  }

  async countByStatus(organizationId: string): Promise<{
    total: number;
    qualified: number;
    converted: number;
    new: number;
  }> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    const orgLeads = Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId);
    
    return {
      total: orgLeads.length,
      qualified: Math.floor(orgLeads.length * 0.6),
      converted: Math.floor(orgLeads.length * 0.2),
      new: Math.floor(orgLeads.length * 0.2)
    };
  }

  async findRecent(organizationId: string, limit: number): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => lead.organizationId === organizationId)
      .slice(0, limit);
  }

  async searchByQuery(organizationId: string, query: string, limit: number): Promise<Lead[]> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return Array.from(this.leads.values())
      .filter(lead => {
        const nameMatch = lead.contactInfo.name?.toLowerCase().includes(query.toLowerCase());
        const emailMatch = lead.contactInfo.email?.toLowerCase().includes(query.toLowerCase());
        return lead.organizationId === organizationId && (nameMatch || emailMatch);
      })
      .slice(0, limit);
  }

  async getFunnelMetrics(organizationId: string, dateFrom: Date, dateTo: Date): Promise<{
    sessions: number;
    leadsGenerated: number;
    qualified: number;
    contacted: number;
    converted: number;
    conversionRates: {
      sessionToLead: number;
      leadToQualified: number;
      qualifiedToContacted: number;
      contactedToConverted: number;
    };
  }> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return {
      sessions: 100,
      leadsGenerated: 20,
      qualified: 12,
      contacted: 8,
      converted: 4,
      conversionRates: {
        sessionToLead: 0.2,
        leadToQualified: 0.6,
        qualifiedToContacted: 0.67,
        contactedToConverted: 0.5
      }
    };
  }

  async findDuplicates(organizationId: string): Promise<Array<{
    criteria: 'email' | 'phone';
    value: string;
    leads: Lead[];
  }>> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return [];
  }

  async updateBulk(leadIds: string[], updates: {
    followUpStatus?: any;
    assignedTo?: string;
    tags?: { add?: string[]; remove?: string[] };
  }): Promise<number> {
    if (this.shouldFail) throw new Error('Mock repository failure');
    return leadIds.length;
  }

  // Helper methods
  addLead(lead: Lead): void {
    this.leads.set(lead.id, lead);
  }

  getAll(): Lead[] {
    return Array.from(this.leads.values());
  }

  clear(): void {
    this.leads.clear();
  }
}

// Debug Information Service Mock
export class MockDebugInformationService implements IDebugInformationService {
  private sessions: Map<string, any> = new Map();
  private debugMode = false;

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  captureApiCall(
    callType: 'first' | 'second',
    requestData: any,
    responseData: any,
    processingTime: number
  ): any {
    return {
      requestData: {
        endpoint: '/mock/api',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: requestData,
        payloadSize: '1KB',
        messageCount: 1,
        conversationHistoryLength: 5,
        userMessage: 'Mock user message'
      },
      responseData: {
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        response: responseData,
        responseSize: '500B'
      }
    };
  }

  getProcessingDebugInfo(sessionId: string): any | null {
    return this.sessions.get(sessionId) || null;
  }

  clearDebugInfo(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  initializeSession(sessionId: string, userMessageId: string, botMessageId: string): void {
    this.sessions.set(sessionId, {
      sessionId,
      userMessageId,
      botMessageId,
      totalProcessingTime: 0,
      firstApiCall: null,
      secondApiCall: null
    });
  }

  addApiCallToSession(sessionId: string, callType: 'first' | 'second', apiCallInfo: any): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session[`${callType}ApiCall`] = apiCallInfo;
    }
  }

  updateProcessingTime(sessionId: string, totalTime: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.totalProcessingTime = totalTime;
    }
  }

  // Additional helper methods for testing
  isDebugEnabled(): boolean {
    return this.debugMode;
  }

  getAllSessions(): Map<string, any> {
    return new Map(this.sessions);
  }

  clearAllSessions(): void {
    this.sessions.clear();
  }
}

// Helper function to create a complete mock environment
export function createMockEnvironment() {
  return {
    aiService: new MockOpenAIProvider(),
    tokenService: new MockTokenCountingService(),
    intentService: new MockIntentClassificationService(),
    knowledgeService: new MockKnowledgeRetrievalService(),
    loggingService: new MockLoggingService(),
    configRepository: new MockChatbotConfigRepository(),
    sessionRepository: new MockChatSessionRepository(),
    messageRepository: new MockChatMessageRepository(),
    leadRepository: new MockLeadRepository()
  };
}