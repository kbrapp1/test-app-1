set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_generation_summaries()
 RETURNS TABLE(id uuid, organization_id uuid, user_id uuid, prompt_preview text, model_name character varying, provider_name character varying, status character varying, cost_cents integer, generation_time_seconds integer, saved_to_dam boolean, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return only generations the current user can access
  RETURN QUERY
  SELECT
    ig.id,
    ig.organization_id,
    ig.user_id,
    LEFT(ig.prompt, 100) || CASE WHEN LENGTH(ig.prompt) > 100 THEN '...' ELSE '' END as prompt_preview,

    ig.model_name,
    ig.provider_name,
    ig.status,
    ig.cost_cents,
    ig.generation_time_seconds,
    ig.saved_to_dam,
    ig.created_at,
    ig.updated_at
  FROM image_generations ig
  WHERE ig.user_id = auth.uid()  -- Users can see their own generations
     OR EXISTS (
       SELECT 1 FROM organization_memberships om
       WHERE om.organization_id = ig.organization_id
       AND om.user_id = auth.uid()
     ); -- Organization members can see org generations
END;
$function$
;


