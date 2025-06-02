-- Create the image_generations table for AI image generation MVP
CREATE TABLE IF NOT EXISTS image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  model_name VARCHAR(100) NOT NULL DEFAULT 'flux-1-kontext-pro',
  provider_name VARCHAR(50) NOT NULL DEFAULT 'replicate',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result_image_url TEXT,
  replicate_prediction_id VARCHAR(100),
  cost_cents INTEGER NOT NULL DEFAULT 5,
  generation_time_seconds INTEGER,
  image_width INTEGER NOT NULL DEFAULT 1024,
  image_height INTEGER NOT NULL DEFAULT 1024,
  saved_to_dam BOOLEAN NOT NULL DEFAULT false,
  dam_asset_id UUID,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add check constraints for data integrity
ALTER TABLE image_generations 
ADD CONSTRAINT check_image_generations_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE image_generations 
ADD CONSTRAINT check_image_generations_prompt_length 
CHECK (char_length(prompt) >= 3 AND char_length(prompt) <= 2000);

ALTER TABLE image_generations 
ADD CONSTRAINT check_image_generations_cost_positive 
CHECK (cost_cents >= 0);

ALTER TABLE image_generations 
ADD CONSTRAINT check_image_generations_dimensions_positive 
CHECK (image_width > 0 AND image_height > 0);

ALTER TABLE image_generations 
ADD CONSTRAINT check_image_generations_generation_time_positive 
CHECK (generation_time_seconds IS NULL OR generation_time_seconds > 0);

-- Create indexes for performance optimization
CREATE INDEX idx_image_generations_user_org ON image_generations(user_id, organization_id);
CREATE INDEX idx_image_generations_status ON image_generations(status);
CREATE INDEX idx_image_generations_created_at ON image_generations(created_at DESC);
CREATE INDEX idx_image_generations_user_created_at ON image_generations(user_id, created_at DESC);
CREATE INDEX idx_image_generations_org_created_at ON image_generations(organization_id, created_at DESC);
CREATE INDEX idx_image_generations_replicate_prediction ON image_generations(replicate_prediction_id) WHERE replicate_prediction_id IS NOT NULL;
CREATE INDEX idx_image_generations_dam_asset ON image_generations(dam_asset_id) WHERE dam_asset_id IS NOT NULL;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_image_generations_updated_at 
    BEFORE UPDATE ON image_generations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own generations
CREATE POLICY "Users can view their own generations" 
ON image_generations FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" 
ON image_generations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" 
ON image_generations FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
ON image_generations FOR DELETE 
USING (auth.uid() = user_id);

-- Additional policy for organization members to view organization generations
-- (for admin/organization-level features)
CREATE POLICY "Organization members can view org generations" 
ON image_generations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM organization_memberships 
    WHERE organization_memberships.organization_id = image_generations.organization_id 
    AND organization_memberships.user_id = auth.uid()
  )
);

-- Create a function to get generation statistics (useful for analytics)
CREATE OR REPLACE FUNCTION get_user_generation_stats(target_user_id UUID)
RETURNS TABLE (
  total_generations BIGINT,
  completed_generations BIGINT,
  failed_generations BIGINT,
  total_cost_cents BIGINT,
  avg_generation_time_seconds NUMERIC,
  saved_to_dam_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_generations,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_generations,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_generations,
    COALESCE(SUM(cost_cents), 0) as total_cost_cents,
    ROUND(AVG(generation_time_seconds), 2) as avg_generation_time_seconds,
    COUNT(*) FILTER (WHERE saved_to_dam = true) as saved_to_dam_count
  FROM image_generations 
  WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the statistics function
GRANT EXECUTE ON FUNCTION get_user_generation_stats(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE image_generations IS 'Stores AI image generation requests and results';
COMMENT ON COLUMN image_generations.id IS 'Unique identifier for each generation';
COMMENT ON COLUMN image_generations.organization_id IS 'Organization the generation belongs to';
COMMENT ON COLUMN image_generations.user_id IS 'User who created the generation';
COMMENT ON COLUMN image_generations.prompt IS 'Text prompt used for generation (3-2000 chars)';
COMMENT ON COLUMN image_generations.model_name IS 'AI model used (e.g., flux-1-kontext-pro)';
COMMENT ON COLUMN image_generations.provider_name IS 'AI service provider (e.g., replicate)';
COMMENT ON COLUMN image_generations.status IS 'Generation status: pending, processing, completed, failed, cancelled';
COMMENT ON COLUMN image_generations.result_image_url IS 'URL of the generated image';
COMMENT ON COLUMN image_generations.replicate_prediction_id IS 'External provider tracking ID';
COMMENT ON COLUMN image_generations.cost_cents IS 'Generation cost in cents';
COMMENT ON COLUMN image_generations.generation_time_seconds IS 'Time taken to generate image';
COMMENT ON COLUMN image_generations.image_width IS 'Generated image width in pixels';
COMMENT ON COLUMN image_generations.image_height IS 'Generated image height in pixels';
COMMENT ON COLUMN image_generations.saved_to_dam IS 'Whether image was saved to DAM system';
COMMENT ON COLUMN image_generations.dam_asset_id IS 'DAM asset ID if saved to DAM';
COMMENT ON COLUMN image_generations.error_message IS 'Error details if generation failed';
COMMENT ON COLUMN image_generations.metadata IS 'Additional generation metadata as JSON';

-- Note: generation_summaries view was originally created here but later replaced
-- with a secure function in migration 20250531114801_replace_view_with_secure_function.sql
-- to eliminate the open lock icon issue in Supabase Dashboard
