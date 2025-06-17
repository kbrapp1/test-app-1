/**
 * Lead Management Domain Errors
 * 
 * AI INSTRUCTIONS:
 * - Use specific error types for each business rule violation
 * - Include relevant context for debugging and user feedback
 * - Use error codes for programmatic handling
 * - Never expose technical details to domain layer
 */

export enum LeadErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export abstract class LeadDomainError extends Error {
  abstract readonly code: string;
  abstract readonly severity: LeadErrorSeverity;
  
  constructor(
    message: string,
    public readonly context: Record<string, any> = {},
    public readonly timestamp: Date = new Date()
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class LeadNotFoundError extends LeadDomainError {
  readonly code = 'LEAD_NOT_FOUND';
  readonly severity = LeadErrorSeverity.MEDIUM;
  
  constructor(leadId: string, context: Record<string, any> = {}) {
    super(`Lead not found: ${leadId}`, { ...context, leadId });
  }
}

export class LeadAlreadyExistsError extends LeadDomainError {
  readonly code = 'LEAD_ALREADY_EXISTS';
  readonly severity = LeadErrorSeverity.HIGH;
  
  constructor(sessionId: string, context: Record<string, any> = {}) {
    super(`Lead already captured for session: ${sessionId}`, { ...context, sessionId });
  }
}

export class ChatSessionNotFoundError extends LeadDomainError {
  readonly code = 'CHAT_SESSION_NOT_FOUND';
  readonly severity = LeadErrorSeverity.HIGH;
  
  constructor(sessionId: string, context: Record<string, any> = {}) {
    super(`Chat session not found: ${sessionId}`, { ...context, sessionId });
  }
}

export class InvalidLeadUpdateError extends LeadDomainError {
  readonly code = 'INVALID_LEAD_UPDATE';
  readonly severity = LeadErrorSeverity.MEDIUM;
  
  constructor(reason: string, context: Record<string, any> = {}) {
    super(`Invalid lead update: ${reason}`, context);
  }
}

export class LeadAccessDeniedError extends LeadDomainError {
  readonly code = 'LEAD_ACCESS_DENIED';
  readonly severity = LeadErrorSeverity.HIGH;
  
  constructor(leadId: string, organizationId: string, context: Record<string, any> = {}) {
    super(`Access denied to lead ${leadId} for organization ${organizationId}`, { 
      ...context, 
      leadId, 
      organizationId 
    });
  }
}

export class EntityPersistenceError extends LeadDomainError {
  readonly code = 'ENTITY_PERSISTENCE_FAILED';
  readonly severity = LeadErrorSeverity.HIGH;
  
  constructor(operation: string, entityType: string, context: Record<string, any> = {}) {
    super(`Failed to persist ${entityType} during ${operation}`, { 
      ...context, 
      operation, 
      entityType 
    });
  }
} 