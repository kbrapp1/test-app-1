-- Phase 1.1: Create Core Context Table
-- Single responsibility: Track user's active organization

-- Core context table - Single responsibility: Track user's active organization
CREATE TABLE public.user_organization_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Performance indexes
CREATE INDEX idx_user_org_context_user_id ON public.user_organization_context(user_id);
CREATE INDEX idx_user_org_context_org_id ON public.user_organization_context(active_organization_id);

-- Enable RLS
ALTER TABLE public.user_organization_context ENABLE ROW LEVEL SECURITY;

-- Basic RLS policy - Users manage their own context
CREATE POLICY "Users can manage their own organization context" 
ON public.user_organization_context
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_organization_context_updated_at
  BEFORE UPDATE ON public.user_organization_context
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();;
