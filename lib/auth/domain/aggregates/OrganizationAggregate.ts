/**
 * Organization Aggregate Root
 * 
 * AI INSTRUCTIONS:
 * - Enforce business invariants across organization-related entities
 * - Publish domain events for significant state changes
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle
 */

import { AggregateRoot } from './AggregateRoot';
import { OrganizationId } from '../value-objects/OrganizationId';
import { UserId } from '../value-objects/UserId';
import {
  OrganizationCreatedEvent,
  OrganizationMemberAddedEvent,
  OrganizationMemberRemovedEvent,
  OrganizationMemberRoleChangedEvent
} from '../events/DomainEvent';
import {
  BusinessRuleViolationError,
  InvariantViolationError,
  DuplicateResourceError,
  OrganizationMembershipError
} from '../errors/AuthDomainError';

export interface OrganizationSettings {
  allowSelfRegistration?: boolean;
  requireEmailVerification?: boolean;
  maxMembers?: number;
  defaultRole?: string;
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial'
}

export interface OrganizationMember {
  userId: string;
  role: string;
  joinedAt: Date;
  addedBy: string;
  status: 'active' | 'inactive' | 'pending';
}

export class OrganizationAggregate extends AggregateRoot<OrganizationId> {
  private _name: string;
  private _ownerId: UserId;
  private _status: OrganizationStatus;
  private _settings: OrganizationSettings;
  private _members: Map<string, OrganizationMember>;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: OrganizationId,
    name: string,
    ownerId: UserId,
    status: OrganizationStatus = OrganizationStatus.ACTIVE,
    settings: OrganizationSettings = {},
    members: OrganizationMember[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    super(id);
    this._name = name;
    this._ownerId = ownerId;
    this._status = status;
    this._settings = settings;
    this._members = new Map(members.map(m => [m.userId, m]));
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    
    this.validateInvariants();
  }

  // Factory method for new organization creation
  static create(
    name: string,
    ownerId: UserId,
    settings: OrganizationSettings = {}
  ): OrganizationAggregate {
    const organizationId = OrganizationId.generate();
    const now = new Date();
    
    const ownerMember: OrganizationMember = {
      userId: ownerId.value,
      role: 'owner',
      joinedAt: now,
      addedBy: ownerId.value,
      status: 'active'
    };

    const organization = new OrganizationAggregate(
      organizationId,
      name,
      ownerId,
      OrganizationStatus.ACTIVE,
      {
        allowSelfRegistration: false,
        requireEmailVerification: true,
        maxMembers: 100,
        defaultRole: 'member',
        ...settings
      },
      [ownerMember],
      now,
      now
    );

    organization.addDomainEvent(new OrganizationCreatedEvent(
      organizationId,
      name,
      ownerId,
      now
    ));

    return organization;
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get ownerId(): UserId {
    return this._ownerId;
  }

  get status(): OrganizationStatus {
    return this._status;
  }

  get settings(): OrganizationSettings {
    return { ...this._settings };
  }

  get members(): OrganizationMember[] {
    return Array.from(this._members.values());
  }

  get memberCount(): number {
    return this._members.size;
  }

  get activeMemberCount(): number {
    return Array.from(this._members.values()).filter(m => m.status === 'active').length;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
  addMember(userId: UserId, role: string, addedBy: UserId): void {
    this.validateInvariants();
    
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Cannot add members to inactive organization',
        { organizationId: this.id.value, status: this._status }
      );
    }

    if (this._members.has(userId.value)) {
      throw new DuplicateResourceError(
        'Organization member',
        userId.value,
        { organizationId: this.id.value }
      );
    }

    // Check if adder has permission (must be owner or admin)
    const adder = this._members.get(addedBy.value);
    if (!adder || !['owner', 'admin'].includes(adder.role)) {
      throw new OrganizationMembershipError(
        'Only owners and admins can add members',
        { organizationId: this.id.value, addedBy: addedBy.value }
      );
    }

    // Check member limit
    if (this._settings.maxMembers && this.activeMemberCount >= this._settings.maxMembers) {
      throw new BusinessRuleViolationError(
        'Organization has reached maximum member limit',
        { 
          organizationId: this.id.value, 
          currentCount: this.activeMemberCount,
          maxMembers: this._settings.maxMembers
        }
      );
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      throw new BusinessRuleViolationError(
        'Invalid role specified',
        { organizationId: this.id.value, role, validRoles }
      );
    }

    // Cannot add another owner
    if (role === 'owner') {
      throw new BusinessRuleViolationError(
        'Organization can only have one owner',
        { organizationId: this.id.value, currentOwner: this._ownerId.value }
      );
    }

    const newMember: OrganizationMember = {
      userId: userId.value,
      role,
      joinedAt: new Date(),
      addedBy: addedBy.value,
      status: 'active'
    };

    this._members.set(userId.value, newMember);
    this._updatedAt = new Date();

    this.addDomainEvent(new OrganizationMemberAddedEvent(
      this.id,
      userId,
      role,
      addedBy,
      newMember.joinedAt
    ));
  }

