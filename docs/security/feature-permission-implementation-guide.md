# Feature Permission Implementation Guide

This guide provides step-by-step instructions for implementing role-based permissions for any new feature area using the shared security system.

## Overview

Every new feature should follow this security implementation pattern:
1. **Database Layer** - Org ID enforcement and RLS policies
2. **Domain Layer** - Define feature-specific permissions 
3. **Server Layer** - Server actions and API protection
4. **Client Layer** - UI conditional rendering
5. **Testing** - Validate all permission scenarios

---

## Step 1: Database Layer Security

### 1.1 Ensure Organization ID Enforcement
- [ ] **Add `organization_id` column to all feature tables**
  ```sql
  ALTER TABLE feature_table 
  ADD COLUMN organization_id UUID NOT NULL 
  REFERENCES organizations(id) ON DELETE CASCADE;
  ```
- [ ] **Create indexes for performance**
  ```sql
  CREATE INDEX idx_feature_table_org_id ON feature_table(organization_id);
  CREATE INDEX idx_feature_table_user_org ON feature_table(user_id, organization_id);
  ```

### 1.2 Implement Row Level Security (RLS)
- [ ] **Enable RLS on feature tables**
  ```sql
  ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;
  ```
- [ ] **Create organization-scoped access policy**
  ```sql
  CREATE POLICY "Users can access their organization's feature_table"
  ON feature_table
  FOR ALL
  TO authenticated
  USING (organization_id = get_active_organization_id());
  ```
- [ ] **Create super admin override policy**
  ```sql
  CREATE POLICY "Super admins can access all feature_table"
  ON feature_table
  FOR ALL
  TO authenticated
  USING (is_super_admin());
  ```

### 1.3 Feature Flag Configuration

#### Feature Flag Default Behavior
**Universal Rule**: All features default to **enabled** when the feature flag is missing from the database.

- When flag is missing from database → **Accessible** (defaultEnabled: true)
- Organizations must explicitly disable features they don't want
- This ensures new features work out-of-the-box for existing organizations

#### Manage Feature Flags for Organization
- [ ] **Add feature flag to organizations.feature_flags JSONB column**
  ```sql
  -- Explicitly enable feature (optional, since features default to enabled)
  UPDATE organizations 
  SET feature_flags = feature_flags || '{"feature_name": true}'::jsonb
  WHERE id = 'org-id';
  
  -- Disable feature (when organization doesn't want it)
  UPDATE organizations 
  SET feature_flags = feature_flags || '{"feature_name": false}'::jsonb  
  WHERE id = 'org-id';
  ```

---

## Step 2: Domain Layer Permissions

### 2.1 Define Feature-Specific Permissions
- [ ] **Add permissions to `lib/auth/roles.ts`**
  ```typescript
  export enum Permission {
    // Feature management
    CREATE_FEATURE = 'create:feature',
    UPDATE_FEATURE = 'update:feature', 
    DELETE_FEATURE = 'delete:feature',
    VIEW_FEATURE = 'view:feature',
  }
  ```

### 2.2 Update Role-Permission Mapping
- [ ] **Update `ROLE_PERMISSIONS` in `lib/auth/roles.ts`**
  ```typescript
  export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.ADMIN]: [
      // ... existing permissions
      Permission.CREATE_FEATURE,
      Permission.UPDATE_FEATURE,
      Permission.DELETE_FEATURE,
      Permission.VIEW_FEATURE,
    ],
    [UserRole.EDITOR]: [
      // ... existing permissions
      Permission.CREATE_FEATURE,
      Permission.UPDATE_FEATURE,
      Permission.DELETE_FEATURE,
      Permission.VIEW_FEATURE,
    ],
    [UserRole.MEMBER]: [
      // ... existing permissions
      Permission.CREATE_FEATURE,
      Permission.UPDATE_FEATURE,
      Permission.VIEW_FEATURE,
    ],
    [UserRole.VIEWER]: [
      // ... existing permissions
      Permission.VIEW_FEATURE,
    ],
    [UserRole.VISITOR]: [
      // No feature access
    ]
  };
  ```

---

## Step 3: Server Layer Protection

### 3.1 Create Feature Access Helper
- [ ] **Add convenience function to `lib/shared/access-control/server/checkFeatureAccess.ts`**
  ```typescript
  /**
   * Convenience function for Feature access
   * 
   * AI INSTRUCTIONS:
   * - Universal rule: defaultEnabled defaults to true
   * - All features are enabled when flag is missing from database
   * - Organizations must explicitly disable unwanted features
   */
  export const checkFeatureAccess = (requiredPermissions?: Permission[]) =>
    checkFeatureAccess({
      featureName: 'feature_name',
      requiredPermissions,
      requireOrganization: true,
      defaultEnabled: true // AI: Universal rule - all features default to enabled
    });
  ```

