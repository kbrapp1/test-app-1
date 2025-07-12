# Auth Domain DDD Restructure - Task Plan

## Overview
This task plan restructures the auth domain into proper DDD architecture while maintaining all existing functionality. The plan focuses exclusively on the auth domain and leaves cross-domain improvements for future work.

## Pre-Migration Analysis

### Current State Assessment
- [ ] Audit all current auth files and their sizes
- [ ] Document all existing exports and their usage across domains
- [ ] Identify all business domain permissions in roles.ts
- [ ] Map current dependencies and their relationships
- [ ] Create backup of current auth implementation

### Risk Assessment
- [ ] Identify breaking changes for other domains
- [ ] Plan backward compatibility strategy
- [ ] Document rollback procedures
- [ ] Create migration testing strategy

## Phase 1: Domain Layer Foundation

### 1.1 Create Domain Structure
- [ ] Create `/lib/auth/domain/` directory structure
- [ ] Create `/lib/auth/domain/aggregates/` directory
- [ ] Create `/lib/auth/domain/entities/` directory
- [ ] Create `/lib/auth/domain/value-objects/` directory
- [ ] Create `/lib/auth/domain/services/` directory
- [ ] Create `/lib/auth/domain/events/` directory
- [ ] Create `/lib/auth/domain/errors/` directory
- [ ] Create `/lib/auth/domain/repositories/` directory

### 1.2 Create Domain Entities
- [ ] Create `User.ts` entity with identity and profile logic
- [ ] Create `Profile.ts` entity with user profile management
- [ ] Create `Role.ts` entity with role definitions and hierarchies
- [ ] Create `Permission.ts` entity with permission definitions
- [ ] Extract business logic from current files into entities
- [ ] Add entity validation rules and invariants

### 1.3 Create Value Objects
- [ ] Create `UserId.ts` value object for type safety
- [ ] Create `Email.ts` value object with validation
- [ ] Create `OrganizationId.ts` value object
- [ ] Create `TokenHash.ts` value object for security
- [ ] Move existing value objects to proper structure
- [ ] Add immutability and validation to all value objects

### 1.4 Create Domain Services
- [ ] Extract logic from `authorization.ts` into `AuthorizationService.ts`
- [ ] Create `AuthenticationService.ts` for core auth business logic
- [ ] Create `PasswordService.ts` for password validation/hashing
- [ ] Create `TokenService.ts` for JWT token management
- [ ] Create `PermissionService.ts` for permission checking
- [ ] Ensure all services contain only business logic

### 1.5 Create Domain Events
- [ ] Create `UserAuthenticatedEvent.ts`
- [ ] Create `UserLoggedOutEvent.ts`
- [ ] Create `OrganizationSwitchedEvent.ts`
- [ ] Create `PasswordResetEvent.ts`
- [ ] Create `MembershipCreatedEvent.ts`
- [ ] Create `RoleChangedEvent.ts`
- [ ] Create `SuperAdminAccessGrantedEvent.ts`
- [ ] Create `AuthenticationCacheInvalidatedEvent.ts`

### 1.6 Create Domain Errors
- [ ] Create `AuthenticationError.ts` for auth failures
- [ ] Create `AuthorizationError.ts` for permission failures
- [ ] Create `InvalidCredentialsError.ts` for login failures
- [ ] Create `SessionExpiredError.ts` for session issues
- [ ] Create `PermissionDeniedError.ts` for access violations
- [ ] Replace generic errors with domain-specific ones

### 1.7 Create Repository Interfaces
- [ ] Create `IUserRepository.ts` interface
- [ ] Create `IProfileRepository.ts` interface
- [ ] Create `IMembershipRepository.ts` interface
- [ ] Create `IOrganizationRepository.ts` interface
- [ ] Define clean data access contracts

### 1.8 Handle Complex Permissions Migration
- [ ] Analyze 263-line `roles.ts` for business domain permissions
- [ ] Separate core auth permissions from business domain permissions
- [ ] Create permission registry pattern for cross-domain access
- [ ] Document business domain permissions for future migration
- [ ] Maintain backward compatibility for existing permission checks

## Phase 2: Application Layer

### 2.1 Create Application Structure
- [ ] Create `/lib/auth/application/` directory structure
- [ ] Create `/lib/auth/application/use-cases/` directory
- [ ] Create `/lib/auth/application/services/` directory
- [ ] Create `/lib/auth/application/dto/` directory
- [ ] Create `/lib/auth/application/mappers/` directory

### 2.2 Create Use Cases
- [ ] Create `AuthenticateUserUseCase.ts`
- [ ] Create `SwitchOrganizationUseCase.ts`
- [ ] Create `UpdateProfileUseCase.ts`
- [ ] Create `InviteMemberUseCase.ts`
- [ ] Create `CompleteOnboardingUseCase.ts` (from onboardingAuthUtils.ts)
- [ ] Create `ResetPasswordUseCase.ts`
- [ ] Create `GrantSuperAdminUseCase.ts`
- [ ] Ensure use cases orchestrate domain services only

