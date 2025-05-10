-- 1. Drop the existing policy
DROP POLICY IF EXISTS "Organization members can access their org data in team_members" ON public.team_members;

-- 2. Create the new policy
CREATE POLICY "Team Member RLS Policy" -- Renamed for clarity
ON public.team_members
FOR ALL -- This applies to SELECT, INSERT, UPDATE, DELETE
TO authenticated
USING (
    -- For SELECT (Read):
    -- Allow if the current user is a member of the team_member's organization.
    EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        WHERE om.organization_id = team_members.organization_id 
          AND om.user_id = auth.uid()
    )
)
WITH CHECK (
    -- For INSERT, UPDATE, DELETE (Write/Modify):
    -- Allow if:
    -- 1. The team_member's organization_id matches the user's active organization.
    -- 2. AND The current user is an 'admin' of that active organization.
    team_members.organization_id = public.get_active_organization_id() 
    AND EXISTS (
        SELECT 1
        FROM public.organization_memberships om
        WHERE om.organization_id = public.get_active_organization_id()
          AND om.user_id = auth.uid()
          AND om.role = 'admin' 
    )
);

-- 3. (Optional but Recommended) Ensure RLS is enabled on the table
-- This command is idempotent; it won't error if RLS is already enabled.
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY; 