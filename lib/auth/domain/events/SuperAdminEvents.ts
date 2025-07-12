/**
 * Super Admin Domain Events - Domain Layer
 * 
 * AI INSTRUCTIONS:
 * - Domain events for super admin operations
 * - Immutable events representing super admin state changes
 * - Include all relevant context for event handlers
 * - Single responsibility: Super admin event definitions
 */

import { DomainEvent } from './DomainEvent';
import { UserId } from '../value-objects/UserId';

export class SuperAdminAccessRevokedEvent extends DomainEvent {
  constructor(
    public readonly targetUserId: UserId,
    public readonly revokedByUserId: UserId,
    public readonly revokedAt: Date,
    public readonly reason: string,
    eventVersion: number = 1
  ) {
    super(targetUserId.value, eventVersion);
  }

  getEventName(): string {
    return 'SuperAdminAccessRevoked';
  }
}

export class SuperAdminOrganizationAccessedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly organizationId: string,
    public readonly accessedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'SuperAdminOrganizationAccessed';
  }
}

export class SuperAdminCacheInvalidatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly cacheType: string,
    public readonly organizationIds: string[],
    public readonly invalidatedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'SuperAdminCacheInvalidated';
  }
}

// Re-export existing event from DomainEvent.ts
export { SuperAdminAccessGrantedEvent } from './DomainEvent'; 