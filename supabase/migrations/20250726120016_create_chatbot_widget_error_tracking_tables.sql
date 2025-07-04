-- Create comprehensive chatbot widget error tracking system
-- Following 2025 best practices but scoped to chatbot widget domain
-- 3 specialized tables for different error categories

-- ===== CHATBOT CONVERSATION ERRORS =====
-- User interaction, AI responses, session management
CREATE TABLE public.chatbot_conversation_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Error Classification
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_category TEXT NOT NULL CHECK (error_category IN (
        'message_processing', 'conversation_flow', 'session_management', 
        'context_extraction', 'ai_response_generation', 'token_limit',
        'model_configuration', 'embedding_generation'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context Information
    session_id TEXT,
    conversation_id TEXT,
    message_id TEXT,
    user_id UUID,
    organization_id UUID NOT NULL,
    
    -- AI/LLM Specific Context
    model_name TEXT,
    token_usage JSONB, -- { promptTokens, completionTokens, totalCostCents }
    prompt_length INTEGER,
    response_length INTEGER,
    
    -- Error Details
    error_context JSONB NOT NULL DEFAULT '{}',
    stack_trace TEXT,
    user_query TEXT,
    
    -- Performance Metrics
    response_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- OpenTelemetry Integration
    trace_id TEXT,
    span_id TEXT
);

-- ===== CHATBOT KNOWLEDGE ERRORS =====
-- Knowledge base, crawling, vector search, content processing
CREATE TABLE public.chatbot_knowledge_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Error Classification
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_category TEXT NOT NULL CHECK (error_category IN (
        'knowledge_retrieval', 'vector_search', 'knowledge_indexing', 
        'knowledge_cache', 'website_crawling', 'content_extraction',
        'content_deduplication', 'url_normalization'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context Information
    session_id TEXT,
    user_id UUID,
    organization_id UUID NOT NULL,
    chatbot_config_id UUID,
    
    -- Knowledge Specific Context
    source_url TEXT,
    source_type TEXT, -- 'website', 'document', 'manual'
    content_type TEXT,
    query_text TEXT,
    
    -- Vector/Search Context
    vector_dimensions INTEGER,
    similarity_threshold DECIMAL(5,3),
    search_results_count INTEGER,
    
    -- Crawling Context
    crawl_depth INTEGER,
    pages_attempted INTEGER,
    pages_successful INTEGER,
    
    -- Error Details
    error_context JSONB NOT NULL DEFAULT '{}',
    stack_trace TEXT,
    
    -- Performance Metrics
    processing_time_ms INTEGER,
    memory_usage_mb INTEGER,
    cache_hit_rate DECIMAL(5,3),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- OpenTelemetry Integration
    trace_id TEXT,
    span_id TEXT
);

-- ===== CHATBOT SYSTEM ERRORS =====
-- Configuration, rendering, performance, security, data persistence
CREATE TABLE public.chatbot_system_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Error Classification
    error_code TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_category TEXT NOT NULL CHECK (error_category IN (
        'widget_rendering', 'widget_configuration', 'chatbot_configuration',
        'integration_configuration', 'external_service', 'api_rate_limit',
        'data_persistence', 'data_validation', 'security_violation',
        'authentication', 'authorization', 'performance_threshold',
        'resource_exhaustion', 'analytics_tracking'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Context Information
    session_id TEXT,
    user_id UUID,
    organization_id UUID NOT NULL,
    chatbot_config_id UUID,
    
    -- System Context
    component_name TEXT,
    service_name TEXT,
    operation_name TEXT,
    
    -- Configuration Context
    config_field TEXT,
    config_value TEXT,
    integration_type TEXT,
    
    -- Performance Context
    threshold_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    metric_name TEXT,
    
    -- External Service Context
    external_service TEXT,
    api_endpoint TEXT,
    http_status_code INTEGER,
    
    -- Security Context
    violation_type TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Error Details
    error_context JSONB NOT NULL DEFAULT '{}',
    stack_trace TEXT,
    
    -- Performance Metrics
    processing_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- OpenTelemetry Integration
    trace_id TEXT,
    span_id TEXT
);

-- ===== INDEXES FOR PERFORMANCE =====

-- Conversation Errors Indexes
CREATE INDEX idx_chatbot_conversation_errors_org_created ON public.chatbot_conversation_errors(organization_id, created_at DESC);
CREATE INDEX idx_chatbot_conversation_errors_session ON public.chatbot_conversation_errors(session_id);
CREATE INDEX idx_chatbot_conversation_errors_category ON public.chatbot_conversation_errors(error_category);
CREATE INDEX idx_chatbot_conversation_errors_severity ON public.chatbot_conversation_errors(severity);
CREATE INDEX idx_chatbot_conversation_errors_model ON public.chatbot_conversation_errors(model_name);
CREATE INDEX idx_chatbot_conversation_errors_trace ON public.chatbot_conversation_errors(trace_id);

-- Knowledge Errors Indexes
CREATE INDEX idx_chatbot_knowledge_errors_org_created ON public.chatbot_knowledge_errors(organization_id, created_at DESC);
CREATE INDEX idx_chatbot_knowledge_errors_session ON public.chatbot_knowledge_errors(session_id);
CREATE INDEX idx_chatbot_knowledge_errors_category ON public.chatbot_knowledge_errors(error_category);
CREATE INDEX idx_chatbot_knowledge_errors_severity ON public.chatbot_knowledge_errors(severity);
CREATE INDEX idx_chatbot_knowledge_errors_source ON public.chatbot_knowledge_errors(source_url);
CREATE INDEX idx_chatbot_knowledge_errors_config ON public.chatbot_knowledge_errors(chatbot_config_id);
CREATE INDEX idx_chatbot_knowledge_errors_trace ON public.chatbot_knowledge_errors(trace_id);

-- System Errors Indexes
CREATE INDEX idx_chatbot_system_errors_org_created ON public.chatbot_system_errors(organization_id, created_at DESC);
CREATE INDEX idx_chatbot_system_errors_session ON public.chatbot_system_errors(session_id);
CREATE INDEX idx_chatbot_system_errors_category ON public.chatbot_system_errors(error_category);
CREATE INDEX idx_chatbot_system_errors_severity ON public.chatbot_system_errors(severity);
CREATE INDEX idx_chatbot_system_errors_component ON public.chatbot_system_errors(component_name);
CREATE INDEX idx_chatbot_system_errors_service ON public.chatbot_system_errors(service_name);
CREATE INDEX idx_chatbot_system_errors_trace ON public.chatbot_system_errors(trace_id);

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS on all tables
ALTER TABLE public.chatbot_conversation_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_system_errors ENABLE ROW LEVEL SECURITY;

-- Conversation Errors RLS Policies
CREATE POLICY "conversation_errors_select" ON public.chatbot_conversation_errors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "conversation_errors_insert" ON public.chatbot_conversation_errors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "conversation_errors_update" ON public.chatbot_conversation_errors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

-- Knowledge Errors RLS Policies
CREATE POLICY "knowledge_errors_select" ON public.chatbot_knowledge_errors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "knowledge_errors_insert" ON public.chatbot_knowledge_errors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "knowledge_errors_update" ON public.chatbot_knowledge_errors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

-- System Errors RLS Policies
CREATE POLICY "system_errors_select" ON public.chatbot_system_errors
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "system_errors_insert" ON public.chatbot_system_errors
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

CREATE POLICY "system_errors_update" ON public.chatbot_system_errors
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.user_organization_permissions WHERE user_id = auth.uid() AND revoked_at IS NULL
        )
    );

-- ===== DOCUMENTATION =====

-- Table Comments
COMMENT ON TABLE public.chatbot_conversation_errors IS 'Tracks conversation, AI response, and session management errors in chatbot widget';
COMMENT ON TABLE public.chatbot_knowledge_errors IS 'Tracks knowledge base, crawling, and vector search errors in chatbot widget';
COMMENT ON TABLE public.chatbot_system_errors IS 'Tracks configuration, rendering, and system-level errors in chatbot widget';

-- Key Column Comments
COMMENT ON COLUMN public.chatbot_conversation_errors.error_category IS 'Specific conversation error type for targeted analysis';
COMMENT ON COLUMN public.chatbot_conversation_errors.token_usage IS 'LLM token usage: {promptTokens, completionTokens, totalCostCents}';
COMMENT ON COLUMN public.chatbot_conversation_errors.trace_id IS 'OpenTelemetry trace ID for distributed tracing';

COMMENT ON COLUMN public.chatbot_knowledge_errors.error_category IS 'Specific knowledge error type for targeted analysis';
COMMENT ON COLUMN public.chatbot_knowledge_errors.similarity_threshold IS 'Vector similarity threshold that failed';
COMMENT ON COLUMN public.chatbot_knowledge_errors.cache_hit_rate IS 'Cache efficiency at time of error';

COMMENT ON COLUMN public.chatbot_system_errors.error_category IS 'Specific system error type for targeted analysis';
COMMENT ON COLUMN public.chatbot_system_errors.threshold_value IS 'Performance threshold that was exceeded';
COMMENT ON COLUMN public.chatbot_system_errors.violation_type IS 'Type of security violation detected';

-- ===== MIGRATION DATA FROM EXISTING TABLE =====

-- Migrate existing fallback_errors to appropriate new table
-- Most fallback errors are AI response generation issues -> conversation_errors
INSERT INTO public.chatbot_conversation_errors (
    error_code,
    error_message,
    error_category,
    severity,
    session_id,
    user_id,
    organization_id,
    error_context,
    created_at,
    resolved_at,
    resolution_notes
)
SELECT 
    error_code,
    error_message,
    'ai_response_generation' as error_category,
    severity,
    session_id,
    user_id,
    organization_id,
    error_context,
    created_at,
    resolved_at,
    resolution_notes
FROM public.fallback_errors
WHERE error_code IN ('AI_RESPONSE_GENERATION_FAILED', 'RESPONSE_EXTRACTION_FAILED', 'TOKEN_LIMIT_EXCEEDED');

-- Migrate other fallback errors to system_errors
INSERT INTO public.chatbot_system_errors (
    error_code,
    error_message,
    error_category,
    severity,
    session_id,
    user_id,
    organization_id,
    error_context,
    created_at,
    resolved_at,
    resolution_notes
)
SELECT 
    error_code,
    error_message,
    'external_service' as error_category,
    severity,
    session_id,
    user_id,
    organization_id,
    error_context,
    created_at,
    resolved_at,
    resolution_notes
FROM public.fallback_errors
WHERE error_code NOT IN ('AI_RESPONSE_GENERATION_FAILED', 'RESPONSE_EXTRACTION_FAILED', 'TOKEN_LIMIT_EXCEEDED');

-- Note: We'll keep the fallback_errors table for now to avoid breaking existing code
-- It can be dropped in a future migration after updating all references 