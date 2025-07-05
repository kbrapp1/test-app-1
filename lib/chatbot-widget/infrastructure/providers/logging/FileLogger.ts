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
  private operationContext: Record<string, any> = {};

  constructor(
    private service: any, // ChatbotFileLoggingService - avoiding circular import
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
    this.addEntry(LogLevel.INFO, '================================================================================');
  }

  logRaw(message: string): void {
    this.service.addRawLogEntry(message, this.logFile);
  }

  logMessage(message: string, data?: any, level: LogLevel = LogLevel.INFO): void {
    if (data !== undefined && data !== null) {
      // For structured data, use the addEntry method which handles formatting properly
      this.addEntry(level, message, data);
    } else {
      // For simple messages, just log the message
      this.addEntry(level, message);
    }
  }

  logStep(step: string, data?: any, level: LogLevel = LogLevel.INFO): void {
    // Extract step number if present in the step string
    const stepMatch = step.match(/^(\d+)[:.]?\s*(.+)$/);
    const stepNumber = stepMatch ? parseInt(stepMatch[1]) : null;
    const description = stepMatch ? stepMatch[2] : step;
    
    // Add step separator for better readability (except for first step)
    if (stepNumber && stepNumber > 1) {
      this.service.addRawLogEntry('', this.logFile); // Empty line separator
    }
    
    // Log step header with clear formatting
    const stepHeader = stepNumber ? `🔄 STEP ${stepNumber}: ${description}` : `🔄 ${step}`;
    this.addEntry(level, stepHeader);
    
    // Log step data if provided
    if (data !== undefined && data !== null) {
      this.addEntry(level, 'Step Data:', data);
    }
    
    // Add separator line after step
    this.service.addRawLogEntry('────────────────────────────────────────────────────────────────────────────────', this.logFile);
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
    // Log API call header with clear separation
    this.service.addRawLogEntry('🔵 =================================', this.logFile);
    this.addEntry(LogLevel.INFO, `🔵 OPENAI API CALL - UNIFIED PROCESSING`);
    this.service.addRawLogEntry('🔵 =================================', this.logFile);
    
    // Log complete API request details
    this.addEntry(LogLevel.INFO, '📤 COMPLETE API REQUEST:');
    this.addEntry(LogLevel.INFO, `🔗 Endpoint: ${endpoint}`);
    
    // Log request headers if present
    if (request?.headers) {
      this.addEntry(LogLevel.INFO, '📋 Request Headers:', request.headers);
    }
    
    // Log complete request body
    if (request?.body || request) {
      this.addEntry(LogLevel.INFO, '📋 Request Body:', request.body || request);
    }
    
    // Log API call timing
    this.addEntry(LogLevel.INFO, `⏱️  API Call Started: ${new Date().toISOString()}`);
    
    // Log response details
    if (response !== undefined && response !== null) {
      this.addEntry(LogLevel.INFO, `✅ API Call Completed: ${new Date().toISOString()}`);
      this.addEntry(LogLevel.INFO, `⏱️  Duration: ${duration}ms`);
      this.addEntry(LogLevel.INFO, '📥 COMPLETE API RESPONSE:');
      
      // Log response headers if present
      if (response.headers) {
        this.addEntry(LogLevel.INFO, '📋 Response Headers:', response.headers);
      }
      
      // Log response body
      this.addEntry(LogLevel.INFO, '📋 Response Body:', response);
    }
    
    // Add closing separator
    this.service.addRawLogEntry('🔵 =================================', this.logFile);
    this.addEntry(LogLevel.INFO, '🔵 UNIFIED PROCESSING COMPLETED');
    this.service.addRawLogEntry('🔵 =================================', this.logFile);
  }

  logCache(operation: 'hit' | 'miss' | 'warm' | 'evict', key: string, details?: any): void {
    this.addEntry(LogLevel.DEBUG, `CACHE_${operation.toUpperCase()}: ${key}`, details);
  }

  logDomainEvent(eventName: string, eventData: any): void {
    this.addEntry(LogLevel.INFO, `DOMAIN_EVENT: ${eventName}`, eventData);
  }

  async flush(): Promise<void> {
    // No-op: immediate writes mean no buffering to flush
  }

  getCorrelationId(): string {
    return this.context.correlationId || 'unknown';
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

  /**
   * Unified entry creation method
   * 
   * AI INSTRUCTIONS:
   * - Consolidates all log entry creation logic
   * - Reduces code duplication across methods
   * - Maintains consistent formatting and context
   */
  private addEntry(
    level: LogLevel, 
    message: string, 
    data?: any, 
    error?: { name: string; message: string; stack?: string },
    metrics?: LogMetrics
  ): void {
    // Create Error object if error details provided
    const errorObj = error ? Object.assign(new Error(error.message), error) : undefined;
    
    // Call service method with correct parameter order
    this.service.addLogEntry(level, message, this.logFile, data, errorObj, metrics);
  }
} 