### 2.3 Create Application Services
- [ ] Create `AuthApplicationService.ts` for coordination
- [ ] Create `MembershipApplicationService.ts` for team management
- [ ] Create `OnboardingApplicationService.ts` for user onboarding
- [ ] Create `ProfileApplicationService.ts` for profile management
- [ ] Ensure services coordinate use cases and domain services

### 2.4 Create DTOs and Mappers
- [ ] Create `UserDTO.ts` for user data transfer
- [ ] Create `ProfileDTO.ts` for profile data transfer
- [ ] Create `MembershipDTO.ts` for membership data transfer
- [ ] Create `RoleDTO.ts` for role data transfer
- [ ] Create `UserMapper.ts` for entity-DTO transformation
- [ ] Create `ProfileMapper.ts` for profile transformation
- [ ] Create `MembershipMapper.ts` for membership transformation
- [ ] Ensure DTOs never expose domain entities

## Phase 3: Infrastructure Layer Reorganization

### 3.1 Create Infrastructure Structure
- [ ] Create `/lib/auth/infrastructure/` directory structure
- [ ] Create `/lib/auth/infrastructure/persistence/supabase/` directory
- [ ] Create `/lib/auth/infrastructure/adapters/` directory
- [ ] Create `/lib/auth/infrastructure/services/` directory
- [ ] Create `/lib/auth/infrastructure/composition/` directory

### 3.2 Move Large Services to Correct Layer
- [ ] **CRITICAL**: Move `organization-service.ts` (16KB, 495 lines) to `infrastructure/persistence/supabase/OrganizationRepository.ts`
- [ ] Move `onboardingService.ts` to `infrastructure/services/OnboardingService.ts`
- [ ] Move `profileService.ts` to `infrastructure/persistence/supabase/ProfileRepository.ts`
- [ ] Refactor large services into proper repository pattern
- [ ] Ensure infrastructure services implement domain interfaces

### 3.3 Create Repository Implementations
- [ ] Create `SupabaseUserRepository.ts` implementing `IUserRepository`
- [ ] Create `SupabaseProfileRepository.ts` implementing `IProfileRepository`
- [ ] Create `SupabaseMembershipRepository.ts` implementing `IMembershipRepository`
- [ ] Create `SupabaseOrganizationRepository.ts` from large organization service
- [ ] Ensure repositories handle only data access concerns

### 3.4 Create Anti-Corruption Layers
- [ ] Create `SupabaseAuthAdapter.ts` for Supabase auth integration
- [ ] Create `JwtTokenAdapter.ts` for JWT token handling
- [ ] Create `DatabaseUserAdapter.ts` for database user mapping
- [ ] Create `OnboardingAdapter.ts` (from onboardingAuthUtils.ts)
- [ ] Ensure adapters protect domain from external changes

### 3.5 Organize Existing Infrastructure
- [ ] Keep `SecurityAwareUserValidationService.ts` in infrastructure but organize properly
- [ ] Move `action-wrapper.ts` to `infrastructure/wrappers/ActionWrapper.ts`
- [ ] Move `middleware.ts` to `infrastructure/middleware/AuthMiddleware.ts`
- [ ] Update all infrastructure services to use dependency injection

### 3.6 Create Composition Root
- [ ] Create `AuthCompositionRoot.ts` for dependency injection
- [ ] Wire all auth domain dependencies properly
- [ ] Implement singleton pattern for composition root
- [ ] Ensure lazy initialization of dependencies

## Phase 4: Presentation Layer Cleanup

### 4.1 Create Presentation Structure
- [ ] Create `/lib/auth/presentation/` directory structure
- [ ] Create `/lib/auth/presentation/actions/` directory
- [ ] Create `/lib/auth/presentation/components/` directory
- [ ] Create `/lib/auth/presentation/hooks/` directory
- [ ] Create `/lib/auth/presentation/providers/` directory
- [ ] Create `/lib/auth/presentation/types/` directory

### 4.2 Organize Server Actions
- [ ] Move `server-action.ts` to `presentation/actions/serverActions.ts`
- [ ] Move existing actions to `presentation/actions/`
- [ ] Create `authActions.ts` for authentication actions
- [ ] Create `memberActions.ts` for member management actions
- [ ] Create `profileActions.ts` for profile management actions
- [ ] Update all actions to use composition root for dependencies

### 4.3 Organize Components and Hooks
- [ ] Keep existing providers in `presentation/providers/`
- [ ] Keep existing hooks in `presentation/hooks/`
- [ ] Move existing components to `presentation/components/`
- [ ] Update all to use application services through composition root
- [ ] Ensure components never directly access domain entities

### 4.4 Create Presentation Types
- [ ] Create `AuthTypes.ts` for UI-specific auth types
- [ ] Create `ProfileTypes.ts` for profile UI types
- [ ] Create `MembershipTypes.ts` for membership UI types
- [ ] Ensure types are UI-specific and don't expose domain entities

## Phase 5: Super Admin Subdomain Restructure

