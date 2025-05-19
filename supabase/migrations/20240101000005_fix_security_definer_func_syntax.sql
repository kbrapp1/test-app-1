-- Step 1: Drop the function if it was partially created or exists from a failed attempt
DROP FUNCTION IF EXISTS public.are_users_in_same_org(uuid);

-- Step 2: Create the SECURITY DEFINER function with corrected syntax
CREATE OR REPLACE FUNCTION public.are_users_in_same_org(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om1
    JOIN public.organization_memberships om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = p_target_user_id
  );
$$;

-- Step 3: Ensure problematic policies are dropped
DROP POLICY IF EXISTS "Org members can see memberships in their orgs (v3)" ON "public"."organization_memberships";
DROP POLICY IF EXISTS "Organization members can view profiles of other org members" ON "public"."profiles";

-- Step 4: Re-create the desired policy on profiles using the corrected function
DROP POLICY IF EXISTS "Organization members can view profiles via func" ON "public"."profiles"; -- Drop first in case it exists from a partial apply
CREATE POLICY "Organization members can view profiles via func"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  public.are_users_in_same_org(profiles.id)
);

-- Down migration (optional)
-- DROP POLICY IF EXISTS "Organization members can view profiles via func" ON "public"."profiles";
-- DROP FUNCTION IF EXISTS public.are_users_in_same_org(uuid); 