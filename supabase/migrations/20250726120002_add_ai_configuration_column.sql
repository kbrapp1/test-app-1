-- Add ai_configuration column to chatbot_configs table
-- This column stores AI configuration settings as JSONB

ALTER TABLE chatbot_configs 
ADD COLUMN ai_configuration JSONB NOT NULL DEFAULT '{
    "openaiModel": "gpt-4o-mini",
    "openaiTemperature": 0.3,
    "openaiMaxTokens": 1000,
    "contextMaxTokens": 12000,
    "contextSystemPromptTokens": 500,
    "contextResponseReservedTokens": 3000,
    "contextSummaryTokens": 200,
    "intentConfidenceThreshold": 0.7,
    "intentAmbiguityThreshold": 0.2,
    "enableMultiIntentDetection": true,
    "enablePersonaInference": true,
    "enableAdvancedEntities": true,
    "entityExtractionMode": "comprehensive",
    "customEntityTypes": [],
    "maxConversationTurns": 20,
    "inactivityTimeoutSeconds": 300,
    "enableJourneyRegression": true,
    "enableContextSwitchDetection": true,
    "enableAdvancedScoring": true,
    "entityCompletenessWeight": 0.3,
    "personaConfidenceWeight": 0.2,
    "journeyProgressionWeight": 0.25,
    "enablePerformanceLogging": true,
    "enableIntentAnalytics": true,
    "enablePersonaAnalytics": true,
    "responseTimeThresholdMs": 2000
}'::jsonb;

-- Create index for ai_configuration JSONB column for better query performance
CREATE INDEX idx_chatbot_configs_ai_configuration ON chatbot_configs USING GIN (ai_configuration);

-- Add comment to document the column purpose
COMMENT ON COLUMN chatbot_configs.ai_configuration IS 'AI configuration settings including OpenAI model parameters, context window settings, intent classification, entity extraction, conversation flow, lead scoring, and performance monitoring configuration'; 