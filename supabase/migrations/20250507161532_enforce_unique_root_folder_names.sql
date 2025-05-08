CREATE UNIQUE INDEX idx_folders_unique_root_name
ON public.folders (organization_id, name)
WHERE parent_folder_id IS NULL;
