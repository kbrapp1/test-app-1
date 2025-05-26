-- Add color column to tags table for color-coded tags
-- This allows users to visually distinguish tags in the UI

-- Add color column with default value
ALTER TABLE "public"."tags" 
ADD COLUMN "color" "text" DEFAULT 'blue' NOT NULL;

-- Add check constraint for valid color values
-- Using a predefined set of colors for consistency
ALTER TABLE "public"."tags" 
ADD CONSTRAINT "tags_color_check" 
CHECK ("color" IN (
    'blue', 'green', 'yellow', 'red', 'purple', 'pink', 
    'indigo', 'gray', 'orange', 'teal', 'emerald', 'lime'
));

-- Create comment for the color column
COMMENT ON COLUMN "public"."tags"."color" IS 'Visual color identifier for the tag (blue, green, yellow, red, purple, pink, indigo, gray, orange, teal, emerald, lime)';

-- Add index for color filtering (if needed for queries)
CREATE INDEX "idx_tags_color" ON "public"."tags" USING "btree" ("color");

-- Update existing tags with random colors for better visual distribution
UPDATE "public"."tags" SET "color" = 
  CASE (RANDOM() * 11)::INTEGER
    WHEN 0 THEN 'blue'
    WHEN 1 THEN 'green' 
    WHEN 2 THEN 'yellow'
    WHEN 3 THEN 'red'
    WHEN 4 THEN 'purple'
    WHEN 5 THEN 'pink'
    WHEN 6 THEN 'indigo'
    WHEN 7 THEN 'gray'
    WHEN 8 THEN 'orange'
    WHEN 9 THEN 'teal'
    WHEN 10 THEN 'emerald'
    ELSE 'lime'
  END
WHERE "color" = 'blue'; -- Only update default values 