# Auth Services Guide

## Overview

The auth domain provides a comprehensive authentication and authorization system built on Domain-Driven Design (DDD) principles. It handles user authentication, organization management, role-based permissions, and super admin functionality.

## Architecture Overview

```
lib/auth/
├── domain/           # Core business logic and rules
├── application/      # Use cases and application services
├── infrastructure/   # External integrations (Supabase, cache, etc.)
├── presentation/     # React components and providers
└── super-admin/      # ⚠️ Legacy folder - being migrated to proper DDD layers
```

**Note**: The `super-admin/` folder represents a transitional state. Super admin functionality is being integrated into the proper DDD layers for architectural consistency.

## Core Services

### 1. GlobalAuthenticationService

**Purpose**: Centralized authentication service that eliminates redundant API calls and provides caching.

**Performance Problem Solved**: The TTS domain previously made 13 redundant `supabase.auth.getUser()` calls per request, causing visible performance issues in the network panel. This service eliminates that problem.

**Key Features**:
- **Performance Optimization**: Reduces multiple `supabase.auth.getUser()` calls to single cached requests
- **5-second Cache TTL**: Balances performance with security
- **Token Hash Validation**: Ensures cache security with token comparison
- **Dual Environment Support**: Works in both server and client contexts

**Usage**:
```typescript
// Server-side
const globalAuth = getGlobalAuthenticationService();
const result = await globalAuth.getAuthenticatedUser();

// Client-side  
const result = await globalAuth.getAuthenticatedUserClient();
```

**Cache Strategy**:
- Server cache key: `'server-auth'`
- Client cache key: `'client-auth'`
- Invalidation: Token hash mismatch or TTL expiration

### 2. PermissionService

**Purpose**: Domain service for role-based access control and permission validation.

**Key Features**:
- **Role-Based Permissions**: Maps user roles to specific permissions
- **Super Admin Bypass**: Automatic permission grant for super admins
- **Organization Context**: Validates permissions within organization scope
- **Permission Inheritance**: Handles role hierarchy and permission cascading

**Permission System**:
```typescript
// Check user permissions
const result = PermissionService.checkPermissions({
  userId,
  userRole: UserRole.ADMIN,
  organizationId,
  requiredPermissions: [Permission.CREATE_USER, Permission.VIEW_TTS],
  user // Optional: for super admin bypass
});

// Get all permissions for a role
const permissions = PermissionService.getAllPermissionsForRole(UserRole.ADMIN);
```

**Role Hierarchy**:
- **Admin**: Full organization control and user management
- **Editor**: Content editing and team management
- **Member**: Standard user access with content creation
- **Viewer**: Read-only access to content
- **Visitor**: Minimal access (guest-level permissions)

### 3. TokenService

**Purpose**: Domain service for JWT token validation and organization context extraction.

**Key Features**:
- **Token Validation**: Validates JWT format and expiration
- **Organization Context**: Extracts active organization from token claims
- **User Context**: Retrieves user ID from token
- **Business Rule Validation**: Ensures token meets domain requirements

**Usage**:
```typescript
// Validate token
const result = TokenService.validateToken(tokenString);
if (result.isValid) {
  const userId = result.userId;
  const orgId = result.organizationId;
}

// Check organization context
const isValid = TokenService.validateOrganizationContext(
  tokenString, 
  expectedOrganizationId
);
```

### 4. SuperAdminDomainService

**Purpose**: Domain service for super admin business logic and operations.

**Key Features**:
- **Access Control**: Only super admins can grant/revoke super admin access
- **Business Rules**: Prevents self-granting and validates operations
- **Cross-Organization Access**: Enables super admin operations across all organizations
- **Audit Context**: Provides super admin operation context

**Super Admin Capabilities**:
```typescript
// Grant super admin access
superAdminService.grantSuperAdminAccess(targetUser, grantedByUser);

// Validate super admin operation
superAdminService.validateSuperAdminOperation(user, 'deleteOrganization');

// Create super admin context
const context = superAdminService.createSuperAdminContext(user);
// Returns: { isSuperAdmin, canAccessAllOrganizations, canBypassOrganizationRLS, ... }
```

### 5. SimpleCacheService

**Purpose**: Unified cache invalidation service for ALL users (with enhanced super admin capabilities).

**Key Features**:
- **Organization-Scoped Invalidation**: Invalidates cache for specific organizations (all users)
- **Enhanced Super Admin Support**: Cross-organization cache invalidation for super admins
- **Asset Management**: Handles DAM asset cache invalidation (all users)
- **Team Management**: Manages team/member cache invalidation (all users)
- **Regular User Operations**: Standard cache invalidation for normal operations

