set check_function_bodies = off;

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
        $function$
;

CREATE OR REPLACE FUNCTION public.debug_get_all_jwt_claims()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb;
$function$
;

CREATE OR REPLACE FUNCTION public.get_active_organization_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  SELECT nullif( (current_setting('request.jwt.claims', true)::jsonb -> 'custom_claims') ->> 'active_organization_id', '')::uuid;
$function$
;

CREATE OR REPLACE FUNCTION public.get_current_auth_uid_for_test()
 RETURNS uuid
 LANGUAGE sql
 SET search_path TO 'auth', 'pg_temp'
AS $function$
  SELECT auth.uid();
$function$
;

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
$function$
;

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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$function$
;

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
$function$
;

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
        $function$
;

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
$function$
;


