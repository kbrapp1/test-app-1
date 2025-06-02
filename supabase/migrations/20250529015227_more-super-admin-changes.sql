drop policy if exists "Superusers can manage organization domains" on "public"."organization_domains";

drop policy if exists "Organization members can access their org data in TtsPrediction" on "public"."TtsPrediction";

drop policy if exists "Asset Tags: Org members can manage tags for their org assets" on "public"."asset_tags";

drop policy if exists "Members can read domains of their organizations" on "public"."organization_domains";

-- Note: Super admin policies are already created in migration 20250529013555
-- These CREATE statements have been removed to avoid duplicates


create policy "Organization members can access their org data in TtsPrediction"
on "public"."TtsPrediction"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = "TtsPrediction".organization_id) AND (om.user_id = auth.uid())))) OR is_super_admin()))
with check (((organization_id = get_active_organization_id()) OR is_super_admin()));


create policy "Asset Tags: Org members can manage tags for their org assets"
on "public"."asset_tags"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM (assets a
     JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
  WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid())))) OR is_super_admin()))
with check (((EXISTS ( SELECT 1
   FROM (assets a
     JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
  WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid()) AND (a.organization_id = get_active_organization_id())))) OR is_super_admin()));


create policy "Members can read domains of their organizations"
on "public"."organization_domains"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = organization_domains.organization_id) AND (om.user_id = auth.uid())))) OR is_super_admin()));



