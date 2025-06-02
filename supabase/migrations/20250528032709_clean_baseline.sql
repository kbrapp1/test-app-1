create extension if not exists "moddatetime" with schema "public" version '1.0';
create table "public"."TtsPrediction" (
    "id" uuid not null default gen_random_uuid(),
    "replicatePredictionId" text not null,
    "status" text not null,
    "inputText" text not null,
    "outputUrl" text,
    "createdAt" timestamp with time zone not null default timezone('utc'::text, now()),
    "updatedAt" timestamp with time zone not null default timezone('utc'::text, now()),
    "userId" uuid not null,
    "sourceAssetId" uuid,
    "outputAssetId" uuid,
    "voiceId" text,
    "errorMessage" text,
    "organization_id" uuid not null,
    "prediction_provider" text,
    "is_output_url_problematic" boolean not null default false,
    "output_url_last_error" text,
    "output_storage_path" text,
    "output_content_type" text,
    "output_file_size" integer
);
alter table "public"."TtsPrediction" enable row level security;
create table "public"."asset_tags" (
    "asset_id" uuid not null,
    "tag_id" uuid not null
);
alter table "public"."asset_tags" enable row level security;
create table "public"."assets" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "storage_path" text not null,
    "mime_type" text not null,
    "size" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "folder_id" uuid,
    "organization_id" uuid not null,
    "updated_at" timestamp with time zone default now()
);
alter table "public"."assets" enable row level security;
create table "public"."folders" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "parent_folder_id" uuid,
    "organization_id" uuid not null,
    "updated_at" timestamp with time zone default now()
);
alter table "public"."folders" enable row level security;
create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text,
    "content" text,
    "position" integer,
    "color_class" text default 'bg-yellow-200'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null
);
alter table "public"."notes" enable row level security;
create table "public"."organization_domains" (
    "organization_id" uuid not null,
    "domain_name" text not null,
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."organization_domains" enable row level security;
create table "public"."organization_memberships" (
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "role" text not null default 'member'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "role_id" uuid not null
);
alter table "public"."organization_memberships" enable row level security;
create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "owner_user_id" uuid,
    "slug" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);
