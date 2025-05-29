# Super Admin System Guide

## Overview

The super admin system provides a way to grant certain users access to all organizations and bypass Row Level Security (RLS) policies. Super admins can only be created and managed through direct database access in Supabase.

## Database Structure

### Tables

- **`profiles.is_super_admin`**: Boolean column indicating super admin status
- **`super_admin_audit`**: Audit trail for tracking privilege changes

### Functions

- **`is_super_admin()`**: Returns true if current user is a super admin
- **`grant_super_admin(user_id, notes)`**: Grants super admin privileges
- **`revoke_super_admin(user_id, notes)`**: Revokes super admin privileges

## How to Create a Super Admin

Super admins can only be created through Supabase SQL editor for security.

### Step 1: Find the User ID

```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'admin@example.com';
```

### Step 2: Grant Super Admin Privileges

```sql
-- Grant super admin privileges
SELECT public.grant_super_admin(
  'user-uuid-here', 
  'Initial super admin setup for production'
);
```

### Step 3: Verify the Grant

```sql
-- Verify super admin status
SELECT u.email, p.is_super_admin 
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.is_super_admin = true;
```

## Managing Super Admins

### View All Super Admins

```sql
SELECT 
  u.email,
  u.created_at,
  p.is_super_admin,
  p.full_name
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.is_super_admin = true;
```

### View Audit Trail

```sql
SELECT 
  sa.action,
  sa.performed_at,
  target_user.email as target_user_email,
  performed_by_user.email as performed_by_email,
  sa.notes
FROM public.super_admin_audit sa
JOIN auth.users target_user ON sa.target_user_id = target_user.id
LEFT JOIN auth.users performed_by_user ON sa.performed_by_user_id = performed_by_user.id
ORDER BY sa.performed_at DESC;
```

### Revoke Super Admin Privileges

```sql
-- Revoke super admin privileges
SELECT public.revoke_super_admin(
  'user-uuid-here', 
  'Removing super admin access - role change'
);
```

## Security Features

1. **Database-Only Management**: Super admins can only be managed through direct database access
2. **Audit Trail**: All privilege changes are logged with timestamps and notes
3. **Function Security**: Grant/revoke functions use `SECURITY DEFINER` for controlled access
4. **RLS Integration**: Super admin status automatically bypasses RLS policies

## RLS Policy Updates

The super admin system automatically updates existing RLS policies to include super admin bypass:

- Assets: View, insert, update, delete
- Folders: View, insert, update, delete  
- Organizations: View, update
- Organization Memberships: View, manage

## Application Integration

### Checking Super Admin Status

In your application code, you can check super admin status:

```typescript
// Client-side check (for UI only)
const { data: profile } = await supabase
  .from('profiles')
  .select('is_super_admin')
  .eq('id', user.id)
  .single();

// Server-side check using function
const { data: isSuperAdmin } = await supabase
  .rpc('is_super_admin');
```

### Super Admin Features

Super admins automatically get access to:
- All organizations' data
- All assets and folders across organizations
- Organization management capabilities
- User management across all organizations

## Best Practices

1. **Minimal Usage**: Only create super admins when absolutely necessary
2. **Document Changes**: Always include meaningful notes when granting/revoking
3. **Regular Audits**: Periodically review super admin list and audit trail
4. **Secure Access**: Only grant database access to trusted personnel
5. **Environment Separation**: Use different super admins for different environments

## Troubleshooting

### Super Admin Not Working

1. Verify the user exists in `auth.users`
2. Check the `profiles.is_super_admin` column is true
3. Ensure RLS policies include the super admin bypass
4. Check function permissions and definitions

### Migration Issues

If you need to apply migrations:

```bash
# Apply the baseline migration first
npx supabase db push

# Then apply the super admin migration
npx supabase db push
```

## Environment Setup

### Development
- Create a test super admin for development testing
- Use a dedicated test email address

### Production
- Only create super admins for actual administrators
- Use corporate email addresses
- Document who has super admin access

## Emergency Access

If you need emergency access to the system:

1. Access Supabase dashboard directly
2. Use SQL editor to grant super admin privileges
3. Access application with super admin account
4. Resolve the issue
5. Consider revoking emergency access if temporary 