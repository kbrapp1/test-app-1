/**
 * Vector Storage Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector storage and deletion operations
 * - Infrastructure service focused on Supabase vector persistence
 * - Keep business logic pure, handle database-specific concerns
 * - Never exceed 250 lines per @golden-rule
 * - Support batch operations and transaction safety
 * - Handle error tracking and recovery strategies
 * - Provide efficient storage optimization and cleanup
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { ErrorTrackingFacade } from '../../application/services/ErrorTrackingFacade';
import {
  VectorKnowledgeItem,
  VectorQueryContext,
  VectorDeletionContext,
  VectorOperationResult
} from '../types/VectorRepositoryTypes';
import { VectorStorageValidator } from './VectorStorageValidator';
import { VectorDeletionService } from './VectorDeletionService';
import { VectorInsertionService } from './VectorInsertionService';

/** Specialized Service for Vector Storage Operations
 */
export class VectorStorageService {
  
  private deletionService: VectorDeletionService;
  private insertionService: VectorInsertionService;

  constructor(
    private supabase: SupabaseClient,
    private errorTrackingService: ErrorTrackingFacade
  ) {
    this.deletionService = new VectorDeletionService(supabase, errorTrackingService);
    this.insertionService = new VectorInsertionService(supabase);
  }

  /** Store knowledge items with vectors in batch
 */
  async storeKnowledgeItems(
    context: VectorQueryContext,
    items: VectorKnowledgeItem[]
  ): Promise<VectorOperationResult> {
    try {
      // Validate input items
      const validation = VectorStorageValidator.validateStorageItems(items);
      if (!validation.isValid) {
        throw new BusinessRuleViolationError(
          `Invalid storage items: ${validation.errors.join(', ')}`,
          { ...context, itemCount: items.length }
        );
      }

      // Get the unique IDs of the items being upserted
      const knowledgeItemIds = items.map(item => item.knowledgeItemId);

      // Delete existing items to ensure clean upsert
      await this.deletionService.deleteExistingItems(context, knowledgeItemIds);

      // Insert new records with both content and vectors
      await this.insertionService.insertVectorRecords(context, items);

      return {
        success: true,
        itemsProcessed: items.length,
        errors: [],
        warnings: validation.warnings,
        metadata: { operation: 'store_knowledge_items' }
      };
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        `Knowledge vector storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { ...context, itemCount: items.length }
      );
    }
  }

  /**
   * Delete knowledge items by source pattern
   * 
   * AI INSTRUCTIONS:
   * - Support pattern matching for URL-based deletion
   * - Provide detailed logging and error tracking
   * - Handle multi-tenant isolation properly
   * - Return accurate deletion counts
   * - Support both exact and pattern-based deletion
   */
  async deleteKnowledgeItemsBySource(
    deletionContext: VectorDeletionContext
  ): Promise<number> {
    return this.deletionService.deleteKnowledgeItemsBySource(deletionContext);
  }



} 