### 3.2 Protect Server Actions
- [ ] **Add permission checks to all server actions**
  ```typescript
  'use server';
  
  export async function createFeature(formData: FormData) {
    try {
      // AI: Check feature access with permissions
      await checkFeatureAccess({
        featureName: 'feature_name',
        requiredPermissions: [Permission.CREATE_FEATURE],
        requireOrganization: true
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Access denied',
        code: ErrorCodes.UNAUTHORIZED
      };
    }
    
    // ... rest of implementation
  }
  ```

### 3.3 Protect Page Components
- [ ] **Add access control to page component**
  ```typescript
  export default async function FeaturePage() {
    try {
      const accessResult = await checkFeatureAccess({
        featureName: 'feature_name',
        requiredPermissions: [Permission.VIEW_FEATURE],
        requireOrganization: true
      });
      
      return <FeaturePageContent organizationId={accessResult.organizationId} />;
      
    } catch (error: any) {
      if (error.message?.includes('feature')) {
        return <FeatureNotAvailable feature="Feature Name" />;
      }
      if (error.message?.includes('organization')) {
        return <NoOrganizationAccess />;
      }
      if (error.message?.includes('permission')) {
        return <InsufficientPermissions feature="Feature Name" />;
      }
      return <NoOrganizationAccess />;
    }
  }
  ```

### 3.4 Ensure Proper Access Control Exports

- [ ] **Add feature access functions to `lib/shared/access-control/index.ts`**
  ```typescript
  // Export convenience functions for easy importing
  export { 
    checkFeatureAccess,
    checkNotesAccess,
    checkTeamAccess,
    // ... other feature access functions
  } from './server/checkFeatureAccess';
  
  // Export permission hooks
  export {
    useFeatureAccess,
    useNotesPermissions,
    useTeamPermissions,
    // ... other permission hooks
  } from './hooks/usePermissions';
  ```

**Common Issue**: Missing exports can cause "function not found" errors when importing convenience functions. Always verify exports are properly configured.

### 3.5 Protect API Routes (if applicable)
- [ ] **Add permission checks to API routes**
  ```typescript
  export async function GET(request: Request) {
    try {
      await checkFeatureAccess({
        featureName: 'feature_name',
        requiredPermissions: [Permission.VIEW_FEATURE],
        requireOrganization: true
      });
    } catch (error) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // ... rest of implementation
  }
  ```

---

## Step 4: Client Layer Conditional Rendering

### 4.1 Access Guard Components - Client Component Requirement

**IMPORTANT**: Access guard components that include interactive elements (buttons, onClick handlers) must be client components.

- [ ] **Add 'use client' directive to interactive guard components**
  ```typescript
  'use client';
  
  /**
   * Feature Not Available Component
   * 
   * AI INSTRUCTIONS:
   * - Must be client component due to interactive elements (onClick handlers)
   * - Display when organization doesn't have feature enabled
   * - Provide upgrade/contact information with working buttons
   */
  
  export function FeatureNotAvailable({ feature, description }: Props) {
    const handleUpgrade = () => {
      window.location.href = '/settings/billing';
    };
    
    return (
      <div>
        <Button onClick={handleUpgrade}>Upgrade Plan</Button>
      </div>
    );
  }
  ```

### 4.2 Use Permission Hooks in Components
- [ ] **Add conditional rendering based on permissions**
  ```typescript
  'use client';
  
  import { useFeatureAccess } from '@/lib/shared/access-control/hooks/useFeatureAccess';
  import { Permission } from '@/lib/auth/roles';
  
  export function FeatureComponent() {
    const { hasPermission, isLoading } = useFeatureAccess('feature_name');
    
    const canCreate = hasPermission(Permission.CREATE_FEATURE);
    const canEdit = hasPermission(Permission.UPDATE_FEATURE);
    const canDelete = hasPermission(Permission.DELETE_FEATURE);
    
    if (isLoading) return <LoadingSpinner />;
    
    return (
      <div>
        {canCreate && <CreateButton />}
        {canEdit && <EditButton />}
        {canDelete && <DeleteButton />}
      </div>
    );
  }
  ```

### 4.3 Handle Read-Only Mode for Viewers
- [ ] **Implement read-only UI for viewers**
  ```typescript
  const isReadOnly = !hasPermission(Permission.UPDATE_FEATURE);
  
  return (
    <div>
      <input 
        disabled={isReadOnly}
        placeholder={isReadOnly ? "Read-only mode" : "Enter text"}
      />
      {!isReadOnly && <SaveButton />}
    </div>
  );
  ```

---

## Step 5: Testing & Validation

