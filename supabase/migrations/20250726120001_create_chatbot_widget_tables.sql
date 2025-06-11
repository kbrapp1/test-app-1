-- Create chatbot_configs table
CREATE TABLE chatbot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    description TEXT,
    
    -- Personality settings (stored as JSONB)
    personality_settings JSONB NOT NULL DEFAULT '{
        "tone": "professional",
        "communicationStyle": "helpful", 
        "responseLength": "adaptive",
        "escalationTriggers": []
    }'::jsonb,
    
    -- Knowledge base (stored as JSONB)
    knowledge_base JSONB NOT NULL DEFAULT '{
        "companyInfo": "",
        "productCatalog": "",
        "faqs": [],
        "supportDocs": "",
        "complianceGuidelines": ""
    }'::jsonb,
    
    -- Operating hours (stored as JSONB)
    operating_hours JSONB NOT NULL DEFAULT '{
        "timezone": "UTC",
        "businessHours": [],
        "holidaySchedule": [],
        "outsideHoursMessage": "We are currently closed. Please leave a message and we will get back to you."
    }'::jsonb,
    
    -- Lead qualification questions (stored as JSONB array)
    lead_qualification_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chatbot_configs_name_length CHECK (LENGTH(name) > 0 AND LENGTH(name) <= 100),
    CONSTRAINT chatbot_configs_org_name_unique UNIQUE (organization_id, name)
);

-- Create indexes
CREATE INDEX idx_chatbot_configs_organization_id ON chatbot_configs(organization_id);
CREATE INDEX idx_chatbot_configs_active ON chatbot_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_chatbot_configs_updated_at ON chatbot_configs(updated_at);

-- Create chat_sessions table
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_config_id UUID NOT NULL REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL, -- Fingerprint or anonymous ID
    session_token VARCHAR(255) NOT NULL UNIQUE,
    
    -- Context data (stored as JSONB)
    context_data JSONB NOT NULL DEFAULT '{
        "visitorName": null,
        "email": null,
        "phone": null,
        "company": null,
        "previousVisits": 0,
        "pageViews": [],
        "conversationSummary": "",
        "topics": [],
        "interests": [],
        "engagementScore": 50
    }'::jsonb,
    
    -- Lead qualification state (stored as JSONB)
    lead_qualification_state JSONB NOT NULL DEFAULT '{
        "currentStep": 0,
        "totalSteps": 0,
        "answeredQuestions": [],
        "qualificationStatus": "not_started",
        "isQualified": false,
        "leadScore": 0,
        "engagementLevel": "low"
    }'::jsonb,
    
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'escalated')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Browser/request metadata
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    current_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for chat_sessions
CREATE INDEX idx_chat_sessions_chatbot_config_id ON chat_sessions(chatbot_config_id);
CREATE INDEX idx_chat_sessions_visitor_id ON chat_sessions(visitor_id);
CREATE INDEX idx_chat_sessions_session_token ON chat_sessions(session_token);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_last_activity ON chat_sessions(last_activity_at);
CREATE INDEX idx_chat_sessions_started_at ON chat_sessions(started_at);

-- Create chat_messages table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'bot', 'system', 'lead_capture', 'qualification')),
    content TEXT NOT NULL,
    
    -- Message metadata (stored as JSONB)
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for chat_messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX idx_chat_messages_type ON chat_messages(message_type);
CREATE INDEX idx_chat_messages_visible ON chat_messages(is_visible) WHERE is_visible = true;

-- Create chat_leads table
CREATE TABLE chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    chatbot_config_id UUID NOT NULL REFERENCES chatbot_configs(id) ON DELETE CASCADE,
    
    -- Contact information (stored as JSONB)
    contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Qualification data (stored as JSONB)
    qualification_data JSONB NOT NULL DEFAULT '{
        "answeredQuestions": [],
        "engagementLevel": "low",
        "budget": null,
        "timeline": null,
        "decisionMaker": null,
        "currentSolution": null,
        "painPoints": [],
        "industry": null,
        "companySize": null
    }'::jsonb,
    
    lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
    qualification_status VARCHAR(20) NOT NULL DEFAULT 'not_qualified' CHECK (qualification_status IN ('not_qualified', 'qualified', 'highly_qualified', 'disqualified')),
    
    -- Lead source tracking
    source JSONB NOT NULL DEFAULT '{
        "type": "chatbot",
        "chatbotName": null,
        "referrerUrl": null,
        "campaignSource": null,
        "medium": "chat",
        "ipAddress": null,
        "userAgent": null
    }'::jsonb,
    
    conversation_summary TEXT NOT NULL DEFAULT '',
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Follow-up tracking
    follow_up_status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (follow_up_status IN ('new', 'contacted', 'in_progress', 'converted', 'lost', 'nurturing')),
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    last_contacted_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for chat_leads
CREATE INDEX idx_chat_leads_session_id ON chat_leads(session_id);
CREATE INDEX idx_chat_leads_organization_id ON chat_leads(organization_id);
CREATE INDEX idx_chat_leads_chatbot_config_id ON chat_leads(chatbot_config_id);
CREATE INDEX idx_chat_leads_qualification_status ON chat_leads(qualification_status);
CREATE INDEX idx_chat_leads_follow_up_status ON chat_leads(follow_up_status);
CREATE INDEX idx_chat_leads_lead_score ON chat_leads(lead_score);
CREATE INDEX idx_chat_leads_captured_at ON chat_leads(captured_at);
CREATE INDEX idx_chat_leads_assigned_to ON chat_leads(assigned_to);
CREATE INDEX idx_chat_leads_tags ON chat_leads USING GIN(tags);

