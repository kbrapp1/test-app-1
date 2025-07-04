-- Create fallback_errors table for tracking fallback error occurrences
-- This table stores detailed information about when fallback responses are triggered

CREATE TABLE public.fallback_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_context JSONB NOT NULL DEFAULT '{}',
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    session_id TEXT,
    user_id UUID,
    organization_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

-- Create indexes for efficient querying
CREATE INDEX idx_fallback_errors_organization_id ON public.fallback_errors(organization_id);
CREATE INDEX idx_fallback_errors_error_code ON public.fallback_errors(error_code);
CREATE INDEX idx_fallback_errors_severity ON public.fallback_errors(severity);
CREATE INDEX idx_fallback_errors_created_at ON public.fallback_errors(created_at);
CREATE INDEX idx_fallback_errors_session_id ON public.fallback_errors(session_id);

-- Create composite index for common query patterns
CREATE INDEX idx_fallback_errors_org_created ON public.fallback_errors(organization_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.fallback_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for multi-tenant access
CREATE POLICY "Users can view fallback errors from their organization" ON public.fallback_errors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organization_permissions
            WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "Users can insert fallback errors for their organization" ON public.fallback_errors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organization_permissions
            WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "Users can update fallback errors from their organization" ON public.fallback_errors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id
            FROM public.user_organization_permissions
            WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.fallback_errors IS 'Tracks fallback error occurrences for monitoring and debugging';
COMMENT ON COLUMN public.fallback_errors.error_code IS 'Standardized error code for categorization';
COMMENT ON COLUMN public.fallback_errors.error_message IS 'Human-readable error message';
COMMENT ON COLUMN public.fallback_errors.error_context IS 'Additional context and debugging information';
COMMENT ON COLUMN public.fallback_errors.severity IS 'Error severity level: low, medium, high, critical';
COMMENT ON COLUMN public.fallback_errors.session_id IS 'Chat session where the error occurred';
COMMENT ON COLUMN public.fallback_errors.resolved_at IS 'When the error was resolved (if applicable)';
COMMENT ON COLUMN public.fallback_errors.resolution_notes IS 'Notes about how the error was resolved'; 