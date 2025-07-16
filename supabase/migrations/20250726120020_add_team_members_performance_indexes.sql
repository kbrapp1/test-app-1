-- Migration: Add performance indexes for team members query
-- Purpose: Fix 841ms delay in get_organization_members_with_profiles RPC function
-- Date: 2025-07-26
-- Impact: Should reduce query time from 841ms to <50ms

-- Index 1: Optimize WHERE clause on organization_memberships
-- This speeds up: WHERE om.organization_id = target_org_id
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_id 
ON public.organization_memberships (organization_id);

-- Index 2: Optimize the JOIN operation
-- This speeds up: JOIN profiles p ON om.user_id = p.id
CREATE INDEX IF NOT EXISTS idx_organization_memberships_user_id
ON public.organization_memberships (user_id);

-- Index 3: Composite index for the exact query pattern
-- This optimizes the full query: WHERE + JOIN combination
CREATE INDEX IF NOT EXISTS idx_org_members_composite
ON public.organization_memberships (organization_id, user_id);

-- Index 4: Speed up profile data retrieval
-- This speeds up: SELECT p.id, p.full_name, p.email FROM profiles p
CREATE INDEX IF NOT EXISTS idx_profiles_display_data
ON public.profiles (id, full_name, email);

-- Comment: Removed CONCURRENTLY keyword for transaction compatibility
-- These indexes will be created atomically within the migration transaction

-- Update table statistics for optimal query planning
ANALYZE public.organization_memberships;
ANALYZE public.profiles;

-- Verify indexes were created successfully
-- (This will be visible in Supabase dashboard > Database > Indexes)

/*
Expected performance improvement:
- Before: ~841ms for team members query
- After: ~20-50ms for team members query
- Impact: 90%+ reduction in page load time on hard refresh
*/ 