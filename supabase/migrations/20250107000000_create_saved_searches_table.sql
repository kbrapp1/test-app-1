-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    search_criteria JSONB NOT NULL DEFAULT '{}',
    is_global BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    use_count INTEGER NOT NULL DEFAULT 0,
    
    -- Constraints
    CONSTRAINT saved_searches_name_length CHECK (char_length(name) > 0 AND char_length(name) <= 100),
    CONSTRAINT saved_searches_use_count_non_negative CHECK (use_count >= 0)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_org ON saved_searches(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_org_use_count ON saved_searches(organization_id, use_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_last_used ON saved_searches(last_used_at DESC NULLS LAST);

-- Enable Row Level Security
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own saved searches and popular searches from their organization
CREATE POLICY "Users can view saved searches in their organization" 
ON saved_searches FOR SELECT 
TO authenticated 
USING (organization_id = get_active_organization_id());

-- Users can insert their own saved searches
CREATE POLICY "Users can create their own saved searches" 
ON saved_searches FOR INSERT 
TO authenticated 
WITH CHECK (
    user_id = auth.uid() 
    AND organization_id = get_active_organization_id()
);

-- Users can update their own saved searches
CREATE POLICY "Users can update their own saved searches" 
ON saved_searches FOR UPDATE 
TO authenticated 
USING (
    user_id = auth.uid() 
    AND organization_id = get_active_organization_id()
);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete their own saved searches" 
ON saved_searches FOR DELETE 
TO authenticated 
USING (
    user_id = auth.uid() 
    AND organization_id = get_active_organization_id()
);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_searches_updated_at_trigger
    BEFORE UPDATE ON saved_searches
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_searches_updated_at(); 