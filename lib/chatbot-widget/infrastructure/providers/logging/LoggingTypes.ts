/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Shared types for logging infrastructure
 * - Keep focused on data structures only
 * - Follow @golden-rule patterns: single responsibility
 */

import { LogContext, LogLevel, LogMetrics } from '../../../domain/services/interfaces/IChatbotLoggingService';

export interface LoggingConfig {
  enabled: boolean;
  level: LogLevel;
  outputFormat: 'json' | 'text';
  logDirectory: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  data?: any;
  error?: { 
    name: string; 
    message: string; 
    stack?: string 
  };
  metrics?: LogMetrics;
} 