alter table "public"."organizations" enable row level security;
create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "last_sign_in_at" timestamp with time zone
);
alter table "public"."profiles" enable row level security;
create table "public"."roles" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);
alter table "public"."roles" enable row level security;
create table "public"."saved_searches" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "user_id" uuid not null,
    "organization_id" uuid not null,
    "search_criteria" jsonb not null default '{}'::jsonb,
    "is_global" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "last_used_at" timestamp with time zone,
    "use_count" integer not null default 0
);
alter table "public"."saved_searches" enable row level security;
create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null,
    "color" text not null default 'blue'::text
);
alter table "public"."tags" enable row level security;
create table "public"."team_members" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "title" text not null,
    "primary_image_path" text not null,
    "secondary_image_path" text not null,
    "created_at" timestamp with time zone not null default now(),
    "organization_id" uuid not null
);
alter table "public"."team_members" enable row level security;
create table "public"."team_user_memberships" (
    "team_id" uuid not null,
    "user_id" uuid not null,
    "role_in_team" text,
    "created_at" timestamp with time zone not null default now()
);
alter table "public"."team_user_memberships" enable row level security;
create table "public"."teams" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);
alter table "public"."teams" enable row level security;
CREATE UNIQUE INDEX "TtsPrediction_pkey" ON public."TtsPrediction" USING btree (id);
CREATE UNIQUE INDEX "TtsPrediction_replicatePredictionId_key" ON public."TtsPrediction" USING btree ("replicatePredictionId");
CREATE UNIQUE INDEX asset_tags_pkey ON public.asset_tags USING btree (asset_id, tag_id);
CREATE INDEX assets_folder_id_idx ON public.assets USING btree (folder_id);
CREATE UNIQUE INDEX assets_pkey ON public.assets USING btree (id);
CREATE UNIQUE INDEX assets_storage_path_key ON public.assets USING btree (storage_path);
CREATE UNIQUE INDEX folders_pkey ON public.folders USING btree (id);
CREATE INDEX idx_assets_folder_id ON public.assets USING btree (folder_id);
CREATE INDEX idx_folders_parent_folder_id ON public.folders USING btree (parent_folder_id);
CREATE INDEX idx_saved_searches_last_used ON public.saved_searches USING btree (last_used_at DESC NULLS LAST);
CREATE INDEX idx_saved_searches_org_use_count ON public.saved_searches USING btree (organization_id, use_count DESC);
CREATE INDEX idx_saved_searches_user_org ON public.saved_searches USING btree (user_id, organization_id);
CREATE INDEX idx_tags_color ON public.tags USING btree (color);
CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);
CREATE UNIQUE INDEX organization_domains_domain_name_key ON public.organization_domains USING btree (domain_name);
CREATE UNIQUE INDEX organization_domains_pkey ON public.organization_domains USING btree (organization_id, domain_name);
CREATE UNIQUE INDEX organization_memberships_pkey ON public.organization_memberships USING btree (user_id, organization_id);
CREATE UNIQUE INDEX organizations_name_key ON public.organizations USING btree (name);
CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);
CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug);
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);
CREATE UNIQUE INDEX roles_pkey ON public.roles USING btree (id);
CREATE UNIQUE INDEX saved_searches_pkey ON public.saved_searches USING btree (id);
CREATE UNIQUE INDEX tags_org_name_unique ON public.tags USING btree (organization_id, name);
CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);
CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);
CREATE UNIQUE INDEX team_user_memberships_pkey ON public.team_user_memberships USING btree (team_id, user_id);
CREATE UNIQUE INDEX teams_org_name_unique ON public.teams USING btree (organization_id, name);
CREATE UNIQUE INDEX teams_pkey ON public.teams USING btree (id);
alter table "public"."TtsPrediction" add constraint "TtsPrediction_pkey" PRIMARY KEY using index "TtsPrediction_pkey";
alter table "public"."asset_tags" add constraint "asset_tags_pkey" PRIMARY KEY using index "asset_tags_pkey";
alter table "public"."assets" add constraint "assets_pkey" PRIMARY KEY using index "assets_pkey";
alter table "public"."folders" add constraint "folders_pkey" PRIMARY KEY using index "folders_pkey";
alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";
alter table "public"."organization_domains" add constraint "organization_domains_pkey" PRIMARY KEY using index "organization_domains_pkey";
alter table "public"."organization_memberships" add constraint "organization_memberships_pkey" PRIMARY KEY using index "organization_memberships_pkey";
alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";
alter table "public"."roles" add constraint "roles_pkey" PRIMARY KEY using index "roles_pkey";
alter table "public"."saved_searches" add constraint "saved_searches_pkey" PRIMARY KEY using index "saved_searches_pkey";
alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";
alter table "public"."team_members" add constraint "team_members_pkey" PRIMARY KEY using index "team_members_pkey";
alter table "public"."team_user_memberships" add constraint "team_user_memberships_pkey" PRIMARY KEY using index "team_user_memberships_pkey";
alter table "public"."teams" add constraint "teams_pkey" PRIMARY KEY using index "teams_pkey";
alter table "public"."TtsPrediction" add constraint "TtsPrediction_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."TtsPrediction" validate constraint "TtsPrediction_organization_id_fkey";
alter table "public"."TtsPrediction" add constraint "TtsPrediction_outputAssetId_fkey" FOREIGN KEY ("outputAssetId") REFERENCES assets(id) ON DELETE SET NULL not valid;
alter table "public"."TtsPrediction" validate constraint "TtsPrediction_outputAssetId_fkey";
alter table "public"."TtsPrediction" add constraint "TtsPrediction_replicatePredictionId_key" UNIQUE using index "TtsPrediction_replicatePredictionId_key";
alter table "public"."TtsPrediction" add constraint "TtsPrediction_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES assets(id) ON DELETE SET NULL not valid;
alter table "public"."TtsPrediction" validate constraint "TtsPrediction_sourceAssetId_fkey";
alter table "public"."TtsPrediction" add constraint "TtsPrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."TtsPrediction" validate constraint "TtsPrediction_userId_fkey";
alter table "public"."asset_tags" add constraint "asset_tags_asset_id_fkey" FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE not valid;
alter table "public"."asset_tags" validate constraint "asset_tags_asset_id_fkey";
alter table "public"."asset_tags" add constraint "asset_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;
alter table "public"."asset_tags" validate constraint "asset_tags_tag_id_fkey";
alter table "public"."assets" add constraint "assets_folder_id_fkey" FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE not valid;
alter table "public"."assets" validate constraint "assets_folder_id_fkey";
alter table "public"."assets" add constraint "assets_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."assets" validate constraint "assets_organization_id_fkey";
alter table "public"."assets" add constraint "assets_storage_path_key" UNIQUE using index "assets_storage_path_key";
alter table "public"."assets" add constraint "assets_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."assets" validate constraint "assets_user_id_fkey";
alter table "public"."folders" add constraint "fk_folders_parent_folder" FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE not valid;
alter table "public"."folders" validate constraint "fk_folders_parent_folder";
alter table "public"."folders" add constraint "folders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."folders" validate constraint "folders_organization_id_fkey";
alter table "public"."folders" add constraint "folders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."folders" validate constraint "folders_user_id_fkey";
alter table "public"."notes" add constraint "notes_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."notes" validate constraint "notes_organization_id_fkey";
alter table "public"."notes" add constraint "notes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."notes" validate constraint "notes_user_id_fkey";
alter table "public"."organization_domains" add constraint "organization_domains_domain_name_key" UNIQUE using index "organization_domains_domain_name_key";
alter table "public"."organization_domains" add constraint "organization_domains_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."organization_domains" validate constraint "organization_domains_organization_id_fkey";
alter table "public"."organization_memberships" add constraint "fk_organization_memberships_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."organization_memberships" validate constraint "fk_organization_memberships_user_id";
alter table "public"."organization_memberships" add constraint "organization_memberships_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."organization_memberships" validate constraint "organization_memberships_organization_id_fkey";
alter table "public"."organization_memberships" add constraint "organization_memberships_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'member'::text, 'editor'::text, 'viewer'::text]))) not valid;
alter table "public"."organization_memberships" validate constraint "organization_memberships_role_check";
alter table "public"."organization_memberships" add constraint "organization_memberships_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL not valid;
alter table "public"."organization_memberships" validate constraint "organization_memberships_role_id_fkey";
alter table "public"."organization_memberships" add constraint "organization_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."organization_memberships" validate constraint "organization_memberships_user_id_fkey";
alter table "public"."organizations" add constraint "organizations_name_key" UNIQUE using index "organizations_name_key";
alter table "public"."organizations" add constraint "organizations_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;
alter table "public"."organizations" validate constraint "organizations_owner_user_id_fkey";
alter table "public"."organizations" add constraint "organizations_slug_key" UNIQUE using index "organizations_slug_key";
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."profiles" validate constraint "profiles_id_fkey";
alter table "public"."roles" add constraint "roles_name_key" UNIQUE using index "roles_name_key";
alter table "public"."saved_searches" add constraint "saved_searches_name_length" CHECK (((char_length(name) > 0) AND (char_length(name) <= 100))) not valid;
alter table "public"."saved_searches" validate constraint "saved_searches_name_length";
alter table "public"."saved_searches" add constraint "saved_searches_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."saved_searches" validate constraint "saved_searches_organization_id_fkey";
alter table "public"."saved_searches" add constraint "saved_searches_use_count_non_negative" CHECK ((use_count >= 0)) not valid;
alter table "public"."saved_searches" validate constraint "saved_searches_use_count_non_negative";
alter table "public"."saved_searches" add constraint "saved_searches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."saved_searches" validate constraint "saved_searches_user_id_fkey";
alter table "public"."tags" add constraint "tags_color_check" CHECK ((color = ANY (ARRAY['blue'::text, 'green'::text, 'yellow'::text, 'red'::text, 'purple'::text, 'pink'::text, 'indigo'::text, 'gray'::text, 'orange'::text, 'teal'::text, 'emerald'::text, 'lime'::text]))) not valid;
alter table "public"."tags" validate constraint "tags_color_check";
alter table "public"."tags" add constraint "tags_org_name_unique" UNIQUE using index "tags_org_name_unique";
alter table "public"."tags" add constraint "tags_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."tags" validate constraint "tags_organization_id_fkey";
alter table "public"."tags" add constraint "tags_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."tags" validate constraint "tags_user_id_fkey";
alter table "public"."team_members" add constraint "team_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."team_members" validate constraint "team_members_organization_id_fkey";
alter table "public"."team_user_memberships" add constraint "team_user_memberships_role_in_team_check" CHECK ((role_in_team = ANY (ARRAY['leader'::text, 'member'::text]))) not valid;
alter table "public"."team_user_memberships" validate constraint "team_user_memberships_role_in_team_check";
alter table "public"."team_user_memberships" add constraint "team_user_memberships_team_id_fkey" FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE not valid;
alter table "public"."team_user_memberships" validate constraint "team_user_memberships_team_id_fkey";
alter table "public"."team_user_memberships" add constraint "team_user_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;
alter table "public"."team_user_memberships" validate constraint "team_user_memberships_user_id_fkey";
alter table "public"."teams" add constraint "teams_org_name_unique" UNIQUE using index "teams_org_name_unique";
alter table "public"."teams" add constraint "teams_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE not valid;
alter table "public"."teams" validate constraint "teams_organization_id_fkey";
set check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.are_users_in_same_org(p_target_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om1
    JOIN public.organization_memberships om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = p_target_user_id
  );
