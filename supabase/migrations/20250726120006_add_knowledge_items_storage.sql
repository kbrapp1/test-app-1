-- Knowledge Items Storage - 2025 RAG Best Practice
-- Stores original content alongside vectors for complete RAG pipeline

-- Create table for storing knowledge items with content
CREATE TABLE chatbot_knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_config_id UUID NOT NULL,
  knowledge_item_id TEXT NOT NULL, -- Original knowledge item ID
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- ← THE ACTUAL CONTENT FOR ANSWERING QUESTIONS
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source_type TEXT NOT NULL, -- 'faq', 'company_info', 'product_catalog', 'support_docs', 'website_crawled'
  source_url TEXT, -- For website crawled content
  source_metadata JSONB DEFAULT '{}',
  intent_relevance TEXT[] DEFAULT '{}',
  relevance_score FLOAT DEFAULT 0.8,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one knowledge item per chatbot config
  UNIQUE(organization_id, chatbot_config_id, knowledge_item_id)
);

-- Create indexes for performance
CREATE INDEX chatbot_knowledge_items_org_config_idx 
ON chatbot_knowledge_items(organization_id, chatbot_config_id);

CREATE INDEX chatbot_knowledge_items_category_idx 
ON chatbot_knowledge_items(category);

CREATE INDEX chatbot_knowledge_items_source_type_idx 
ON chatbot_knowledge_items(source_type);

CREATE INDEX chatbot_knowledge_items_content_hash_idx 
ON chatbot_knowledge_items(content_hash);

-- Create vector similarity index (IVFFlat for cosine similarity)
CREATE INDEX chatbot_knowledge_items_embedding_idx 
ON chatbot_knowledge_items 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Vector similarity search function
CREATE OR REPLACE FUNCTION match_knowledge_items(
  query_organization_id UUID,
  query_chatbot_config_id UUID,
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 3,
  intent_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  source_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  knowledge_item_id TEXT,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  source_type TEXT,
  source_url TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    k.id,
    k.knowledge_item_id,
    k.title,
    k.content,
    k.category,
    k.tags,
    k.source_type,
    k.source_url,
    1 - (k.embedding <=> query_embedding) as similarity
  FROM chatbot_knowledge_items k
  WHERE 
    k.organization_id = query_organization_id
    AND k.chatbot_config_id = query_chatbot_config_id
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
    AND (intent_filter IS NULL OR intent_filter = ANY(k.intent_relevance))
    AND (category_filter IS NULL OR k.category = category_filter)
    AND (source_type_filter IS NULL OR k.source_type = source_type_filter)
  ORDER BY k.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- Add RLS policies
ALTER TABLE chatbot_knowledge_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access knowledge items for their organization
CREATE POLICY "Users can access knowledge items for their organization" ON chatbot_knowledge_items
FOR ALL USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_permissions
    WHERE user_id = auth.uid()
    AND revoked_at IS NULL
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_chatbot_knowledge_items_updated_at
BEFORE UPDATE ON chatbot_knowledge_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION match_knowledge_items TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE chatbot_knowledge_items IS 'Stores knowledge items with original content and embeddings for RAG pipeline';
COMMENT ON COLUMN chatbot_knowledge_items.content IS 'Original content used for answering user questions';
COMMENT ON COLUMN chatbot_knowledge_items.embedding IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN chatbot_knowledge_items.source_type IS 'Type of content: faq, company_info, product_catalog, support_docs, website_crawled';
COMMENT ON COLUMN chatbot_knowledge_items.source_url IS 'Original URL for website crawled content';
COMMENT ON FUNCTION match_knowledge_items IS 'Find similar knowledge items using vector similarity search'; 