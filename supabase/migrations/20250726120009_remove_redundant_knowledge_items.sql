-- Remove the redundant chatbot_knowledge_items table
-- The chatbot_knowledge_vectors table now contains both vectors AND content

-- First, drop any functions that reference the old table
DROP FUNCTION IF EXISTS get_knowledge_items_for_chatbot(UUID, UUID);

-- Drop the table
DROP TABLE IF EXISTS chatbot_knowledge_items CASCADE;

-- Update the similarity search function to use only the vector table
CREATE OR REPLACE FUNCTION similarity_search_knowledge(
  p_organization_id UUID,
  p_chatbot_config_id UUID,
  p_query_vector vector(1536),
  p_similarity_threshold float DEFAULT 0.7,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  knowledge_item_id TEXT,
  content TEXT,
  title TEXT,
  category TEXT,
  source_type TEXT,
  source_url TEXT,
  similarity float,
  metadata JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ckv.id,
    ckv.knowledge_item_id,
    ckv.content,
    ckv.title,
    ckv.category,
    ckv.source_type,
    ckv.source_url,
    1 - (ckv.vector <=> p_query_vector) as similarity,
    ckv.metadata
  FROM chatbot_knowledge_vectors ckv
  WHERE ckv.organization_id = p_organization_id
    AND ckv.chatbot_config_id = p_chatbot_config_id
    AND 1 - (ckv.vector <=> p_query_vector) > p_similarity_threshold
  ORDER BY ckv.vector <=> p_query_vector
  LIMIT p_limit;
END;
$$;

-- Add comment
COMMENT ON FUNCTION similarity_search_knowledge IS 'Performs semantic similarity search using vector embeddings and returns matching content with similarity scores'; 