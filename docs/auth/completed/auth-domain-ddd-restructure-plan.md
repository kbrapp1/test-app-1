# Auth Domain DDD Restructure Plan

## Current State Analysis

### ❌ **Auth Domain Architectural Problems**
1. **Mixed Layer Concerns**: Files like `roles.ts` (263 lines), `authorization.ts`, and `middleware.ts` are at the root level instead of proper DDD layers
2. **Incomplete Domain Layer**: Only has `value-objects/` - missing aggregates, entities, services, events, and errors
3. **Infrastructure Services in Wrong Layer**: `organization-service.ts` (16KB, 495 lines), `onboardingService.ts`, and `profileService.ts` are in `/services/` but should be in `/infrastructure/`
4. **Missing Application Layer**: No proper application services, use cases, or DTOs
5. **Presentation Layer Scattered**: Hooks and providers mixed with other concerns
6. **No Composition Root**: Dependencies are directly instantiated instead of using dependency injection
7. **Super Admin Subdomain**: Complex `super-admin/` directory needs DDD restructuring
8. **Business Domain Permissions**: `roles.ts` contains TTS, DAM, and other domain permissions that should be in respective domains

### ✅ **What's Working Well in Auth Domain**
- ✅ `SecurityAwareUserValidationService` follows good DDD patterns (already in infrastructure)
- ✅ `AuthenticationProvider` centralizes auth state management
- ✅ Role and permission system is comprehensive and hierarchical
- ✅ JWT-based security architecture is solid
- ✅ Super admin functionality is well-implemented
- ✅ Middleware provides good API route protection

### 🔄 **Complex Areas Requiring Careful Migration**
- `organization-service.ts` (16KB) - Large service with complex organization logic
- `roles.ts` (263 lines) - Complex permission hierarchies with business domain permissions
- `super-admin/` - Subdomain with types, hooks, and permissions
- `onboardingAuthUtils.ts` - Specialized auth utilities for onboarding flow

### 📁 **Complete Current File Inventory**
**Root Level Files to Restructure**:
- ❌ `roles.ts` (263 lines) → Split into domain entities and value objects
- ❌ `authorization.ts` (117 lines) → Move to domain services
- ❌ `middleware.ts` (135 lines) → Move to infrastructure
- ❌ `server-action.ts` (85 lines) → Move to presentation actions
- ❌ `action-wrapper.ts` (141 lines) → Move to infrastructure wrappers
- ❌ `onboardingAuthUtils.ts` (63 lines) → Move to infrastructure utilities
- ✅ `examples.md` → Keep as documentation
- ✅ `index.ts` → Update exports after restructure

**Existing Directories**:
- ✅ `providers/` → Keep in presentation layer (already well-structured)
- ✅ `infrastructure/SecurityAwareUserValidationService.ts` → Good example to follow
- ❌ `services/` → Move all to infrastructure/persistence/supabase/
- ❌ `hooks/` → Move to presentation/hooks/
- ❌ `actions/` → Move to presentation/actions/
- ❌ `super-admin/` → Needs complete DDD restructure
- ✅ `__tests__/` → Keep but update imports after restructure

## Target DDD Architecture

