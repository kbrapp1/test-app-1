-- Enable pgvector extension for vector storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table for storing knowledge vectors
CREATE TABLE chatbot_knowledge_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  chatbot_config_id UUID NOT NULL,
  knowledge_item_id TEXT NOT NULL,
  vector vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimensions
  content_hash TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one vector per knowledge item per chatbot config
  UNIQUE(organization_id, chatbot_config_id, knowledge_item_id)
);

-- Create indexes for performance
CREATE INDEX chatbot_knowledge_vectors_org_config_idx 
ON chatbot_knowledge_vectors(organization_id, chatbot_config_id);

CREATE INDEX chatbot_knowledge_vectors_content_hash_idx 
ON chatbot_knowledge_vectors(content_hash);

-- Create vector similarity index (IVFFlat for cosine similarity)
CREATE INDEX chatbot_knowledge_vectors_vector_idx 
ON chatbot_knowledge_vectors 
USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);

-- Add RLS policies
ALTER TABLE chatbot_knowledge_vectors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access vectors for their organization
CREATE POLICY "Users can access vectors for their organization" ON chatbot_knowledge_vectors
FOR ALL USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organization_permissions
    WHERE user_id = auth.uid()
    AND revoked_at IS NULL
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_chatbot_knowledge_vectors_updated_at
BEFORE UPDATE ON chatbot_knowledge_vectors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE chatbot_knowledge_vectors IS 'Stores vector embeddings for chatbot knowledge base items';
COMMENT ON COLUMN chatbot_knowledge_vectors.vector IS 'OpenAI text-embedding-3-small vector (1536 dimensions)';
COMMENT ON COLUMN chatbot_knowledge_vectors.content_hash IS 'SHA-256 hash of content for change detection';
COMMENT ON COLUMN chatbot_knowledge_vectors.metadata IS 'Additional metadata about the knowledge item'; 