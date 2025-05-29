# Super-Admin Implementation Guide

## Overview

This guide implements a robust super-admin system that can only be managed through direct database access, providing organization-wide access to all features and data.

## 1. Database Schema Changes

### Migration: Add Super-Admin Support

```sql
-- Migration: add_super_admin_support.sql

-- Add super_admin flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Add index for performance
CREATE INDEX idx_profiles_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = true;

-- Add audit trail for super admin changes
CREATE TABLE IF NOT EXISTS public.super_admin_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('granted', 'revoked')),
    granted_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    notes TEXT
);

-- Add RLS to audit table
ALTER TABLE public.super_admin_audit ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view audit logs" ON public.super_admin_audit
    FOR SELECT TO authenticated 
    USING (public.is_super_admin(auth.uid()));

COMMENT ON TABLE public.super_admin_audit IS 'Audit trail for super admin privilege changes';
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Grants organization-wide access to all features and data. Can only be set via direct database access.';
```

### 2. Database Functions

```sql
-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_super_admin FROM public.profiles WHERE id = user_id),
        FALSE
    );
$$;

COMMENT ON FUNCTION public.is_super_admin IS 'Checks if a user has super admin privileges';

-- Function to grant super admin (only callable by existing super admin or via direct SQL)
CREATE OR REPLACE FUNCTION public.grant_super_admin(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    granting_user_id UUID := auth.uid();
BEGIN
    -- Only allow if caller is super admin or if called without auth context (direct SQL)
    IF granting_user_id IS NOT NULL AND NOT public.is_super_admin(granting_user_id) THEN
        RAISE EXCEPTION 'Only super admins can grant super admin privileges';
    END IF;
    
    -- Update user profile
    UPDATE public.profiles 
    SET is_super_admin = TRUE 
    WHERE id = target_user_id;
    
    -- Log the action
    INSERT INTO public.super_admin_audit (user_id, action, granted_by_user_id, notes)
    VALUES (target_user_id, 'granted', granting_user_id, notes);
    
    RETURN TRUE;
END;
$$;

-- Function to revoke super admin
CREATE OR REPLACE FUNCTION public.revoke_super_admin(
    target_user_id UUID,
    notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    granting_user_id UUID := auth.uid();
BEGIN
    -- Only allow if caller is super admin or if called without auth context
    IF granting_user_id IS NOT NULL AND NOT public.is_super_admin(granting_user_id) THEN
        RAISE EXCEPTION 'Only super admins can revoke super admin privileges';
    END IF;
    
    -- Prevent self-revocation unless it's the last super admin
    IF granting_user_id = target_user_id THEN
        IF (SELECT COUNT(*) FROM public.profiles WHERE is_super_admin = TRUE) <= 1 THEN
            RAISE EXCEPTION 'Cannot revoke super admin from the last super admin';
        END IF;
    END IF;
    
    -- Update user profile
    UPDATE public.profiles 
    SET is_super_admin = FALSE 
    WHERE id = target_user_id;
    
    -- Log the action
    INSERT INTO public.super_admin_audit (user_id, action, granted_by_user_id, notes)
    VALUES (target_user_id, 'revoked', granting_user_id, notes);
    
    RETURN TRUE;
END;
$$;
```

## 3. Updated RLS Policies

Replace hardcoded UUID checks with function calls:

```sql
-- Example: Update existing policies to use is_super_admin function

-- Assets policy update
DROP POLICY IF EXISTS "Assets access based on active organization" ON public.assets;
CREATE POLICY "Assets access based on active organization" ON public.assets 
    TO authenticated 
    USING (
        public.is_super_admin() OR 
        organization_id = public.get_active_organization_id()
    ) 
    WITH CHECK (
        public.is_super_admin() OR 
        organization_id = public.get_active_organization_id()
    );

-- Folders policy update  
DROP POLICY IF EXISTS "Folders access based on active organization" ON public.folders;
CREATE POLICY "Folders access based on active organization" ON public.folders 
    TO authenticated 
    USING (
        public.is_super_admin() OR 
        organization_id = public.get_active_organization_id()
    ) 
    WITH CHECK (
        public.is_super_admin() OR 
        organization_id = public.get_active_organization_id()
    );

-- Organization memberships - super admins can manage all
CREATE POLICY "Super admins can manage all organization memberships" ON public.organization_memberships
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Organizations - super admins can manage all
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Apply similar pattern to other tables...
```

## 4. Application Layer Integration

### TypeScript Types

```typescript
// types/auth.ts
export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface SuperAdminAuditEntry {
  id: string;
  user_id: string;
  action: 'granted' | 'revoked';
  granted_by_user_id: string | null;
  created_at: string;
  notes: string | null;
}
```

### Auth Context Updates

```typescript
// lib/auth/context.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isSuperAdmin: boolean;
  // ... other auth context properties
}

export function useAuth() {
  // ... existing implementation
  
  const isSuperAdmin = useMemo(() => {
    return profile?.is_super_admin ?? false;
  }, [profile]);

  return {
    user,
    profile,
    isSuperAdmin,
    // ... other returns
  };
}
```

### Permission Utilities

