import { AggregateRoot, DomainEvent } from '../../domain/common/AggregateRoot';
import { SupabaseClient } from '@supabase/supabase-js';

export interface UnitOfWork {
  /**
   * Register an aggregate for insertion
   */
  registerNew(aggregate: AggregateRoot): void;

  /**
   * Register an aggregate for update
   */
  registerDirty(aggregate: AggregateRoot): void;

  /**
   * Register an aggregate for deletion
   */
  registerRemoved(aggregate: AggregateRoot): void;

  /**
   * Commit all changes in a single transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback all changes
   */
  rollback(): Promise<void>;

  /**
   * Check if unit of work has pending changes
   */
  hasChanges(): boolean;
}

export class SupabaseUnitOfWork implements UnitOfWork {
  private newAggregates: AggregateRoot[] = [];
  private dirtyAggregates: AggregateRoot[] = [];
  private removedAggregates: AggregateRoot[] = [];
  private isCommitting = false;

  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  registerNew(aggregate: AggregateRoot): void {
    if (this.isCommitting) {
      throw new Error('Cannot register new aggregates during commit');
    }
    
    // Ensure not already tracked
    if (this.isTracked(aggregate)) {
      throw new Error(`Aggregate ${aggregate.id} is already tracked`);
    }

    this.newAggregates.push(aggregate);
  }

  registerDirty(aggregate: AggregateRoot): void {
    if (this.isCommitting) {
      throw new Error('Cannot register dirty aggregates during commit');
    }

    // Don't double-track
    if (this.newAggregates.includes(aggregate) || this.dirtyAggregates.includes(aggregate)) {
      return;
    }

    this.dirtyAggregates.push(aggregate);
  }

  registerRemoved(aggregate: AggregateRoot): void {
    if (this.isCommitting) {
      throw new Error('Cannot register removed aggregates during commit');
    }

    // Remove from other collections if present
    this.removeFromCollection(this.newAggregates, aggregate);
    this.removeFromCollection(this.dirtyAggregates, aggregate);

    if (!this.removedAggregates.includes(aggregate)) {
      this.removedAggregates.push(aggregate);
    }
  }

  async commit(): Promise<void> {
    if (this.isCommitting) {
      throw new Error('Unit of Work is already committing');
    }

    if (!this.hasChanges()) {
      return; // Nothing to commit
    }

    this.isCommitting = true;

    try {
      // Start transaction
      const { error: transactionError } = await this.supabase.rpc('begin_transaction');
      if (transactionError) {
        throw new Error(`Failed to start transaction: ${transactionError.message}`);
      }

      // Collect all domain events before persisting
      const allEvents: DomainEvent[] = [
        ...this.newAggregates.flatMap(a => a.getUncommittedEvents()),
        ...this.dirtyAggregates.flatMap(a => a.getUncommittedEvents()),
        ...this.removedAggregates.flatMap(a => a.getUncommittedEvents())
      ];

      try {
        // Persist changes
        await this.persistInserts();
        await this.persistUpdates();
        await this.persistDeletes();

        // Commit transaction
        const { error: commitError } = await this.supabase.rpc('commit_transaction');
        if (commitError) {
          throw new Error(`Failed to commit transaction: ${commitError.message}`);
        }

        // Mark events as committed
        this.markEventsAsCommitted();

        // Publish domain events (after successful commit)
        await this.publishDomainEvents(allEvents);

        // Clear tracking collections
        this.clearCollections();

      } catch (error) {
        // Rollback on error
        await this.supabase.rpc('rollback_transaction');
        throw error;
      }

    } finally {
      this.isCommitting = false;
    }
  }

  async rollback(): Promise<void> {
    try {
      await this.supabase.rpc('rollback_transaction');
    } finally {
      this.clearCollections();
      this.isCommitting = false;
    }
  }

  hasChanges(): boolean {
    return this.newAggregates.length > 0 || 
           this.dirtyAggregates.length > 0 || 
           this.removedAggregates.length > 0;
  }

  // Private helper methods
  private isTracked(aggregate: AggregateRoot): boolean {
    return this.newAggregates.includes(aggregate) ||
           this.dirtyAggregates.includes(aggregate) ||
           this.removedAggregates.includes(aggregate);
  }

  private removeFromCollection(collection: AggregateRoot[], aggregate: AggregateRoot): void {
    const index = collection.indexOf(aggregate);
    if (index > -1) {
      collection.splice(index, 1);
    }
  }

  private async persistInserts(): Promise<void> {
    for (const aggregate of this.newAggregates) {
      // This would call the appropriate repository insert method
      // Implementation depends on your specific repository structure
      await this.persistAggregate(aggregate, 'INSERT');
    }
  }

  private async persistUpdates(): Promise<void> {
    for (const aggregate of this.dirtyAggregates) {
      await this.persistAggregate(aggregate, 'UPDATE');
    }
  }

  private async persistDeletes(): Promise<void> {
    for (const aggregate of this.removedAggregates) {
      await this.persistAggregate(aggregate, 'DELETE');
    }
  }

  private async persistAggregate(_aggregate: AggregateRoot, _operation: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<void> {
    // This is a simplified example - in practice, you'd route to the appropriate repository
    // based on the aggregate type and operation
    
    // For Generation aggregates, you'd call the GenerationRepository
    // For other aggregates, you'd call their respective repositories
    
    // Example:
    // if (aggregate instanceof Generation) {
    //   const repo = new SupabaseGenerationRepository(this.supabase);
    //   switch (operation) {
    //     case 'INSERT': await repo.insert(aggregate); break;
    //     case 'UPDATE': await repo.update(aggregate); break;
    //     case 'DELETE': await repo.delete(aggregate.id); break;
    //   }
    // }
    
    // Persist operation would be handled by specific repository
  }

  private markEventsAsCommitted(): void {
    [...this.newAggregates, ...this.dirtyAggregates, ...this.removedAggregates]
      .forEach(aggregate => aggregate.markEventsAsCommitted());
  }

  private async publishDomainEvents(events: DomainEvent[]): Promise<void> {
    // Publish events to event bus, message queue, etc.
    for (const event of events) {
      await this.publishEvent(event);
    }
  }

  private async publishEvent(_event: DomainEvent): Promise<void> {
    // Implementation would depend on your event publishing mechanism
    // Could be: Event bus, Message queue, HTTP webhooks, etc.
  }

  private clearCollections(): void {
    this.newAggregates = [];
    this.dirtyAggregates = [];
    this.removedAggregates = [];
  }
} 