### 5.1 Test All Permission Scenarios
- [ ] **Admin user** - Can access all features and actions
- [ ] **Editor user** - Can create/edit/delete (if configured)
- [ ] **Member user** - Can create/edit but not delete (if configured)
- [ ] **Viewer user** - Can only view, no modifications
- [ ] **Visitor user** - No access at all
- [ ] **No organization** - Proper error handling
- [ ] **Feature disabled** - Proper feature flag handling

### 5.2 Test Organization Isolation
- [ ] **User in Org A** cannot see data from Org B
- [ ] **User switches orgs** - data updates correctly
- [ ] **Super admin** can access all organizations

### 5.3 Test UI Conditional Rendering
- [ ] **Buttons show/hide** based on permissions
- [ ] **Forms are read-only** for viewers
- [ ] **Loading states** work properly
- [ ] **Error messages** are user-friendly

---

## Step 6: Documentation & Deployment

### 6.1 Update Documentation
- [ ] **Add feature to permissions documentation**
- [ ] **Update role descriptions** if new capabilities added
- [ ] **Document any special permission rules**

### 6.2 Database Migration
- [ ] **Create migration scripts** for new tables/columns
- [ ] **Seed feature flags** for existing organizations
- [ ] **Test migration on staging** before production

### 6.3 Feature Flag Rollout
- [ ] **Start with feature disabled** in production
- [ ] **Enable for test organizations** first
- [ ] **Gradual rollout** to all organizations
- [ ] **Monitor for permission-related errors**

---

## Runtime Permission Loading & Memory Management

### How Role-Permission Mapping Works at Runtime

**Current Implementation (Hybrid: Database Roles + In-Memory Permissions):**
- **Role Source:** User roles fetched from `organization_memberships` table (database)
- **Permission Mapping:** `ROLE_PERMISSIONS` object in `lib/auth/roles.ts` (in-memory)
- **Loading:** Permissions loaded into memory, roles fetched per request
- **Scope:** Each serverless function instance gets its own permission mapping
- **Updates:** Role changes immediate (database), permission changes require deployment

```typescript
// lib/auth/roles.ts - Loaded into memory at module import
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [...Object.values(Permission)], // All permissions
  [UserRole.EDITOR]: [Permission.CREATE_NOTE, Permission.UPDATE_NOTE, ...],
  // ... other roles
};

// lib/shared/access-control/server/checkFeatureAccess.ts - Hybrid approach
export async function checkFeatureAccess(options) {
  // Get user role from database (organization-specific)
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();
  
  const userRole = membership?.role as UserRole | undefined;
  
  // Fast in-memory permission lookup
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  const hasPermission = requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}
```

**Memory Loading Timeline:**
1. **Server/Function Start:** Module imports load `ROLE_PERMISSIONS` into memory
2. **Permission Check:** Database call for user role + in-memory permission lookup
3. **Function Reuse:** Same permission mapping used for subsequent requests (warm starts)
4. **Cold Start:** New function instance loads fresh permission mapping from code

**Performance Characteristics:**
- **Hybrid Speed:** One database call for role + fast in-memory permission lookup
- **Dynamic Roles:** Role changes take effect immediately (no deployment needed)
- **Static Permissions:** Permission changes require code deployment
- **Organization-Aware:** Roles are organization-specific from database
- **Scalable:** Works well with serverless/Vercel architecture

### Future Database-Driven Approach

**If migrating to database-driven permissions:**
- **Source of Truth:** Database tables (`roles`, `permissions`, `role_permissions`)
- **Loading:** Cache loaded at startup, refreshed periodically
- **Scope:** Shared cache across function instances (Redis/memory)
- **Updates:** Dynamic without code deployment

```typescript
// Future pattern - database-driven with cache
class PermissionCache {
  private static cache: Map<UserRole, Permission[]> = new Map();
  
  static async loadPermissions(): Promise<void> {
    // Load from database into memory cache
    const rolePermissions = await fetchRolePermissionsFromDB();
    this.cache = new Map(rolePermissions);
  }
  
  static hasPermission(role: UserRole, permission: Permission): boolean {
    // Fast cache lookup - occasional database refresh
    return this.cache.get(role)?.includes(permission) ?? false;
  }
}
```

---

## Common Patterns & Best Practices

### Permission Naming Convention
```typescript
// Use namespace:action format
CREATE_FEATURE = 'create:feature'
UPDATE_FEATURE = 'update:feature'
DELETE_FEATURE = 'delete:feature'
VIEW_FEATURE = 'view:feature'
MANAGE_FEATURE = 'manage:feature' // For admin-only actions
```

### Error Handling Pattern
```typescript
try {
  await checkFeatureAccess({ /* ... */ });
} catch (error: any) {
  return {
    success: false,
    message: error.message || 'Access denied',
    code: ErrorCodes.UNAUTHORIZED
  };
}
```