### Recommended File Structure
```
/lib/auth/
├── DOMAIN_BOUNDARY.md              # ✅ Domain scope definition
├── domain/
│   ├── aggregates/
│   │   ├── UserAggregate.ts        # User identity and profile
│   │   ├── OrganizationMembershipAggregate.ts # User-org relationships
│   │   └── SessionAggregate.ts     # Active user sessions
│   ├── entities/
│   │   ├── User.ts                 # Core user entity
│   │   ├── Profile.ts              # User profile entity
│   │   ├── Role.ts                 # Role entity
│   │   └── Permission.ts           # Permission entity
│   ├── value-objects/
│   │   ├── UserId.ts               # User identifier
│   │   ├── Email.ts                # Email validation
│   │   ├── OrganizationId.ts       # Organization identifier
│   │   └── TokenHash.ts            # JWT token hash
│   ├── services/
│   │   ├── AuthenticationService.ts # Core auth business logic
│   │   ├── AuthorizationService.ts  # Permission checking logic
│   │   ├── PasswordService.ts       # Password validation/hashing
│   │   └── TokenService.ts          # JWT token management
│   ├── events/
│   │   ├── UserAuthenticatedEvent.ts
│   │   ├── UserLoggedOutEvent.ts
│   │   ├── OrganizationSwitchedEvent.ts
│   │   └── MembershipCreatedEvent.ts
│   ├── errors/
│   │   ├── AuthenticationError.ts
│   │   ├── AuthorizationError.ts
│   │   ├── InvalidCredentialsError.ts
│   │   └── SessionExpiredError.ts
│   └── repositories/
│       ├── IUserRepository.ts
│       ├── IProfileRepository.ts
│       └── IMembershipRepository.ts
├── application/
│   ├── use-cases/
│   │   ├── AuthenticateUserUseCase.ts
│   │   ├── SwitchOrganizationUseCase.ts
│   │   ├── UpdateProfileUseCase.ts
│   │   └── InviteMemberUseCase.ts
│   ├── services/
│   │   ├── AuthApplicationService.ts
│   │   └── MembershipApplicationService.ts
│   ├── dto/
│   │   ├── UserDTO.ts
│   │   ├── ProfileDTO.ts
│   │   └── MembershipDTO.ts
│   └── mappers/
│       ├── UserMapper.ts
│       └── ProfileMapper.ts
├── infrastructure/
│   ├── persistence/supabase/
│   │   ├── SupabaseUserRepository.ts
│   │   ├── SupabaseProfileRepository.ts
│   │   └── SupabaseMembershipRepository.ts
│   ├── adapters/
│   │   ├── SupabaseAuthAdapter.ts
│   │   ├── JwtTokenAdapter.ts
│   │   └── DatabaseUserAdapter.ts
│   ├── services/
│   │   └── SecurityAwareUserValidationService.ts # ✅ Already exists
│   └── composition/
│       └── AuthCompositionRoot.ts
└── presentation/
    ├── actions/
    │   ├── authActions.ts          # Server actions
    │   ├── memberActions.ts        # Member management
    │   └── profileActions.ts       # Profile management
    ├── components/
    │   ├── LoginForm.tsx           # ✅ Already exists
    │   ├── OrganizationSelector.tsx # ✅ Already exists
    │   └── ProfileForm.tsx
    ├── hooks/
    │   ├── useAuth.ts              # Auth state management
    │   ├── useProfile.ts           # Profile management
    │   └── useOrganizationSelector.ts # ✅ Already exists
    ├── providers/
    │   ├── AuthenticationProvider.tsx # ✅ Already exists
    │   └── UserProfileProvider.tsx    # ✅ Already exists
    └── types/
        ├── AuthTypes.ts
        └── ProfileTypes.ts
```

## Migration Strategy - Auth Domain Focus

### Phase 1: Domain Layer Foundation (Auth Only)
1. **Create Domain Entities**
   - Extract user/profile logic from current files into proper entities
   - Create `User.ts`, `Profile.ts`, `Role.ts`, `Permission.ts` entities
   - Implement business validation rules within entities

2. **Create Value Objects**
   - `UserId.ts`, `Email.ts`, `OrganizationId.ts` for type safety
   - `TokenHash.ts` for security validation
   - Move existing value objects to proper structure

3. **Create Domain Services**
   - Extract business logic from `authorization.ts` into `AuthorizationService.ts`
   - Create `AuthenticationService.ts` for core auth business logic
   - Create `PasswordService.ts` for password validation/hashing
   - Create `TokenService.ts` for JWT token management

4. **Create Domain Events**
   - `UserAuthenticatedEvent`, `OrganizationSwitchedEvent`, `MembershipCreatedEvent`
   - Enable event-driven architecture within auth domain

5. **Create Domain Errors**
   - Replace generic errors with domain-specific ones
   - `AuthenticationError`, `AuthorizationError`, `InvalidCredentialsError`

6. **Handle Complex Permissions Migration**
   - Analyze 263-line `roles.ts` for business domain permissions
   - Keep core auth permissions in auth domain
   - Create permission registry pattern for cross-domain access
   - Document business domain permissions for future migration

### Phase 2: Application Layer (Auth Only)
1. **Create Use Cases**
   - `AuthenticateUserUseCase.ts`
   - `SwitchOrganizationUseCase.ts`
   - `UpdateProfileUseCase.ts`
   - `InviteMemberUseCase.ts`
   - `CompleteOnboardingUseCase.ts` (from onboardingAuthUtils.ts)

2. **Create Application Services**
   - `AuthApplicationService.ts` for coordination
   - `MembershipApplicationService.ts` for team management
   - `OnboardingApplicationService.ts` for user onboarding

3. **Create DTOs and Mappers**
   - Clean data contracts between layers
   - Transform domain entities to DTOs for external consumption

### Phase 3: Infrastructure Layer Reorganization (Auth Only)
1. **Move Services to Correct Layer**
   - **CRITICAL**: `organization-service.ts` (16KB, 495 lines) → `infrastructure/persistence/supabase/OrganizationRepository.ts`
   - `onboardingService.ts` → `infrastructure/services/OnboardingService.ts`
   - `profileService.ts` → `infrastructure/persistence/supabase/ProfileRepository.ts`
   - Keep `SecurityAwareUserValidationService` in infrastructure but organize properly

2. **Create Repository Implementations**
   - `SupabaseUserRepository.ts`
   - `SupabaseProfileRepository.ts`
   - `SupabaseMembershipRepository.ts`
   - Refactor large organization service into proper repository pattern

