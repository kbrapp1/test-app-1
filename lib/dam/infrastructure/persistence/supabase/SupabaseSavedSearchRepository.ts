import { SupabaseClient } from '@supabase/supabase-js';
import { 
  ISavedSearchRepository, 
  CreateSavedSearchData, 
  UpdateSavedSearchData 
} from '../../../domain/repositories/ISavedSearchRepository';
import { SavedSearch, SavedSearchProps } from '../../../domain/entities/SavedSearch';
import { createClient } from '@/lib/supabase/client';
import { DatabaseError } from '@/lib/errors/base';

interface RawSavedSearchDbRecord {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  organization_id: string;
  search_criteria: any; // JSON column
  is_global: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  use_count: number;
}

export class SupabaseSavedSearchRepository implements ISavedSearchRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  private mapRawToDomain(raw: RawSavedSearchDbRecord): SavedSearch {
    const props: SavedSearchProps = {
      id: raw.id,
      name: raw.name,
      description: raw.description || undefined,
      userId: raw.user_id,
      organizationId: raw.organization_id,
      searchCriteria: raw.search_criteria,
      isGlobal: raw.is_global,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
      lastUsedAt: raw.last_used_at ? new Date(raw.last_used_at) : undefined,
      useCount: raw.use_count,
    };
    
    return new SavedSearch(props);
  }

  async findById(id: string): Promise<SavedSearch | null> {
    const { data, error } = await this.supabase
      .from('saved_searches')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error finding saved search by ID:', error);
      throw new DatabaseError('Failed to find saved search', error.message);
    }

    return this.mapRawToDomain(data as RawSavedSearchDbRecord);
  }

  async findByUserId(userId: string, organizationId: string): Promise<SavedSearch[]> {
    const { data, error } = await this.supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding saved searches by user ID:', error);
      throw new DatabaseError('Failed to find saved searches', error.message);
    }

    return (data || []).map(raw => this.mapRawToDomain(raw as RawSavedSearchDbRecord));
  }

  async findByOrganizationId(organizationId: string): Promise<SavedSearch[]> {
    const { data, error } = await this.supabase
      .from('saved_searches')
      .select('*')
      .eq('organization_id', organizationId)
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error finding saved searches by organization ID:', error);
      throw new DatabaseError('Failed to find saved searches', error.message);
    }

    return (data || []).map(raw => this.mapRawToDomain(raw as RawSavedSearchDbRecord));
  }

  async save(data: CreateSavedSearchData): Promise<SavedSearch> {
    const insertData = {
      id: data.id,
      name: data.name,
      description: data.description,
      user_id: data.userId,
      organization_id: data.organizationId,
      search_criteria: data.searchCriteria,
      is_global: data.isGlobal,
      use_count: 0,
    };

    const { data: result, error } = await this.supabase
      .from('saved_searches')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error saving saved search:', error);
      throw new DatabaseError('Failed to save search', error.message);
    }

    return this.mapRawToDomain(result as RawSavedSearchDbRecord);
  }

  async update(id: string, data: UpdateSavedSearchData): Promise<SavedSearch | null> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.searchCriteria !== undefined) updateData.search_criteria = data.searchCriteria;
    if (data.isGlobal !== undefined) updateData.is_global = data.isGlobal;

    const { data: result, error } = await this.supabase
      .from('saved_searches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error updating saved search:', error);
      throw new DatabaseError('Failed to update saved search', error.message);
    }

    return this.mapRawToDomain(result as RawSavedSearchDbRecord);
  }

  async updateUsage(id: string, lastUsedAt: Date = new Date()): Promise<SavedSearch | null> {
    // First, get the current use_count
    const { data: current, error: fetchError } = await this.supabase
      .from('saved_searches')
      .select('use_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching saved search for usage update:', fetchError);
      throw new DatabaseError('Failed to update saved search usage', fetchError.message);
    }

    // Now update with incremented use_count
    const { data: result, error } = await this.supabase
      .from('saved_searches')
      .update({
        last_used_at: lastUsedAt.toISOString(),
        use_count: (current.use_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error updating saved search usage:', error);
      throw new DatabaseError('Failed to update saved search usage', error.message);
    }

    return this.mapRawToDomain(result as RawSavedSearchDbRecord);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting saved search:', error);
      throw new DatabaseError('Failed to delete saved search', error.message);
    }

    return true;
  }

  async findPopular(organizationId: string, limit: number = 10): Promise<SavedSearch[]> {
    const { data, error } = await this.supabase
      .from('saved_searches')
      .select('*')
      .eq('organization_id', organizationId)
      .gt('use_count', 0) // Only include searches that have been used
      .order('use_count', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error finding popular saved searches:', error);
      throw new DatabaseError('Failed to find popular saved searches', error.message);
    }

    return (data || []).map(raw => this.mapRawToDomain(raw as RawSavedSearchDbRecord));
  }
} 
