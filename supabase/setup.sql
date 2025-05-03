-- COMPREHENSIVE SUPABASE SETUP SCRIPT

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
-- Ensure necessary extensions are enabled
CREATE EXTENSION IF NOT EXISTS moddatetime;  -- For automatic timestamp updates
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- For gen_random_uuid()

-- ============================================================================
-- EMAIL DOMAIN RESTRICTIONS
-- ============================================================================
-- Function to check email domain against an allowed list
CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS TRIGGER AS $$
DECLARE
  -- !!! CUSTOMIZE THIS LIST !!!
  allowed_domains TEXT[] := ARRAY['vistaonemarketing.com', 'ironmarkusa.com'];
  email_domain TEXT;
BEGIN
  email_domain := split_part(NEW.email, '@', 2);
  IF NOT (email_domain = ANY(allowed_domains)) THEN
    RAISE EXCEPTION 'Email domain % is not allowed. Please use a valid company email.', email_domain;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove existing domain check trigger if it exists (safe to run)
DROP TRIGGER IF EXISTS before_user_insert_check_domain ON auth.users;

-- Create the domain check trigger
CREATE TRIGGER before_user_insert_check_domain
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_domain();

-- ============================================================================
-- NOTES TABLE SETUP
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT,
    position INTEGER, -- For drag-and-drop ordering
    color_class TEXT DEFAULT 'bg-yellow-200', -- For note color, default yellow
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security for Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Notes: Allow users full access to their own notes only
DROP POLICY IF EXISTS "Notes: Allow individual select access" ON public.notes;
CREATE POLICY "Notes: Allow individual select access" ON public.notes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notes: Allow individual insert access" ON public.notes;
CREATE POLICY "Notes: Allow individual insert access" ON public.notes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notes: Allow individual update access" ON public.notes;
CREATE POLICY "Notes: Allow individual update access" ON public.notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notes: Allow individual delete access" ON public.notes;
CREATE POLICY "Notes: Allow individual delete access" ON public.notes FOR DELETE USING (auth.uid() = user_id);

-- Trigger for Notes: automatically update 'updated_at' timestamp
DROP TRIGGER IF EXISTS handle_updated_at ON public.notes;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Optional: Update existing notes data if upgrading schema
-- Set default color for existing notes that don't have one
UPDATE public.notes SET color_class = 'bg-yellow-200' WHERE color_class IS NULL;

-- Calculate and set initial position for existing notes based on creation date
WITH ordered_notes AS (
  SELECT id, user_id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) - 1 AS calculated_position
  FROM public.notes
)
UPDATE public.notes n SET position = o.calculated_position 
FROM ordered_notes o 
WHERE n.id = o.id AND n.user_id = o.user_id AND n.position IS NULL;

-- ============================================================================
-- DAM ASSETS TABLE SETUP
-- ============================================================================
-- First create the folders table (needed for foreign key reference)
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add parent_folder_id for hierarchy (idempotent)
ALTER TABLE public.folders
ADD COLUMN IF NOT EXISTS parent_folder_id uuid NULL;

-- Add foreign key constraint if it doesn't exist (less straightforward to check directly, rely on ADD COLUMN IF NOT EXISTS)
-- Consider manually dropping if recreating: DROP CONSTRAINT IF EXISTS fk_folders_parent_folder ON public.folders;
ALTER TABLE public.folders
ADD CONSTRAINT fk_folders_parent_folder
FOREIGN KEY (parent_folder_id)
REFERENCES public.folders (id)
ON DELETE SET NULL; -- Or use ON DELETE CASCADE

-- Index for quickly finding subfolders within a specific parent folder
CREATE INDEX IF NOT EXISTS idx_folders_parent_folder_id ON public.folders (parent_folder_id);

