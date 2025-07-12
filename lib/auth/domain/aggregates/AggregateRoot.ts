/**
 * Aggregate Root Base Class
 * 
 * AI INSTRUCTIONS:
 * - Use for entities that serve as consistency boundaries
 * - Enforce business invariants across aggregate members
 * - Publish domain events for cross-aggregate communication
 * - Never reference other aggregates directly - use IDs only
 */

import { DomainEvent } from '../events/DomainEvent';

export abstract class AggregateRoot<TId> {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  constructor(protected readonly id: TId) {}

  public getId(): TId {
    return this.id;
  }

  public getVersion(): number {
    return this._version;
  }

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

  public clearEvents(): void {
    this._domainEvents = [];
  }

  // Override in concrete aggregates to enforce invariants
  protected abstract validateInvariants(): void;

  // Override in concrete aggregates to handle concurrency
  protected checkVersion(expectedVersion: number): void {
    if (this._version !== expectedVersion) {
      throw new Error(
        `Concurrency conflict: expected version ${expectedVersion}, but current version is ${this._version}`
      );
    }
  }
} 