$function$;
CREATE OR REPLACE FUNCTION public.check_email_domain()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
        DECLARE
      -- !!! CUSTOMIZE THIS LIST !!!
      allowed_domains TEXT[] := ARRAY['vistaonemarketing.com', 'ironmarkusa.com'];
          email_domain TEXT;
        BEGIN
          email_domain := split_part(NEW.email, '@', 2);
          IF NOT (email_domain = ANY(allowed_domains)) THEN
            RAISE EXCEPTION 'Email domain % is not allowed. Please use a valid company email.', email_domain;
          END IF;
          RETURN NEW;
        END;
        $function$;
CREATE OR REPLACE FUNCTION public.debug_get_all_jwt_claims()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$function$;
CREATE OR REPLACE FUNCTION public.get_active_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT nullif( (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', '')::uuid;
$function$;
CREATE OR REPLACE FUNCTION public.get_current_auth_uid_for_test()
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO 'auth', 'pg_temp'
AS $function$
  SELECT auth.uid();
$function$;
CREATE OR REPLACE FUNCTION public.get_folder_path(p_folder_id uuid)
 RETURNS TABLE(id uuid, name text, depth integer)
 LANGUAGE sql
 STABLE
AS $function$
  WITH RECURSIVE folder_hierarchy AS (
    -- Base case: the starting folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      0 AS depth -- Start depth at 0
    FROM public.folders f
    WHERE f.id = p_folder_id

    UNION ALL

    -- Recursive step: find the parent of the current folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      fh.depth + 1 -- Increment depth
    FROM public.folders f
    JOIN folder_hierarchy fh ON f.id = fh.parent_folder_id
    WHERE fh.parent_folder_id IS NOT NULL -- Stop when we reach the root (parent is null)
  )
  -- Select the path, ordering by depth descending to get Root -> ... -> Current
  SELECT 
    fh.id, 
    fh.name,
    fh.depth
  FROM folder_hierarchy fh
  ORDER BY fh.depth DESC;
$function$;
CREATE OR REPLACE FUNCTION public.get_organization_members_with_profiles(target_org_id uuid)
 RETURNS TABLE(id uuid, name text)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT
    p.id AS id,
    COALESCE(p.full_name, p.email, 'Unnamed User') AS name
  FROM
    public.organization_memberships om
  JOIN
    public.profiles p ON om.user_id = p.id
  WHERE
    om.organization_id = target_org_id
  ORDER BY
    name;
$function$;
CREATE OR REPLACE FUNCTION public.get_users_invitation_details(user_ids_to_check uuid[], p_organization_id uuid)
 RETURNS TABLE(id uuid, invited_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
    SELECT
      u.id,
      u.invited_at
    FROM auth.users u
    JOIN public.organization_memberships m
      ON u.id = m.user_id
    WHERE
      u.id = ANY(user_ids_to_check)
      AND m.organization_id = p_organization_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.handle_user_last_sign_in_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_user_admin_of_organization(org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
          SELECT EXISTS (
            SELECT 1
            FROM public.organization_memberships om
            JOIN public.roles r ON om.role_id = r.id
            WHERE om.organization_id = org_id
              AND om.user_id = auth.uid()
              AND r.name = 'admin'
          );
        $function$;
CREATE OR REPLACE FUNCTION public.is_user_member_of_organization(user_id_to_check uuid, organization_id_to_check uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.user_id = user_id_to_check
      AND om.organization_id = organization_id_to_check
  );
$function$;
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.update_saved_searches_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;
grant delete on table "public"."TtsPrediction" to "anon";
grant insert on table "public"."TtsPrediction" to "anon";
grant references on table "public"."TtsPrediction" to "anon";
grant select on table "public"."TtsPrediction" to "anon";
grant trigger on table "public"."TtsPrediction" to "anon";
grant truncate on table "public"."TtsPrediction" to "anon";
grant update on table "public"."TtsPrediction" to "anon";
grant delete on table "public"."TtsPrediction" to "authenticated";
grant insert on table "public"."TtsPrediction" to "authenticated";
grant references on table "public"."TtsPrediction" to "authenticated";
grant select on table "public"."TtsPrediction" to "authenticated";
grant trigger on table "public"."TtsPrediction" to "authenticated";
grant truncate on table "public"."TtsPrediction" to "authenticated";
grant update on table "public"."TtsPrediction" to "authenticated";
grant delete on table "public"."TtsPrediction" to "service_role";
grant insert on table "public"."TtsPrediction" to "service_role";
grant references on table "public"."TtsPrediction" to "service_role";
grant select on table "public"."TtsPrediction" to "service_role";
grant trigger on table "public"."TtsPrediction" to "service_role";
grant truncate on table "public"."TtsPrediction" to "service_role";
grant update on table "public"."TtsPrediction" to "service_role";
grant delete on table "public"."asset_tags" to "anon";
grant insert on table "public"."asset_tags" to "anon";
grant references on table "public"."asset_tags" to "anon";
grant select on table "public"."asset_tags" to "anon";
grant trigger on table "public"."asset_tags" to "anon";
grant truncate on table "public"."asset_tags" to "anon";
grant update on table "public"."asset_tags" to "anon";
grant delete on table "public"."asset_tags" to "authenticated";
grant insert on table "public"."asset_tags" to "authenticated";
grant references on table "public"."asset_tags" to "authenticated";
grant select on table "public"."asset_tags" to "authenticated";
grant trigger on table "public"."asset_tags" to "authenticated";
grant truncate on table "public"."asset_tags" to "authenticated";
grant update on table "public"."asset_tags" to "authenticated";
grant delete on table "public"."asset_tags" to "service_role";
grant insert on table "public"."asset_tags" to "service_role";
grant references on table "public"."asset_tags" to "service_role";
grant select on table "public"."asset_tags" to "service_role";
grant trigger on table "public"."asset_tags" to "service_role";
grant truncate on table "public"."asset_tags" to "service_role";
grant update on table "public"."asset_tags" to "service_role";
grant delete on table "public"."assets" to "anon";
grant insert on table "public"."assets" to "anon";
grant references on table "public"."assets" to "anon";
grant select on table "public"."assets" to "anon";
grant trigger on table "public"."assets" to "anon";
grant truncate on table "public"."assets" to "anon";
grant update on table "public"."assets" to "anon";
grant delete on table "public"."assets" to "authenticated";
grant insert on table "public"."assets" to "authenticated";
grant references on table "public"."assets" to "authenticated";
grant select on table "public"."assets" to "authenticated";
grant trigger on table "public"."assets" to "authenticated";
grant truncate on table "public"."assets" to "authenticated";
grant update on table "public"."assets" to "authenticated";
grant delete on table "public"."assets" to "service_role";
grant insert on table "public"."assets" to "service_role";
grant references on table "public"."assets" to "service_role";
grant select on table "public"."assets" to "service_role";
grant trigger on table "public"."assets" to "service_role";
grant truncate on table "public"."assets" to "service_role";
grant update on table "public"."assets" to "service_role";
grant delete on table "public"."folders" to "anon";
grant insert on table "public"."folders" to "anon";
grant references on table "public"."folders" to "anon";
grant select on table "public"."folders" to "anon";
grant trigger on table "public"."folders" to "anon";
grant truncate on table "public"."folders" to "anon";
grant update on table "public"."folders" to "anon";
grant delete on table "public"."folders" to "authenticated";
grant insert on table "public"."folders" to "authenticated";
grant references on table "public"."folders" to "authenticated";
grant select on table "public"."folders" to "authenticated";
grant trigger on table "public"."folders" to "authenticated";
grant truncate on table "public"."folders" to "authenticated";
grant update on table "public"."folders" to "authenticated";
grant delete on table "public"."folders" to "service_role";
grant insert on table "public"."folders" to "service_role";
grant references on table "public"."folders" to "service_role";
grant select on table "public"."folders" to "service_role";
grant trigger on table "public"."folders" to "service_role";
grant truncate on table "public"."folders" to "service_role";
grant update on table "public"."folders" to "service_role";
grant delete on table "public"."notes" to "anon";
grant insert on table "public"."notes" to "anon";
grant references on table "public"."notes" to "anon";
grant select on table "public"."notes" to "anon";
grant trigger on table "public"."notes" to "anon";
grant truncate on table "public"."notes" to "anon";
grant update on table "public"."notes" to "anon";
grant delete on table "public"."notes" to "authenticated";
grant insert on table "public"."notes" to "authenticated";
grant references on table "public"."notes" to "authenticated";
grant select on table "public"."notes" to "authenticated";
grant trigger on table "public"."notes" to "authenticated";
grant truncate on table "public"."notes" to "authenticated";
grant update on table "public"."notes" to "authenticated";
grant delete on table "public"."notes" to "service_role";
grant insert on table "public"."notes" to "service_role";
grant references on table "public"."notes" to "service_role";
grant select on table "public"."notes" to "service_role";
grant trigger on table "public"."notes" to "service_role";
grant truncate on table "public"."notes" to "service_role";
grant update on table "public"."notes" to "service_role";
grant delete on table "public"."organization_domains" to "anon";
grant insert on table "public"."organization_domains" to "anon";
grant references on table "public"."organization_domains" to "anon";
grant select on table "public"."organization_domains" to "anon";
grant trigger on table "public"."organization_domains" to "anon";
grant truncate on table "public"."organization_domains" to "anon";
grant update on table "public"."organization_domains" to "anon";
grant delete on table "public"."organization_domains" to "authenticated";
grant insert on table "public"."organization_domains" to "authenticated";
grant references on table "public"."organization_domains" to "authenticated";
grant select on table "public"."organization_domains" to "authenticated";
grant trigger on table "public"."organization_domains" to "authenticated";
grant truncate on table "public"."organization_domains" to "authenticated";
grant update on table "public"."organization_domains" to "authenticated";
grant delete on table "public"."organization_domains" to "service_role";
grant insert on table "public"."organization_domains" to "service_role";
grant references on table "public"."organization_domains" to "service_role";
grant select on table "public"."organization_domains" to "service_role";
grant trigger on table "public"."organization_domains" to "service_role";
grant truncate on table "public"."organization_domains" to "service_role";
grant update on table "public"."organization_domains" to "service_role";
grant delete on table "public"."organization_memberships" to "anon";
grant insert on table "public"."organization_memberships" to "anon";
grant references on table "public"."organization_memberships" to "anon";
grant select on table "public"."organization_memberships" to "anon";
grant trigger on table "public"."organization_memberships" to "anon";
grant truncate on table "public"."organization_memberships" to "anon";
grant update on table "public"."organization_memberships" to "anon";
grant delete on table "public"."organization_memberships" to "authenticated";
grant insert on table "public"."organization_memberships" to "authenticated";
grant references on table "public"."organization_memberships" to "authenticated";
grant select on table "public"."organization_memberships" to "authenticated";
grant trigger on table "public"."organization_memberships" to "authenticated";
grant truncate on table "public"."organization_memberships" to "authenticated";
grant update on table "public"."organization_memberships" to "authenticated";
grant delete on table "public"."organization_memberships" to "service_role";
grant insert on table "public"."organization_memberships" to "service_role";
grant references on table "public"."organization_memberships" to "service_role";
grant select on table "public"."organization_memberships" to "service_role";
grant trigger on table "public"."organization_memberships" to "service_role";
grant truncate on table "public"."organization_memberships" to "service_role";
grant update on table "public"."organization_memberships" to "service_role";
grant delete on table "public"."organizations" to "anon";
grant insert on table "public"."organizations" to "anon";
grant references on table "public"."organizations" to "anon";
grant select on table "public"."organizations" to "anon";
grant trigger on table "public"."organizations" to "anon";
grant truncate on table "public"."organizations" to "anon";
grant update on table "public"."organizations" to "anon";
grant delete on table "public"."organizations" to "authenticated";
grant insert on table "public"."organizations" to "authenticated";
grant references on table "public"."organizations" to "authenticated";
grant select on table "public"."organizations" to "authenticated";
grant trigger on table "public"."organizations" to "authenticated";
grant truncate on table "public"."organizations" to "authenticated";
grant update on table "public"."organizations" to "authenticated";
grant delete on table "public"."organizations" to "service_role";
grant insert on table "public"."organizations" to "service_role";
grant references on table "public"."organizations" to "service_role";
grant select on table "public"."organizations" to "service_role";
grant trigger on table "public"."organizations" to "service_role";
grant truncate on table "public"."organizations" to "service_role";
grant update on table "public"."organizations" to "service_role";
grant delete on table "public"."profiles" to "anon";
grant insert on table "public"."profiles" to "anon";
grant references on table "public"."profiles" to "anon";
grant select on table "public"."profiles" to "anon";
grant trigger on table "public"."profiles" to "anon";
grant truncate on table "public"."profiles" to "anon";
grant update on table "public"."profiles" to "anon";
grant delete on table "public"."profiles" to "authenticated";
grant insert on table "public"."profiles" to "authenticated";
grant references on table "public"."profiles" to "authenticated";
grant select on table "public"."profiles" to "authenticated";
grant trigger on table "public"."profiles" to "authenticated";
grant truncate on table "public"."profiles" to "authenticated";
grant update on table "public"."profiles" to "authenticated";
grant delete on table "public"."profiles" to "service_role";
grant insert on table "public"."profiles" to "service_role";
grant references on table "public"."profiles" to "service_role";
grant select on table "public"."profiles" to "service_role";
grant trigger on table "public"."profiles" to "service_role";
grant truncate on table "public"."profiles" to "service_role";
grant update on table "public"."profiles" to "service_role";
grant delete on table "public"."roles" to "anon";
grant insert on table "public"."roles" to "anon";
grant references on table "public"."roles" to "anon";
grant select on table "public"."roles" to "anon";
grant trigger on table "public"."roles" to "anon";
grant truncate on table "public"."roles" to "anon";
grant update on table "public"."roles" to "anon";
grant delete on table "public"."roles" to "authenticated";
grant insert on table "public"."roles" to "authenticated";
grant references on table "public"."roles" to "authenticated";
grant select on table "public"."roles" to "authenticated";
grant trigger on table "public"."roles" to "authenticated";
grant truncate on table "public"."roles" to "authenticated";
grant update on table "public"."roles" to "authenticated";
grant delete on table "public"."roles" to "service_role";
grant insert on table "public"."roles" to "service_role";
grant references on table "public"."roles" to "service_role";
grant select on table "public"."roles" to "service_role";
grant trigger on table "public"."roles" to "service_role";
grant truncate on table "public"."roles" to "service_role";
grant update on table "public"."roles" to "service_role";
grant delete on table "public"."saved_searches" to "anon";
grant insert on table "public"."saved_searches" to "anon";
grant references on table "public"."saved_searches" to "anon";
grant select on table "public"."saved_searches" to "anon";
grant trigger on table "public"."saved_searches" to "anon";
grant truncate on table "public"."saved_searches" to "anon";
grant update on table "public"."saved_searches" to "anon";
grant delete on table "public"."saved_searches" to "authenticated";
grant insert on table "public"."saved_searches" to "authenticated";
grant references on table "public"."saved_searches" to "authenticated";
grant select on table "public"."saved_searches" to "authenticated";
grant trigger on table "public"."saved_searches" to "authenticated";
grant truncate on table "public"."saved_searches" to "authenticated";
grant update on table "public"."saved_searches" to "authenticated";
grant delete on table "public"."saved_searches" to "service_role";
grant insert on table "public"."saved_searches" to "service_role";
grant references on table "public"."saved_searches" to "service_role";
grant select on table "public"."saved_searches" to "service_role";
grant trigger on table "public"."saved_searches" to "service_role";
grant truncate on table "public"."saved_searches" to "service_role";
grant update on table "public"."saved_searches" to "service_role";
grant delete on table "public"."tags" to "anon";
grant insert on table "public"."tags" to "anon";
grant references on table "public"."tags" to "anon";
grant select on table "public"."tags" to "anon";
grant trigger on table "public"."tags" to "anon";
grant truncate on table "public"."tags" to "anon";
grant update on table "public"."tags" to "anon";
grant delete on table "public"."tags" to "authenticated";
grant insert on table "public"."tags" to "authenticated";
grant references on table "public"."tags" to "authenticated";
grant select on table "public"."tags" to "authenticated";
grant trigger on table "public"."tags" to "authenticated";
grant truncate on table "public"."tags" to "authenticated";
grant update on table "public"."tags" to "authenticated";
grant delete on table "public"."tags" to "service_role";
grant insert on table "public"."tags" to "service_role";
grant references on table "public"."tags" to "service_role";
grant select on table "public"."tags" to "service_role";
grant trigger on table "public"."tags" to "service_role";
grant truncate on table "public"."tags" to "service_role";
grant update on table "public"."tags" to "service_role";
grant delete on table "public"."team_members" to "anon";
grant insert on table "public"."team_members" to "anon";
grant references on table "public"."team_members" to "anon";
grant select on table "public"."team_members" to "anon";
grant trigger on table "public"."team_members" to "anon";
grant truncate on table "public"."team_members" to "anon";
grant update on table "public"."team_members" to "anon";
grant delete on table "public"."team_members" to "authenticated";
grant insert on table "public"."team_members" to "authenticated";
grant references on table "public"."team_members" to "authenticated";
grant select on table "public"."team_members" to "authenticated";
grant trigger on table "public"."team_members" to "authenticated";
grant truncate on table "public"."team_members" to "authenticated";
grant update on table "public"."team_members" to "authenticated";
grant delete on table "public"."team_members" to "service_role";
grant insert on table "public"."team_members" to "service_role";
grant references on table "public"."team_members" to "service_role";
grant select on table "public"."team_members" to "service_role";
grant trigger on table "public"."team_members" to "service_role";
grant truncate on table "public"."team_members" to "service_role";
grant update on table "public"."team_members" to "service_role";
grant delete on table "public"."team_user_memberships" to "anon";
grant insert on table "public"."team_user_memberships" to "anon";
grant references on table "public"."team_user_memberships" to "anon";
grant select on table "public"."team_user_memberships" to "anon";
grant trigger on table "public"."team_user_memberships" to "anon";
grant truncate on table "public"."team_user_memberships" to "anon";
grant update on table "public"."team_user_memberships" to "anon";
grant delete on table "public"."team_user_memberships" to "authenticated";
grant insert on table "public"."team_user_memberships" to "authenticated";
grant references on table "public"."team_user_memberships" to "authenticated";
grant select on table "public"."team_user_memberships" to "authenticated";
grant trigger on table "public"."team_user_memberships" to "authenticated";
grant truncate on table "public"."team_user_memberships" to "authenticated";
grant update on table "public"."team_user_memberships" to "authenticated";
grant delete on table "public"."team_user_memberships" to "service_role";
grant insert on table "public"."team_user_memberships" to "service_role";
grant references on table "public"."team_user_memberships" to "service_role";
grant select on table "public"."team_user_memberships" to "service_role";
grant trigger on table "public"."team_user_memberships" to "service_role";
grant truncate on table "public"."team_user_memberships" to "service_role";
grant update on table "public"."team_user_memberships" to "service_role";
grant delete on table "public"."teams" to "anon";
grant insert on table "public"."teams" to "anon";
grant references on table "public"."teams" to "anon";
grant select on table "public"."teams" to "anon";
grant trigger on table "public"."teams" to "anon";
grant truncate on table "public"."teams" to "anon";
grant update on table "public"."teams" to "anon";
grant delete on table "public"."teams" to "authenticated";
grant insert on table "public"."teams" to "authenticated";
grant references on table "public"."teams" to "authenticated";
grant select on table "public"."teams" to "authenticated";
grant trigger on table "public"."teams" to "authenticated";
grant truncate on table "public"."teams" to "authenticated";
grant update on table "public"."teams" to "authenticated";
grant delete on table "public"."teams" to "service_role";
grant insert on table "public"."teams" to "service_role";
grant references on table "public"."teams" to "service_role";
grant select on table "public"."teams" to "service_role";
grant trigger on table "public"."teams" to "service_role";
grant truncate on table "public"."teams" to "service_role";
grant update on table "public"."teams" to "service_role";
create policy "Organization members can access their org data in TtsPrediction"
on "public"."TtsPrediction"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = "TtsPrediction".organization_id) AND (om.user_id = auth.uid())))) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)))
with check (((organization_id = get_active_organization_id()) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)));
create policy "Asset Tags: Org members can manage tags for their org assets"
on "public"."asset_tags"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM (assets a
     JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
  WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid())))) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)))