**When Cache Invalidation Happens**:
- **Asset Operations**: Upload, delete, move, or update any asset
- **Folder Operations**: Create, delete, rename, or move any folder
- **Team Operations**: Add, remove, or update team members
- **Organization Changes**: User switches organizations or role changes
- **Bulk Operations**: Gallery bulk move, delete, or organize operations
- **Super Admin Actions**: Cross-organization operations or global changes

**Cache Operations**:
```typescript
// Invalidate organization cache
SimpleCacheService.invalidateOrganizationCache(
  organizationIds, 
  profile, 
  'all' // or 'assets', 'folders', 'members'
);

// Global cache invalidation (super admin only)
SimpleCacheService.invalidateAllOrganizationsCache(profile);

// Triggered automatically in mutations:
// - Asset upload/delete → invalidates 'assets', 'dam-gallery', 'folders'
// - Team member changes → invalidates 'members', 'team'
// - Organization switch → invalidates all organization-scoped cache
```

## Application Layer

### Use Cases

The application layer orchestrates domain services through focused use cases:

#### Authentication Use Cases
- **LoginUserUseCase**: Handles user login workflow
- **RegisterUserUseCase**: Manages user registration process
- **SwitchOrganizationUseCase**: Manages organization context switching

#### Permission Use Cases  
- **ChangeUserRoleUseCase**: Handles role assignment with authorization
- **CheckUserPermissionsUseCase**: Validates user permissions for operations

#### Super Admin Use Cases
- **GrantSuperAdminUseCase**: Grants super admin privileges
- **RevokeSuperAdminUseCase**: Revokes super admin privileges

### Application Services

#### SuperAdminApplicationService
**Purpose**: Coordinates super admin operations across aggregates.

**Key Methods**:
```typescript
// Grant super admin access
await superAdminApp.grantSuperAdminAccess({
  targetUserId,
  grantedByUserId,
  reason: 'Initial setup'
});

// Get super admin context
const context = await superAdminApp.getSuperAdminContext(userId);
```

#### OrganizationApplicationService
**Purpose**: Manages organization-related operations and user memberships.

## Infrastructure Layer

### Adapters

#### SupabaseAuthAdapter
**Purpose**: Anti-corruption layer between domain and Supabase auth.

**Responsibilities**:
- Transform Supabase types to domain types
- Handle authentication workflows
- Isolate domain from Supabase API changes

#### JwtTokenAdapter
**Purpose**: JWT token handling and validation.

#### DatabaseUserAdapter  
**Purpose**: User data persistence and retrieval.

### Repositories

#### UserRepository
**Purpose**: User aggregate persistence with domain-focused interface.

**Key Methods**:
```typescript
// Core operations
await userRepo.save(userAggregate);
const user = await userRepo.findById(userId);
const user = await userRepo.findByEmail(email);

// Organization queries
const users = await userRepo.findByOrganization(orgId);
const count = await userRepo.countByOrganization(orgId);
```

#### OrganizationRepository
**Purpose**: Organization aggregate persistence.

#### ProfileRepository
**Purpose**: User profile data management.

### Composition Root

**Purpose**: Dependency injection container for the auth domain.

**Key Features**:
- **Singleton Pattern**: Single instance across application
- **Lazy Initialization**: Services created on-demand
- **Clean Dependencies**: Proper dependency injection
- **Service Factories**: Centralized service creation

**Usage**:
```typescript
// Get services through composition root
const authRoot = AuthCompositionRoot.getInstance();
const userRepo = authRoot.getUserRepository();
const loginUseCase = authRoot.getLoginUserUseCase();
```

## Presentation Layer

### Providers

#### AuthenticationProvider
**Purpose**: React context for authentication state management.

**Features**:
- Single source of truth for auth state
- Automatic token refresh
- Loading state management
- Authentication status tracking

**Usage**:
```typescript
// In components
const { user, isLoading, isAuthenticated, refreshAuth } = useAuthentication();
```

#### UserProfileProvider
**Purpose**: User profile and organization context management.

**Features**:
- Profile state management
- Organization switching
- Super admin status tracking
- Performance optimized with caching

## Super Admin System

### Database Management

Super admins can only be created through direct database access using the provided functions:

```sql
-- ✅ CORRECT: Use the provided database function
SELECT public.grant_super_admin(
  'user-uuid-here'::UUID,
  'Initial super admin setup'
);

-- ✅ Verify the grant
SELECT u.email, p.is_super_admin 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.is_super_admin = true;

-- ✅ Revoke super admin (if needed)
SELECT public.revoke_super_admin(
  'user-uuid-here'::UUID,
  'Access no longer needed'
);
```

**⚠️ Important**: Never directly update the `profiles` table. Always use the provided functions which include proper validation and audit trail creation.

### Database Functions

The system provides secure functions for super admin management:

