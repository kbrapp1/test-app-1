CREATE POLICY "Organization members can view profiles of other org members"
ON "public"."profiles"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM
      "public"."organization_memberships" om1
    JOIN
      "public"."organization_memberships" om2 ON om1.organization_id = om2.organization_id
    WHERE
      om1.user_id = auth.uid() AND om2.user_id = profiles.id
  )
);

-- Down migration (optional, but good practice)
-- DROP POLICY IF EXISTS "Organization members can view profiles of other org members" ON "public"."profiles"; 