with check (((EXISTS ( SELECT 1
   FROM (assets a
     JOIN organization_memberships om ON ((a.organization_id = om.organization_id)))
  WHERE ((a.id = asset_tags.asset_id) AND (om.user_id = auth.uid()) AND (a.organization_id = get_active_organization_id())))) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)));
create policy "Assets access based on active organization"
on "public"."assets"
as permissive
for all
to authenticated
using ((organization_id = get_active_organization_id()))
with check ((organization_id = get_active_organization_id()));
create policy "Folders access based on active organization"
on "public"."folders"
as permissive
for all
to authenticated
using ((organization_id = get_active_organization_id()))
with check ((organization_id = get_active_organization_id()));
create policy "Enable user access to their notes in active organization"
on "public"."notes"
as permissive
for all
to public
using (((organization_id = get_active_organization_id()) AND (user_id = auth.uid())))
with check (((organization_id = get_active_organization_id()) AND (user_id = auth.uid())));
create policy "Members can read domains of their organizations"
on "public"."organization_domains"
as permissive
for select
to public
using (((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = organization_domains.organization_id) AND (om.user_id = auth.uid())))) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)));
create policy "Superusers can manage organization domains"
on "public"."organization_domains"
as permissive
for all
to public
using ((auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid));
create policy "Admins can manage memberships of organizations they administer"
on "public"."organization_memberships"
as permissive
for all
to authenticated
using (is_user_admin_of_organization(organization_id))
with check (is_user_admin_of_organization(organization_id));
create policy "Admins can view all memberships of organizations they administe"
on "public"."organization_memberships"
as permissive
for select
to authenticated
using (is_user_admin_of_organization(organization_id));
create policy "Users can view their own membership entries"
on "public"."organization_memberships"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));
create policy "Admins can update their own organization details"
on "public"."organizations"
as permissive
for update
to authenticated
using (is_user_admin_of_organization(id))
with check (is_user_admin_of_organization(id));
create policy "Members can view their organizations"
on "public"."organizations"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = organizations.id) AND (om.user_id = auth.uid())))));
create policy "Admins can view profiles of members in their managed organizati"
on "public"."profiles"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM ((organization_memberships admin_membership
     JOIN roles admin_role ON ((admin_membership.role_id = admin_role.id)))
     JOIN organization_memberships member_membership ON ((admin_membership.organization_id = member_membership.organization_id)))
  WHERE ((admin_membership.user_id = auth.uid()) AND (admin_role.name = 'admin'::text) AND (member_membership.user_id = profiles.id)))));
