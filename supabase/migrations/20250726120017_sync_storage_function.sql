set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_knowledge_vectors_storage_size(org_id text, chatbot_id text)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  table_size bigint;
  row_count bigint;
  estimated_size bigint;
BEGIN
  -- Get total count of rows for this org/chatbot
  SELECT COUNT(*)
  INTO row_count
  FROM chatbot_knowledge_vectors
  WHERE organization_id = org_id 
    AND chatbot_config_id = chatbot_id;

  -- If no rows, return 0
  IF row_count = 0 THEN
    RETURN 0;
  END IF;

  -- Get total table size (approximate approach since we can't filter pg_total_relation_size)
  SELECT pg_total_relation_size('chatbot_knowledge_vectors'::regclass) 
  INTO table_size;

  -- Get total rows in table
  SELECT reltuples::bigint 
  FROM pg_class 
  WHERE relname = 'chatbot_knowledge_vectors'
  INTO estimated_size;

  -- Calculate proportional size based on row count
  IF estimated_size > 0 THEN
    RETURN (table_size * row_count / estimated_size);
  ELSE
    -- Fallback: estimate based on average row size
    -- Approximate: 1536 dimensions * 4 bytes + metadata ~= 6-8KB per row
    RETURN row_count * 7000;
  END IF;
END;
$function$
;


