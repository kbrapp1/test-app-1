/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Infrastructure implementation of IChatbotLoggingService
 * - Single responsibility: Handle file-based logging coordination
 * - Follow @golden-rule patterns: under 250 lines, clean separation
 * - Delegate logger creation to separate implementations
 * - Server-side only: Use dynamic imports for Node.js modules
 */

import { 
  IChatbotLoggingService, 
  ISessionLogger, 
  IOperationLogger,
  LogContext, 
  LogLevel, 
  LogMetrics 
} from '../../../domain/services/interfaces/IChatbotLoggingService';
import { FileLogger } from './FileLogger';
import { NoOpLogger } from './NoOpLogger';
import { LoggingConfig, LogEntry } from './LoggingTypes';

export class ChatbotFileLoggingService implements IChatbotLoggingService {
  private readonly config: LoggingConfig;

  constructor() {
    this.config = this.initializeConfig();
  }

  createSessionLogger(sessionId: string, sharedLogFile: string, context?: LogContext): ISessionLogger {
    if (!this.isServerSide()) return new NoOpLogger();
    
    return new FileLogger(this, {
      sessionId,
      correlationId: this.generateCorrelationId(),
      ...context
    }, sharedLogFile);
  }

  createOperationLogger(operation: string, sharedLogFile: string, context?: LogContext): IOperationLogger {
    if (!this.isServerSide()) return new NoOpLogger();
    
    return new FileLogger(this, {
      operation,
      correlationId: this.generateCorrelationId(),
      ...context
    }, sharedLogFile);
  }

  isLoggingEnabled(): boolean {
    return this.config.enabled && this.isServerSide();
  }

  getLoggingConfig(): { enabled: boolean; level: LogLevel; outputFormat: 'json' | 'text' } {
    return {
      enabled: this.config.enabled && this.isServerSide(),
      level: this.config.level,
      outputFormat: this.config.outputFormat
    };
  }

  addRawLogEntry(message: string, logFile?: string): void {
    if (!this.shouldLog(logFile)) return;
    // Add newline only if message doesn't already end with one
    const content = message.endsWith('\n') ? message : `${message}\n`;
    this.writeAsync(content, logFile!);
  }

  addLogEntry(level: LogLevel, message: string, logFile: string, data?: any, error?: Error, metrics?: LogMetrics): void {
    if (!this.shouldLog(logFile)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error: error ? { 
        name: error.name, 
        message: error.message, 
        stack: error.stack 
      } : undefined,
      metrics
    };
    
    const formatted = this.formatLogEntry(entry);
    this.writeAsync(formatted, logFile);
  }

  private async writeAsync(content: string, logFile: string): Promise<void> {
    if (!this.isServerSide()) return;

    try {
      // Use eval to prevent webpack from analyzing the import
      const fs = await eval('import("fs")').then((m: any) => m.promises);
      const path = await eval('import("path")');
      const logPath = path.join(this.config.logDirectory, logFile);
      
      await this.ensureLogDirectory();
      await fs.appendFile(logPath, content, 'utf8');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logging error:', error);
      }
    }
  }

  private shouldLog(logFile?: string): boolean {
    if (!this.config.enabled || !this.isServerSide()) return false;
    if (!logFile) throw new Error('Shared log file is required for all logging operations');
    return true;
  }

  private initializeConfig(): LoggingConfig {
    if (!this.isServerSide()) {
      return { enabled: false, level: LogLevel.INFO, outputFormat: 'json', logDirectory: 'logs' };
    }

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

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    
    // Check if message already has emojis (preserve existing emojis)
    const hasExistingEmoji = /[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u26FF]|[\u2700-\u27BF]/.test(entry.message);
    
    let formattedMessage = entry.message;
    
    // Only add emojis for ERROR and WARN levels if message doesn't already have emojis
    if (!hasExistingEmoji && (entry.level === LogLevel.ERROR || entry.level === LogLevel.WARN)) {
      const emoji = entry.level === LogLevel.ERROR ? '❌' : '⚠️';
      formattedMessage = `${emoji} ${entry.message}`;
    }
    
    let result = `[${timestamp}] ${formattedMessage}`;
    
    // Add structured data if present - format exactly like original
    if (entry.data !== undefined && entry.data !== null) {
      if (typeof entry.data === 'object') {
        // For objects, format as JSON with proper indentation and add newline before
        result += '\n' + JSON.stringify(entry.data, null, 2);
      } else {
        // For primitives, add on new line
        result += '\n' + String(entry.data);
      }
    }
    
    // Add error details if present
    if (entry.error) {
      result += '\n' + JSON.stringify(entry.error, null, 2);
    }
    
    // Add metrics if present
    if (entry.metrics) {
      result += '\n' + JSON.stringify(entry.metrics, null, 2);
    }
    
    return result + '\n';
  }

  private isServerSide(): boolean {
    return typeof window === 'undefined';
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.isServerSide()) return;
    
    try {
      // Use eval to prevent webpack from analyzing the import
      const fs = await eval('import("fs")').then((m: any) => m.promises);
      await fs.mkdir(this.config.logDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist - not critical
    }
  }
} 