create policy "Organization members can view profiles via func"
on "public"."profiles"
as permissive
for select
to authenticated
using (are_users_in_same_org(id));
create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = id));
create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id));
create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));
create policy "Allow authenticated users to read roles"
on "public"."roles"
as permissive
for select
to authenticated
using (true);
create policy "Users can create their own saved searches"
on "public"."saved_searches"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) AND (organization_id = get_active_organization_id())));
create policy "Users can delete their own saved searches"
on "public"."saved_searches"
as permissive
for delete
to authenticated
using (((user_id = auth.uid()) AND (organization_id = get_active_organization_id())));
create policy "Users can update their own saved searches"
on "public"."saved_searches"
as permissive
for update
to authenticated
using (((user_id = auth.uid()) AND (organization_id = get_active_organization_id())));
create policy "Users can view saved searches in their organization"
on "public"."saved_searches"
as permissive
for select
to authenticated
using ((organization_id = get_active_organization_id()));
create policy "Organization members can access their org data in tags"
on "public"."tags"
as permissive
for all
to public
using (((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = tags.organization_id) AND (om.user_id = auth.uid())))) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)))
with check (((organization_id = get_active_organization_id()) OR (auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid)));
create policy "Team Member RLS Policy"
on "public"."team_members"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = team_members.organization_id) AND (om.user_id = auth.uid())))))
with check (((organization_id = get_active_organization_id()) AND (EXISTS ( SELECT 1
   FROM (organization_memberships om
     JOIN roles r ON ((om.role_id = r.id)))
  WHERE ((om.organization_id = get_active_organization_id()) AND (om.user_id = auth.uid()) AND (r.name = 'admin'::text))))));
