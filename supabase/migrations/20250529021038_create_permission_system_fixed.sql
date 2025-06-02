-- Phase 1.2: Create Permission Tracking System  
-- Single responsibility: Real-time access validation

-- Permission tracking - Single responsibility: Real-time access validation
CREATE TABLE public.user_organization_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'
);

-- Unique constraint to prevent duplicate active permissions
CREATE UNIQUE INDEX idx_user_org_active_permission 
ON public.user_organization_permissions(user_id, organization_id) 
WHERE revoked_at IS NULL;

-- Performance indexes for permission checking
CREATE INDEX idx_user_org_permissions_user_org ON public.user_organization_permissions(user_id, organization_id);
CREATE INDEX idx_user_org_permissions_active ON public.user_organization_permissions(user_id) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE public.user_organization_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own permissions
CREATE POLICY "Users can view their own permissions" 
ON public.user_organization_permissions
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Domain Service: Permission Validation
-- Single responsibility: Check user access to organizations

-- Function: Check if user has access to specific organization
CREATE OR REPLACE FUNCTION public.user_has_org_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_organization_permissions 
    WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND revoked_at IS NULL
  );
$$;

-- Function: Get user's active organization with permission validation
CREATE OR REPLACE FUNCTION public.get_active_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT uoc.active_organization_id 
  FROM public.user_organization_context uoc
  JOIN public.user_organization_permissions uop ON (
    uop.user_id = uoc.user_id 
    AND uop.organization_id = uoc.active_organization_id
    AND uop.revoked_at IS NULL
  )
  WHERE uoc.user_id = auth.uid()
  LIMIT 1;
$$;

-- Function: Get all user's accessible organizations
CREATE OR REPLACE FUNCTION public.get_user_accessible_organizations()
RETURNS TABLE(organization_id UUID, organization_name TEXT, role_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    uop.organization_id,
    o.name as organization_name,
    r.name as role_name
  FROM public.user_organization_permissions uop
  JOIN public.organizations o ON uop.organization_id = o.id
  JOIN public.roles r ON uop.role_id = r.id
  WHERE uop.user_id = auth.uid() 
  AND uop.revoked_at IS NULL
  ORDER BY uop.granted_at DESC;
$$;;
