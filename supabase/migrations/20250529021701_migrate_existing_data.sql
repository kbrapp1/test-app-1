-- Phase 3: Data Migration from Legacy System
-- Safe transfer with conflict resolution and audit trails

-- Step 1: Migrate existing organization contexts
INSERT INTO public.user_organization_context (user_id, active_organization_id, created_at, updated_at)
SELECT 
  id as user_id,
  COALESCE(
    (raw_user_meta_data->>'active_organization_id')::uuid,
    (raw_app_meta_data->>'active_organization_id')::uuid,
    (raw_app_meta_data->'custom_claims'->>'active_organization_id')::uuid
  ) as active_organization_id,
  COALESCE(created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users 
WHERE COALESCE(
  (raw_user_meta_data->>'active_organization_id')::uuid,
  (raw_app_meta_data->>'active_organization_id')::uuid,
  (raw_app_meta_data->'custom_claims'->>'active_organization_id')::uuid
) IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  active_organization_id = EXCLUDED.active_organization_id,
  updated_at = NOW();

-- Step 2: Migrate organization memberships to permissions
INSERT INTO public.user_organization_permissions (
  user_id, 
  organization_id, 
  role_id, 
  granted_at,
  granted_by,
  metadata
)
SELECT 
  om.user_id,
  om.organization_id,
  om.role_id,
  COALESCE(om.created_at, NOW()) as granted_at,
  NULL as granted_by, -- System migration
  jsonb_build_object(
    'migration_source', 'organization_memberships',
    'migrated_at', NOW(),
    'original_role', om.role
  ) as metadata
FROM public.organization_memberships om
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_organization_permissions uop
  WHERE uop.user_id = om.user_id 
  AND uop.organization_id = om.organization_id
  AND uop.revoked_at IS NULL
)
ON CONFLICT DO NOTHING;

-- Step 3: Create audit trail for migration
INSERT INTO public.organization_access_log (
  user_id,
  organization_id,
  action,
  details,
  ip_address,
  user_agent,
  session_id
)
SELECT 
  uoc.user_id,
  uoc.active_organization_id,
  'data_migration',
  jsonb_build_object(
    'source', 'auth_metadata',
    'migration_phase', 'phase_3',
    'migrated_at', NOW(),
    'migration_batch_id', gen_random_uuid()
  ),
  '127.0.0.1'::inet, -- Internal migration
  'Data Migration Script v1.0',
  'migration-' || extract(epoch from now())::text
FROM public.user_organization_context uoc
WHERE uoc.created_at >= NOW() - INTERVAL '1 minute'; -- Recently migrated contexts

-- Step 4: Log permission migrations
INSERT INTO public.organization_access_log (
  user_id,
  organization_id,
  action,
  details,
  ip_address,
  user_agent,
  session_id
)
SELECT 
  uop.user_id,
  uop.organization_id,
  'permission_migration',
  jsonb_build_object(
    'source', 'organization_memberships',
    'migration_phase', 'phase_3', 
    'migrated_at', NOW(),
    'role_id', uop.role_id,
    'migration_batch_id', gen_random_uuid()
  ),
  '127.0.0.1'::inet,
  'Data Migration Script v1.0',
  'migration-' || extract(epoch from now())::text
FROM public.user_organization_permissions uop
WHERE uop.granted_at >= NOW() - INTERVAL '1 minute' -- Recently migrated permissions
AND uop.metadata->>'migration_source' = 'organization_memberships';;