-- Add comment to the column (idempotent)
COMMENT ON COLUMN public.folders.parent_folder_id IS 'References the parent folder''''s ID for hierarchical structure. NULL for top-level folders.';

-- Enable Row Level Security for Folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Folders
DROP POLICY IF EXISTS "Folders: Allow individual select access" ON public.folders;
CREATE POLICY "Folders: Allow individual select access" ON public.folders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Folders: Allow individual insert access" ON public.folders;
CREATE POLICY "Folders: Allow individual insert access" ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Folders: Allow individual update access" ON public.folders;
CREATE POLICY "Folders: Allow individual update access" ON public.folders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Folders: Allow individual delete access" ON public.folders;
CREATE POLICY "Folders: Allow individual delete access" ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- Then create the assets table with folder_id reference
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL, -- Allow assets to exist without a folder
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE, -- Ensure storage path is unique
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ensure the folder_id column exists before creating the index (for idempotency)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Index for quickly finding assets within a specific folder
CREATE INDEX IF NOT EXISTS idx_assets_folder_id ON public.assets (folder_id);

-- Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(name, user_id)  -- Prevent duplicate tags for the same user
);

-- Enable Row Level Security for Tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tags
DROP POLICY IF EXISTS "Tags: Allow individual select access" ON public.tags;
CREATE POLICY "Tags: Allow individual select access" ON public.tags FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tags: Allow individual insert access" ON public.tags;
CREATE POLICY "Tags: Allow individual insert access" ON public.tags FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tags: Allow individual update access" ON public.tags;
CREATE POLICY "Tags: Allow individual update access" ON public.tags FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Tags: Allow individual delete access" ON public.tags;
CREATE POLICY "Tags: Allow individual delete access" ON public.tags FOR DELETE USING (auth.uid() = user_id);

-- Create asset_tags junction table
CREATE TABLE IF NOT EXISTS public.asset_tags (
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (asset_id, tag_id)  -- Composite primary key
);

-- Enable Row Level Security for asset_tags
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;

-- Add a complex RLS policy that checks the user_id in the assets table
DROP POLICY IF EXISTS "Asset Tags: Allow operations on own assets" ON public.asset_tags;
CREATE POLICY "Asset Tags: Allow operations on own assets" ON public.asset_tags 
    USING (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE public.assets.id = asset_id AND public.assets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assets 
            WHERE public.assets.id = asset_id AND public.assets.user_id = auth.uid()
        )
    );

-- Enable Row Level Security for Assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Assets: Allow users full access to their own assets only
DROP POLICY IF EXISTS "Assets: Allow individual select access" ON public.assets;
CREATE POLICY "Assets: Allow individual select access" ON public.assets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Assets: Allow individual insert access" ON public.assets;
CREATE POLICY "Assets: Allow individual insert access" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Assets: Allow individual delete access" ON public.assets;
CREATE POLICY "Assets: Allow individual delete access" ON public.assets FOR DELETE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Assets: Allow individual update access" ON public.assets;
CREATE POLICY "Assets: Allow individual update access" ON public.assets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- RPC FUNCTIONS
-- ============================================================================

-- Function to get the folder path recursively for breadcrumbs
CREATE OR REPLACE FUNCTION public.get_folder_path(p_folder_id uuid)
RETURNS TABLE(id uuid, name text, depth int)
LANGUAGE sql
STABLE
AS $$
  WITH RECURSIVE folder_hierarchy AS (
    -- Base case: the starting folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      0 AS depth -- Start depth at 0
    FROM public.folders f
    WHERE f.id = p_folder_id

    UNION ALL

    -- Recursive step: find the parent of the current folder
    SELECT 
      f.id, 
      f.name, 
      f.parent_folder_id, 
      fh.depth + 1 -- Increment depth
    FROM public.folders f
    JOIN folder_hierarchy fh ON f.id = fh.parent_folder_id
    WHERE fh.parent_folder_id IS NOT NULL -- Stop when we reach the root (parent is null)
  )
  -- Select the path, ordering by depth descending to get Root -> ... -> Current
  SELECT 
    fh.id, 
    fh.name,
    fh.depth
  FROM folder_hierarchy fh
  ORDER BY fh.depth DESC;
$$;

-- Grant execute permission to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_folder_path(uuid) TO authenticated;

-- ============================================================================
-- TEAM MEMBERS TABLE SETUP
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    primary_image_path TEXT NOT NULL,
    secondary_image_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security for Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Team Members
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.team_members;
CREATE POLICY "Allow select for authenticated" ON public.team_members
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.team_members;
CREATE POLICY "Allow insert for authenticated" ON public.team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- PERMISSIONS
-- ============================================================================
-- Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Grant specific permissions on tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated; 
GRANT SELECT, INSERT, UPDATE, DELETE ON public.folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- Service role permissions (usually has bypass RLS implicitly)
GRANT ALL ON public.notes TO service_role;
GRANT ALL ON public.assets TO service_role;
GRANT ALL ON public.folders TO service_role;
GRANT ALL ON public.tags TO service_role;
GRANT ALL ON public.asset_tags TO service_role;
GRANT ALL ON public.team_members TO service_role;

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================ 