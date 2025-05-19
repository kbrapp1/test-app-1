-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Org members can view all memberships within their own orgs" ON "public"."organization_memberships";

-- Step 2: Add the revised, non-recursive policy
CREATE POLICY "Org members can view all memberships within their own orgs (revised)"
ON "public"."organization_memberships"
FOR SELECT
TO authenticated
USING (
  organization_memberships.organization_id IN (
    SELECT om_current_user.organization_id
    FROM public.organization_memberships AS om_current_user
    WHERE om_current_user.user_id = auth.uid()
  )
);

-- Down migration (optional, but good practice)
-- DROP POLICY IF EXISTS "Org members can view all memberships within their own orgs (revised)" ON "public"."organization_memberships";
-- CREATE POLICY "Org members can view all memberships within their own orgs" ... (recreate the old problematic one if needed for rollback, though not recommended) 