- **`is_super_admin(user_id)`**: Returns boolean indicating super admin status
- **`grant_super_admin(user_id, notes)`**: Grants super admin privileges with audit trail
- **`revoke_super_admin(user_id, notes)`**: Revokes super admin privileges with audit trail

### RLS Integration

Super admin status automatically bypasses Row Level Security (RLS) policies through the `is_super_admin()` function:

```sql
-- Example RLS policy with super admin bypass
CREATE POLICY "organization_isolation" ON assets
  FOR ALL USING (
    public.is_super_admin() OR 
    organization_id = get_active_organization_id()
  );
```

### Super Admin Capabilities
- **Cross-Organization Access**: View and manage all organizations
- **Permission Bypass**: Automatic permission grants
- **Cache Management**: Global cache invalidation
- **User Management**: Grant/revoke super admin access
- **Organization Transfer**: Move resources between organizations

### Security Features
- **Database-Only Creation**: Cannot be granted through UI
- **Audit Trail**: All super admin operations logged in `super_admin_audit` table
- **Business Rule Validation**: Prevents self-granting and validates operations
- **Token Security**: Enhanced validation for super admin operations

## Performance Optimizations

### Caching Strategy
1. **GlobalAuthenticationService**: 5-second user authentication cache (solves TTS 13-call problem)
2. **SimpleCacheService**: Organization-scoped cache invalidation (KISS refactoring)
3. **UserProfileProvider**: Profile state caching with organization switching
4. **Token Validation**: Cached token hash comparison

### API Call Reduction
- **Before**: Multiple `supabase.auth.getUser()` calls per request (13 calls in TTS alone)
- **After**: Single cached authentication per 5-second window
- **Impact**: Eliminates redundant API calls across all domains

## Error Handling

### Domain Errors
- **BusinessRuleViolationError**: Domain rule violations
- **InsufficientPermissionsError**: Authorization failures  
- **UserNotFoundError**: User lookup failures
- **InvalidCredentialsError**: Authentication failures

### Error Patterns
```typescript
try {
  await useCase.execute(request);
} catch (error) {
  if (error instanceof BusinessRuleViolationError) {
    // Handle business rule violation
    return { success: false, error: error.message };
  }
  throw error; // Re-throw unexpected errors
}
```

## Integration Patterns

### Cross-Domain Usage
```typescript
// Other domains using auth services
import { getGlobalAuthenticationService } from '@/lib/auth';

const globalAuth = getGlobalAuthenticationService();
const { user, isValid } = await globalAuth.getAuthenticatedUser();
```

### Server Actions
```typescript
// Server action with auth
export async function serverAction() {
  const globalAuth = getGlobalAuthenticationService();
  const { user, isValid } = await globalAuth.getAuthenticatedUser();
  
  if (!isValid || !user) {
    throw new Error('Authentication required');
  }
  
  // Proceed with authenticated logic
}
```

### Client Components
```typescript
// Client component with auth
export function ProtectedComponent() {
  const { user, isAuthenticated } = useAuthentication();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return <AuthenticatedContent user={user} />;
}
```

## Testing

The auth domain includes comprehensive test coverage:
- **Unit Tests**: Domain services and value objects
- **Integration Tests**: Use cases and application services  
- **Component Tests**: React providers and hooks
- **API Tests**: Infrastructure adapters and repositories

**Test Status**: ✅ Comprehensive test coverage maintained across the application
**Note**: Test counts may vary as the codebase evolves. Run `pnpm test` for current results.

## Best Practices

### Domain Layer
- Keep business logic pure and testable
- Use value objects for validation
- Implement domain events for cross-aggregate communication
- Maintain clear aggregate boundaries

### Application Layer  
- Orchestrate domain services through use cases
- Handle cross-aggregate operations
- Provide clean interfaces for infrastructure
- Implement proper error handling

### Infrastructure Layer
- Isolate external dependencies with adapters
- Implement repository patterns for data access
- Use composition root for dependency injection
- Cache strategically for performance

### Presentation Layer
- Use React context for state management
- Implement loading states and error boundaries
- Optimize re-renders with proper memoization
- Provide clean component interfaces

## Security Considerations

### Authentication
- JWT-based authentication with Supabase
- Token validation with hash comparison
- Automatic token refresh handling
- Secure cache invalidation

### Authorization
- Role-based access control (RBAC)
- Organization-scoped permissions
- Super admin privilege escalation
- Permission inheritance and validation

### Data Protection
- Row Level Security (RLS) policies with super admin bypass
- Organization data isolation
- Audit trail for sensitive operations (`super_admin_audit` table)
- Secure super admin management through database functions

This guide provides a comprehensive overview of the auth services architecture and usage patterns. Each service is designed with single responsibility in mind while maintaining clean integration points across the domain. 