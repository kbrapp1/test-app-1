import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseError, NotFoundError } from '@/lib/errors/base';
import { CreateFolderData, UpdateFolderData } from '../../../../domain/repositories/IFolderRepository';
import { FolderMapper } from '../mappers/FolderMapper';

/**
 * Folder Query Executor Service
 * Follows Single Responsibility Principle - handles query execution and error handling
 */
export class FolderQueryExecutor {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Execute query and handle errors
   */
  async executeQuery(query: any, errorContext: string): Promise<any[]> {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error ${errorContext}:`, error.message);
      throw new DatabaseError(`Failed to ${errorContext}.`, error.message);
    }
    
    return data || [];
  }

  /**
   * Execute single record query
   */
  async executeSingleQuery(query: any, errorContext: string): Promise<any | null> {
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error ${errorContext}:`, error.message);
      throw new DatabaseError(`Failed to ${errorContext}.`, error.message);
    }
    
    return data;
  }

  /**
   * Execute folder creation
   */
  async executeCreate(folderData: CreateFolderData): Promise<any> {
    const persistenceData = FolderMapper.toCreatePersistence(folderData);
    const { data, error } = await this.supabase
      .from('folders')
      .insert(persistenceData)
      .select('*, has_children:folders!parent_folder_id(count)')
      .single();

    if (error || !data) {
      console.error('Error creating folder:', error?.message);
      throw new DatabaseError('Could not create folder.', error?.message);
    }
    
    return data;
  }

  /**
   * Execute folder update
   */
  async executeUpdate(id: string, updates: UpdateFolderData, organizationId: string): Promise<any> {
    const persistenceData = FolderMapper.toUpdatePersistence(updates);

    if (Object.keys(persistenceData).length === 0) {
      return null; // Signal no update needed
    }

    const { data: updatedData, error } = await this.supabase
      .from('folders')
      .update(persistenceData)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error.message);
      if (error.code === 'PGRST116') { 
        throw new NotFoundError('Folder not found for update.');
      }
      throw new DatabaseError('Could not update folder.', error.message);
    }
    
    if (!updatedData) { 
      throw new NotFoundError('Folder not found for update.');
    }
    
    return updatedData;
  }

  /**
   * Execute folder deletion with validation
   */
  async executeDelete(id: string, organizationId: string): Promise<void> {
    // Check for child folders
    const { data: childFoldersResult, error: childFoldersError } = await this.supabase
      .from('folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_folder_id', id)
      .eq('organization_id', organizationId);

    if (childFoldersError) {
      console.error('Error checking for child folders before delete:', childFoldersError.message);
      throw new DatabaseError('Could not verify child folders for deletion.', childFoldersError.message);
    }
    
    const childFolderCount = (childFoldersResult as any)?.count;
    if (childFolderCount > 0) {
       throw new DatabaseError('Folder cannot be deleted because it contains sub-folders.');
    }
    
    // Check for child assets
    const { data: childAssetsResult, error: childAssetsError } = await this.supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', id)
      .eq('organization_id', organizationId);

    if (childAssetsError) {
      console.error('Error checking for child assets before delete:', childAssetsError.message);
      throw new DatabaseError('Could not verify child assets for deletion.', childAssetsError.message);
    }
    
    const childAssetCount = (childAssetsResult as any)?.count;
    if (childAssetCount > 0) {
       throw new DatabaseError('Folder cannot be deleted because it contains assets.');
    }

    // Execute deletion
    const { error } = await this.supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting folder:', error.message);
      throw new DatabaseError('Could not delete folder.', error.message);
    }
  }

  /**
   * Execute RPC call for folder path
   */
  async executeGetFolderPath(folderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.rpc('get_folder_path', {
      p_folder_id: folderId
    });

    if (error) {
      console.error('Error fetching folder path:', error.message);
      throw new DatabaseError('Could not fetch folder path.', error.message);
    }
    
    return data || [];
  }
} 
