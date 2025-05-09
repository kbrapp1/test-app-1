-- Drop the existing policy for notes.
-- The name "Organization members can access their org data in notes" was found in migration supabase/migrations/20250507151343_remote_schema.sql
DROP POLICY IF EXISTS "Organization members can access their org data in notes" ON public.notes;

-- Create the new policy for user-specific notes within their active organization.
CREATE POLICY "Enable user access to their notes in active organization"
ON public.notes
FOR ALL -- This applies to SELECT, INSERT, UPDATE, DELETE
USING (
    -- Users can see/update/delete notes if:
    -- 1. The note belongs to their currently active organization.
    -- 2. AND the note belongs to them (their user_id).
    (notes.organization_id = public.get_active_organization_id()) AND (notes.user_id = auth.uid())
)
WITH CHECK (
    -- When inserting or updating a note:
    -- 1. It MUST be associated with their currently active organization.
    -- 2. AND it MUST be associated with their user_id.
    (notes.organization_id = public.get_active_organization_id()) AND (notes.user_id = auth.uid())
);
