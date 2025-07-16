/**
 * Chat Message Processing Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Create specific error types for each business rule violation
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Follow domain error hierarchy from golden-rule.md
 * - Capture business context, not technical details
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export abstract class DomainError extends Error {
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
}

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION_NOT_FOUND';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(sessionId: string, context: Record<string, unknown> = {}) {
    super(`Chat session not found: ${sessionId}`, { ...context, sessionId });
  }
}

export class ConfigurationNotFoundError extends DomainError {
  readonly code = 'CONFIGURATION_NOT_FOUND';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(configId: string, organizationId: string, context: Record<string, unknown> = {}) {
    super(`Chatbot configuration not found: ${configId}`, { ...context, configId, organizationId });
  }
}

export class OperatingHoursViolationError extends DomainError {
  readonly code = 'OPERATING_HOURS_VIOLATION';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(currentTime: Date, operatingHours: any, context: Record<string, any> = {}) {
    super('Message received outside operating hours', { ...context, currentTime, operatingHours });
  }
}

export class ConversationContextAnalysisError extends DomainError {
  readonly code = 'CONTEXT_ANALYSIS_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(sessionId: string, reason: string, context: Record<string, any> = {}) {
    super(`Failed to analyze conversation context: ${reason}`, { ...context, sessionId, reason });
  }
}

export class AIResponseGenerationError extends DomainError {
  readonly code = 'AI_RESPONSE_GENERATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(sessionId: string, reason: string, context: Record<string, any> = {}) {
    super(`Failed to generate AI response: ${reason}`, { ...context, sessionId, reason });
  }
}

export class UnifiedProcessingServiceUnavailableError extends DomainError {
  readonly code = 'UNIFIED_PROCESSING_UNAVAILABLE';
  readonly severity = ErrorSeverity.MEDIUM;
  
  constructor(sessionId: string, fallbackUsed: boolean, context: Record<string, any> = {}) {
    super('Unified processing service unavailable', { ...context, sessionId, fallbackUsed });
  }
}

export class OrganizationRequiredError extends DomainError {
  readonly code = 'ORGANIZATION_REQUIRED';
  readonly severity = ErrorSeverity.CRITICAL;
  
  constructor(context: Record<string, any> = {}) {
    super('Organization ID is required for message processing', context);
  }
}

export class MessageValidationError extends DomainError {
  readonly code = 'MESSAGE_VALIDATION_ERROR';
  readonly severity = ErrorSeverity.HIGH;
  
  constructor(field: string, reason: string, context: Record<string, any> = {}) {
    super(`Message validation failed for ${field}: ${reason}`, { ...context, field, reason });
  }
} 