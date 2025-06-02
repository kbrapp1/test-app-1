-- Remove the replicate-specific prediction ID column
-- All providers now use the generic external_provider_id field

ALTER TABLE public.image_generations 
DROP COLUMN IF EXISTS replicate_prediction_id;
