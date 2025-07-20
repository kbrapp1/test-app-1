import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Validation Utilities
 * 
 * AI INSTRUCTIONS:
 * - Shared validation utilities to eliminate duplicate code
 * - Pure domain service with generic validation patterns
 * - Used by FAQ and WebsiteSource validation services
 * - No external dependencies - pure business logic
 * - Follow @golden-rule patterns exactly
 */
export class ValidationUtilities {
  /**
   * Validates that input is an array
   */
  static validateArrayInput<T>(input: T[], itemName: string): void {
    if (!Array.isArray(input)) {
      throw new BusinessRuleViolationError(
        `${itemName} must be an array`,
        { provided: typeof input, expected: 'array' }
      );
    }
  }

  /**
   * Validates required string field is not empty
   */
  static validateRequiredStringField(
    value: string | undefined, 
    fieldName: string, 
    index: number, 
    itemId: string
  ): void {
    if (!value?.trim()) {
      throw new BusinessRuleViolationError(
        `Item at index ${index} must have a non-empty ${fieldName}`,
        { index, itemId, [fieldName]: value }
      );
    }
  }

  /**
   * Validates string length constraints
   */
  static validateStringLength(
    value: string, 
    maxLength: number, 
    fieldName: string, 
    itemId: string,
    index?: number
  ): void {
    if (value.length > maxLength) {
      const location = index !== undefined ? ` at index ${index}` : '';
      throw new BusinessRuleViolationError(
        `${fieldName}${location} exceeds maximum length (${maxLength} characters)`,
        { itemId, [fieldName + 'Length']: value.length, maxLength }
      );
    }
  }

  /**
   * Validates no duplicate IDs in collection
   */
  static validateNoDuplicateIds<T>(
    items: T[], 
    getKey: (item: T) => string, 
    itemType: string
  ): void {
    const keys = items.map(getKey);
    const uniqueKeys = new Set(keys);
    if (keys.length !== uniqueKeys.size) {
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
      const uniqueDuplicates = new Set(duplicates);
      throw new BusinessRuleViolationError(
        `Duplicate ${itemType} IDs found in collection`,
        { duplicateIds: Array.from(uniqueDuplicates), total: items.length }
      );
    }
  }

  /**
   * Validates collection size limits
   */
  static validateCollectionSize<T>(items: T[], maxSize: number, itemType: string): void {
    if (items.length > maxSize) {
      throw new BusinessRuleViolationError(
        `${itemType} collection exceeds maximum size (${maxSize} items)`,
        { currentSize: items.length, maxSize }
      );
    }
  }

  /**
   * Validates item exists for update operations
   */
  static validateItemExistsForUpdate<T>(
    items: T[], 
    itemId: string, 
    getKey: (item: T) => string,
    mapToSummary: (item: T) => Record<string, unknown>,
    itemType: string
  ): void {
    const exists = items.some(item => getKey(item) === itemId);
    if (!exists) {
      throw new BusinessRuleViolationError(
        `${itemType} not found for update`,
        { 
          itemId, 
          available: items.map(mapToSummary),
          total: items.length
        }
      );
    }
  }
}