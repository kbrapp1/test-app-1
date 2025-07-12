/**
 * User Aggregate Root
 * 
 * AI INSTRUCTIONS:
 * - Enforce business invariants across user-related entities
 * - Publish domain events for significant state changes
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle
 */

import { AggregateRoot } from './AggregateRoot';
import { UserId } from '../value-objects/UserId';
import { OrganizationId } from '../value-objects/OrganizationId';
import { Email } from '../value-objects/Email';
import {
  UserRegisteredEvent,
  UserEmailVerifiedEvent,
  UserPasswordChangedEvent,
  UserProfileUpdatedEvent,
  UserDeactivatedEvent,
  OrganizationSwitchedEvent
} from '../events/DomainEvent';
import {
  BusinessRuleViolationError,
  InvariantViolationError,
  DuplicateResourceError
} from '../errors/AuthDomainError';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  timezone?: string;
  language?: string;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

export class UserAggregate extends AggregateRoot<UserId> {
  private _email: Email;
  private _profile: UserProfile;
  private _status: UserStatus;
  private _emailVerified: boolean;
  private _activeOrganizationId: OrganizationId;
  private _organizationMemberships: Set<string>;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLoginAt?: Date;
  private _isSuperAdmin: boolean;

  constructor(
    id: UserId,
    email: Email,
    activeOrganizationId: OrganizationId,
    profile: UserProfile = {},
    status: UserStatus = UserStatus.PENDING_VERIFICATION,
    emailVerified: boolean = false,
    organizationMemberships: string[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    lastLoginAt?: Date,
    isSuperAdmin: boolean = false
  ) {
    super(id);
    this._email = email;
    this._profile = profile;
    this._status = status;
    this._emailVerified = emailVerified;
    this._activeOrganizationId = activeOrganizationId;
    this._organizationMemberships = new Set(organizationMemberships);
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._lastLoginAt = lastLoginAt;
    this._isSuperAdmin = isSuperAdmin;
    
    this.validateInvariants();
  }

  // Factory method for new user registration
  static register(
    email: Email,
    organizationId: OrganizationId,
    profile: UserProfile = {}
  ): UserAggregate {
    const userId = UserId.generate();
    const user = new UserAggregate(
      userId,
      email,
      organizationId,
      profile,
      UserStatus.PENDING_VERIFICATION,
      false,
      [organizationId.value],
      new Date(),
      new Date()
    );

    user.addDomainEvent(new UserRegisteredEvent(
      userId,
      email,
      organizationId
    ));

    return user;
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get profile(): UserProfile {
    return { ...this._profile };
  }

  get status(): UserStatus {
    return this._status;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get activeOrganizationId(): OrganizationId {
    return this._activeOrganizationId;
  }

  get organizationMemberships(): string[] {
    return Array.from(this._organizationMemberships);
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  // Business methods
  verifyEmail(): void {
    this.validateInvariants();
    
    if (this._emailVerified) {
      throw new BusinessRuleViolationError(
        'Email is already verified',
        { userId: this.id.value, email: this._email.value }
      );
    }

    if (this._status === UserStatus.SUSPENDED) {
      throw new BusinessRuleViolationError(
        'Cannot verify email for suspended user',
        { userId: this.id.value, status: this._status }
      );
    }

    this._emailVerified = true;
    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();

    this.addDomainEvent(new UserEmailVerifiedEvent(
      this.id,
      this._email,
      this._updatedAt
    ));
  }

  updateProfile(newProfile: Partial<UserProfile>): void {
    this.validateInvariants();
    
    if (this._status === UserStatus.SUSPENDED) {
      throw new BusinessRuleViolationError(
        'Cannot update profile for suspended user',
        { userId: this.id.value, status: this._status }
      );
    }

    const updatedFields: string[] = [];
    const oldProfile = { ...this._profile };

    // Update only provided fields
    Object.entries(newProfile).forEach(([key, value]) => {
      if (value !== undefined && value !== oldProfile[key as keyof UserProfile]) {
        (this._profile as any)[key] = value;
        updatedFields.push(key);
      }
    });

    if (updatedFields.length === 0) {
      return; // No changes
    }

    this._updatedAt = new Date();

    this.addDomainEvent(new UserProfileUpdatedEvent(
      this.id,
      updatedFields,
      this._updatedAt
    ));
  }

  changePassword(): void {
    this.validateInvariants();
    
    if (this._status === UserStatus.SUSPENDED) {
      throw new BusinessRuleViolationError(
        'Cannot change password for suspended user',
        { userId: this.id.value, status: this._status }
      );
    }

    this._updatedAt = new Date();

    this.addDomainEvent(new UserPasswordChangedEvent(
      this.id,
      this._updatedAt
    ));
  }

  switchOrganization(organizationId: OrganizationId): void {
    this.validateInvariants();
    
    if (this._status !== UserStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Only active users can switch organizations',
        { userId: this.id.value, status: this._status }
      );
    }

    if (!this._organizationMemberships.has(organizationId.value)) {
      throw new BusinessRuleViolationError(
        'User is not a member of the target organization',
        { userId: this.id.value, organizationId: organizationId.value }
      );
    }

    if (this._activeOrganizationId.equals(organizationId)) {
      return; // Already active
    }

    const previousOrganizationId = this._activeOrganizationId;
    this._activeOrganizationId = organizationId;
    this._updatedAt = new Date();

    this.addDomainEvent(new OrganizationSwitchedEvent(
      this.id,
      previousOrganizationId,
      organizationId,
      this._updatedAt
    ));
  }

  addOrganizationMembership(organizationId: OrganizationId): void {
    this.validateInvariants();
    
    if (this._organizationMemberships.has(organizationId.value)) {
      throw new DuplicateResourceError(
        'Organization membership',
        organizationId.value,
        { userId: this.id.value }
      );
    }

    this._organizationMemberships.add(organizationId.value);
    this._updatedAt = new Date();
  }

  removeOrganizationMembership(organizationId: OrganizationId): void {
    this.validateInvariants();
    
    if (!this._organizationMemberships.has(organizationId.value)) {
      throw new BusinessRuleViolationError(
        'User is not a member of this organization',
        { userId: this.id.value, organizationId: organizationId.value }
      );
    }

    if (this._organizationMemberships.size === 1) {
      throw new BusinessRuleViolationError(
        'User must be a member of at least one organization',
        { userId: this.id.value, organizationId: organizationId.value }
      );
    }

    this._organizationMemberships.delete(organizationId.value);
    
    // If removing active organization, switch to another one
    if (this._activeOrganizationId.equals(organizationId)) {
      const remainingOrgs = Array.from(this._organizationMemberships);
      const newActiveOrg = OrganizationId.create(remainingOrgs[0]);
      this.switchOrganization(newActiveOrg);
    }

    this._updatedAt = new Date();
  }

  deactivate(reason: string): void {
    this.validateInvariants();
    
    if (this._status === UserStatus.INACTIVE) {
      throw new BusinessRuleViolationError(
        'User is already inactive',
        { userId: this.id.value, status: this._status }
      );
    }

    this._status = UserStatus.INACTIVE;
    this._updatedAt = new Date();

    this.addDomainEvent(new UserDeactivatedEvent(
      this.id,
      reason,
      this._updatedAt
    ));
  }

  recordLogin(): void {
    this.validateInvariants();
    
    if (this._status !== UserStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Only active users can log in',
        { userId: this.id.value, status: this._status }
      );
    }

    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
  }

  // Super Admin methods
  get isSuperAdmin(): boolean {
    return this._isSuperAdmin;
  }

  hasSuperAdminRole(): boolean {
    return this._isSuperAdmin;
  }

  grantSuperAdminAccess(): void {
    this.validateInvariants();
    
    if (this._isSuperAdmin) {
      throw new BusinessRuleViolationError(
        'User already has super admin access',
        { userId: this.id.value }
      );
    }

    this._isSuperAdmin = true;
    this._updatedAt = new Date();
    
    // Note: Domain event will be published by SuperAdminDomainService
  }

  revokeSuperAdminAccess(): void {
    this.validateInvariants();
    
    if (!this._isSuperAdmin) {
      throw new BusinessRuleViolationError(
        'User does not have super admin access',
        { userId: this.id.value }
      );
    }

    this._isSuperAdmin = false;
    this._updatedAt = new Date();
    
    // Note: Domain event will be published by SuperAdminDomainService
  }

  protected validateInvariants(): void {
    // User must have an email
    if (!this._email) {
      throw new InvariantViolationError(
        'User must have an email address',
        { userId: this.id.value }
      );
    }

    // User must have an active organization
    if (!this._activeOrganizationId) {
      throw new InvariantViolationError(
        'User must have an active organization',
        { userId: this.id.value }
      );
    }

    // User must be a member of their active organization
    if (!this._organizationMemberships.has(this._activeOrganizationId.value)) {
      throw new InvariantViolationError(
        'User must be a member of their active organization',
        { 
          userId: this.id.value, 
          activeOrganizationId: this._activeOrganizationId.value,
          memberships: Array.from(this._organizationMemberships)
        }
      );
    }

    // User must be a member of at least one organization
    if (this._organizationMemberships.size === 0) {
      throw new InvariantViolationError(
        'User must be a member of at least one organization',
        { userId: this.id.value }
      );
    }

    // Profile validation
    if (this._profile.firstName && this._profile.firstName.length > 100) {
      throw new InvariantViolationError(
        'First name cannot exceed 100 characters',
        { userId: this.id.value, firstName: this._profile.firstName }
      );
    }

    if (this._profile.lastName && this._profile.lastName.length > 100) {
      throw new InvariantViolationError(
        'Last name cannot exceed 100 characters',
        { userId: this.id.value, lastName: this._profile.lastName }
      );
    }
  }
} 