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
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_saved_searches_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;


