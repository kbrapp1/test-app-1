-- Add second_image_url column to image_generations table for multi-image support
-- This supports models like flux-kontext-pro-multi that require two input images

ALTER TABLE image_generations 
ADD COLUMN second_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN image_generations.second_image_url IS 'URL of the second input image for multi-image generation models';

