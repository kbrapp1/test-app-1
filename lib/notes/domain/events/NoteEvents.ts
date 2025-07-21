/**
 * Note Domain Events - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Lightweight domain events for aggregate state changes
 * - Keep simple - no complex event sourcing
 * - Focus on business-significant events only
 * - Follow @golden-rule event patterns exactly
 */

export interface DomainEvent {
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly version: number;
}

export class NoteCreatedEvent implements DomainEvent {
  readonly eventType = 'NoteCreated';
  readonly occurredOn = new Date();
  readonly version = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly title: string | null,
    public readonly content: string | null,
    public readonly userId: string,
    public readonly organizationId: string
  ) {}
}

export class NoteUpdatedEvent implements DomainEvent {
  readonly eventType = 'NoteUpdated';
  readonly occurredOn = new Date();
  readonly version = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly changes: {
      title?: { from: string | null; to: string | null };
      content?: { from: string | null; to: string | null };
      position?: { from: number; to: number };
      colorClass?: { from: string; to: string };
    }
  ) {}
}

export class NoteDeletedEvent implements DomainEvent {
  readonly eventType = 'NoteDeleted';
  readonly occurredOn = new Date();
  readonly version = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly userId: string,
    public readonly organizationId: string
  ) {}
}