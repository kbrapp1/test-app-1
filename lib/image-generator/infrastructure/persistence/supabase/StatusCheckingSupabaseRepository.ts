import { SupabaseClient } from '@supabase/supabase-js';
import { StatusCheckingRepository } from '../../../domain/repositories/StatusCheckingRepository';
import { Generation } from '../../../domain/entities/Generation';
import { GenerationRowMapper, GenerationRow } from './mappers/GenerationRowMapper';
import { success, error, Result } from '../../common/Result';

/**
 * Supabase Status Checking Repository Implementation
 * Single Responsibility: Implement generation status data access using Supabase
 * Infrastructure Layer - Concrete implementation of domain repository interface
 */
export class StatusCheckingSupabaseRepository implements StatusCheckingRepository {
  
  constructor(
    private readonly supabase: SupabaseClient
  ) {}

  /**
   * Standard select fields for generation queries
   */
  private readonly selectFields = `
    id,
    organization_id,
    user_id,
    prompt,
    model_name,
    provider_name,
    status,
    result_image_url,
    base_image_url,
    external_provider_id,
    cost_cents,
    estimated_cost_cents,
    generation_time_seconds,
    image_width,
    image_height,
    aspect_ratio,
    edit_type,
    saved_to_dam,
    dam_asset_id,
    source_dam_asset_id,
    error_message,
    metadata,
    created_at,
    updated_at
  `;

  /**
   * Find active generations that require status polling
   */
  async findActiveGenerationsForPolling(
    userId: string, 
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    try {
      const { data, error: dbError } = await this.supabase
        .from('ai_generations')
        .select(this.selectFields)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) {
        return error(`Failed to fetch active generations: ${dbError.message}`);
      }

      const generations = this.transformRows(data || []);
      return success(generations);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Find specific generation by ID for status checking
   */
  async findGenerationForStatusCheck(
    generationId: string,
    userId: string,
    organizationId: string
  ): Promise<Result<Generation | null, string>> {
    try {
      const { data, error: dbError } = await this.supabase
        .from('ai_generations')
        .select(this.selectFields)
        .eq('id', generationId)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          return success(null); // No rows found
        }
        return error(`Failed to fetch generation: ${dbError.message}`);
      }

      const generation = this.transformRow(data);
      return success(generation);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Find multiple generations by IDs for batch status checking
   */
  async findGenerationsForBatchStatusCheck(
    generationIds: string[],
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    if (generationIds.length === 0) {
      return success([]);
    }

    try {
      const { data, error: dbError } = await this.supabase
        .from('ai_generations')
        .select(this.selectFields)
        .in('id', generationIds)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (dbError) {
        return error(`Failed to fetch generations batch: ${dbError.message}`);
      }

      const generations = this.transformRows(data || []);
      return success(generations);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Update generation status after external provider check
   */
  async updateGenerationStatus(
    generation: Generation
  ): Promise<Result<void, string>> {
    try {
      const updateData = this.prepareUpdateData(generation);

      const { error: dbError } = await this.supabase
        .from('ai_generations')
        .update(updateData)
        .eq('id', generation.getId())
        .eq('user_id', generation.userId)
        .eq('organization_id', generation.organizationId);

      if (dbError) {
        return error(`Failed to update generation status: ${dbError.message}`);
      }

      return success(undefined);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Update multiple generation statuses in batch
   */
  async updateGenerationStatusBatch(
    generations: Generation[]
  ): Promise<Result<void, string>> {
    if (generations.length === 0) {
      return success(undefined);
    }

    try {
      // For simplicity, use individual updates with Promise.all
      // This can be optimized with stored procedures if needed
      const updatePromises = generations.map(generation => 
        this.updateGenerationStatus(generation)
      );

      const results = await Promise.all(updatePromises);
      
      const errors = results
        .filter(result => !result.isSuccess())
        .map(result => result.getError());

      if (errors.length > 0) {
        return error(`Batch update failed: ${errors.join(', ')}`);
      }

      return success(undefined);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Find generations that should be marked as timed out
   */
  async findGenerationsForTimeout(
    userId: string,
    organizationId: string
  ): Promise<Result<Generation[], string>> {
    try {
      const timeoutThreshold = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      const { data, error: dbError } = await this.supabase
        .from('ai_generations')
        .select(this.selectFields)
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .in('status', ['pending', 'processing'])
        .lt('created_at', timeoutThreshold.toISOString())
        .order('created_at', { ascending: true })
        .limit(20);

      if (dbError) {
        return error(`Failed to fetch timeout candidates: ${dbError.message}`);
      }

      const generations = this.transformRows(data || []);
      return success(generations);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark generations as timed out due to business rules
   */
  async markGenerationsAsTimedOut(
    generations: Generation[]
  ): Promise<Result<void, string>> {
    if (generations.length === 0) {
      return success(undefined);
    }

    try {
      const updatePromises = generations.map(generation => 
        this.supabase
          .from('ai_generations')
          .update({
            status: 'failed',
            error_message: 'Generation timed out',
            updated_at: new Date().toISOString()
          })
          .eq('id', generation.getId())
          .eq('user_id', generation.userId)
          .eq('organization_id', generation.organizationId)
      );

      const results = await Promise.all(updatePromises);
      
      const errors = results
        .filter(result => result.error)
        .map(result => result.error!.message);

      if (errors.length > 0) {
        return error(`Timeout batch update failed: ${errors.join(', ')}`);
      }

      return success(undefined);

    } catch (err) {
      return error(`Database error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Transform single database row to domain entity
   */
  private transformRow(row: any): Generation | null {
    try {
      // Add estimated_cost_cents if missing for compatibility
      const completeRow = {
        ...row,
        estimated_cost_cents: row.estimated_cost_cents || row.cost_cents
      } as GenerationRow;
      
      return GenerationRowMapper.fromRow(completeRow);
    } catch (error) {
      // Log error and return null for invalid rows
      return null;
    }
  }

  /**
   * Transform multiple database rows to domain entities
   */
  private transformRows(rows: any[]): Generation[] {
    return rows
      .map(row => this.transformRow(row))
      .filter((generation): generation is Generation => generation !== null);
  }

  /**
   * Prepare update data from domain entity
   */
  private prepareUpdateData(generation: Generation): Record<string, any> {
    // Use the existing row mapper to get the update data
    const rowData = GenerationRowMapper.toRow(generation);
    
    // Remove fields that shouldn't be updated
    const { id, organization_id, user_id, created_at, ...updateFields } = rowData;
    
    return {
      ...updateFields,
      updated_at: new Date().toISOString()
    };
  }
} 