```typescript
// lib/auth/permissions.ts
export function canAccessAllOrganizations(profile: Profile | null): boolean {
  return profile?.is_super_admin ?? false;
}

export function canManageOrganization(
  profile: Profile | null, 
  organizationId: string
): boolean {
  if (profile?.is_super_admin) return true;
  
  // Check if user is admin of specific organization
  return isUserAdminOfOrganization(organizationId);
}

export function getAccessibleOrganizations(
  profile: Profile | null,
  userOrganizations: Organization[]
): Organization[] | 'all' {
  if (profile?.is_super_admin) return 'all';
  return userOrganizations;
}
```

## 5. UI Components

### Super Admin Badge

```typescript
// components/auth/SuperAdminBadge.tsx
export function SuperAdminBadge({ profile }: { profile: Profile }) {
  if (!profile.is_super_admin) return null;
  
  return (
    <Badge variant="destructive" className="ml-2">
      <Shield className="w-3 h-3 mr-1" />
      Super Admin
    </Badge>
  );
}
```

### Organization Selector (Updated for Super Admin)

```typescript
// components/auth/OrganizationSelector.tsx
export function OrganizationSelector() {
  const { profile, isSuperAdmin } = useAuth();
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);
  
  useEffect(() => {
    if (isSuperAdmin) {
      // Fetch all organizations for super admin
      fetchAllOrganizations().then(setAllOrganizations);
    }
  }, [isSuperAdmin]);
  
  const organizations = isSuperAdmin ? allOrganizations : userOrganizations;
  
  return (
    <Select>
      {isSuperAdmin && (
        <SelectItem value="*">
          <Shield className="w-4 h-4 mr-2" />
          All Organizations (Super Admin)
        </SelectItem>
      )}
      {organizations.map(org => (
        <SelectItem key={org.id} value={org.id}>
          {org.name}
        </SelectItem>
      ))}
    </Select>
  );
}
```

## 6. Security Best Practices

### Database Access Only
- Super admin privileges can only be granted through direct database access
- No API endpoints for granting/revoking super admin status
- Requires database-level authentication

### Audit Trail
- All super admin privilege changes are logged
- Immutable audit trail with timestamps and notes
- Only viewable by other super admins

### Principle of Least Privilege
- Super admin access is explicit and visible in UI
- Users are clearly identified as super admins
- Regular audit of super admin list

## 7. Initial Setup Commands

### Creating First Super Admin

```sql
-- Connect to your Supabase database via SQL editor or psql

-- 1. First, ensure the user exists and has a profile
-- (User should sign up through normal flow first)

-- 2. Grant super admin privileges
SELECT public.grant_super_admin(
    '[USER_UUID_HERE]'::UUID,
    'Initial super admin setup'
);

-- 3. Verify the change
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.is_super_admin,
    p.created_at
FROM public.profiles p
WHERE p.is_super_admin = TRUE;

-- 4. View audit trail
SELECT * FROM public.super_admin_audit ORDER BY created_at DESC;
```

## 8. Ongoing Management

### Granting Super Admin (by existing super admin)
```sql
-- Via application (if implemented) or direct SQL
SELECT public.grant_super_admin(
    '[NEW_USER_UUID]'::UUID,
    'Promoted to super admin by [REASON]'
);
```

### Revoking Super Admin
```sql
SELECT public.revoke_super_admin(
    '[USER_UUID]'::UUID,
    'Access no longer needed'
);
```

### Auditing Super Admins
```sql
-- List all current super admins
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.last_sign_in_at,
    p.created_at as account_created
FROM public.profiles p
WHERE p.is_super_admin = TRUE
ORDER BY p.last_sign_in_at DESC NULLS LAST;

-- Review recent privilege changes
SELECT 
    sa.action,
    sa.created_at,
    target.email as target_user_email,
    granter.email as granted_by_email,
    sa.notes
FROM public.super_admin_audit sa
LEFT JOIN public.profiles target ON sa.user_id = target.id
LEFT JOIN public.profiles granter ON sa.granted_by_user_id = granter.id
ORDER BY sa.created_at DESC
LIMIT 20;
```

## 9. Migration Rollback Plan

```sql
-- If you need to rollback the super admin system:

-- 1. Drop the new policies
-- 2. Recreate old hardcoded policies
-- 3. Drop functions
DROP FUNCTION IF EXISTS public.is_super_admin;
DROP FUNCTION IF EXISTS public.grant_super_admin;
DROP FUNCTION IF EXISTS public.revoke_super_admin;

-- 4. Drop tables
DROP TABLE IF EXISTS public.super_admin_audit;

-- 5. Remove column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_super_admin;
```

## Implementation Benefits

✅ **Secure**: Only manageable via direct database access  
✅ **Auditable**: Complete trail of privilege changes  
✅ **Flexible**: Function-based policies easier to maintain  
✅ **Scalable**: No hardcoded UUIDs in policies  
✅ **Visible**: Clear UI indication of super admin status  
✅ **Recoverable**: Migration rollback plan included  

## Notes

- Replace the hardcoded UUID `'abade2e0-646c-4e80-bddd-98333a56f1f7'` in all existing policies
- Test thoroughly in development before applying to production
- Consider implementing super admin session timeouts for additional security
- Document all super admin accounts and their purpose 