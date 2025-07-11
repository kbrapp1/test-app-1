alter table "public"."organization_memberships" drop constraint "organization_memberships_role_check";

alter table "public"."organization_memberships" add constraint "organization_memberships_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text, 'editor'::text, 'viewer'::text, 'visitor'::text]))) not valid;

alter table "public"."organization_memberships" validate constraint "organization_memberships_role_check";


