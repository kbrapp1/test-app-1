create extension if not exists "pgjwt" with schema "extensions";


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_email_domain()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Add any domain validation logic here if needed
  -- For now, just allow all domains
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.grant_super_admin(target_user_id uuid, notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
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

CREATE OR REPLACE FUNCTION public.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    (SELECT is_super_admin 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$function$
;

CREATE OR REPLACE FUNCTION public.revoke_super_admin(target_user_id uuid, notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;


