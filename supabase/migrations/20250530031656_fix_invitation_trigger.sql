create table "public"."organization_access_log" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "organization_id" uuid,
    "action" character varying(50) not null,
    "details" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "session_id" text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."organization_access_log" enable row level security;

create table "public"."user_organization_context" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "active_organization_id" uuid,
    "last_accessed_at" timestamp with time zone default now(),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_organization_context" enable row level security;

create table "public"."user_organization_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "role_id" uuid not null,
    "granted_at" timestamp with time zone default now(),
    "granted_by" uuid,
    "revoked_at" timestamp with time zone,
    "revoked_by" uuid,
    "metadata" jsonb default '{}'::jsonb
);


alter table "public"."user_organization_permissions" enable row level security;

CREATE INDEX idx_org_access_log_action ON public.organization_access_log USING btree (action);

CREATE INDEX idx_org_access_log_created_at ON public.organization_access_log USING btree (created_at DESC);

CREATE INDEX idx_org_access_log_org_time ON public.organization_access_log USING btree (organization_id, created_at DESC);

CREATE INDEX idx_org_access_log_user_time ON public.organization_access_log USING btree (user_id, created_at DESC);

CREATE UNIQUE INDEX idx_user_org_active_permission ON public.user_organization_permissions USING btree (user_id, organization_id) WHERE (revoked_at IS NULL);

CREATE INDEX idx_user_org_context_org_id ON public.user_organization_context USING btree (active_organization_id);

CREATE INDEX idx_user_org_context_user_id ON public.user_organization_context USING btree (user_id);

CREATE INDEX idx_user_org_permissions_active ON public.user_organization_permissions USING btree (user_id) WHERE (revoked_at IS NULL);

CREATE INDEX idx_user_org_permissions_user_org ON public.user_organization_permissions USING btree (user_id, organization_id);

CREATE UNIQUE INDEX organization_access_log_pkey ON public.organization_access_log USING btree (id);

CREATE UNIQUE INDEX user_organization_context_pkey ON public.user_organization_context USING btree (id);

CREATE UNIQUE INDEX user_organization_context_user_id_key ON public.user_organization_context USING btree (user_id);

CREATE UNIQUE INDEX user_organization_permissions_pkey ON public.user_organization_permissions USING btree (id);

alter table "public"."organization_access_log" add constraint "organization_access_log_pkey" PRIMARY KEY using index "organization_access_log_pkey";

alter table "public"."user_organization_context" add constraint "user_organization_context_pkey" PRIMARY KEY using index "user_organization_context_pkey";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_pkey" PRIMARY KEY using index "user_organization_permissions_pkey";

alter table "public"."organization_access_log" add constraint "organization_access_log_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) not valid;

alter table "public"."organization_access_log" validate constraint "organization_access_log_organization_id_fkey";

alter table "public"."organization_access_log" add constraint "organization_access_log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."organization_access_log" validate constraint "organization_access_log_user_id_fkey";

alter table "public"."user_organization_context" add constraint "user_organization_context_active_organization_id_fkey" FOREIGN KEY (active_organization_id) REFERENCES organizations(id) ON DELETE SET NULL not valid;

alter table "public"."user_organization_context" validate constraint "user_organization_context_active_organization_id_fkey";

alter table "public"."user_organization_context" add constraint "user_organization_context_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_organization_context" validate constraint "user_organization_context_user_id_fkey";

alter table "public"."user_organization_context" add constraint "user_organization_context_user_id_key" UNIQUE using index "user_organization_context_user_id_key";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_organization_permissions" validate constraint "user_organization_permissions_granted_by_fkey";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;

alter table "public"."user_organization_permissions" validate constraint "user_organization_permissions_organization_id_fkey";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_revoked_by_fkey" FOREIGN KEY (revoked_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_organization_permissions" validate constraint "user_organization_permissions_revoked_by_fkey";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) not valid;

alter table "public"."user_organization_permissions" validate constraint "user_organization_permissions_role_id_fkey";