### 5.1 Analyze Super Admin Complexity
- [ ] Review existing `super-admin/` structure
- [ ] Identify domain vs. presentation concerns
- [ ] Plan integration with main auth domain
- [ ] Document super admin specific requirements

### 5.2 Restructure Super Admin into DDD
- [ ] Move super admin domain logic to main auth domain
- [ ] Keep super admin UI components in presentation layer
- [ ] Create super admin specific use cases and services
- [ ] Integrate super admin permissions into main permission system

### 5.3 Super Admin Integration
- [ ] Create super admin specific aggregates if needed
- [ ] Ensure super admin functionality works with new architecture
- [ ] Update super admin caching and permissions
- [ ] Test super admin cross-organization access

## Phase 6: Root Level Cleanup

### 6.1 Move Core Files to Proper Layers
- [ ] Move `roles.ts` logic to `domain/entities/Role.ts` and `domain/value-objects/Permission.ts`
- [ ] Move `authorization.ts` logic to `domain/services/AuthorizationService.ts`
- [ ] Move `onboardingAuthUtils.ts` to `infrastructure/utilities/OnboardingUtils.ts`
- [ ] Archive old files after successful migration

### 6.2 Update Index Exports
- [ ] Update `index.ts` to export from new structure
- [ ] Export only what's needed by other domains
- [ ] Keep internal DDD structure hidden
- [ ] Maintain backward compatibility for existing imports
- [ ] Document breaking changes if any

### 6.3 Update Tests
- [ ] Update all test imports to use new structure
- [ ] Fix `server-action.test.ts` (already completed)
- [ ] Update middleware tests
- [ ] Update authorization tests
- [ ] Add tests for new domain services and use cases
- [ ] Ensure all existing functionality still works

## Phase 7: Integration and Validation

### 7.1 Cross-Domain Integration Testing
- [ ] Test auth integration with chatbot-widget domain
- [ ] Test auth integration with DAM domain
- [ ] Test auth integration with TTS domain
- [ ] Test auth integration with image-generator domain
- [ ] Test auth integration with monitoring domain
- [ ] Ensure all existing auth flows work

### 7.2 Performance Validation
- [ ] Verify GlobalAuthenticationService still works
- [ ] Test auth caching performance
- [ ] Validate JWT token handling performance
- [ ] Test organization switching performance
- [ ] Ensure no performance regressions

### 7.3 Security Validation
- [ ] Test all permission checks still work
- [ ] Validate JWT security implementation
- [ ] Test organization isolation
- [ ] Validate super admin access controls
- [ ] Test session management security

## Phase 8: Documentation and Cleanup

### 8.1 Update Documentation
- [ ] Update auth domain boundary documentation
- [ ] Create migration guide for other domains
- [ ] Document new DDD structure
- [ ] Update API documentation
- [ ] Create troubleshooting guide

### 8.2 Final Cleanup
- [ ] Remove old files after successful migration
- [ ] Clean up unused imports
- [ ] Remove deprecated code
- [ ] Optimize bundle size
- [ ] Final code review

## Success Criteria

### Functional Requirements
- [ ] All existing auth functionality works unchanged
- [ ] All permission checks continue to work
- [ ] Organization switching works properly
- [ ] Super admin functionality preserved
- [ ] JWT token handling maintained
- [ ] Session management unchanged

### Non-Functional Requirements
- [ ] No performance regressions
- [ ] Improved code maintainability
- [ ] Better testability
- [ ] Clear separation of concerns
- [ ] Proper dependency injection
- [ ] Clean architecture compliance

### Integration Requirements
- [ ] All other domains continue to work
- [ ] Backward compatibility maintained
- [ ] No breaking changes for existing APIs
- [ ] Smooth migration path
- [ ] Rollback capability preserved

## Risk Mitigation

### High-Risk Areas
- [ ] Large organization service migration (16KB file)
- [ ] Complex permission system restructure
- [ ] Super admin subdomain integration
- [ ] Cross-domain auth integration
- [ ] JWT token handling changes

### Mitigation Strategies
- [ ] Incremental migration approach
- [ ] Extensive testing at each phase
- [ ] Backward compatibility maintenance
- [ ] Rollback procedures documented
- [ ] Feature flags for gradual rollout

## Timeline Estimation

- **Phase 1**: Domain Layer Foundation - 2-3 weeks
- **Phase 2**: Application Layer - 1-2 weeks
- **Phase 3**: Infrastructure Layer - 2-3 weeks
- **Phase 4**: Presentation Layer - 1 week
- **Phase 5**: Super Admin Restructure - 1-2 weeks
- **Phase 6**: Root Level Cleanup - 1 week
- **Phase 7**: Integration and Validation - 1-2 weeks
- **Phase 8**: Documentation and Cleanup - 1 week

**Total Estimated Time**: 10-15 weeks

## Notes

- This plan focuses exclusively on the auth domain
- Business domain permissions will be addressed in future cross-domain work
- All existing functionality must be preserved
- Backward compatibility is critical
- Testing is essential at each phase
- Documentation must be updated throughout the process 