-- Fix audit trail RLS policies to allow INSERT operations
-- We had SELECT policies but missing INSERT policies

-- Add INSERT policy for users to log their own actions
CREATE POLICY "Users can insert their own audit logs" 
ON public.organization_access_log
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Add INSERT policy for system/service actions (like context_clear with null org_id)
CREATE POLICY "Allow system audit logging" 
ON public.organization_access_log
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND (
    organization_id IS NULL 
    OR organization_id IN (
      SELECT uop.organization_id 
      FROM public.user_organization_permissions uop
      WHERE uop.user_id = auth.uid() 
      AND uop.revoked_at IS NULL
    )
  )
);;