alter table "public"."user_organization_permissions" add constraint "user_organization_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_organization_permissions" validate constraint "user_organization_permissions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_audit_trail(p_organization_id uuid DEFAULT NULL::uuid, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_action text DEFAULT NULL::text, p_limit integer DEFAULT 100)
 RETURNS TABLE(id uuid, user_id uuid, organization_id uuid, action text, details jsonb, ip_address inet, user_agent text, session_id text, created_at timestamp with time zone, user_email text, organization_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT 
    oal.id,
    oal.user_id,
    oal.organization_id,
    oal.action,
    oal.details,
    oal.ip_address,
    oal.user_agent,
    oal.session_id,
    oal.created_at,
    u.email as user_email,
    o.name as organization_name
  FROM public.organization_access_log oal
  LEFT JOIN auth.users u ON oal.user_id = u.id
  LEFT JOIN public.organizations o ON oal.organization_id = o.id
  WHERE 
    (p_organization_id IS NULL OR oal.organization_id = p_organization_id)
    AND (p_start_date IS NULL OR oal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR oal.created_at <= p_end_date)
    AND (p_action IS NULL OR oal.action = p_action)
    AND (
      oal.user_id = auth.uid() -- User can see their own logs
      OR oal.organization_id IN (
        -- Or admin can see organization logs
        SELECT om.organization_id 
        FROM public.organization_memberships om
        JOIN public.roles r ON om.role_id = r.id
        WHERE om.user_id = auth.uid() 
        AND r.name IN ('admin', 'owner')
      )
    )
  ORDER BY oal.created_at DESC
  LIMIT p_limit;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_accessible_organizations()
 RETURNS TABLE(organization_id uuid, organization_name text, role_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT 
    uop.organization_id,
    o.name as organization_name,
    r.name as role_name
  FROM public.user_organization_permissions uop
  JOIN public.organizations o ON uop.organization_id = o.id
  JOIN public.roles r ON uop.role_id = r.id
  WHERE uop.user_id = auth.uid() 
  AND uop.revoked_at IS NULL
  ORDER BY uop.granted_at DESC;
$function$
;

CREATE OR REPLACE FUNCTION public.log_organization_access(p_user_id uuid, p_organization_id uuid, p_action text, p_details jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text, p_session_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.organization_access_log (
    user_id,
    organization_id,
    action,
    details,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent,
    p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_has_org_access(org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organization_permissions 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND revoked_at IS NULL
  );
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT uoc.active_organization_id 
  FROM public.user_organization_context uoc
  JOIN public.user_organization_permissions uop ON (
    uop.user_id = uoc.user_id 
    AND uop.organization_id = uoc.active_organization_id
    AND uop.revoked_at IS NULL
  )
  WHERE uoc.user_id = auth.uid()
  LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  invited_org_id UUID;
  assigned_role_id UUID;
  user_full_name TEXT;
BEGIN
  -- Always create a profile first
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;

  -- Check if this is an invited user by looking at user_metadata
  IF NEW.raw_user_meta_data IS NOT NULL THEN
    -- Extract invitation data from user metadata
    invited_org_id := (NEW.raw_user_meta_data->>'invited_to_org_id')::UUID;
    assigned_role_id := (NEW.raw_user_meta_data->>'assigned_role_id')::UUID;
    user_full_name := NEW.raw_user_meta_data->>'full_name';
    
    -- If user has invitation metadata, set up their organization context and permissions
    IF invited_org_id IS NOT NULL AND assigned_role_id IS NOT NULL THEN
      
      -- Update the profile with full_name if provided
      IF user_full_name IS NOT NULL THEN
        UPDATE public.profiles 
        SET full_name = user_full_name 
        WHERE id = NEW.id;
      END IF;
      
      -- Create organization context (critical for "active organization")
      INSERT INTO public.user_organization_context (
        user_id,
        active_organization_id,
        last_accessed_at,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        invited_org_id,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        active_organization_id = EXCLUDED.active_organization_id,
        last_accessed_at = NOW(),
        updated_at = NOW();
      
      -- Create organization permissions (required by get_active_organization_id function)
      INSERT INTO public.user_organization_permissions (
        user_id,
        organization_id,
        role_id,
        granted_at
      )
      VALUES (
        NEW.id,
        invited_org_id,
        assigned_role_id,
        NOW()
      );
      
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."organization_access_log" to "anon";

grant insert on table "public"."organization_access_log" to "anon";

grant references on table "public"."organization_access_log" to "anon";

grant select on table "public"."organization_access_log" to "anon";

grant trigger on table "public"."organization_access_log" to "anon";

grant truncate on table "public"."organization_access_log" to "anon";

grant update on table "public"."organization_access_log" to "anon";

grant delete on table "public"."organization_access_log" to "authenticated";

grant insert on table "public"."organization_access_log" to "authenticated";

grant references on table "public"."organization_access_log" to "authenticated";

grant select on table "public"."organization_access_log" to "authenticated";

grant trigger on table "public"."organization_access_log" to "authenticated";

grant truncate on table "public"."organization_access_log" to "authenticated";

grant update on table "public"."organization_access_log" to "authenticated";

grant delete on table "public"."organization_access_log" to "service_role";

grant insert on table "public"."organization_access_log" to "service_role";

grant references on table "public"."organization_access_log" to "service_role";

grant select on table "public"."organization_access_log" to "service_role";

grant trigger on table "public"."organization_access_log" to "service_role";

grant truncate on table "public"."organization_access_log" to "service_role";

grant update on table "public"."organization_access_log" to "service_role";

grant delete on table "public"."user_organization_context" to "anon";

grant insert on table "public"."user_organization_context" to "anon";

grant references on table "public"."user_organization_context" to "anon";

grant select on table "public"."user_organization_context" to "anon";

grant trigger on table "public"."user_organization_context" to "anon";

grant truncate on table "public"."user_organization_context" to "anon";

grant update on table "public"."user_organization_context" to "anon";

grant delete on table "public"."user_organization_context" to "authenticated";

grant insert on table "public"."user_organization_context" to "authenticated";

grant references on table "public"."user_organization_context" to "authenticated";

grant select on table "public"."user_organization_context" to "authenticated";

grant trigger on table "public"."user_organization_context" to "authenticated";

grant truncate on table "public"."user_organization_context" to "authenticated";

grant update on table "public"."user_organization_context" to "authenticated";

grant delete on table "public"."user_organization_context" to "service_role";

grant insert on table "public"."user_organization_context" to "service_role";

grant references on table "public"."user_organization_context" to "service_role";

grant select on table "public"."user_organization_context" to "service_role";

grant trigger on table "public"."user_organization_context" to "service_role";

grant truncate on table "public"."user_organization_context" to "service_role";

grant update on table "public"."user_organization_context" to "service_role";

grant delete on table "public"."user_organization_permissions" to "anon";

grant insert on table "public"."user_organization_permissions" to "anon";

grant references on table "public"."user_organization_permissions" to "anon";

grant select on table "public"."user_organization_permissions" to "anon";

grant trigger on table "public"."user_organization_permissions" to "anon";

grant truncate on table "public"."user_organization_permissions" to "anon";

grant update on table "public"."user_organization_permissions" to "anon";

grant delete on table "public"."user_organization_permissions" to "authenticated";

grant insert on table "public"."user_organization_permissions" to "authenticated";

grant references on table "public"."user_organization_permissions" to "authenticated";

grant select on table "public"."user_organization_permissions" to "authenticated";

grant trigger on table "public"."user_organization_permissions" to "authenticated";

grant truncate on table "public"."user_organization_permissions" to "authenticated";

grant update on table "public"."user_organization_permissions" to "authenticated";

grant delete on table "public"."user_organization_permissions" to "service_role";

grant insert on table "public"."user_organization_permissions" to "service_role";

grant references on table "public"."user_organization_permissions" to "service_role";

grant select on table "public"."user_organization_permissions" to "service_role";

grant trigger on table "public"."user_organization_permissions" to "service_role";

grant truncate on table "public"."user_organization_permissions" to "service_role";

grant update on table "public"."user_organization_permissions" to "service_role";

create policy "Admins can view organization audit logs"
on "public"."organization_access_log"
as permissive
for select
to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM (organization_memberships om
     JOIN roles r ON ((om.role_id = r.id)))
  WHERE ((om.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'owner'::text]))))));


create policy "Allow system audit logging"
on "public"."organization_access_log"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) AND ((organization_id IS NULL) OR (organization_id IN ( SELECT uop.organization_id
   FROM user_organization_permissions uop
  WHERE ((uop.user_id = auth.uid()) AND (uop.revoked_at IS NULL)))))));


create policy "Users can insert their own audit logs"
on "public"."organization_access_log"
as permissive
for insert
to authenticated
with check ((user_id = auth.uid()));


create policy "Users can view their own audit logs"
on "public"."organization_access_log"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Users can manage their own organization context"
on "public"."user_organization_context"
as permissive
for all
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "Users can view their own permissions"
on "public"."user_organization_permissions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


CREATE TRIGGER update_user_organization_context_updated_at BEFORE UPDATE ON public.user_organization_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


