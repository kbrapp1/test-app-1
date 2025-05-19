-- Step 1: Drop the 'v3' policy from organization_memberships to avoid conflicts or further recursion issues
DROP POLICY IF EXISTS "Org members can see memberships in their orgs (v3)" ON "public"."organization_memberships";

-- Step 2: Create the SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.are_users_in_same_org(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
-- Set a specific search_path to ensure the function operates in a known context
-- and to avoid any potential issues with the caller's search_path.
SET search_path = public, auth
AS $$
  EXISTS (
    SELECT 1
    FROM public.organization_memberships om1
    JOIN public.organization_memberships om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = p_target_user_id
  )
$$;

-- Step 3: Drop the previous general member profile view policy from profiles table
DROP POLICY IF EXISTS "Organization members can view profiles of other org members" ON "public"."profiles";

-- Step 4: Create the new policy on profiles using the function
CREATE POLICY "Organization members can view profiles via func"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  public.are_users_in_same_org(profiles.id) -- profiles.id is the id of the profile row being checked
);

-- Down migration (optional, more complex due to multiple steps)
-- DROP POLICY IF EXISTS "Organization members can view profiles via func" ON "public"."profiles";
-- DROP FUNCTION IF EXISTS public.are_users_in_same_org(uuid);
-- Potentially recreate the policies that were dropped if rolling back to a specific previous state. 