import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { Generation } from '../../../domain/entities/Generation';
import { GenerationRepository, GenerationFilters } from '../../../domain/repositories/GenerationRepository';
import { Result, success, error } from '../../common/Result';
import { GenerationRowMapper } from './mappers/GenerationRowMapper';
import { GenerationQueryBuilder } from './services/GenerationQueryBuilder';
import { GenerationStatsCalculator, GenerationStats } from './services/GenerationStatsCalculator';

export class SupabaseGenerationRepository implements GenerationRepository {
  private tableName = 'image_generations';
  private useServiceRole: boolean;

  constructor(useServiceRole: boolean = false) {
    this.useServiceRole = useServiceRole;
  }

  private getClient() {
    if (this.useServiceRole) {
      return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
    }
    return createClient();
  }

  async save(generation: Generation): Promise<Result<Generation, string>> {
    try {
      const row = GenerationRowMapper.toRow(generation);
      const supabase = this.getClient();
      
      const { error: supabaseError } = await supabase
        .from(this.tableName)
        .insert(row);

      if (supabaseError) {
        return error(`Failed to save generation: ${supabaseError.message}`);
      }

      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async update(generation: Generation): Promise<Result<Generation, string>> {
    try {
      const row = GenerationRowMapper.toRow(generation);
      const supabase = this.getClient();
      
      const { error: supabaseError } = await supabase
        .from(this.tableName)
        .update(row)
        .eq('id', generation.getId());

      if (supabaseError) {
        return error(`Failed to update generation: ${supabaseError.message}`);
      }

      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async findById(id: string): Promise<Result<Generation | null, string>> {
    try {
      const supabase = this.getClient();
      const { data, error: supabaseError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          return success(null); // Not found
        }
        return error(`Failed to find generation: ${supabaseError.message}`);
      }

      const generation = GenerationRowMapper.fromRow(data);
      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async findMany(filters: GenerationFilters): Promise<Result<Generation[], string>> {
    try {
      const supabase = this.getClient();
      const baseQuery = supabase.from(this.tableName);
      const query = GenerationQueryBuilder.buildFindManyQuery(baseQuery, filters);
      
      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        return error(`Failed to find generations: ${supabaseError.message}`);
      }

      const generations = GenerationRowMapper.fromRows(data);
      return success(generations);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async delete(id: string): Promise<Result<boolean, string>> {
    try {
      const supabase = this.getClient();
      const { error: supabaseError } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (supabaseError) {
        return error(`Failed to delete generation: ${supabaseError.message}`);
      }

      return success(true);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async getStats(userId: string, organizationId: string): Promise<Result<GenerationStats, string>> {
    try {
      const supabase = this.getClient();
      const baseQuery = supabase.from(this.tableName);
      const query = GenerationQueryBuilder.buildStatsQuery(baseQuery, userId, organizationId);
      
      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        return error(`Failed to get stats: ${supabaseError.message}`);
      }

      const stats = GenerationStatsCalculator.calculateStats(data);
      return success(stats);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async markSavedToDAM(id: string, damAssetId: string): Promise<Result<Generation, string>> {
    try {
      const supabase = this.getClient();
      const { data, error: supabaseError } = await supabase
        .from(this.tableName)
        .update({
          saved_to_dam: true,
          dam_asset_id: damAssetId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        return error(`Failed to mark as saved to DAM: ${supabaseError.message}`);
      }

      const generation = GenerationRowMapper.fromRow(data);
      return success(generation);
    } catch (err) {
      return error(err instanceof Error ? err.message : 'Unknown error');
    }
  }


} 