-- Phase 2: Audit Trail Infrastructure
-- Single responsibility: Track all organization access and permission changes

-- Audit trail for compliance - Single responsibility: Track access events
CREATE TABLE public.organization_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action VARCHAR(50) NOT NULL, -- 'switch', 'access', 'permission_grant', 'permission_revoke'
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_org_access_log_user_time ON public.organization_access_log(user_id, created_at DESC);
CREATE INDEX idx_org_access_log_org_time ON public.organization_access_log(organization_id, created_at DESC);
CREATE INDEX idx_org_access_log_action ON public.organization_access_log(action);
CREATE INDEX idx_org_access_log_created_at ON public.organization_access_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.organization_access_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.organization_access_log
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- RLS Policy: Admins can view organization audit logs
CREATE POLICY "Admins can view organization audit logs" 
ON public.organization_access_log
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id 
    FROM public.organization_memberships om
    JOIN public.roles r ON om.role_id = r.id
    WHERE om.user_id = auth.uid() 
    AND r.name IN ('admin', 'owner')
  )
);

-- Audit helper function to log organization access events
CREATE OR REPLACE FUNCTION public.log_organization_access(
  p_user_id UUID,
  p_organization_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.organization_access_log (
    user_id,
    organization_id,
    action,
    details,
    ip_address,
    user_agent,
    session_id
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent,
    p_session_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to get audit trail with filtering
CREATE OR REPLACE FUNCTION public.get_audit_trail(
  p_organization_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  organization_id UUID,
  action TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ,
  user_email TEXT,
  organization_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    oal.id,
    oal.user_id,
    oal.organization_id,
    oal.action,
    oal.details,
    oal.ip_address,
    oal.user_agent,
    oal.session_id,
    oal.created_at,
    u.email as user_email,
    o.name as organization_name
  FROM public.organization_access_log oal
  LEFT JOIN auth.users u ON oal.user_id = u.id
  LEFT JOIN public.organizations o ON oal.organization_id = o.id
  WHERE 
    (p_organization_id IS NULL OR oal.organization_id = p_organization_id)
    AND (p_start_date IS NULL OR oal.created_at >= p_start_date)
    AND (p_end_date IS NULL OR oal.created_at <= p_end_date)
    AND (p_action IS NULL OR oal.action = p_action)
    AND (
      oal.user_id = auth.uid() -- User can see their own logs
      OR oal.organization_id IN (
        -- Or admin can see organization logs
        SELECT om.organization_id 
        FROM public.organization_memberships om
        JOIN public.roles r ON om.role_id = r.id
        WHERE om.user_id = auth.uid() 
        AND r.name IN ('admin', 'owner')
      )
    )
  ORDER BY oal.created_at DESC
  LIMIT p_limit;
$$;;
