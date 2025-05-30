-- ============================================================================
-- USER DIAGNOSTIC SCRIPT
-- ============================================================================
-- This script checks all database entries for a specific user to diagnose
-- why they might be getting "no active organization found" error
-- 
-- INSTRUCTIONS:
-- 1. Change the user_email below
-- 2. Run the script in Supabase SQL Editor
-- 3. Check each section of the report
-- ============================================================================

WITH target_user AS (
  SELECT 'don@vistaonemarketing.com' AS user_email  -- CHANGE THIS: User's email to diagnose
)

-- ============================================================================
-- SECTION 1: Check if user exists in auth.users
-- ============================================================================
SELECT 
  '1. AUTH USER' as section,
  CASE WHEN u.id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  u.id::text as user_id,
  u.email as details
FROM target_user t
LEFT JOIN auth.users u ON u.email = t.user_email

UNION ALL

-- ============================================================================
-- SECTION 2: Check if user has profile
-- ============================================================================
SELECT 
  '2. USER PROFILE' as section,
  CASE WHEN p.id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  p.full_name as user_id,
  COALESCE(p.email, 'No email in profile') as details
FROM target_user t
LEFT JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.profiles p ON p.id = u.id

UNION ALL

-- ============================================================================
-- SECTION 3: Check organization memberships
-- ============================================================================
SELECT 
  '3. ORG MEMBERSHIP' as section,
  CASE WHEN om.user_id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status,
  COALESCE(o.name, 'No organization') as user_id,
  COALESCE(r.name, 'No role') as details
FROM target_user t
LEFT JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.organization_memberships om ON om.user_id = u.id
LEFT JOIN public.organizations o ON o.id = om.organization_id
LEFT JOIN public.roles r ON r.id = om.role_id

UNION ALL

-- ============================================================================
-- SECTION 4: Check organization context (CRITICAL!)
-- ============================================================================
SELECT 
  '4. ORG CONTEXT' as section,
  CASE WHEN uoc.user_id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING - THIS IS THE PROBLEM!' END as status,
  COALESCE(o.name, 'No active organization') as user_id,
  COALESCE(uoc.last_accessed_at::text, 'No access time') as details
FROM target_user t
LEFT JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.user_organization_context uoc ON uoc.user_id = u.id
LEFT JOIN public.organizations o ON o.id = uoc.active_organization_id

UNION ALL

-- ============================================================================
-- SECTION 5: Test the get_active_organization_id function
-- ============================================================================
SELECT 
  '5. FUNCTION TEST' as section,
  'Testing get_active_organization_id()' as status,
  'This should return org ID for authenticated user' as user_id,
  'Run this separately while logged in as Don' as details

UNION ALL

-- ============================================================================
-- SECTION 6: Available organizations for reference
-- ============================================================================
SELECT 
  '6. AVAILABLE ORGS' as section,
  '📋 REFERENCE' as status,
  o.name as user_id,
  o.id::text as details
FROM public.organizations o
ORDER BY o.name

UNION ALL

-- ============================================================================
-- SECTION 7: Available roles for reference
-- ============================================================================
SELECT 
  '7. AVAILABLE ROLES' as section,
  '📋 REFERENCE' as status,
  r.name as user_id,
  r.id::text as details
FROM public.roles r
ORDER BY r.name;

-- ============================================================================
-- SEPARATE QUERY: Raw data dump for debugging
-- ============================================================================

-- Uncomment this section if you need raw data:
/*
SELECT '=== RAW DATA DUMP ===' as debug_info;

SELECT 'auth.users' as table_name, u.id, u.email, u.created_at
FROM target_user t
JOIN auth.users u ON u.email = t.user_email;

SELECT 'profiles' as table_name, p.id, p.email, p.full_name, p.created_at
FROM target_user t
JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.profiles p ON p.id = u.id;

SELECT 'organization_memberships' as table_name, om.user_id, om.organization_id, om.role, om.role_id
FROM target_user t
JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.organization_memberships om ON om.user_id = u.id;

SELECT 'user_organization_context' as table_name, uoc.user_id, uoc.active_organization_id, uoc.last_accessed_at
FROM target_user t
JOIN auth.users u ON u.email = t.user_email
LEFT JOIN public.user_organization_context uoc ON uoc.user_id = u.id;
*/ 