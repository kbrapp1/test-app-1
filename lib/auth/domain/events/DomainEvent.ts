/**
 * Domain Event Base Class and Auth Domain Events
 * 
 * AI INSTRUCTIONS:
 * - Represent significant business occurrences
 * - Include aggregate ID, timestamp, and relevant context
 * - Ensure immutability of event data
 * - Use for cross-aggregate communication
 */

import { UserId } from '../value-objects/UserId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { Email } from '../value-objects/Email';

export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;

  constructor(
    public readonly aggregateId: string,
    eventVersion: number = 1
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.eventVersion = eventVersion;
  }

  abstract getEventName(): string;
}

// User Domain Events
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly organizationId: OrganizationId,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserRegistered';
  }
}

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly verifiedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserEmailVerified';
  }
}

export class UserPasswordChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly changedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserPasswordChanged';
  }
}

export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedFields: string[],
    public readonly updatedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserProfileUpdated';
  }
}

export class UserDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly reason: string,
    public readonly deactivatedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserDeactivated';
  }
}

// Organization Domain Events
export class OrganizationCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly ownerId: UserId,
    public readonly createdAt: Date,
    eventVersion: number = 1
  ) {
    super(organizationId.value, eventVersion);
  }

  getEventName(): string {
    return 'OrganizationCreated';
  }
}

export class OrganizationMemberAddedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: string,
    public readonly addedBy: UserId,
    public readonly addedAt: Date,
    eventVersion: number = 1
  ) {
    super(organizationId.value, eventVersion);
  }

  getEventName(): string {
    return 'OrganizationMemberAdded';
  }
}

export class OrganizationMemberRemovedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly removedBy: UserId,
    public readonly removedAt: Date,
    eventVersion: number = 1
  ) {
    super(organizationId.value, eventVersion);
  }

  getEventName(): string {
    return 'OrganizationMemberRemoved';
  }
}

export class OrganizationMemberRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly oldRole: string,
    public readonly newRole: string,
    public readonly changedBy: UserId,
    public readonly changedAt: Date,
    eventVersion: number = 1
  ) {
    super(organizationId.value, eventVersion);
  }

  getEventName(): string {
    return 'OrganizationMemberRoleChanged';
  }
}

export class OrganizationSwitchedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly fromOrganizationId: OrganizationId | null,
    public readonly toOrganizationId: OrganizationId,
    public readonly switchedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'OrganizationSwitched';
  }
}

// Authentication Domain Events
export class UserAuthenticatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly organizationId: OrganizationId,
    public readonly authenticatedAt: Date,
    public readonly sessionId: string,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserAuthenticated';
  }
}

export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly sessionId: string,
    public readonly loggedOutAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'UserLoggedOut';
  }
}

export class SessionExpiredEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly sessionId: string,
    public readonly expiredAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'SessionExpired';
  }
}

export class PasswordResetEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly resetToken: string,
    public readonly requestedAt: Date,
    public readonly expiresAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'PasswordReset';
  }
}

export class SuperAdminAccessGrantedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly grantedBy: UserId,
    public readonly grantedAt: Date,
    public readonly reason: string,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'SuperAdminAccessGranted';
  }
}

export class AuthenticationCacheInvalidatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly organizationId: OrganizationId,
    public readonly reason: string,
    public readonly invalidatedAt: Date,
    eventVersion: number = 1
  ) {
    super(userId.value, eventVersion);
  }

  getEventName(): string {
    return 'AuthenticationCacheInvalidated';
  }
} 