/**
 * Chatbot Logging Service Interface
 * 
 * AI INSTRUCTIONS:
 * - Domain layer interface for centralized logging across chatbot widget
 * - Single responsibility: Define logging contracts for domain services
 * - Follow @golden-rule patterns: clean interfaces, no implementation details
 * - Support structured logging with context and correlation
 * - Enable performance monitoring and error tracking
 */

export interface LogContext {
  sessionId?: string;
  userId?: string;
  organizationId?: string;
  operation?: string;
  correlationId?: string;
  messageId?: string;
  metadata?: Record<string, any>;
}

export interface LogMetrics {
  duration?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  apiCalls?: number;
  cacheHits?: number;
  cacheMisses?: number;
  customMetrics?: Record<string, number>;
}

export interface ISessionLogger {
  /**
   * Log a header with separator lines (for main section headers)
   */
  logHeader(title: string): void;

  /**
   * Log a separator line (================================================================================)
   */
  logSeparator(): void;

  /**
   * Log a raw message exactly as-is with no timestamp or emoji prefixes
   */
  logRaw(message: string): void;

  /**
   * Log a direct message without any prefixes (for clean log entries)
   */
  logMessage(message: string, data?: any, level?: LogLevel): void;

  /**
   * Log a processing step with structured data
   */
  logStep(step: string, data?: any, level?: LogLevel): void;

  /**
   * Log an error with context and stack trace
   */
  logError(error: Error, context?: any): void;

  /**
   * Log performance metrics and timing data
   */
  logMetrics(operation: string, metrics: LogMetrics): void;

  /**
   * Log API call details with request/response data
   */
  logApiCall(endpoint: string, request: any, response: any, duration: number): void;

  /**
   * Log cache operations (hits, misses, warming)
   */
  logCache(operation: 'hit' | 'miss' | 'warm' | 'evict', key: string, details?: any): void;

  /**
   * Log business domain events
   */
  logDomainEvent(eventName: string, eventData: any): void;

  /**
   * Flush all pending log entries to storage
   */
  flush(): Promise<void>;

  /**
   * Get correlation ID for this logging session
   */
  getCorrelationId(): string;
}

export interface IOperationLogger {
  /**
   * Log operation start with context
   */
  start(context?: LogContext): void;

  /**
   * Log operation completion with results
   */
  complete(result?: any, metrics?: LogMetrics): void;

  /**
   * Log operation failure with error details
   */
  fail(error: Error, context?: any): void;

  /**
   * Add contextual information to operation
   */
  addContext(key: string, value: any): void;

  /**
   * Get operation duration in milliseconds
   */
  getDuration(): number;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface IChatbotLoggingService {
  /**
   * Create a session-scoped logger for conversation processing
   * 
   * AI INSTRUCTIONS:
   * - Create logger tied to specific chat session
   * - Support shared log file for request correlation
   * - Enable structured logging with session context
   */
  createSessionLogger(
    sessionId: string, 
    sharedLogFile: string,
    context?: LogContext
  ): ISessionLogger;

  /**
   * Create an operation-scoped logger for specific business operations
   * 
   * AI INSTRUCTIONS:
   * - Create logger for discrete operations (API calls, cache operations, etc.)
   * - Automatic timing and performance tracking
   * - Support nested operation contexts
   */
  createOperationLogger(
    operation: string, 
    sharedLogFile: string,
    context?: LogContext
  ): IOperationLogger;

  /**
   * Check if logging is enabled for current environment
   */
  isLoggingEnabled(): boolean;

  /**
   * Get current logging configuration
   * 
   * AI INSTRUCTIONS:
   * - Return configuration for immediate synchronous logging
   * - No buffering needed for chronological ordering
   * - Follow @golden-rule: single responsibility
   */
  getLoggingConfig(): {
    enabled: boolean;
    level: LogLevel;
    outputFormat: 'json' | 'text';
  };
} 