/**
 * Chat Message Processing Domain Events
 * 
 * AI INSTRUCTIONS:
 * - Represent significant business occurrences in message processing
 * - Include aggregate ID, timestamp, and relevant context
 * - Ensure immutable event data
 * - Use for cross-aggregate communication
 * - Follow domain event naming conventions
 */

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  
  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string
  ) {
    this.occurredAt = new Date();
    this.eventId = crypto.randomUUID();
  }
}

export class MessageProcessingStartedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userMessageId: string,
    public readonly organizationId: string
  ) {
    super(sessionId, 'MessageProcessingStarted');
  }
}

export class MessageProcessingCompletedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userMessageId: string,
    public readonly botMessageId: string,
    public readonly processingTimeMs: number,
    public readonly organizationId: string
  ) {
    super(sessionId, 'MessageProcessingCompleted');
  }
}

export class MessageProcessingFailedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userMessageId: string,
    public readonly errorMessage: string,
    public readonly processingTimeMs: number,
    public readonly organizationId: string
  ) {
    super(sessionId, 'MessageProcessingFailed');
  }
}

export class ConversationContextAnalyzedEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly messageCount: number,
    public readonly contextTokensUsed: number,
    public readonly intentDetected?: string,
    public readonly knowledgeItemsRetrieved?: number
  ) {
    super(sessionId, 'ConversationContextAnalyzed');
  }
}

export class LeadCaptureTriggeredEvent extends DomainEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userMessageId: string,
    public readonly leadScore: number,
    public readonly triggerReason: string,
    public readonly organizationId: string
  ) {
    super(sessionId, 'LeadCaptureTriggered');
  }
} 