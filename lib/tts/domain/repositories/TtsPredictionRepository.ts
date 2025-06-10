import { TtsPrediction } from '../entities/TtsPrediction';

/**
 * Domain repository interface for TtsPrediction operations.
 * This interface defines the contract for persistence operations
 * without exposing infrastructure concerns to the domain layer.
 */
export interface TtsPredictionRepository {
  /**
   * Save a new TTS prediction to persistence
   */
  save(prediction: TtsPrediction): Promise<TtsPrediction>;

  /**
   * Update an existing TTS prediction
   */
  update(prediction: TtsPrediction): Promise<TtsPrediction>;

  /**
   * Find a prediction by its unique identifier
   */
  findById(id: string): Promise<TtsPrediction | null>;

  /**
   * Find all predictions for a specific user
   */
  findByUserId(userId: string, options?: FindOptions): Promise<TtsPrediction[]>;

  /**
   * Find all predictions for a specific organization
   */
  findByOrganizationId(organizationId: string, options?: FindOptions): Promise<TtsPrediction[]>;

  /**
   * Find predictions by status
   */
  findByStatus(status: string, options?: FindOptions): Promise<TtsPrediction[]>;

  /**
   * Find predictions by external provider ID
   */
  findByExternalProviderId(externalProviderId: string): Promise<TtsPrediction | null>;

  /**
   * Delete a prediction
   */
  delete(id: string): Promise<void>;

  /**
   * Count total predictions for a user with optional filters
   */
  countByUserId(userId: string, filters?: CountFilters): Promise<number>;

  /**
   * Mark a prediction URL as problematic
   */
  markUrlProblematic(id: string, errorMessage: string): Promise<void>;

  /**
   * Link a prediction to a DAM asset
   */
  linkToAsset(id: string, assetId: string): Promise<void>;
}

/**
 * Options for find operations
 */
export interface FindOptions {
  limit?: number;
  offset?: number;
  page?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'inputText' | 'voiceId';
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

/**
 * Filters for count operations
 */
export interface CountFilters {
  status?: string;
  searchQuery?: string;
  dateFrom?: Date;
  dateTo?: Date;
} 