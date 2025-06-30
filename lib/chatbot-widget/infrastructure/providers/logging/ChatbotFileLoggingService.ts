/**
 * Chatbot File Logging Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure implementation of IChatbotLoggingService
 * - Single responsibility: Handle file-based logging with optimization
 * - Follow @golden-rule patterns: under 250 lines, clean separation
 * - Implement batched async I/O for performance
 * - Handle environment configuration and graceful fallbacks
 * - Support structured logging with correlation IDs
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { 
  IChatbotLoggingService, 
  ISessionLogger, 
  IOperationLogger,
  LogContext, 
  LogLevel, 
  LogMetrics 
} from '../../../domain/services/interfaces/IChatbotLoggingService';

export class ChatbotFileLoggingService implements IChatbotLoggingService {
  private readonly config: LoggingConfig;

  constructor() {
    this.config = this.initializeConfig();
  }

  createSessionLogger(
    sessionId: string, 
    sharedLogFile: string,
    context?: LogContext
  ): ISessionLogger {
    if (!this.config.enabled) {
      return new NoOpSessionLogger();
    }

    const correlationId = this.generateCorrelationId();
    const logContext: LogContext = {
      sessionId,
      correlationId,
      ...context
    };

    return new FileSessionLogger(
      this,
      logContext,
      sharedLogFile,
      this.config
    );
  }

  createOperationLogger(operation: string, sharedLogFile: string, context?: LogContext): IOperationLogger {
    if (!this.config.enabled) {
      return new NoOpOperationLogger();
    }

    const correlationId = this.generateCorrelationId();
    const logContext: LogContext = {
      operation,
      correlationId,
      ...context
    };

    return new FileOperationLogger(this, logContext, this.config, sharedLogFile);
  }

  isLoggingEnabled(): boolean {
    return this.config.enabled;
  }

  getLoggingConfig(): {
    enabled: boolean;
    level: LogLevel;
    outputFormat: 'json' | 'text';
  } {
    return {
      enabled: this.config.enabled,
      level: this.config.level,
      outputFormat: this.config.outputFormat
    };
  }

  /**
   * Internal method to add log entry to buffer
   * 
   * AI INSTRUCTIONS:
   * - Add to memory buffer for batched writes
   * - Handle buffer overflow protection
   * - Support both shared and individual log files
   */
  /**
   * Add raw log entry to file without any formatting
   * 
   * AI INSTRUCTIONS:
   * - Write message directly to file as-is
   * - Use for original log format compatibility
   * - No timestamps, emojis, or JSON formatting
   */
  addRawLogEntry(message: string, logFile?: string): void {
    if (!this.config.enabled) return;
    
    if (!logFile) {
      throw new Error('Shared log file is required for all logging operations');
    }
    
    const logPath = path.join(this.config.logDirectory, logFile);
    
    this.ensureLogDirectorySync();
    
    try {
      const fs = require('fs');
      fs.appendFileSync(logPath, `${message}\n`, 'utf8');
    } catch (error) {
      // Silent fail to prevent logging from breaking application
    }
  }

  /**
   * Add log entry with immediate synchronous write for chronological ordering
   * 
   * AI INSTRUCTIONS:
   * - Write immediately to maintain chronological order
   * - Use sync writes for proper ordering (~1-5ms per entry)
   * - Follow @golden-rule: single responsibility, minimal complexity
   * - Handle errors gracefully without breaking application flow
   */
  addLogEntry(entry: LogEntry, logFile?: string): void {
    if (!this.isLoggingEnabled()) return;

        if (!logFile) {
      throw new Error('Shared log file is required for all logging operations');
    }

    const logPath = path.join(this.config.logDirectory, logFile);
    const logContent = this.formatLogEntry(entry) + '\n';

    try {
      // Ensure directory exists synchronously
      this.ensureLogDirectorySync();
      
      // Write immediately for proper chronological ordering
      require('fs').appendFileSync(logPath, logContent);
    } catch (error) {
      // Silent fail - logging should never break the application
      if (process.env.NODE_ENV === 'development') {
        console.error('Logging error:', error);
      }
    }
  }



  /**
   * Initialize logging configuration for immediate synchronous writes
   * 
   * AI INSTRUCTIONS:
   * - Configure for immediate writes without buffering
   * - Handle environment variables and test conditions
   * - Follow @golden-rule: single responsibility, clear configuration
   */
  private initializeConfig(): LoggingConfig {
    const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
    const enabled = process.env.CHATBOT_FILE_LOGGING !== 'false' && !isTestEnvironment;
    
    return {
      enabled,
      level: this.parseLogLevel(process.env.CHATBOT_LOG_LEVEL) || LogLevel.INFO,
      outputFormat: 'json',
      logDirectory: process.env.CHATBOT_LOG_DIR || 'logs'
    };
  }

  private parseLogLevel(level?: string): LogLevel | undefined {
    if (!level) return undefined;
    return Object.values(LogLevel).find(l => l === level.toLowerCase());
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }



  /**
   * Format log entry to match existing readable log format
   * 
   * AI INSTRUCTIONS:
   * - Use simple, clean format matching existing logs
   * - Only add emoji for entries that don't already have them
   * - Follow @golden-rule: single responsibility, minimal complexity
   * - Match the style: [timestamp] message (with emoji only when needed)
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    
    // Check if message already has emoji or is a special format (separator, header)
    const hasEmoji = /^[\uD83C-\uDBFF\uDC00-\uDFFF]/.test(entry.message);
    const isSeparator = entry.message.includes('================================================================================') || 
                       entry.message.includes('=================================') ||
                       /^=+$/.test(entry.message.trim());
    const isPlainText = !hasEmoji && !isSeparator;
    
    // Only add emoji for entries that don't already have them and aren't separators
    let logLine = isPlainText 
      ? `[${timestamp}] ${this.getEmojiForLevel(entry.level)} ${entry.message}`
      : `[${timestamp}] ${entry.message}`;
    
    // Add structured data on separate lines with readable formatting
    if (entry.data && Object.keys(entry.data).length > 0) {
      // Always use multi-line JSON formatting for readability like existing logs
      logLine += `\n[${timestamp}] 📋 ${JSON.stringify(entry.data, null, 2)}`;
    }
    
    // Add errors on separate lines with clear formatting
    if (entry.error) {
      logLine += `\n[${timestamp}] ❌ ${entry.error.name}: ${entry.error.message}`;
    }
    
    // Add metrics in compact format
    if (entry.metrics && entry.metrics.duration) {
      logLine += `\n[${timestamp}] ⏱️  Duration: ${entry.metrics.duration}ms`;
    }
    
    return logLine;
  }

  /**
   * Get emoji indicator for log level
   * 
   * AI INSTRUCTIONS:
   * - Provide visual indicators matching existing log style
   * - Use consistent emoji patterns for quick scanning
   */
  private getEmojiForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return '📋';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.CRITICAL: return '🚨';
      default: return '📝';
    }
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Synchronous directory creation for immediate logging
   * 
   * AI INSTRUCTIONS:
   * - Use sync operations for chronological ordering
   * - Handle errors gracefully without breaking flow
   * - Follow @golden-rule: single responsibility
   */
  private ensureLogDirectorySync(): void {
    try {
      require('fs').mkdirSync(this.config.logDirectory, { recursive: true });
    } catch (error) {
      // Silent fail - directory might already exist
    }
  }


}

interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  outputFormat: 'json' | 'text';
  logDirectory: string;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metrics?: LogMetrics;
}

/**
 * File-based Session Logger Implementation
 * 
 * AI INSTRUCTIONS:
 * - Implement ISessionLogger for file output
 * - Handle structured logging with context
 * - Support correlation across operations
 */
class FileSessionLogger implements ISessionLogger {
  constructor(
    private service: ChatbotFileLoggingService,
    private context: LogContext,
    private logFile?: string,
    private config?: LoggingConfig
  ) {}

  logHeader(title: string): void {
    this.logSeparator();
    this.logMessage(title);
    this.logSeparator();
  }

  logSeparator(): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: '================================================================================',
      context: this.context
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logRaw(message: string): void {
    // Write directly to file without any formatting, timestamps, or emojis
    this.service.addRawLogEntry(message, this.logFile);
  }

  logMessage(message: string, data?: any, level: LogLevel = LogLevel.INFO): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      data
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logStep(step: string, data?: any, level: LogLevel = LogLevel.INFO): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `STEP: ${step}`,
      context: this.context,
      data
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logError(error: Error, context?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message: `ERROR: ${error.message}`,
      context: { ...this.context, ...context },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logMetrics(operation: string, metrics: LogMetrics): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `METRICS: ${operation}`,
      context: this.context,
      metrics
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logApiCall(endpoint: string, request: any, response: any, duration: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `API_CALL: ${endpoint}`,
      context: this.context,
      data: { request, response, duration }
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logCache(operation: 'hit' | 'miss' | 'warm' | 'evict', key: string, details?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message: `CACHE_${operation.toUpperCase()}: ${key}`,
      context: this.context,
      data: details
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  logDomainEvent(eventName: string, eventData: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `DOMAIN_EVENT: ${eventName}`,
      context: this.context,
      data: eventData
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  /**
   * Flush method - no-op since we use immediate synchronous writes
   * 
   * AI INSTRUCTIONS:
   * - No buffering means no flushing needed
   * - Immediate writes ensure all data is persisted
   * - Follow @golden-rule: single responsibility
   */
  async flush(): Promise<void> {
    // No-op: immediate synchronous writes mean no buffering to flush
  }

  getCorrelationId(): string {
    return this.context.correlationId || 'unknown';
  }
}

/**
 * File-based Operation Logger Implementation
 */
class FileOperationLogger implements IOperationLogger {
  private startTime: number = Date.now();
  private operationContext: Record<string, any> = {};

  constructor(
    private service: ChatbotFileLoggingService,
    private context: LogContext,
    private config: LoggingConfig,
    private logFile?: string
  ) {}

  start(context?: LogContext): void {
    this.startTime = Date.now();
    if (context) {
      this.context = { ...this.context, ...context };
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `OPERATION_START: ${this.context.operation}`,
      context: this.context
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  complete(result?: any, metrics?: LogMetrics): void {
    const duration = Date.now() - this.startTime;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message: `OPERATION_COMPLETE: ${this.context.operation}`,
      context: this.context,
      data: { result, duration, ...this.operationContext },
      metrics: { ...metrics, duration }
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  fail(error: Error, context?: any): void {
    const duration = Date.now() - this.startTime;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message: `OPERATION_FAILED: ${this.context.operation}`,
      context: { ...this.context, ...context },
      data: { duration, ...this.operationContext },
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
    
    this.service.addLogEntry(entry, this.logFile);
  }

  addContext(key: string, value: any): void {
    this.operationContext[key] = value;
  }

  getDuration(): number {
    return Date.now() - this.startTime;
  }
}

/**
 * No-op implementations for when logging is disabled
 */
class NoOpSessionLogger implements ISessionLogger {
  logHeader(): void {}
  logSeparator(): void {}
  logRaw(): void {}
  logMessage(): void {}
  logStep(): void {}
  logError(): void {}
  logMetrics(): void {}
  logApiCall(): void {}
  logCache(): void {}
  logDomainEvent(): void {}
  async flush(): Promise<void> {}
  getCorrelationId(): string { return 'disabled'; }
}

class NoOpOperationLogger implements IOperationLogger {
  start(): void {}
  complete(): void {}
  fail(): void {}
  addContext(): void {}
  getDuration(): number { return 0; }
} 