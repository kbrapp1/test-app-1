-- Update user's metadata in auth.users
UPDATE auth.users
SET 
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb), 
        '{name}', 
        '"Joe Williams"'::jsonb
    ),
    raw_app_meta_data = jsonb_set(
        COALESCE(raw_app_meta_data, '{}'::jsonb), 
        '{active_organization_id}', 
        '"ce099184-5169-474e-be71-4fcb9e5e94f8"'::jsonb
    )
WHERE id = 'ef8371a4-3f24-4d3a-b438-8a45f4fb3771';

-- Add user to organization_memberships, or update role if already a member
INSERT INTO public.organization_memberships (user_id, organization_id, role)
VALUES ('ef8371a4-3f24-4d3a-b438-8a45f4fb3771', 'ce099184-5169-474e-be71-4fcb9e5e94f8', 'member')
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET role = EXCLUDED.role; 