-- Create lead_notes table for tracking follow-up notes
CREATE TABLE lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES chat_leads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id),
    note_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'call', 'email', 'meeting', 'proposal', 'follow_up')),
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for lead_notes
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_author_id ON lead_notes(author_id);
CREATE INDEX idx_lead_notes_created_at ON lead_notes(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chatbot_configs_updated_at BEFORE UPDATE ON chatbot_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chat_leads_updated_at BEFORE UPDATE ON chat_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON lead_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE chatbot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_configs
CREATE POLICY "Organization members can view chatbot configs" ON chatbot_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om 
            WHERE om.organization_id = chatbot_configs.organization_id 
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage chatbot configs" ON chatbot_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om 
            WHERE om.organization_id = chatbot_configs.organization_id 
            AND om.user_id = auth.uid()
            AND om.role IN ('admin', 'owner')
        )
    );

-- RLS Policies for chat_sessions
CREATE POLICY "Organization members can view chat sessions" ON chat_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chatbot_configs cc
            JOIN organization_memberships om ON om.organization_id = cc.organization_id
            WHERE cc.id = chat_sessions.chatbot_config_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage chat sessions" ON chat_sessions
    FOR ALL USING (true); -- Allow system operations (API calls)

-- RLS Policies for chat_messages  
CREATE POLICY "Organization members can view chat messages" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_sessions cs
            JOIN chatbot_configs cc ON cc.id = cs.chatbot_config_id
            JOIN organization_memberships om ON om.organization_id = cc.organization_id
            WHERE cs.id = chat_messages.session_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage chat messages" ON chat_messages
    FOR ALL USING (true); -- Allow system operations

-- RLS Policies for chat_leads
CREATE POLICY "Organization members can view chat leads" ON chat_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om 
            WHERE om.organization_id = chat_leads.organization_id 
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can manage chat leads" ON chat_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM organization_memberships om 
            WHERE om.organization_id = chat_leads.organization_id 
            AND om.user_id = auth.uid()
        )
    );

-- RLS Policies for lead_notes
CREATE POLICY "Organization members can view lead notes" ON lead_notes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_leads cl
            JOIN organization_memberships om ON om.organization_id = cl.organization_id
            WHERE cl.id = lead_notes.lead_id
            AND om.user_id = auth.uid()
        )
    );

CREATE POLICY "Organization members can manage their own lead notes" ON lead_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM chat_leads cl
            JOIN organization_memberships om ON om.organization_id = cl.organization_id
            WHERE cl.id = lead_notes.lead_id
            AND om.user_id = auth.uid()
        )
        AND (lead_notes.author_id = auth.uid() OR NOT lead_notes.is_private)
    );

-- Create function to get organization context for chatbot sessions
CREATE OR REPLACE FUNCTION get_organization_id_from_session(session_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT cc.organization_id
        FROM chat_sessions cs
        JOIN chatbot_configs cc ON cc.id = cs.chatbot_config_id
        WHERE cs.id = session_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically set organization_id on chat_leads
CREATE OR REPLACE FUNCTION set_chat_lead_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        NEW.organization_id := get_organization_id_from_session(NEW.session_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_chat_lead_organization_id_trigger 
    BEFORE INSERT ON chat_leads 
    FOR EACH ROW 
    EXECUTE FUNCTION set_chat_lead_organization_id();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON chatbot_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_notes TO authenticated;

-- Grant permissions to service role (for API operations)
GRANT ALL ON chatbot_configs TO service_role;
GRANT ALL ON chat_sessions TO service_role;
GRANT ALL ON chat_messages TO service_role;
GRANT ALL ON chat_leads TO service_role;
GRANT ALL ON lead_notes TO service_role; 