### UI Conditional Rendering Pattern
```typescript
// Using feature-specific permission hooks
const { canCreate, canUpdate, canDelete, isLoading } = useNotesPermissions();

// Or using general permission hook
const { hasPermission, isLoading } = usePermissions();
const canEdit = hasPermission(Permission.UPDATE_FEATURE);

return (
  <div>
    <DisplayComponent />
    {/* Fail-secure: hide during loading, show only with permission */}
    {!isLoading && canEdit && <EditComponent />}
    {!isLoading && canCreate && <CreateButton />}
  </div>
);
```

### Client-Side Role Resolution
```typescript
// useUser hook now fetches role from database (matches server pattern)
const { user, isLoading, auth } = useUser();

// auth.role comes from organization_memberships table
// auth.hasPermission() uses ROLE_PERMISSIONS mapping
// isLoading is true until both user and role are resolved
```

### Organization Context Pattern
```typescript
// Always include organization_id in database operations
const { supabase, user, activeOrgId } = await getAuthContext();

await supabase
  .from('feature_table')
  .insert({
    // ... data
    user_id: user.id,
    organization_id: activeOrgId // Always include this
  });
```

---

## Important Security Considerations

### Super Admin Special Cases
- **Cross-organization access:** Super admins can access all orgs
- **Override policies:** Separate RLS policies for super admin access
- **Audit logging:** Track super admin actions across organizations
- **Permission inheritance:** Super admins get all permissions automatically

### Edge Cases & Error Handling
- **Missing organization context:** Graceful fallback to error state
- **Stale JWT tokens:** Handle token refresh and validation
- **Feature flag race conditions:** Consistent feature flag checking
- **Permission inheritance conflicts:** Clear hierarchy resolution

```typescript
// Handle edge cases in permission checking (client-side)
export function handlePermissionEdgeCases(user: User | null, userRole: UserRole | undefined, permission: Permission) {
  // No user
  if (!user) return false;
  
  // Super admin override
  if (isSuperAdmin(user)) return true;
  
  // Missing role (role fetched from database)
  if (!userRole) {
    console.warn('User has no role assigned:', user.id);
    return false; // Fail-secure
  }
  
  // Check permission using database role
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

// Server-side pattern
export async function handlePermissionEdgeCasesServer(user: User, organizationId: string, permission: Permission) {
  // Fetch role from database
  const { data: membership } = await supabase
    .from('organization_memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single();
  
  const userRole = membership?.role as UserRole | undefined;
  
  return handlePermissionEdgeCases(user, userRole, permission);
}
```

### Audit & Compliance
- **Permission change logging:** Track who changed what permissions when
- **Access attempt logging:** Log denied access attempts for security monitoring
- **Role assignment auditing:** Track role changes and assignments
- **Compliance reporting:** Generate permission reports for audits

### Performance & Monitoring
- **Permission check metrics:** Monitor permission check performance
- **Cache hit rates:** Track permission cache effectiveness (future DB-driven)
- **Error rate monitoring:** Alert on permission-related errors
- **Load testing:** Ensure permission checks scale with user growth

---

## Checklist Template

Copy this checklist for each new feature:

### Database Security
- [ ] Tables have `organization_id NOT NULL` with foreign key
- [ ] RLS policies created for organization scoping
- [ ] Super admin override policies created
- [ ] Indexes created for performance
- [ ] Feature flag added to organizations table

### Domain Permissions
- [ ] Feature-specific permissions defined in `Permission` enum
- [ ] Role-permission mapping updated in `ROLE_PERMISSIONS`
- [ ] Permission hierarchy follows business rules

### Server Protection
- [ ] Convenience function added to `checkFeatureAccess`
- [ ] All server actions protected with permission checks
- [ ] Page components protected with access control
- [ ] API routes protected (if applicable)
- [ ] Proper error handling and user feedback
- [ ] Access control exports added to index file

### Client Rendering
- [ ] `useFeatureAccess` hook used for conditional rendering
- [ ] Create/Edit/Delete buttons conditionally shown
- [ ] Read-only mode implemented for viewers
- [ ] Loading states handled properly
- [ ] Access guard components use 'use client' directive when interactive

### Testing
- [ ] All user roles tested (admin, editor, member, viewer, visitor)
- [ ] Organization isolation verified
- [ ] Feature flag toggle tested
- [ ] UI conditional rendering verified
- [ ] Error scenarios tested

### Documentation
- [ ] Feature added to permission documentation
- [ ] Implementation patterns documented
- [ ] Migration scripts created and tested
- [ ] Deployment plan created

---

This guide ensures consistent, secure, and maintainable permission implementation across all features in your application.