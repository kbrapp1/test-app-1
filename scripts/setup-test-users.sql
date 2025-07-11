-- ============================================================================
-- SETUP TEST USERS FOR ROLE-BASED PERMISSION TESTING
-- ============================================================================
-- This script sets up test users to verify role-based permissions implementation
-- 
-- PREREQUISITES: 
-- - Users must already exist in auth.users (create manually in Supabase Auth)
-- - Organizations must exist: Ironmark, Acme
-- - Roles must exist: viewer, editor
--
-- USERS TO CREATE IN AUTH FIRST:
-- - visitor-ironmark@vistaonemarketing.com (pwd: test123#)
-- - visitor-acme@vistaonemarketing.com (pwd: test123#)
-- - editor-ironmark@vistaonemarketing.com (pwd: test123#)
-- - editor-acme@vistaonemarketing.com (pwd: test123#)
-- ============================================================================

-- ============================================================================
-- USER 1: visitor-ironmark@vistaonemarketing.com (viewer role, Ironmark org)
-- ============================================================================
WITH params AS (
  SELECT 
    'visitor-ironmark@vistaonemarketing.com' AS user_email,
    'Visitor Ironmark' AS user_full_name,
    'Ironmark' AS org_name,
    'viewer' AS role_name
),

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

SELECT 
  '✅ USER 1: visitor-ironmark@vistaonemarketing.com' as status,
  'viewer role in Ironmark' as details,
  'CREATED' as result
FROM profile_insert
LIMIT 1;

-- ============================================================================
-- USER 2: visitor-acme@vistaonemarketing.com (viewer role, Acme org)
-- ============================================================================
WITH params AS (
  SELECT 
    'visitor-acme@vistaonemarketing.com' AS user_email,
    'Visitor Acme' AS user_full_name,
    'Acme' AS org_name,
    'viewer' AS role_name
),

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

SELECT 
  '✅ USER 2: visitor-acme@vistaonemarketing.com' as status,
  'viewer role in Acme' as details,
  'CREATED' as result
FROM profile_insert
LIMIT 1;

-- ============================================================================
-- USER 3: editor-ironmark@vistaonemarketing.com (editor role, Ironmark org)
-- ============================================================================
WITH params AS (
  SELECT 
    'editor-ironmark@vistaonemarketing.com' AS user_email,
    'Editor Ironmark' AS user_full_name,
    'Ironmark' AS org_name,
    'editor' AS role_name
),

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

SELECT 
  '✅ USER 3: editor-ironmark@vistaonemarketing.com' as status,
  'editor role in Ironmark' as details,
  'CREATED' as result
FROM profile_insert
LIMIT 1;

-- ============================================================================
-- USER 4: editor-acme@vistaonemarketing.com (editor role, Acme org)
-- ============================================================================
WITH params AS (
  SELECT 
    'editor-acme@vistaonemarketing.com' AS user_email,
    'Editor Acme' AS user_full_name,
    'Acme' AS org_name,
    'editor' AS role_name
),

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

SELECT 
  '✅ USER 4: editor-acme@vistaonemarketing.com' as status,
  'editor role in Acme' as details,
  'CREATED' as result
FROM profile_insert
LIMIT 1;

-- ============================================================================
-- VERIFICATION REPORT
-- ============================================================================
SELECT 
  '🎉 ALL TEST USERS SETUP COMPLETE' as status,
  'Ready for role-based permission testing' as details,
  'SUCCESS' as result; 