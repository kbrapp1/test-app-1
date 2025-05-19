-- Step 1: Drop the previous 'revised' policy
DROP POLICY IF EXISTS "Org members can view all memberships within their own orgs (revised)" ON "public"."organization_memberships";

-- Step 2: Add the new 'v3' policy
CREATE POLICY "Org members can see memberships in their orgs (v3)"
ON "public"."organization_memberships"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.organization_memberships AS self_membership
    WHERE self_membership.user_id = auth.uid()
      AND self_membership.organization_id = organization_memberships.organization_id -- Comparing target row's org_id to current user's org_id(s)
  )
);

-- Down migration (optional)
-- DROP POLICY IF EXISTS "Org members can see memberships in their orgs (v3)" ON "public"."organization_memberships";
-- CREATE POLICY "Org members can view all memberships within their own orgs (revised)" ... (recreate the 'revised' one if needed for rollback) 