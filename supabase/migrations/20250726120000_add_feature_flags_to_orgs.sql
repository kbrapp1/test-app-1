-- Migration to add feature flag support to existing organizations table
ALTER TABLE public.organizations
ADD COLUMN feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.feature_flags IS 'Defines which features are enabled. E.g., {"dam": true, "tts": false, "reporting": true}'; 