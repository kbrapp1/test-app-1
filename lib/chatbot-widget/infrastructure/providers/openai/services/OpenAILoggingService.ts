/**
 * OpenAI Logging Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle file logging for OpenAI API operations
 * - Extracted from OpenAIIntentClassificationService to follow @golden-rule.mdc
 * - Provide consistent logging interface across OpenAI services
 * - Handle environment variable checks and async logging
 * - Follow DDD patterns: Infrastructure service for cross-cutting concerns
 */

import { promises as fs } from 'fs';
import * as path from 'path';

export interface LoggingContext {
  logEntry: (message: string) => void;
  flushLogs: () => Promise<void>;
}

export class OpenAILoggingService {
  
  /**
   * Initialize logging context with environment variable check
   * 
   * AI INSTRUCTIONS:
   * - Check CHATBOT_FILE_LOGGING environment variable
   * - Return no-op context if logging disabled
   * - Setup batched async logging if enabled
   * - Follow @golden-rule patterns for clean interfaces
   */
  initializeLogging(sharedLogFile?: string): LoggingContext {
    const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
    
    if (!fileLoggingEnabled) {
      // Return no-op logging context when disabled
      return {
        logEntry: () => {},
        flushLogs: async () => {}
      };
    }

    return this.createActiveLoggingContext(sharedLogFile);
  }

  /**
   * Create active logging context with file operations
   * 
   * AI INSTRUCTIONS:
   * - Setup log file path and directory creation
   * - Implement batched logging for performance
   * - Use async I/O to prevent blocking
   * - Handle errors gracefully
   */
  private createActiveLoggingContext(sharedLogFile?: string): LoggingContext {
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    
    let logFile: string;
    if (sharedLogFile) {
      logFile = path.join(logDir, sharedLogFile);
    } else {
      const logFileName = `chatbot-${timestamp.replace(/[:.]/g, '-').split('.')[0]}.log`;
      logFile = path.join(logDir, logFileName);
    }
    
    let logBuffer: string[] = [];

    // Ensure logs directory exists
    this.ensureLogDirectoryExists(logDir);

    const flushLogs = async (): Promise<void> => {
      if (logBuffer.length > 0) {
        const logContent = logBuffer.join('');
        logBuffer.length = 0; // Clear buffer
        try {
          await fs.appendFile(logFile, logContent);
        } catch (error) {
          console.error('Failed to write to log file:', error);
        }
      }
    };

    const logEntry = (logMessage: string): void => {
      const logLine = `[${timestamp}] ${logMessage}\n`;
      logBuffer.push(logLine);
      
      // Flush periodically to avoid huge memory usage
      if (logBuffer.length > 50) {
        flushLogs().catch(console.error);
      }
    };

    return {
      logEntry,
      flushLogs
    };
  }

  /**
   * Ensure log directory exists
   * 
   * AI INSTRUCTIONS:
   * - Create logs directory if it doesn't exist
   * - Handle permissions errors gracefully
   * - Use synchronous operation for directory creation
   * - Only called when logging is actually enabled
   */
  private ensureLogDirectoryExists(logDir: string): void {
    try {
      const fs = require('fs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }
} 