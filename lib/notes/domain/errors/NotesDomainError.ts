/**
 * Notes Domain Errors - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Define specific error types for notes business rules
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Follow @golden-rule domain error patterns exactly
 */

export abstract class NotesDomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: ErrorSeverity;
  
  constructor(
    message: string,
    public readonly context: Record<string, unknown> = {},
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

export class BusinessRuleViolationError extends NotesDomainError {
  readonly code = 'NOTES_BUSINESS_RULE_VIOLATION';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(rule: string, context: Record<string, unknown> = {}) {
    super(`Notes business rule violated: ${rule}`, context);
  }
}

export class NoteNotFoundError extends NotesDomainError {
  readonly code = 'NOTE_NOT_FOUND';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(noteId: string, context: Record<string, unknown> = {}) {
    super(`Note not found: ${noteId}`, { ...context, noteId });
  }
}

export class InvalidNoteDataError extends NotesDomainError {
  readonly code = 'INVALID_NOTE_DATA';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(field: string, value: unknown, context: Record<string, unknown> = {}) {
    super(`Invalid note data for field '${field}': ${value}`, { ...context, field, value });
  }
}

export class NotePositionConflictError extends NotesDomainError {
  readonly code = 'NOTE_POSITION_CONFLICT';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(position: number, context: Record<string, unknown> = {}) {
    super(`Note position conflict at position: ${position}`, { ...context, position });
  }
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
} 