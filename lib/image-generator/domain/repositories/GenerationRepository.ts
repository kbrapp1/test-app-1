import { Generation } from '../entities/Generation';
import { Result } from '../../infrastructure/common/Result';
import { GenerationStats } from '../../infrastructure/persistence/supabase/services/GenerationStatsCalculator';

export interface GenerationFilters {
  status?: string;
  userId?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  savedToDAM?: boolean;
  searchTerm?: string;
}

export interface GenerationRepository {
  /**
   * Save a new generation
   */
  save(generation: Generation): Promise<Result<Generation, string>>;

  /**
   * Update an existing generation
   */
  update(generation: Generation): Promise<Result<Generation, string>>;

  /**
   * Find a generation by ID
   */
  findById(id: string): Promise<Result<Generation | null, string>>;

  /**
   * Find generations with filters
   */
  findMany(filters: GenerationFilters): Promise<Result<Generation[], string>>;

  /**
   * Delete a generation
   */
  delete(id: string): Promise<Result<boolean, string>>;

  /**
   * Get generation statistics
   */
  getStats(userId: string, organizationId: string): Promise<Result<GenerationStats, string>>;

  /**
   * Mark generation as saved to DAM
   */
  markSavedToDAM(id: string, damAssetId: string): Promise<Result<Generation, string>>;
} 