create policy "Org admins can manage memberships of teams in their org"
on "public"."team_user_memberships"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM ((teams t
     JOIN organization_memberships om ON ((t.organization_id = om.organization_id)))
     JOIN roles r ON ((om.role_id = r.id)))
  WHERE ((t.id = team_user_memberships.team_id) AND (om.user_id = auth.uid()) AND (r.name = 'admin'::text)))))
with check ((EXISTS ( SELECT 1
   FROM ((teams t
     JOIN organization_memberships om ON ((t.organization_id = om.organization_id)))
     JOIN roles r ON ((om.role_id = r.id)))
  WHERE ((t.id = team_user_memberships.team_id) AND (om.user_id = auth.uid()) AND (r.name = 'admin'::text)))));
create policy "Superusers can manage team user memberships"
on "public"."team_user_memberships"
as permissive
for all
to public
using ((auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid));
create policy "Team members can view their team memberships"
on "public"."team_user_memberships"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (teams t
     JOIN organization_memberships om ON ((t.organization_id = om.organization_id)))
  WHERE ((t.id = team_user_memberships.team_id) AND (om.user_id = auth.uid())))));
create policy "Org members can interact with teams in their org"
on "public"."teams"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM organization_memberships om
  WHERE ((om.organization_id = teams.organization_id) AND (om.user_id = auth.uid())))))
with check ((EXISTS ( SELECT 1
   FROM (organization_memberships om
     JOIN roles r ON ((om.role_id = r.id)))
  WHERE ((om.organization_id = teams.organization_id) AND (om.user_id = auth.uid()) AND (r.name = ANY (ARRAY['admin'::text, 'editor'::text]))))));
create policy "Superusers can manage teams"
on "public"."teams"
as permissive
for all
to public
using ((auth.uid() = 'abade2e0-646c-4e80-bddd-98333a56f1f7'::uuid));
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
CREATE TRIGGER handle_organization_memberships_updated_at BEFORE UPDATE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
CREATE TRIGGER handle_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
CREATE TRIGGER update_saved_searches_updated_at_trigger BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION update_saved_searches_updated_at();
CREATE TRIGGER handle_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