  removeMember(userId: UserId, removedBy: UserId): void {
    this.validateInvariants();
    
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Cannot remove members from inactive organization',
        { organizationId: this.id.value, status: this._status }
      );
    }

    const member = this._members.get(userId.value);
    if (!member) {
      throw new BusinessRuleViolationError(
        'User is not a member of this organization',
        { organizationId: this.id.value, userId: userId.value }
      );
    }

    // Cannot remove the owner
    if (member.role === 'owner') {
      throw new BusinessRuleViolationError(
        'Cannot remove organization owner',
        { organizationId: this.id.value, userId: userId.value }
      );
    }

    // Check if remover has permission
    const remover = this._members.get(removedBy.value);
    if (!remover) {
      throw new OrganizationMembershipError(
        'Remover is not a member of this organization',
        { organizationId: this.id.value, removedBy: removedBy.value }
      );
    }

    // Only owners and admins can remove members, or users can remove themselves
    const canRemove = ['owner', 'admin'].includes(remover.role) || userId.equals(removedBy);
    if (!canRemove) {
      throw new OrganizationMembershipError(
        'Insufficient permissions to remove member',
        { organizationId: this.id.value, removedBy: removedBy.value, removerRole: remover.role }
      );
    }

    this._members.delete(userId.value);
    this._updatedAt = new Date();

    this.addDomainEvent(new OrganizationMemberRemovedEvent(
      this.id,
      userId,
      removedBy,
      this._updatedAt
    ));
  }

  changeMemberRole(userId: UserId, newRole: string, changedBy: UserId): void {
    this.validateInvariants();
    
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Cannot change member roles in inactive organization',
        { organizationId: this.id.value, status: this._status }
      );
    }

    const member = this._members.get(userId.value);
    if (!member) {
      throw new BusinessRuleViolationError(
        'User is not a member of this organization',
        { organizationId: this.id.value, userId: userId.value }
      );
    }

    // Check if changer has permission (must be owner or admin)
    const changer = this._members.get(changedBy.value);
    if (!changer || !['owner', 'admin'].includes(changer.role)) {
      throw new OrganizationMembershipError(
        'Only owners and admins can change member roles',
        { organizationId: this.id.value, changedBy: changedBy.value }
      );
    }

    // Cannot change owner role
    if (member.role === 'owner' || newRole === 'owner') {
      throw new BusinessRuleViolationError(
        'Cannot change owner role',
        { organizationId: this.id.value, userId: userId.value, currentRole: member.role, newRole }
      );
    }

    // Validate new role
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(newRole)) {
      throw new BusinessRuleViolationError(
        'Invalid role specified',
        { organizationId: this.id.value, newRole, validRoles }
      );
    }

    if (member.role === newRole) {
      return; // No change needed
    }

    const oldRole = member.role;
    member.role = newRole;
    this._updatedAt = new Date();

    this.addDomainEvent(new OrganizationMemberRoleChangedEvent(
      this.id,
      userId,
      oldRole,
      newRole,
      changedBy,
      this._updatedAt
    ));
  }

  updateSettings(newSettings: Partial<OrganizationSettings>): void {
    this.validateInvariants();
    
    if (this._status !== OrganizationStatus.ACTIVE) {
      throw new BusinessRuleViolationError(
        'Cannot update settings for inactive organization',
        { organizationId: this.id.value, status: this._status }
      );
    }

    // Validate maxMembers if provided
    if (newSettings.maxMembers !== undefined) {
      if (newSettings.maxMembers < 1) {
        throw new BusinessRuleViolationError(
          'Maximum members must be at least 1',
          { organizationId: this.id.value, maxMembers: newSettings.maxMembers }
        );
      }

      if (newSettings.maxMembers < this.activeMemberCount) {
        throw new BusinessRuleViolationError(
          'Cannot set maximum members below current member count',
          { 
            organizationId: this.id.value, 
            maxMembers: newSettings.maxMembers,
            currentCount: this.activeMemberCount
          }
        );
      }
    }

    this._settings = { ...this._settings, ...newSettings };
    this._updatedAt = new Date();
  }

  getMember(userId: UserId): OrganizationMember | undefined {
    return this._members.get(userId.value);
  }

  isMember(userId: UserId): boolean {
    return this._members.has(userId.value);
  }

  isOwner(userId: UserId): boolean {
    const member = this._members.get(userId.value);
    return member?.role === 'owner';
  }

  isAdmin(userId: UserId): boolean {
    const member = this._members.get(userId.value);
    return member?.role === 'admin';
  }

  hasRole(userId: UserId, role: string): boolean {
    const member = this._members.get(userId.value);
    return member?.role === role;
  }

  protected validateInvariants(): void {
    // Organization must have a name
    if (!this._name || this._name.trim().length === 0) {
      throw new InvariantViolationError(
        'Organization must have a name',
        { organizationId: this.id.value }
      );
    }

    // Organization name cannot be too long
    if (this._name.length > 100) {
      throw new InvariantViolationError(
        'Organization name cannot exceed 100 characters',
        { organizationId: this.id.value, name: this._name }
      );
    }

    // Organization must have an owner
    if (!this._ownerId) {
      throw new InvariantViolationError(
        'Organization must have an owner',
        { organizationId: this.id.value }
      );
    }

    // Owner must be a member
    const owner = this._members.get(this._ownerId.value);
    if (!owner) {
      throw new InvariantViolationError(
        'Organization owner must be a member',
        { organizationId: this.id.value, ownerId: this._ownerId.value }
      );
    }

    // Owner must have owner role
    if (owner.role !== 'owner') {
      throw new InvariantViolationError(
        'Organization owner must have owner role',
        { organizationId: this.id.value, ownerId: this._ownerId.value, ownerRole: owner.role }
      );
    }

    // Organization must have at least one member
    if (this._members.size === 0) {
      throw new InvariantViolationError(
        'Organization must have at least one member',
        { organizationId: this.id.value }
      );
    }

    // Organization can only have one owner
    const owners = Array.from(this._members.values()).filter(m => m.role === 'owner');
    if (owners.length !== 1) {
      throw new InvariantViolationError(
        'Organization must have exactly one owner',
        { organizationId: this.id.value, ownerCount: owners.length }
      );
    }

    // Validate settings
    if (this._settings.maxMembers && this._settings.maxMembers < 1) {
      throw new InvariantViolationError(
        'Maximum members must be at least 1',
        { organizationId: this.id.value, maxMembers: this._settings.maxMembers }
      );
    }
  }
} 