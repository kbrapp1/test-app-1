export interface DomainEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  occurredOn: Date;
  eventVersion: number;
  eventData?: Record<string, any>;
}

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  protected constructor(
    public readonly id: string,
    version?: number
  ) {
    this._version = version || 0;
  }

  // Domain Events Management
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getUncommittedEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
    this._version++;
  }

  public getVersion(): number {
    return this._version;
  }

  // Factory method for creating domain events
  protected createEvent(
    eventType: string,
    eventData?: Record<string, any>
  ): DomainEvent {
    return {
      eventId: crypto.randomUUID(),
      aggregateId: this.id,
      eventType,
      occurredOn: new Date(),
      eventVersion: this._version + 1,
      eventData
    };
  }
} 