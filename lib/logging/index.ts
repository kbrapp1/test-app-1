/**
 * Defines a singleton Logger class for structured logging with different levels
 * (debug, info, warn, error), logging color-coded messages in development
 * and structured JSON (intended for a logging service) in production.
 */
import { ErrorSeverity } from '../errors/constants';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = {
  message: string;
  code?: string;
  statusCode?: number;
  context?: Record<string, unknown>;
  severity?: ErrorSeverity;
  stack?: string;
  [key: string]: unknown;
};

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log debug messages (only in development)
   */
  debug(context: LogContext | string) {
    if (this.isDevelopment) {
      this.log('debug', context);
    }
  }

  /**
   * Log informational messages
   */
  info(context: LogContext | string) {
    this.log('info', context);
  }

  /**
   * Log warning messages
   */
  warn(context: LogContext | string) {
    this.log('warn', context);
  }

  /**
   * Log error messages
   */
  error(context: LogContext | string) {
    this.log('error', context);
  }

  private log(level: LogLevel, context: LogContext | string) {
    const timestamp = new Date().toISOString();
    const logContext = typeof context === 'string' ? { message: context } : context;

    // Basic console logging for development
    if (this.isDevelopment) {
      const color = this.getLogColor(level);
      console[level](
        `%c${timestamp} [${level.toUpperCase()}]`,
        `color: ${color}; font-weight: bold`,
        logContext
      );
      if (logContext.stack) {
        console[level]('Stack trace:', logContext.stack);
      }
      return;
    }

    // In production, we should send logs to a proper logging service
    // TODO: Integrate with a logging service (e.g., Winston, Pino, or external service)
    const logEntry = {
      timestamp,
      level,
      ...logContext,
    };

    // For now, just use console in production, but structured
    console[level](JSON.stringify(logEntry));
  }

  private getLogColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '#6c757d'; // gray
      case 'info':
        return '#0dcaf0'; // cyan
      case 'warn':
        return '#ffc107'; // yellow
      case 'error':
        return '#dc3545'; // red
      default:
        return '#000000';
    }
  }
}

export const logger = new Logger(); 