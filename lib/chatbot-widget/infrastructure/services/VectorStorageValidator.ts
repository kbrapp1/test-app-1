/**
 * Vector Storage Validator
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Validate vector storage items and operations
 * - Infrastructure service focused on data validation
 * - Handle data integrity checks and dimension validation
 * - Stay under 150 lines
 * - Provide detailed validation results with errors and warnings
 */

import { VectorKnowledgeItem, VectorStorageConfig } from '../types/VectorRepositoryTypes';

/** Validation result for vector storage operations */
export interface VectorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Vector Storage Validator
 * Handles validation of vector storage items and configurations
 */
export class VectorStorageValidator {
  
  private static readonly DEFAULT_STORAGE_CONFIG: VectorStorageConfig = {
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
    enableValidation: true,
    dimensionConfig: {
      expectedDimensions: 1536,
      validateDimensions: true
    }
  };

  /**
   * Validate storage items before insertion
   * 
   * AI INSTRUCTIONS:
   * - Check vector dimensions and format
   * - Validate required fields and data types
   * - Provide detailed validation results
   * - Support data integrity checks
   * - Enable early error detection
   */
  static validateStorageItems(items: VectorKnowledgeItem[]): VectorValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(items) || items.length === 0) {
      errors.push('Items array is empty or invalid');
      return { isValid: false, errors, warnings };
    }

    items.forEach((item, index) => {
      // Validate required fields
      if (!item.knowledgeItemId) {
        errors.push(`Item ${index}: knowledge item ID is required`);
      }
      if (!item.title) {
        errors.push(`Item ${index}: title is required`);
      }
      if (!item.content) {
        errors.push(`Item ${index}: content is required`);
      }
      if (!item.category) {
        errors.push(`Item ${index}: category is required`);
      }
      if (!item.contentHash) {
        errors.push(`Item ${index}: content hash is required`);
      }

      // Validate vector dimensions
      if (!Array.isArray(item.embedding)) {
        errors.push(`Item ${index}: embedding must be an array`);
      } else if (item.embedding.length !== VectorStorageValidator.DEFAULT_STORAGE_CONFIG.dimensionConfig.expectedDimensions) {
        errors.push(
          `Item ${index}: vector dimension mismatch (${item.embedding.length} vs ${VectorStorageValidator.DEFAULT_STORAGE_CONFIG.dimensionConfig.expectedDimensions})`
        );
      }

      // Validate source type
      const validSourceTypes = ['faq', 'company_info', 'product_catalog', 'support_docs', 'website_crawled'];
      if (!validSourceTypes.includes(item.sourceType)) {
        errors.push(`Item ${index}: invalid source type '${item.sourceType}'`);
      }

      // Check for optional warnings
      if (!item.sourceUrl && item.sourceType === 'website_crawled') {
        warnings.push(`Item ${index}: website crawled item missing source URL`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /** Get default storage configuration */
  static getDefaultConfig(): VectorStorageConfig {
    return { ...VectorStorageValidator.DEFAULT_STORAGE_CONFIG };
  }

  /** Validate vector dimensions */
  static validateVectorDimensions(vector: number[], expectedDimensions: number = 1536): boolean {
    return Array.isArray(vector) && vector.length === expectedDimensions;
  }

  /** Validate source type */
  static validateSourceType(sourceType: string): boolean {
    const validSourceTypes = ['faq', 'company_info', 'product_catalog', 'support_docs', 'website_crawled'];
    return validSourceTypes.includes(sourceType);
  }
}