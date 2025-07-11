import { createClient } from '@/lib/supabase/server';
import { TtsPrediction } from '../../../domain/entities/TtsPrediction';
import { 
  TtsPredictionRepository, 
  FindOptions, 
  CountFilters 
} from '../../../domain/repositories/TtsPredictionRepository';
import { TtsPredictionMapper } from './mappers/TtsPredictionMapper';

/**
 * Supabase implementation of the TtsPredictionRepository interface.
 * This infrastructure component handles all database operations for TtsPrediction
 * entities while maintaining the DDD separation of concerns.
 */
export class TtsPredictionSupabaseRepository implements TtsPredictionRepository {
  
  /**
   * Save a new TTS prediction to persistence
   */
  async save(prediction: TtsPrediction): Promise<TtsPrediction> {
    const supabase = createClient();
    const insertData = TtsPredictionMapper.toInsert(prediction);
    
    const { data, error } = await supabase
      .from('TtsPrediction')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save TTS prediction: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomain(data);
  }

  /**
   * Update an existing TTS prediction
   */
  async update(prediction: TtsPrediction): Promise<TtsPrediction> {
    const supabase = createClient();
    const updateData = TtsPredictionMapper.toUpdate(prediction);
    
    const { data, error } = await supabase
      .from('TtsPrediction')
      .update(updateData)
      .eq('id', prediction.id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update TTS prediction: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomain(data);
  }

  /**
   * Find a prediction by its unique identifier
   */
  async findById(id: string): Promise<TtsPrediction | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('TtsPrediction')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find TTS prediction by ID: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomain(data);
  }

  /**
   * Find all predictions for a specific user
   */
  async findByUserId(userId: string, options?: FindOptions): Promise<TtsPrediction[]> {
    const supabase = createClient();
    const mappedOptions = TtsPredictionMapper.mapFindOptions(options || {});
    
    let query = supabase
      .from('TtsPrediction')
      .select('*')
      .eq('userId', userId);
    
    // Apply search filter
    if (mappedOptions.searchQuery) {
      query = query.ilike('inputText', `%${mappedOptions.searchQuery}%`);
    }
    
    // Apply sorting
    query = query.order(mappedOptions.sortColumn, { ascending: mappedOptions.sortOrder === 'asc' });
    
    // Apply pagination
    if (mappedOptions.limit) {
      query = query.limit(mappedOptions.limit);
    }
    if (mappedOptions.offset) {
      query = query.range(mappedOptions.offset, mappedOptions.offset + (mappedOptions.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find TTS predictions by user ID: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomainList(data || []);
  }

  /**
   * Find all predictions for a specific organization
   */
  async findByOrganizationId(organizationId: string, options?: FindOptions): Promise<TtsPrediction[]> {
    const supabase = createClient();
    const mappedOptions = TtsPredictionMapper.mapFindOptions(options || {});
    
    let query = supabase
      .from('TtsPrediction')
      .select('*')
      .eq('organization_id', organizationId);
    
    // Apply search filter
    if (mappedOptions.searchQuery) {
      query = query.ilike('inputText', `%${mappedOptions.searchQuery}%`);
    }
    
    // Apply sorting
    query = query.order(mappedOptions.sortColumn, { ascending: mappedOptions.sortOrder === 'asc' });
    
    // Apply pagination
    if (mappedOptions.limit) {
      query = query.limit(mappedOptions.limit);
    }
    if (mappedOptions.offset) {
      query = query.range(mappedOptions.offset, mappedOptions.offset + (mappedOptions.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find TTS predictions by organization ID: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomainList(data || []);
  }

  /**
   * Find predictions by status
   */
  async findByStatus(status: string, options?: FindOptions): Promise<TtsPrediction[]> {
    const supabase = createClient();
    const mappedOptions = TtsPredictionMapper.mapFindOptions(options || {});
    
    let query = supabase
      .from('TtsPrediction')
      .select('*')
      .eq('status', status);
    
    // Apply search filter
    if (mappedOptions.searchQuery) {
      query = query.ilike('inputText', `%${mappedOptions.searchQuery}%`);
    }
    
    // Apply sorting
    query = query.order(mappedOptions.sortColumn, { ascending: mappedOptions.sortOrder === 'asc' });
    
    // Apply pagination
    if (mappedOptions.limit) {
      query = query.limit(mappedOptions.limit);
    }
    if (mappedOptions.offset) {
      query = query.range(mappedOptions.offset, mappedOptions.offset + (mappedOptions.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to find TTS predictions by status: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomainList(data || []);
  }

  /**
   * Find predictions by external provider ID
   */
  async findByExternalProviderId(externalProviderId: string): Promise<TtsPrediction | null> {
    const supabase = createClient();
    
    // Check both replicate_prediction_id and external_provider_id for compatibility
    const { data, error } = await supabase
      .from('TtsPrediction')
      .select('*')
      .eq('replicatePredictionId', externalProviderId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find TTS prediction by external provider ID: ${error.message}`);
    }
    
    return TtsPredictionMapper.toDomain(data);
  }

  /**
   * Delete a prediction
   */
  async delete(id: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('TtsPrediction')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete TTS prediction: ${error.message}`);
    }
  }

  /**
   * Count total predictions for a user with optional filters
   */
  async countByUserId(userId: string, filters?: CountFilters): Promise<number> {
    const supabase = createClient();
    const mappedFilters = TtsPredictionMapper.mapCountFilters(filters || {});
    
    let query = supabase
      .from('TtsPrediction')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId);
    
    // Apply status filter
    if (mappedFilters.status) {
      query = query.eq('status', mappedFilters.status);
    }
    
    // Apply search filter
    if (mappedFilters.searchQuery) {
      query = query.ilike('inputText', `%${mappedFilters.searchQuery}%`);
    }
    
    // Apply date range filters
    if (mappedFilters.dateFrom) {
      query = query.gte('createdAt', mappedFilters.dateFrom);
    }
    if (mappedFilters.dateTo) {
      query = query.lte('createdAt', mappedFilters.dateTo);
    }
    
    const { count, error } = await query;
    
    if (error) {
      throw new Error(`Failed to count TTS predictions by user ID: ${error.message}`);
    }
    
    return count || 0;
  }

  /**
   * Mark a prediction URL as problematic
   */
  async markUrlProblematic(id: string, errorMessage: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('TtsPrediction')
      .update({
        is_output_url_problematic: true,
        output_url_last_error: errorMessage,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to mark URL as problematic: ${error.message}`);
    }
  }

  /**
   * Link a prediction to a DAM asset
   */
  async linkToAsset(id: string, assetId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('TtsPrediction')
      .update({
        outputAssetId: assetId,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to link prediction to asset: ${error.message}`);
    }
  }
} 