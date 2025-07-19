/**
 * Safe Type Extractor Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service for safe property extraction
 * - Handles type-safe access to unknown objects
 * - Single responsibility: safe property access
 * - No business logic - pure technical utility
 */

import { WorkflowTypeValidator } from '../../../domain/services/mapping/WorkflowTypeValidator';
import { MappingResult } from '../../../domain/value-objects/mapping/MappingResult';

export class SafeTypeExtractor {
  private readonly validator: WorkflowTypeValidator;

  constructor() {
    this.validator = new WorkflowTypeValidator();
  }

  /**
   * Safely get property from object
   */
  public getProperty(obj: Record<string, unknown>, key: string): unknown {
    return obj[key];
  }

  /**
   * Safely extract string with validation
   */
  public getString(obj: Record<string, unknown>, key: string): MappingResult<string> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isString(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid string`);
  }

  /**
   * Safely extract number with validation
   */
  public getNumber(obj: Record<string, unknown>, key: string): MappingResult<number> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isNumber(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid number`);
  }

  /**
   * Safely extract object with validation
   */
  public getObject(obj: Record<string, unknown>, key: string): MappingResult<Record<string, unknown>> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isObject(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid object`);
  }

  /**
   * Safely extract string array with validation
   */
  public getStringArray(obj: Record<string, unknown>, key: string): MappingResult<string[]> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isStringArray(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid string array`);
  }

  /**
   * Safely extract sentiment with business validation
   */
  public getSentiment(obj: Record<string, unknown>, key: string = 'sentiment'): MappingResult<'positive' | 'neutral' | 'negative'> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isValidSentiment(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid sentiment`);
  }

  /**
   * Safely extract confidence with range validation
   */
  public getConfidence(obj: Record<string, unknown>, key: string): MappingResult<number> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isValidConfidence(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid confidence value (0-1)`);
  }

  /**
   * Safely extract progress percentage with range validation
   */
  public getProgressPercentage(obj: Record<string, unknown>, key: string): MappingResult<number> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isValidProgressPercentage(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid progress percentage (0-100)`);
  }

  /**
   * Safely extract entities with validation
   */
  public getEntities(obj: Record<string, unknown>, key: string = 'entities'): MappingResult<Record<string, unknown>> {
    const value = this.getProperty(obj, key);
    
    if (this.validator.isValidEntityObject(value)) {
      return MappingResult.success(value);
    }
    
    return MappingResult.failure(`Property '${key}' is not a valid entities object`);
  }

  /**
   * Check if object has required properties
   */
  public hasRequiredProperties(obj: Record<string, unknown>, requiredKeys: string[]): boolean {
    return requiredKeys.every(key => key in obj && obj[key] !== undefined);
  }

  /**
   * Validate entire object structure
   */
  public validateObjectStructure(obj: unknown, requiredKeys: string[]): MappingResult<Record<string, unknown>> {
    if (!this.validator.isObject(obj)) {
      return MappingResult.failure('Value is not a valid object');
    }

    if (!this.hasRequiredProperties(obj, requiredKeys)) {
      const missing = requiredKeys.filter(key => !(key in obj));
      return MappingResult.failure(`Missing required properties: ${missing.join(', ')}`);
    }

    return MappingResult.success(obj);
  }
}