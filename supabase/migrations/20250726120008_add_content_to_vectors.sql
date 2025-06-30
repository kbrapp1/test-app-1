-- Add content column to chatbot_knowledge_vectors table
-- This allows the vector table to store both embeddings AND the actual text content
-- needed for semantic search and completion injection

ALTER TABLE chatbot_knowledge_vectors 
ADD COLUMN content TEXT NOT NULL DEFAULT '';

-- Add title column for better organization
ALTER TABLE chatbot_knowledge_vectors 
ADD COLUMN title TEXT NOT NULL DEFAULT '';

-- Add category for filtering
ALTER TABLE chatbot_knowledge_vectors 
ADD COLUMN category TEXT NOT NULL DEFAULT 'general';

-- Add source information
ALTER TABLE chatbot_knowledge_vectors 
ADD COLUMN source_type TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE chatbot_knowledge_vectors 
ADD COLUMN source_url TEXT;

-- Create index for content search
CREATE INDEX chatbot_knowledge_vectors_content_search_idx 
ON chatbot_knowledge_vectors USING gin(to_tsvector('english', content));

-- Create index for category filtering
CREATE INDEX chatbot_knowledge_vectors_category_idx 
ON chatbot_knowledge_vectors(category);

-- Create index for source type filtering  
CREATE INDEX chatbot_knowledge_vectors_source_type_idx 
ON chatbot_knowledge_vectors(source_type);

-- Update table comment
COMMENT ON TABLE chatbot_knowledge_vectors IS 'Stores vector embeddings AND content for chatbot knowledge base items - single source for semantic search and completion injection';
COMMENT ON COLUMN chatbot_knowledge_vectors.content IS 'The actual text content that gets injected into completions';
COMMENT ON COLUMN chatbot_knowledge_vectors.title IS 'Title or heading for the knowledge item';
COMMENT ON COLUMN chatbot_knowledge_vectors.category IS 'Category for filtering (e.g., faq, product_info, support)';
COMMENT ON COLUMN chatbot_knowledge_vectors.source_type IS 'Source type (e.g., website_crawled, manual, faq, company_info)';
COMMENT ON COLUMN chatbot_knowledge_vectors.source_url IS 'Original source URL if applicable'; 