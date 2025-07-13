/**
 * Auth Domain Layer Exports
 * 
 * AI INSTRUCTIONS:
 * - Export only public domain interfaces and types
 * - Keep internal implementation details private
 * - Maintain clean API surface for application layer
 * - Follow DDD principles for bounded context
 */

// Value Objects
export { UserId } from './value-objects/UserId';
export { OrganizationId } from './value-objects/OrganizationId';
export { Email } from './value-objects/Email';


// Domain Entities (Aggregate Roots)
export { UserAggregate } from './aggregates/UserAggregate';
export { OrganizationAggregate } from './aggregates/OrganizationAggregate';

// Domain Services

export { PermissionService } from './services/PermissionService';
export { TokenService } from './services/TokenService';
export { PasswordService } from './services/PasswordService';

// Domain Events
export { 
  DomainEvent,
  UserRegisteredEvent,
  UserEmailVerifiedEvent,
  UserPasswordChangedEvent,
  UserProfileUpdatedEvent,
  UserDeactivatedEvent,
  OrganizationCreatedEvent,
  OrganizationMemberAddedEvent,
  OrganizationMemberRemovedEvent,
  OrganizationMemberRoleChangedEvent,
  OrganizationSwitchedEvent,
  UserAuthenticatedEvent,
  UserLoggedOutEvent,
  SessionExpiredEvent,
  PasswordResetEvent,
  SuperAdminAccessGrantedEvent,
  AuthenticationCacheInvalidatedEvent
} from './events/DomainEvent';

// Domain Errors
export {
  AuthDomainError,
  UserNotFoundError,
  OrganizationNotFoundError,
  InvalidCredentialsError,
  InsufficientPermissionsError,
  BusinessRuleViolationError,
  InvariantViolationError,
  OrganizationMembershipError,
  SessionExpiredError,
  DuplicateResourceError
} from './errors/AuthDomainError';

// Repository Interfaces
export type { IUserRepository } from './repositories/IUserRepository';
export type { IOrganizationRepository } from './repositories/IOrganizationRepository';
export type { IProfileRepository } from './repositories/IProfileRepository';

// Domain Service Interfaces
export type { 
  PermissionCheck, 
  PermissionResult 
} from './services/PermissionService';

export type { 
  TokenValidationResult, 
  TokenClaims 
} from './services/TokenService';

export type { 
  PasswordValidationResult, 
  PasswordRequirements 
} from './services/PasswordService';

 