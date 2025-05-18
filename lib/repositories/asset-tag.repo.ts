import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { SupabaseQueryResult } from '@/types/repositories';

export async function addTagToAssetInDb(
  assetId: string,
  tagId: string,
): Promise<SupabaseQueryResult<null>> {
  const supabase = createSupabaseUserClient();
  const { error } = await supabase
    .from('asset_tags')
    .insert({ asset_id: assetId, tag_id: tagId });
  return { data: null, error };
}

export async function removeTagFromAssetInDb(
  assetId: string,
  tagId: string
): Promise<SupabaseQueryResult<null>> {
  const supabase = createSupabaseUserClient();
  const { error } = await supabase
    .from('asset_tags')
    .delete()
    .match({ asset_id: assetId, tag_id: tagId });
  return { data: null, error };
} 