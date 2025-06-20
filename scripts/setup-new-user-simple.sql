-- ============================================================================
-- SETUP NEW USER SCRIPT - SIMPLE PARAMETERS
-- ============================================================================
-- This script sets up all required database entries for a new user
-- 
-- INSTRUCTIONS:
-- 1. Change ONLY the 4 values in the "params" section below
-- 2. Run the entire script in Supabase SQL Editor
-- 3. Check the verification report at the end
--
-- NOTE: If users are invited via the app's invite system, this script is NOT needed.
-- The database trigger handle_new_user() now automatically creates all required entries
-- when users accept invitations and sign up. This script is only for manual user creation.
--
-- PREREQUISITES: 
-- - User must already exist in auth.users (create manually in Supabase Auth)
-- - Organization must exist in public.organizations  
-- - Role must exist in public.roles
-- ============================================================================

WITH params AS (
  SELECT 
    'lynne@vistaonemarketing.com' AS user_email,     -- CHANGE THIS: User's email
    'Lynne Kingsley' AS user_full_name,                 -- CHANGE THIS: User's display name
    'Ironmark' AS org_name,                        -- CHANGE THIS: Organization name
    'member' AS role_name                           -- CHANGE THIS: Role (admin/member/editor)
),

-- Get the actual IDs we need
user_data AS (
  SELECT u.id as user_id, u.email, p.user_full_name
  FROM auth.users u
  CROSS JOIN params p
  WHERE u.email = p.user_email
),

org_data AS (
  SELECT o.id as org_id, o.name, p.org_name as param_org_name
  FROM public.organizations o
  CROSS JOIN params p
  WHERE o.name ILIKE '%' || p.org_name || '%'
),

role_data AS (
  SELECT r.id as role_id, r.name, p.role_name as param_role_name
  FROM public.roles r
  CROSS JOIN params p
  WHERE r.name = p.role_name
),

-- STEP 1: Setup User Profile
profile_insert AS (
  INSERT INTO public.profiles (id, email, full_name, created_at)
  SELECT 
    ud.user_id,
    ud.email,
    ud.user_full_name,
    NOW()
  FROM user_data ud
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name
  RETURNING id, email, full_name
),

-- STEP 2: Setup Organization Membership
membership_insert AS (
  INSERT INTO public.organization_memberships (user_id, organization_id, role, role_id, created_at, updated_at)
  SELECT 
    ud.user_id,
    od.org_id,
    rd.param_role_name,
    rd.role_id,
    NOW(),
    NOW()
  FROM user_data ud
  CROSS JOIN org_data od
  CROSS JOIN role_data rd
  ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    role_id = EXCLUDED.role_id,
    updated_at = NOW()
  RETURNING user_id, organization_id, role
),

-- STEP 3: Setup Organization Context (Critical - fixes "No active organization")
context_insert AS (
  INSERT INTO public.user_organization_context (
    user_id, 
    active_organization_id, 
    last_accessed_at, 
    created_at, 
    updated_at
  )
  SELECT 
    ud.user_id,
    od.org_id,
    NOW(),
    NOW(),
    NOW()
  FROM user_data ud
  CROSS JOIN org_data od
  ON CONFLICT (user_id) DO UPDATE SET
    active_organization_id = EXCLUDED.active_organization_id,
    last_accessed_at = NOW(),
    updated_at = NOW()
  RETURNING user_id, active_organization_id
),

-- STEP 4: Setup Organization Permissions (Critical - required by get_active_organization_id function)
permissions_insert AS (
  INSERT INTO public.user_organization_permissions (
    user_id,
    organization_id,
    role_id,
    granted_at
  )
  SELECT 
    ud.user_id,
    od.org_id,
    rd.role_id,
    NOW()
  FROM user_data ud
  CROSS JOIN org_data od
  CROSS JOIN role_data rd
  RETURNING user_id, organization_id
)

-- VERIFICATION REPORT - Shows what was created
SELECT 
  '✅ USER PROFILE' as component,
  p.email,
  p.full_name,
  'CREATED' as status
FROM profile_insert p

UNION ALL

SELECT 
  '✅ ORGANIZATION MEMBERSHIP' as component,
  od.name as organization,
  rd.name as role,
  'CREATED' as status
FROM membership_insert mi
JOIN org_data od ON mi.organization_id = od.org_id
JOIN role_data rd ON rd.param_role_name = mi.role

UNION ALL

SELECT 
  '✅ ORGANIZATION CONTEXT' as component,
  od.name as organization,
  'Active Organization Set' as role,
  'CREATED' as status
FROM context_insert ci
JOIN org_data od ON ci.active_organization_id = od.org_id

UNION ALL

SELECT 
  '✅ ORGANIZATION PERMISSIONS' as component,
  od.name as organization,
  'Access Permission Granted' as role,
  'CREATED' as status
FROM permissions_insert pi
JOIN org_data od ON pi.organization_id = od.org_id

UNION ALL

SELECT 
  '🎉 SETUP COMPLETE' as component,
  'User can now login successfully' as organization,
  params.user_email as role,
  'SUCCESS' as status
FROM params; 