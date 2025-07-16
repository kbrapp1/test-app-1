/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Implements both ISessionLogger and IOperationLogger interfaces
 * - Consolidated functionality to reduce code duplication
 * - Maintains all required logging capabilities
 * - Single responsibility: handle file-based logging operations
 * - Follow @golden-rule patterns: under 250 lines
 */

import { 
  ISessionLogger, 
  IOperationLogger, 
  LogContext, 
  LogLevel, 
  LogMetrics 
} from '../../../domain/services/interfaces/IChatbotLoggingService';
import { LogEntry } from './LoggingTypes';

export class FileLogger implements ISessionLogger, IOperationLogger {
  private startTime: number = Date.now();
  private operationContext: Record<string, unknown> = {};

  constructor(
    private service: unknown, // ChatbotFileLoggingService - avoiding circular import
    private context: LogContext,
    private logFile: string
  ) {}

  // ISessionLogger methods
  logHeader(title: string): void {
    this.logSeparator();
    this.logMessage(title);
    this.logSeparator();
  }

  logSeparator(): void {
    (this.service as any).addRawLogEntry('================================================================================', this.logFile as any);
  }

  logRaw(message: string): void {
    (this.service as any).addRawLogEntry(message, this.logFile as any);
  }

  logMessage(message: string, data?: unknown, level: LogLevel = LogLevel.INFO): void {
    if (data !== undefined && data !== null) {
      // For structured data, use the addEntry method which handles formatting properly
      this.addEntry(level, message, data);
    } else {
      // For simple messages, just log the message
      this.addEntry(level, message);
    }
  }

  // FIXED: Add synchronous logging method for critical step ordering
  logMessageSync(message: string, data?: unknown, level: LogLevel = LogLevel.INFO): void {
    if (data !== undefined && data !== null) {
      // For structured data, use the synchronous addEntry method
      this.addEntrySync(level, message, data);
    } else {
      // For simple messages, just log the message synchronously
      this.addEntrySync(level, message);
    }
  }

  logStep(step: string, data?: unknown, level: LogLevel = LogLevel.INFO): void {
    // Extract step number if present in the step string (supports both integer and decimal format)
    const stepMatch = step.match(/^(\d+(?:\.\d+)?)[:.]?\s*(.+)$/);
    const stepNumber = stepMatch ? stepMatch[1] : null;
    const description = stepMatch ? stepMatch[2] : step;
    
    // Check if this is a sub-step (has decimal point)
    const isSubStep = stepNumber && stepNumber.includes('.');
    
    if (isSubStep) {
      // For sub-steps: add line space before and log without timestamp
      (this.service as any).addRawLogEntry('', this.logFile as any);
      const stepHeader = `🔄 STEP ${stepNumber}: ${description}`;
      (this.service as any).addRawLogEntry(stepHeader, this.logFile as any);
    } else {
      // For main steps: log with timestamp as before
      const stepHeader = stepNumber ? `🔄 STEP ${stepNumber}: ${description}` : `🔄 ${step}`;
      this.addEntry(level, stepHeader);
    }
    
    // Log step data if provided
    if (data !== undefined && data !== null) {
      this.addEntry(level, 'Step Data:', data);
    }
  }

  logError(error: Error, context?: any): void {
    this.addEntry(LogLevel.ERROR, `ERROR: ${error.message}`, context, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  }

  logMetrics(operation: string, metrics: LogMetrics): void {
    this.addEntry(LogLevel.INFO, `METRICS: ${operation}`, undefined, undefined, metrics);
  }

  logApiCall(endpoint: string, request: any, response: any, duration: number): void {
    this.addEntry(LogLevel.INFO, `API_CALL: ${endpoint}`, {
      request: this.sanitizeApiDataForCompleteLogging(request),
      response: this.sanitizeApiData(response),
      duration
    });
  }

  private sanitizeApiDataForCompleteLogging(data: any): any {
    if (!data) return data;
    
    // Create a copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // FIXED: Keep complete message content for QA purposes
    // Don't truncate system prompts or user messages - log them in full
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map((msg: any) => ({
        ...msg,
        content: msg.content // Keep full content for QA review
      }));
    }
    
    return sanitized;
  }

  private sanitizeApiData(data: any): any {
    if (!data) return data;
    
    // Create a copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove sensitive information and truncate for brevity
    if (sanitized.messages) {
      sanitized.messages = sanitized.messages.map((msg: any) => ({
        ...msg,
        content: msg.content ? msg.content.substring(0, 100) + '...' : msg.content
      }));
    }
    
    return sanitized;
  }

  async flush(): Promise<void> {
    // Delegate to service flush method
    if ((this.service as any).flushPendingWrites) {
      await (this.service as any).flushPendingWrites();
    }
  }

  getCorrelationId(): string {
    return this.context.correlationId || 'unknown';
  }

  logCache(operation: 'hit' | 'miss' | 'warm' | 'evict', key: string, details?: any): void {
    this.addEntry(LogLevel.DEBUG, `CACHE_${operation.toUpperCase()}: ${key}`, details);
  }

  logDomainEvent(eventName: string, eventData: any): void {
    this.addEntry(LogLevel.INFO, `DOMAIN_EVENT: ${eventName}`, eventData);
  }

  private addEntry(level: LogLevel, message: string, data?: any, error?: any, metrics?: LogMetrics): void {
    (this.service as any).addLogEntry(level, message, this.logFile as any, data, error, metrics);
  }

  // FIXED: Add synchronous entry method for critical step ordering
  private addEntrySync(level: LogLevel, message: string, data?: any, error?: any, metrics?: LogMetrics): void {
    if ((this.service as any).addLogEntrySync) {
      (this.service as any).addLogEntrySync(level, message, this.logFile as any, data, error, metrics);
    } else {
      // Fallback to async method if sync method not available
      (this.service as any).addLogEntry(level, message, this.logFile as any, data, error, metrics);
    }
  }

  // IOperationLogger methods
  start(context?: LogContext): void {
    this.startTime = Date.now();
    if (context) this.context = { ...this.context, ...context };
    this.addEntry(LogLevel.INFO, `OPERATION_START: ${this.context.operation}`);
  }

  complete(result?: any, metrics?: LogMetrics): void {
    const duration = Date.now() - this.startTime;
    this.addEntry(LogLevel.INFO, `OPERATION_COMPLETE: ${this.context.operation}`, 
      { result, duration, ...this.operationContext }, undefined, { ...metrics, duration });
  }

  fail(error: Error, context?: any): void {
    const duration = Date.now() - this.startTime;
    this.addEntry(LogLevel.ERROR, `OPERATION_FAILED: ${this.context.operation}`, 
      { duration, ...this.operationContext, ...context }, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
  }

  addContext(key: string, value: any): void {
    this.operationContext[key] = value;
  }

  getDuration(): number {
    return Date.now() - this.startTime;
  }
} 