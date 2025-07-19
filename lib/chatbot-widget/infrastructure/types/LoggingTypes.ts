/**
 * Logging Infrastructure Types
 * 
 * Infrastructure layer types for logging and debugging.
 * External system contracts for observability.
 */

/**
 * Debug information interface
 * Infrastructure type for API call debugging and monitoring
 */
export interface DebugApiCall {
  readonly endpoint: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly payload: Record<string, unknown>;
  readonly response: {
    readonly status: number;
    readonly data: unknown;
    readonly headers?: Record<string, string>;
  };
  readonly timestamp: Date;
  readonly duration: number;
  readonly sessionId: string;
  readonly organizationId: string; // SECURITY-CRITICAL: Organization isolation
}

/**
 * Logging context interface
 * Infrastructure type for structured logging context
 */
export interface LoggingContext {
  readonly sessionId?: string;
  readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
  readonly userId?: string;
  readonly operation?: string;
  readonly correlationId?: string;
  readonly customData?: Record<string, unknown>;
}

/**
 * Log entry interface
 * Infrastructure type for structured log entries
 */
export interface LogEntry {
  readonly type: 'info' | 'warning' | 'error' | 'debug';
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly level: 'low' | 'medium' | 'high' | 'critical';
  readonly context?: LoggingContext;
}

/**
 * API call logging interface
 * Infrastructure type for external API call tracking
 */
export interface ApiCallLog {
  readonly endpoint: string;
  readonly request: {
    readonly method: string;
    readonly headers?: Record<string, string>;
    readonly body?: unknown;
  };
  readonly response: {
    readonly status: number;
    readonly data: unknown;
    readonly headers?: Record<string, string>;
  };
  readonly duration: number;
  readonly timestamp: Date;
  readonly sessionId?: string;
  readonly organizationId?: string; // SECURITY-CRITICAL: Organization isolation
}