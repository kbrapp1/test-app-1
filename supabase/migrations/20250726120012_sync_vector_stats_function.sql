set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_vector_stats(query_organization_id uuid, query_chatbot_config_id uuid)
 RETURNS TABLE(total_vectors bigint, last_updated timestamp with time zone, avg_vector_age double precision, storage_size bigint)
 LANGUAGE sql
 STABLE
AS $function$
  SELECT 
    COUNT(*) as total_vectors,
    MAX(updated_at) as last_updated,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 86400 as avg_vector_age, -- in days
    pg_total_relation_size('chatbot_knowledge_vectors') as storage_size
  FROM chatbot_knowledge_vectors
  WHERE 
    organization_id = query_organization_id
    AND chatbot_config_id = query_chatbot_config_id;
$function$
;


