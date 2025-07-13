alter table "public"."organization_memberships" drop constraint "organization_memberships_role_check";

create table "public"."cache_invalidation_events" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "event_type" character varying(50) not null,
    "organization_id" uuid,
    "previous_organization_id" uuid,
    "event_data" jsonb default '{}'::jsonb,
    "processed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
);


alter table "public"."cache_invalidation_events" enable row level security;

CREATE UNIQUE INDEX cache_invalidation_events_pkey ON public.cache_invalidation_events USING btree (id);

CREATE INDEX idx_cache_invalidation_events_user_unprocessed ON public.cache_invalidation_events USING btree (user_id, created_at) WHERE (processed_at IS NULL);

alter table "public"."cache_invalidation_events" add constraint "cache_invalidation_events_pkey" PRIMARY KEY using index "cache_invalidation_events_pkey";

alter table "public"."cache_invalidation_events" add constraint "cache_invalidation_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."cache_invalidation_events" validate constraint "cache_invalidation_events_organization_id_fkey";

alter table "public"."cache_invalidation_events" add constraint "cache_invalidation_events_previous_organization_id_fkey" FOREIGN KEY (previous_organization_id) REFERENCES organizations(id) not valid;

alter table "public"."cache_invalidation_events" validate constraint "cache_invalidation_events_previous_organization_id_fkey";

alter table "public"."cache_invalidation_events" add constraint "cache_invalidation_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."cache_invalidation_events" validate constraint "cache_invalidation_events_user_id_fkey";

alter table "public"."organization_memberships" add constraint "organization_memberships_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text, 'editor'::text, 'viewer'::text, 'visitor'::text]))) not valid;

alter table "public"."organization_memberships" validate constraint "organization_memberships_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_unprocessed_cache_events(user_uuid uuid DEFAULT auth.uid())
 RETURNS TABLE(id uuid, event_type character varying, organization_id uuid, previous_organization_id uuid, event_data jsonb, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.event_type,
    e.organization_id,
    e.previous_organization_id,
    e.event_data,
    e.created_at
  FROM public.cache_invalidation_events e
  WHERE e.user_id = user_uuid
  AND e.processed_at IS NULL
  ORDER BY e.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_cache_invalidation_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Log the cache invalidation need for application to pick up
  INSERT INTO public.cache_invalidation_events (
    user_id,
    event_type,
    organization_id,
    previous_organization_id,
    event_data,
    created_at
  ) VALUES (
    COALESCE(NEW.user_id, OLD.user_id),
    'organization_switch',
    NEW.active_organization_id,
    OLD.active_organization_id,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'unified_context_invalidation_needed', true
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_cache_invalidation_processed(event_ids uuid[])
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.cache_invalidation_events
  SET processed_at = NOW()
  WHERE id = ANY(event_ids)
  AND processed_at IS NULL
  AND user_id = auth.uid(); -- Security: only process own events

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$function$
;

grant delete on table "public"."cache_invalidation_events" to "anon";

grant insert on table "public"."cache_invalidation_events" to "anon";

grant references on table "public"."cache_invalidation_events" to "anon";

grant select on table "public"."cache_invalidation_events" to "anon";

grant trigger on table "public"."cache_invalidation_events" to "anon";

grant truncate on table "public"."cache_invalidation_events" to "anon";

grant update on table "public"."cache_invalidation_events" to "anon";

grant delete on table "public"."cache_invalidation_events" to "authenticated";

grant insert on table "public"."cache_invalidation_events" to "authenticated";

grant references on table "public"."cache_invalidation_events" to "authenticated";

grant select on table "public"."cache_invalidation_events" to "authenticated";

grant trigger on table "public"."cache_invalidation_events" to "authenticated";

grant truncate on table "public"."cache_invalidation_events" to "authenticated";

grant update on table "public"."cache_invalidation_events" to "authenticated";

grant delete on table "public"."cache_invalidation_events" to "service_role";

grant insert on table "public"."cache_invalidation_events" to "service_role";

grant references on table "public"."cache_invalidation_events" to "service_role";

grant select on table "public"."cache_invalidation_events" to "service_role";

grant trigger on table "public"."cache_invalidation_events" to "service_role";

grant truncate on table "public"."cache_invalidation_events" to "service_role";

grant update on table "public"."cache_invalidation_events" to "service_role";

create policy "Users can view their own cache invalidation events"
on "public"."cache_invalidation_events"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


CREATE TRIGGER trigger_org_membership_cache_invalidation AFTER UPDATE OF role ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION log_cache_invalidation_event();

CREATE TRIGGER trigger_org_context_cache_invalidation AFTER UPDATE OF active_organization_id ON public.user_organization_context FOR EACH ROW WHEN ((old.active_organization_id IS DISTINCT FROM new.active_organization_id)) EXECUTE FUNCTION log_cache_invalidation_event();


