drop policy "Superusers can manage organization domains" on "public"."organization_domains";

drop policy "Organization members can access their org data in TtsPrediction" on "public"."TtsPrediction";

drop policy "Asset Tags: Org members can manage tags for their org assets" on "public"."asset_tags";

drop policy "Members can read domains of their organizations" on "public"."organization_domains";

create policy "Super admins can manage all asset tags"
on "public"."asset_tags"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "Super admins can manage organization domains"
on "public"."organization_domains"
as permissive
for all
to public
using (is_super_admin())
with check (is_super_admin());


create policy "Super admins can manage all profiles"
on "public"."profiles"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "Super admins can manage all saved searches"
on "public"."saved_searches"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


create policy "Super admins can manage all team members"
on "public"."team_members"
as permissive
for all
to authenticated
using (is_super_admin())
with check (is_super_admin());


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



