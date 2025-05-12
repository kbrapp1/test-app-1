import { createClient as createSupabaseUserClient } from '@/lib/supabase/server';
import type { Folder } from '@/types/dam'; // Use 'type' import for types
import type { SupabaseQueryResult } from '@/types/repositories'; // Updated path

export interface FolderDbRecord {
  id: string;
  created_at: string;
  name: string;
  user_id: string;
  organization_id: string;
  parent_folder_id: string | null;
  // any other fields from your 'folders' table
}

// Convert DB record to Folder type
export function dbRecordToFolder(record: FolderDbRecord): Folder {
  return {
    ...record,
    type: 'folder',
    // Ensure all Folder type properties are mapped
  };
}

export async function getFolderById(
  folderId: string,
  organizationId: string
): Promise<SupabaseQueryResult<FolderDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .match({ id: folderId, organization_id: organizationId })
    .single();
  
  return { data: data as FolderDbRecord | null, error };
}

export interface CreateFolderInput {
  name: string;
  parentFolderId: string | null;
  userId: string;
  organizationId: string;
}

export async function createFolderInDb(
  input: CreateFolderInput
): Promise<SupabaseQueryResult<FolderDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('folders')
    .insert({
      name: input.name.trim(),
      parent_folder_id: input.parentFolderId,
      user_id: input.userId,
      organization_id: input.organizationId,
    })
    .select('*')
    .single();

  return { data: data as FolderDbRecord | null, error };
}

export interface UpdateFolderInput {
  folderId: string;
  newName: string;
  organizationId: string; // For matching scope
}

export async function updateFolderInDb(
  input: UpdateFolderInput
): Promise<SupabaseQueryResult<FolderDbRecord>> {
  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase
    .from('folders')
    .update({ name: input.newName.trim() })
    .match({ id: input.folderId, organization_id: input.organizationId })
    .select('*')
    .single();
  
  return { data: data as FolderDbRecord | null, error };
}

export interface DeleteFolderInput {
  folderId: string;
  organizationId: string;
}

export async function deleteFolderRecordInDb(
  input: DeleteFolderInput
): Promise<SupabaseQueryResult<null>> { 
  const supabase = createSupabaseUserClient();
  const { error } = await supabase
    .from('folders')
    .delete()
    .match({ id: input.folderId, organization_id: input.organizationId });

  return { data: null, error };
}

export async function getChildFolders(
  parentFolderId: string | null,
  organizationId: string
): Promise<SupabaseQueryResult<FolderDbRecord[]>> {
  const supabase = createSupabaseUserClient();
  let query = supabase
    .from('folders')
    .select('*')
    .eq('organization_id', organizationId);

  if (parentFolderId) {
    query = query.eq('parent_folder_id', parentFolderId);
  } else {
    query = query.is('parent_folder_id', null);
  }
  
  query = query.order('name', { ascending: true });

  const { data, error } = await query;
  return { data: data as FolderDbRecord[] | null, error };
} 