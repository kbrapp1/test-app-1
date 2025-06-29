-- Function for finding similar vectors using pgvector
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

-- Function for getting vector storage statistics
CREATE OR REPLACE FUNCTION get_vector_stats(
  query_organization_id UUID,
  query_chatbot_config_id UUID
)
RETURNS TABLE (
  total_vectors BIGINT,
  last_updated TIMESTAMPTZ,
  avg_vector_age FLOAT,
  storage_size BIGINT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    COUNT(*) as total_vectors,
    MAX(updated_at) as last_updated,
    AVG(EXTRACT(EPOCH FROM (NOW() - created_at))) / 86400 as avg_vector_age, -- in days
    pg_total_relation_size('chatbot_knowledge_vectors') as storage_size
  FROM chatbot_knowledge_vectors
  WHERE 
    organization_id = query_organization_id
    AND chatbot_config_id = query_chatbot_config_id;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION find_similar_vectors TO authenticated;
GRANT EXECUTE ON FUNCTION get_vector_stats TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION find_similar_vectors IS 'Find similar vectors using cosine similarity with pgvector';
COMMENT ON FUNCTION get_vector_stats IS 'Get storage statistics for vector cache performance monitoring'; 