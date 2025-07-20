/**
 * Error Context Value Object
 * 
 * Immutable domain value object representing error context for knowledge processing operations.
 * Ensures data integrity and provides standardized error context structure.
 */

export interface ErrorContextData {
  operation: string;
  organizationId?: string;
  chatbotConfigId?: string;
  sessionId?: string;
  userQuery?: string;
  vectorCount?: number;
  memoryUsage?: number;
  searchOptions?: Record<string, unknown>;
}

export class ErrorContext {
  private constructor(
    private readonly data: ErrorContextData
  ) {
    Object.freeze(this.data);
  }

  static create(data: ErrorContextData): ErrorContext {
    if (!data.operation?.trim()) {
      throw new Error('Operation is required for error context');
    }

    // Sanitize user query for logging security
    const sanitizedData: ErrorContextData = {
      ...data,
      operation: data.operation.trim(),
      userQuery: data.userQuery ? ErrorContext.sanitizeQuery(data.userQuery) : undefined
    };

    return new ErrorContext(sanitizedData);
  }

  private static sanitizeQuery(query: string): string {
    // Remove potential sensitive information and limit length
    const maxLength = 100;
    const sanitized = query.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED]');
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) + '...' : sanitized;
  }

  get operation(): string {
    return this.data.operation;
  }

  get organizationId(): string | undefined {
    return this.data.organizationId;
  }

  get sessionId(): string | undefined {
    return this.data.sessionId;
  }

  get sanitizedUserQuery(): string | undefined {
    return this.data.userQuery;
  }

  toLogData(): Record<string, unknown> {
    const logData: Record<string, unknown> = {};
    
    Object.entries(this.data).forEach(([key, value]) => {
      if (value !== undefined) {
        logData[key] = value;
      }
    });
    
    return logData;
  }

  withOperation(operation: string): ErrorContext {
    return ErrorContext.create({ ...this.data, operation });
  }

  equals(other: ErrorContext): boolean {
    return JSON.stringify(this.data) === JSON.stringify(other.data);
  }
}