3. **Create Anti-Corruption Layers**
   - `SupabaseAuthAdapter.ts`
   - `JwtTokenAdapter.ts`
   - `DatabaseUserAdapter.ts`
   - `OnboardingAdapter.ts` (from onboardingAuthUtils.ts)

4. **Create Composition Root**
   - `AuthCompositionRoot.ts` for dependency injection
   - Wire all auth domain dependencies properly

### Phase 4: Presentation Layer Cleanup (Auth Only)
1. **Organize Server Actions**
   - Move existing actions to `presentation/actions/`
   - Update to use composition root for dependencies

2. **Organize Hooks and Providers**
   - Keep existing providers in `presentation/providers/`
   - Keep existing hooks in `presentation/hooks/`
   - Update to use application services through composition root

3. **Create Presentation Types**
   - UI-specific data contracts in `presentation/types/`
   - Never expose domain entities to UI

### Phase 5: Super Admin Subdomain Restructure (Auth Only)
1. **Analyze Super Admin Complexity**
   - Review existing `super-admin/` structure
   - Identify domain vs. presentation concerns
   - Plan integration with main auth domain

2. **Restructure Super Admin into DDD**
   - Move super admin domain logic to main auth domain
   - Keep super admin UI components in presentation layer
   - Create super admin specific use cases and services

3. **Super Admin Integration**
   - Integrate super admin permissions into main permission system
   - Create super admin specific aggregates if needed
   - Ensure super admin functionality works with new architecture

### Phase 6: Root Level Cleanup (Auth Only)
1. **Move Core Files to Proper Layers**
   - `roles.ts` → `domain/entities/Role.ts` and `domain/value-objects/Permission.ts`
   - `authorization.ts` → `domain/services/AuthorizationService.ts`
   - `middleware.ts` → `infrastructure/middleware/AuthMiddleware.ts`
   - `server-action.ts` → `presentation/actions/serverActions.ts`
   - `action-wrapper.ts` → `infrastructure/wrappers/ActionWrapper.ts`
   - `onboardingAuthUtils.ts` → `infrastructure/utilities/OnboardingUtils.ts`

2. **Update Index Exports**
   - Export only what's needed by other domains
   - Keep internal DDD structure hidden
   - Maintain backward compatibility for existing imports

3. **Update Tests**
   - Update all test imports to use new structure
   - Ensure all existing functionality still works
   - Add tests for new domain services and use cases

## Auth Domain Specific Issues to Address

### 1. **Current Auth Files to Restructure**
- ✅ `providers/` → Keep in `presentation/providers/`
- ✅ `infrastructure/SecurityAwareUserValidationService.ts` → Keep but organize better
- ❌ `roles.ts` → Split into domain entities and value objects
- ❌ `authorization.ts` → Move to domain services
- ❌ `middleware.ts` → Move to infrastructure
- ❌ `server-action.ts` → Move to presentation actions
- ❌ `action-wrapper.ts` → Move to infrastructure wrappers
- ❌ `services/` → Move to infrastructure/persistence/supabase/
- ❌ `actions/` → Move to presentation/actions/
- ❌ `hooks/` → Move to presentation/hooks/

### 2. **Auth Domain Boundaries**
**Keep in Auth Domain**:
- Core authentication logic
- Role and permission definitions
- User and profile management
- Session management
- Organization membership within auth context

**Export to Other Domains**:
- Permission checking functions
- Authentication wrappers
- User context providers
- Role validation utilities

## Future Work (Outside Auth Domain)

### Cross-Domain Improvements (Separate Tasks)
1. **Business Domain Permissions**: Move TTS, DAM permissions to their respective domains
2. **Multiple Auth Context Services**: Consolidate different domain auth services
3. **GlobalAuthenticationService Integration**: Ensure all domains use centralized auth
4. **Cross-Domain Event Integration**: Implement domain event communication

### Benefits of Auth Domain Restructure

✅ **Improved Auth Domain Maintainability**
- Clear separation of concerns within auth
- Single responsibility principle
- Easier to understand and modify auth logic

✅ **Better Auth Domain Testability**
- Isolated auth business logic
- Dependency injection within auth
- Mockable external dependencies

✅ **Enhanced Auth Security**
- Centralized auth security logic
- Consistent validation patterns
- Better audit trail for auth operations

✅ **Auth Domain Scalability**
- Event-driven architecture within auth
- Loose coupling between auth layers
- Easy to add new auth features

## Implementation Priority

1. **Phase 1**: Domain layer foundation (most critical)
2. **Phase 2**: Application layer (enables proper use cases)
3. **Phase 3**: Infrastructure layer (proper external concerns)
4. **Phase 4**: Presentation layer (clean UI concerns)
5. **Phase 5**: Root level cleanup (final organization)

This focused approach will transform the auth domain into a properly architected DDD module while maintaining all existing functionality and keeping cross-domain improvements as separate future work. 