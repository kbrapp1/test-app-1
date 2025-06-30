-- Fix find_similar_vectors function to include new content columns
DROP FUNCTION IF EXISTS find_similar_vectors(UUID, UUID, vector, FLOAT, INT);

CREATE OR REPLACE FUNCTION find_similar_vectors(
  query_organization_id UUID,
  query_chatbot_config_id UUID,
  query_vector vector(1536),
  similarity_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  chatbot_config_id UUID,
  knowledge_item_id TEXT,
  vector vector(1536),
  content_hash TEXT,
  content TEXT,
  title TEXT,
  category TEXT,
  source_type TEXT,
  source_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    ckv.id,
    ckv.organization_id,
    ckv.chatbot_config_id,
    ckv.knowledge_item_id,
    ckv.vector,
    ckv.content_hash,
    ckv.content,
    ckv.title,
    ckv.category,
    ckv.source_type,
    ckv.source_url,
    ckv.metadata,
    ckv.created_at,
    ckv.updated_at,
    1 - (ckv.vector <=> query_vector) as similarity
  FROM chatbot_knowledge_vectors ckv
  WHERE 
    ckv.organization_id = query_organization_id
    AND ckv.chatbot_config_id = query_chatbot_config_id
    AND 1 - (ckv.vector <=> query_vector) > similarity_threshold
  ORDER BY ckv.vector <=> query_vector ASC
  LIMIT match_count;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION find_similar_vectors TO authenticated;

-- Update comment
COMMENT ON FUNCTION find_similar_vectors IS 'Find similar vectors using cosine similarity with pgvector, returns all content fields'; 