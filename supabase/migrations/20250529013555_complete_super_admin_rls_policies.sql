-- Complete super admin RLS policy updates
-- Remove hardcoded UUIDs and add missing super admin policies

-- Update TtsPrediction policy to remove hardcoded UUID
DROP POLICY IF EXISTS "Organization members can access their org data in TtsPrediction" ON public."TtsPrediction";
CREATE POLICY "Organization members can access their org data in TtsPrediction" ON public."TtsPrediction"
  AS PERMISSIVE FOR ALL TO public
  USING (((EXISTS ( SELECT 1
     FROM organization_memberships om
    WHERE ((om.organization_id = "TtsPrediction".organization_id) AND (om.user_id = auth.uid())))) OR public.is_super_admin()))
  WITH CHECK (((organization_id = get_active_organization_id()) OR public.is_super_admin()));

-- Update asset_tags policy to remove hardcoded UUID
DROP POLICY IF EXISTS "Asset Tags: Org members can manage tags for their org assets" ON public.asset_tags;
CREATE POLICY "Asset Tags: Org members can manage tags for their org assets" ON public.asset_tags
  AS PERMISSIVE FOR ALL TO public
  USING (((EXISTS ( SELECT 1
     FROM (assets a
       JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
    WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid())))) OR public.is_super_admin()))
  WITH CHECK (((EXISTS ( SELECT 1
     FROM (assets a
       JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
    WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid()) AND (a.organization_id = get_active_organization_id())))) OR public.is_super_admin()));

-- Add super admin policy for asset_tags
CREATE POLICY "Super admins can manage all asset tags" ON public.asset_tags
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Update organization_domains policies to remove hardcoded UUID
DROP POLICY IF EXISTS "Members can read domains of their organizations" ON public.organization_domains;
CREATE POLICY "Members can read domains of their organizations" ON public.organization_domains
  AS PERMISSIVE FOR SELECT TO public
  USING (((EXISTS ( SELECT 1
     FROM organization_memberships om
    WHERE ((om.organization_id = organization_domains.organization_id) AND (om.user_id = auth.uid())))) OR public.is_super_admin()));

DROP POLICY IF EXISTS "Superusers can manage organization domains" ON public.organization_domains;
CREATE POLICY "Super admins can manage organization domains" ON public.organization_domains
  AS PERMISSIVE FOR ALL TO public
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Add super admin policy for profiles
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Add super admin policy for saved_searches
CREATE POLICY "Super admins can manage all saved searches" ON public.saved_searches
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Add super admin policy for team_members
CREATE POLICY "Super admins can manage all team members" ON public.team_members
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());;
