import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseQueryResult } from '@/types/repositories';
import type { Tag } from '@/lib/actions/dam/tag.actions'; // Import Tag type

const DAM_TEXT_MIME_TYPES_REPO = ['text/plain', 'text/markdown', 'application/json', 'text/html', 'text/css', 'text/javascript'] as const;
type TextMimeTypeRepo = typeof DAM_TEXT_MIME_TYPES_REPO[number];

export interface AssetDbRecord {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  user_id: string;
  organization_id: string;
  folder_id: string | null;
  storage_path: string;
  mime_type: string;
  size: number;
  asset_tags: Array<{ tags: Tag | null }> | null; // For joined tags
  // any other fields from your 'assets' table
}

export async function getAssetByIdFromDb(
  assetId: string,
  organizationId: string,
): Promise<SupabaseQueryResult<AssetDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('assets')
    .select('*, asset_tags(tags(*))') // Select all asset fields and nested tags
    .match({ id: assetId, organization_id: organizationId })
    .single();
  return { data: data as AssetDbRecord | null, error };
}

export async function updateAssetFolderInDb(
  assetId: string,
  targetFolderId: string | null,
  organizationId: string
): Promise<SupabaseQueryResult<null>> {
  const supabase = createSupabaseUserClient();
  const { error } = await supabase
    .from('assets')
    .update({ folder_id: targetFolderId })
    .match({ id: assetId, organization_id: organizationId });
  return { data: null, error };
}

export async function deleteAssetRecordFromDb(
  assetId: string,
  organizationId: string
): Promise<SupabaseQueryResult<null>> {
  const supabase = createSupabaseUserClient();
  const { error } = await supabase
    .from('assets')
    .delete()
    .match({ id: assetId, organization_id: organizationId });
  return { data: null, error };
}

export interface TextAssetSummaryDb {
  id: string;
  name: string;
  created_at: string;
}

export async function listTextAssetsFromDb(
  organizationId: string
): Promise<SupabaseQueryResult<TextAssetSummaryDb[]>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('assets')
    .select('id, name, created_at')
    .eq('organization_id', organizationId)
    .in('mime_type', DAM_TEXT_MIME_TYPES_REPO as any) // type assertion for Supabase client
    .order('name', { ascending: true });
  return { data: data as TextAssetSummaryDb[] | null, error };
}

export interface UpdateAssetDbMetadataInput {
  assetId: string;
  organizationId: string;
  metadata: Partial<Pick<AssetDbRecord, 'name' | 'size' | 'mime_type' | 'folder_id'>>;
}

export async function updateAssetMetadataInDb(
  input: UpdateAssetDbMetadataInput
): Promise<SupabaseQueryResult<AssetDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('assets')
    .update(input.metadata)
    .match({ id: input.assetId, organization_id: input.organizationId })
    .select('*')
    .single();
  return { data: data as AssetDbRecord | null, error };
}

export interface CreateAssetDbRecordInput {
  id: string;
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  userId: string;
  organizationId: string;
  folderId: string | null;
}

export async function createAssetRecordInDb(
  input: CreateAssetDbRecordInput
): Promise<SupabaseQueryResult<AssetDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('assets')
    .insert({
      id: input.id,
      name: input.name,
      storage_path: input.storagePath,
      mime_type: input.mimeType,
      size: input.size,
      user_id: input.userId,
      organization_id: input.organizationId,
      folder_id: input.folderId,
    })
    .select('*')
    .single();
  return { data: data as AssetDbRecord | null, error };
}

export async function updateAssetNameInDb(
  assetId: string,
  newName: string,
  organizationId: string
): Promise<SupabaseQueryResult<Pick<AssetDbRecord, 'id' | 'name'>>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('assets')
    .update({ name: newName })
    .match({ id: assetId, organization_id: organizationId })
    .select('id, name')
    .single();
  return { data: data as Pick<AssetDbRecord, 'id' | 'name'> | null, error };
} 