-- Add super admin support to the application
-- This allows adding super admins that can access all organizations and bypass RLS

-- Add is_super_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN is_super_admin boolean NOT NULL DEFAULT false;
-- Create super_admin_audit table for tracking privilege changes
CREATE TABLE public.super_admin_audit (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    target_user_id uuid NOT NULL,
    action text NOT NULL CHECK (action IN ('granted', 'revoked')),
    performed_by_user_id uuid,
    performed_at timestamp with time zone NOT NULL DEFAULT now(),
    notes text
);
ALTER TABLE public.super_admin_audit ENABLE ROW LEVEL SECURITY;
-- Add primary key and foreign key constraints
ALTER TABLE public.super_admin_audit ADD CONSTRAINT super_admin_audit_pkey PRIMARY KEY (id);
ALTER TABLE public.super_admin_audit ADD CONSTRAINT super_admin_audit_target_user_id_fkey 
    FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.super_admin_audit ADD CONSTRAINT super_admin_audit_performed_by_user_id_fkey 
    FOREIGN KEY (performed_by_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
-- Create function to check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;
-- Create function to grant super admin privileges (can only be called from SQL)
CREATE OR REPLACE FUNCTION public.grant_super_admin(target_user_id uuid, notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_exists boolean;
BEGIN
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO target_exists;
  
  IF NOT target_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
  END IF;

  -- Update user to super admin
  UPDATE public.profiles 
  SET is_super_admin = true 
  WHERE id = target_user_id;

  -- Create audit record
  INSERT INTO public.super_admin_audit (target_user_id, action, performed_by_user_id, notes)
  VALUES (target_user_id, 'granted', auth.uid(), notes);

  RETURN true;
END;
$$;
-- Create function to revoke super admin privileges
CREATE OR REPLACE FUNCTION public.revoke_super_admin(target_user_id uuid, notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_exists boolean;
BEGIN
  -- Check if target user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = target_user_id) INTO target_exists;
  
  IF NOT target_exists THEN
    RAISE EXCEPTION 'User with ID % does not exist', target_user_id;
  END IF;

  -- Update user to remove super admin
  UPDATE public.profiles 
  SET is_super_admin = false 
  WHERE id = target_user_id;

  -- Create audit record
  INSERT INTO public.super_admin_audit (target_user_id, action, performed_by_user_id, notes)
  VALUES (target_user_id, 'revoked', auth.uid(), notes);

  RETURN true;
END;
$$;
-- Create RLS policies for super_admin_audit table
CREATE POLICY "Super admins can view audit logs" ON public.super_admin_audit
  FOR SELECT USING (public.is_super_admin());
CREATE POLICY "Only super admins can insert audit records" ON public.super_admin_audit
  FOR INSERT WITH CHECK (public.is_super_admin());
-- Update existing RLS policies to use the super admin function instead of hardcoded UUID
-- This replaces the hardcoded 'abade2e0-646c-4e80-bddd-98333a56f1f7' with function calls

-- Update tags policy to use super admin function
DROP POLICY IF EXISTS "Organization members can access their org data in tags" ON public.tags;
CREATE POLICY "Organization members can access their org data in tags" ON public.tags
  AS PERMISSIVE FOR ALL TO public
  USING (((EXISTS ( SELECT 1
     FROM organization_memberships om
    WHERE ((om.organization_id = tags.organization_id) AND (om.user_id = auth.uid())))) OR public.is_super_admin()))
  WITH CHECK (((organization_id = get_active_organization_id()) OR public.is_super_admin()));
-- Update team_user_memberships superuser policy
DROP POLICY IF EXISTS "Superusers can manage team user memberships" ON public.team_user_memberships;
CREATE POLICY "Superusers can manage team user memberships" ON public.team_user_memberships
  AS PERMISSIVE FOR ALL TO public
  USING (public.is_super_admin());
-- Update teams superuser policy  
DROP POLICY IF EXISTS "Superusers can manage teams" ON public.teams;
CREATE POLICY "Superusers can manage teams" ON public.teams
  AS PERMISSIVE FOR ALL TO public
  USING (public.is_super_admin());
-- Add super admin policies for core tables that don't currently have super admin access

-- Add super admin access to assets
CREATE POLICY "Super admins can manage all assets" ON public.assets
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add super admin access to folders
CREATE POLICY "Super admins can manage all folders" ON public.folders
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add super admin access to organizations
CREATE POLICY "Super admins can manage all organizations" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add super admin access to organization memberships
CREATE POLICY "Super admins can manage all organization memberships" ON public.organization_memberships
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add super admin access to TtsPrediction
CREATE POLICY "Super admins can manage all TTS predictions" ON public."TtsPrediction"
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add super admin access to notes
CREATE POLICY "Super admins can manage all notes" ON public.notes
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
-- Add index for better performance on super admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON public.profiles(is_super_admin) WHERE is_super_admin = true;
-- Add comments for documentation
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Indicates if user has super admin privileges to access all organizations';
COMMENT ON TABLE public.super_admin_audit IS 'Audit trail for super admin privilege changes';
COMMENT ON FUNCTION public.is_super_admin() IS 'Returns true if current user is a super admin';
COMMENT ON FUNCTION public.grant_super_admin(uuid, text) IS 'Grants super admin privileges to a user (Supabase-only function)';
COMMENT ON FUNCTION public.revoke_super_admin(uuid, text) IS 'Revokes super admin privileges from a user';
