import { SupabaseClient } from '@supabase/supabase-js';
import { ITagRepository } from '../../../domain/repositories/ITagRepository';
import { Tag } from '../../../domain/entities/Tag';
import { TagMapper, RawTagDbRecord } from './mappers/TagMapper';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { DatabaseError, ValidationError, ConflictError } from '@/lib/errors/base';

export class SupabaseTagRepository implements ITagRepository {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createSupabaseServerClient();
  }

  async findById(id: string): Promise<Tag | null> {
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('SupabaseTagRepository Error - findById:', error.message);
      throw new DatabaseError('Could not fetch tag by ID.', 'DB_FIND_BY_ID_ERROR', { originalError: error.message });
    }
    return data ? TagMapper.toDomain(data as RawTagDbRecord) : null;
  }

  async findByOrganizationId(organizationId: string, includeOrphaned: boolean = true): Promise<Tag[]> {
    if (!organizationId) {
      throw new ValidationError('Organization ID is required to list tags.');
    }

    let query = this.supabase
      .from('tags')
      .select('*')
      .eq('organization_id', organizationId);
      
    if (!includeOrphaned) {
      const { data: usedTagIdsData, error: usedTagIdsError } = await this.supabase
        .from('asset_tags')
        .select('tag_id')
        .not('tag_id', 'is', null);
        
      if (usedTagIdsError) {
        console.error('SupabaseTagRepository Error - fetching used tag IDs:', usedTagIdsError.message);
        throw new DatabaseError('Could not fetch used tag IDs.', 'DB_FETCH_USED_TAG_IDS_ERROR', { originalError: usedTagIdsError.message });
      }
      const usedTagIds = (usedTagIdsData || []).map(item => item.tag_id).filter(id => id);
      if (usedTagIds.length === 0 && !includeOrphaned) {
        return [];
      }
      query = query.in('id', usedTagIds);
    } 

    query = query.order('name', { ascending: true });
    const { data, error } = await query;

    if (error) {
      console.error('SupabaseTagRepository Error - findByOrganizationId:', error.message);
      throw new DatabaseError('Could not fetch tags for organization.', 'DB_FIND_BY_ORG_ERROR', { originalError: error.message });
    }
    return (data || []).map((raw: RawTagDbRecord) => TagMapper.toDomain(raw));
  }

  async findByNameAndOrganization(name: string, organizationId: string): Promise<Tag | null> {
    if (!name || !organizationId) {
      throw new ValidationError('Tag name and Organization ID are required.');
    }
    const { data, error } = await this.supabase
      .from('tags')
      .select('*')
      .eq('name', name)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('SupabaseTagRepository Error - findByNameAndOrganization:', error.message);
      throw new DatabaseError('Could not fetch tag by name and organization.', 'DB_FIND_BY_NAME_ORG_ERROR', { originalError: error.message });
    }
    return data ? TagMapper.toDomain(data as RawTagDbRecord) : null;
  }

  async save(tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag> {
    const persistenceData = TagMapper.toPersistence(tagData);
    const { data, error } = await this.supabase
      .from('tags')
      .insert(persistenceData)
      .select()
      .single();

    if (error || !data) {
      console.error('SupabaseTagRepository Error - save:', error?.message);
      if (error?.code === '23505') { // Unique constraint violation (PostgreSQL specific code)
        throw new ConflictError(
          'A tag with this name already exists in this organization.', 
          'DUPLICATE_TAG_NAME', 
          { originalError: error?.message, conflictingName: tagData.name }
        );
      }
      throw new DatabaseError('Could not save tag.', 'DB_SAVE_TAG_ERROR', { originalError: error?.message });
    }
    return TagMapper.toDomain(data as RawTagDbRecord);
  }
} 