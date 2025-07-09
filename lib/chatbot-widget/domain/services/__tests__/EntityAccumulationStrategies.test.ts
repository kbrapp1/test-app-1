/**
 * EntityAccumulationStrategies Tests
 * 
 * Tests all three accumulation strategies:
 * - Additive: Accumulate unique values over time
 * - Replaceable: Keep latest value
 * - Confidence-based: Keep highest confidence value
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EntityAccumulationStrategies } from '../EntityAccumulationStrategies';
import {
  EntityWithMetadata,
  EntityOperationContext,
  EntityNormalizationConfig,
  AdditiveEntityType,
  ReplaceableEntityType,
  ConfidenceBasedEntityType
} from '../../types/AccumulatedEntityTypes';

describe('EntityAccumulationStrategies', () => {
  const baseContext: EntityOperationContext = {
    extractedAt: new Date('2024-01-01T12:00:00Z'),
    confidence: 0.8,
    messageId: 'msg-123'
  };

  describe('Additive Strategy', () => {
    it('should accumulate unique values from new inputs', () => {
      const existingEntities: EntityWithMetadata<string>[] = [
        {
          value: 'increase sales',
          extractedAt: new Date('2024-01-01T10:00:00Z'),
          confidence: 0.9,
          sourceMessageId: 'msg-100'
        }
      ];

      const newValues = ['reduce costs', 'improve efficiency'];
      const result = EntityAccumulationStrategies.applyAdditiveStrategy(
        existingEntities,
        newValues,
        baseContext
      );

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe('increase sales');
      expect(result[1].value).toBe('reduce costs');
      expect(result[2].value).toBe('improve efficiency');
      expect(result[1].sourceMessageId).toBe('msg-123');
      expect(result[2].sourceMessageId).toBe('msg-123');
    });

    it('should deduplicate similar values', () => {
      const existingEntities: EntityWithMetadata<string>[] = [
        {
          value: 'Increase Sales',
          extractedAt: new Date('2024-01-01T10:00:00Z'),
          confidence: 0.9,
          sourceMessageId: 'msg-100'
        }
      ];

      const newValues = ['increase sales', 'INCREASE SALES!'];
      const result = EntityAccumulationStrategies.applyAdditiveStrategy(
        existingEntities,
        newValues,
        baseContext
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('Increase Sales');
    });

    it('should handle empty existing entities', () => {
      const existingEntities: EntityWithMetadata<string>[] = [];
      const newValues = ['goal 1', 'goal 2'];
      
      const result = EntityAccumulationStrategies.applyAdditiveStrategy(
        existingEntities,
        newValues,
        baseContext
      );

      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('goal 1');
      expect(result[1].value).toBe('goal 2');
    });

    it('should handle empty new values', () => {
      const existingEntities: EntityWithMetadata<string>[] = [
        {
          value: 'existing goal',
          extractedAt: new Date('2024-01-01T10:00:00Z'),
          confidence: 0.9,
          sourceMessageId: 'msg-100'
        }
      ];

      const result = EntityAccumulationStrategies.applyAdditiveStrategy(
        existingEntities,
        [],
        baseContext
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('existing goal');
    });
  });

  describe('Replaceable Strategy', () => {
    it('should create new entity with latest value', () => {
      const newValue = '$50,000';
      const result = EntityAccumulationStrategies.applyReplaceableStrategy(
        newValue,
        baseContext
      );

      expect(result.value).toBe('$50,000');
      expect(result.extractedAt).toEqual(baseContext.extractedAt);
      expect(result.confidence).toBe(0.8);
      expect(result.sourceMessageId).toBe('msg-123');
    });

    it('should handle different data types', () => {
      const urgencyValue = 'high' as const;
      const result = EntityAccumulationStrategies.applyReplaceableStrategy(
        urgencyValue,
        baseContext
      );

      expect(result.value).toBe('high');
      expect(result.extractedAt).toEqual(baseContext.extractedAt);
    });

    it('should handle null values', () => {
      const result = EntityAccumulationStrategies.applyReplaceableStrategy(
        null,
        baseContext
      );

      expect(result.value).toBeNull();
      expect(result.confidence).toBe(0.8);
    });
  });

  describe('Confidence-based Strategy', () => {
    it('should keep existing entity with higher confidence', () => {
      const existingEntity: EntityWithMetadata<string> = {
        value: 'John Doe',
        extractedAt: new Date('2024-01-01T10:00:00Z'),
        confidence: 0.95,
        sourceMessageId: 'msg-100'
      };

      const newValue = 'John Smith';
      const newContext = { ...baseContext, confidence: 0.7 };

      const result = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
        existingEntity,
        newValue,
        newContext
      );

      expect(result.value).toBe('John Doe');
      expect(result.confidence).toBe(0.95);
      expect(result.sourceMessageId).toBe('msg-100');
    });

    it('should use new entity with higher confidence', () => {
      const existingEntity: EntityWithMetadata<string> = {
        value: 'John Doe',
        extractedAt: new Date('2024-01-01T10:00:00Z'),
        confidence: 0.6,
        sourceMessageId: 'msg-100'
      };

      const newValue = 'John Smith';
      const newContext = { ...baseContext, confidence: 0.9 };

      const result = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
        existingEntity,
        newValue,
        newContext
      );

      expect(result.value).toBe('John Smith');
      expect(result.confidence).toBe(0.9);
      expect(result.sourceMessageId).toBe('msg-123');
    });

    it('should use new entity when no existing entity', () => {
      const newValue = 'Jane Doe';
      const result = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
        null,
        newValue,
        baseContext
      );

      expect(result.value).toBe('Jane Doe');
      expect(result.confidence).toBe(0.8);
      expect(result.sourceMessageId).toBe('msg-123');
    });

    it('should respect confidence threshold', () => {
      const existingEntity: EntityWithMetadata<string> = {
        value: 'John Doe',
        extractedAt: new Date('2024-01-01T10:00:00Z'),
        confidence: 0.65,
        sourceMessageId: 'msg-100'
      };

      const newValue = 'John Smith';
      const newContext = { ...baseContext, confidence: 0.6 };

      const result = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
        existingEntity,
        newValue,
        newContext,
        0.7 // High threshold
      );

      expect(result.value).toBe('John Smith');
      expect(result.confidence).toBe(0.6);
    });

    it('should use custom confidence threshold', () => {
      const existingEntity: EntityWithMetadata<string> = {
        value: 'John Doe',
        extractedAt: new Date('2024-01-01T10:00:00Z'),
        confidence: 0.5,
        sourceMessageId: 'msg-100'
      };

      const newValue = 'John Smith';
      const newContext = { ...baseContext, confidence: 0.4 };

      const result = EntityAccumulationStrategies.applyConfidenceBasedStrategy(
        existingEntity,
        newValue,
        newContext,
        0.3 // Low threshold
      );

      expect(result.value).toBe('John Doe');
      expect(result.confidence).toBe(0.5);
    });
  });

  describe('Entity Removal and Correction', () => {
    it('should remove specific values from additive array', () => {
      const entities: EntityWithMetadata<string>[] = [
        { value: 'goal 1', extractedAt: new Date(), confidence: 0.8, sourceMessageId: 'msg-1' },
        { value: 'goal 2', extractedAt: new Date(), confidence: 0.9, sourceMessageId: 'msg-2' },
        { value: 'GOAL 1', extractedAt: new Date(), confidence: 0.7, sourceMessageId: 'msg-3' }
      ];

      const result = EntityAccumulationStrategies.removeFromAdditiveArray(
        entities,
        'goal 1'
      );

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe('goal 2');
    });

    it('should apply corrections to any entity', () => {
      const correctedValue = 'Corrected Value';
      const result = EntityAccumulationStrategies.applyCorrection(
        correctedValue,
        baseContext
      );

      expect(result.value).toBe('Corrected Value');
      expect(result.extractedAt).toEqual(baseContext.extractedAt);
      expect(result.confidence).toBe(0.8);
      expect(result.sourceMessageId).toBe('msg-123');
    });
  });

  describe('Normalization and Deduplication', () => {
    it('should normalize entity values with default config', () => {
      const result = EntityAccumulationStrategies.normalizeEntityValue('  Hello World!  ');
      expect(result).toBe('helloworld');
    });

    it('should normalize with custom config', () => {
      const config: EntityNormalizationConfig = {
        removeSpecialCharacters: false,
        toLowerCase: false,
        trimWhitespace: true
      };

      const result = EntityAccumulationStrategies.normalizeEntityValue('  Hello World!  ', config);
      expect(result).toBe('Hello World!');
    });

    it('should deduplicate entity arrays', () => {
      const entities: EntityWithMetadata<string>[] = [
        { value: 'Goal 1', extractedAt: new Date(), confidence: 0.8, sourceMessageId: 'msg-1' },
        { value: 'GOAL 1!', extractedAt: new Date(), confidence: 0.9, sourceMessageId: 'msg-2' },
        { value: 'Goal 2', extractedAt: new Date(), confidence: 0.7, sourceMessageId: 'msg-3' }
      ];

      const result = EntityAccumulationStrategies.deduplicateEntityArray(entities);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBe('Goal 1');
      expect(result[1].value).toBe('Goal 2');
    });
  });

  describe('Validation and Quality Scoring', () => {
    it('should validate entity confidence scores', () => {
      const validEntities: EntityWithMetadata<string>[] = [
        { value: 'test', extractedAt: new Date(), confidence: 0.5, sourceMessageId: 'msg-1' },
        { value: 'test2', extractedAt: new Date(), confidence: 1.0, sourceMessageId: 'msg-2' }
      ];

      const result = EntityAccumulationStrategies.validateEntityConfidence(validEntities);
      expect(result).toBe(true);
    });

    it('should reject invalid confidence scores', () => {
      const invalidEntities: EntityWithMetadata<string>[] = [
        { value: 'test', extractedAt: new Date(), confidence: 1.5, sourceMessageId: 'msg-1' },
        { value: 'test2', extractedAt: new Date(), confidence: -0.1, sourceMessageId: 'msg-2' }
      ];

      const result = EntityAccumulationStrategies.validateEntityConfidence(invalidEntities);
      expect(result).toBe(false);
    });

    it('should reject NaN confidence scores', () => {
      const invalidEntities: EntityWithMetadata<string>[] = [
        { value: 'test', extractedAt: new Date(), confidence: NaN, sourceMessageId: 'msg-1' }
      ];

      const result = EntityAccumulationStrategies.validateEntityConfidence(invalidEntities);
      expect(result).toBe(false);
    });

    it('should calculate entity quality score', () => {
      const entity: EntityWithMetadata<string> = {
        value: 'test',
        extractedAt: new Date('2024-01-01T12:00:00Z'),
        confidence: 0.8,
        sourceMessageId: 'msg-1'
      };

      const currentTime = new Date('2024-01-01T12:00:00Z');
      const result = EntityAccumulationStrategies.calculateEntityQuality(entity, currentTime);

      expect(result).toBeCloseTo(0.86); // (0.8 * 0.7) + (1.0 * 0.3)
    });

    it('should account for age decay in quality score', () => {
      const entity: EntityWithMetadata<string> = {
        value: 'test',
        extractedAt: new Date('2024-01-01T12:00:00Z'),
        confidence: 0.8,
        sourceMessageId: 'msg-1'
      };

      const currentTime = new Date('2024-01-16T12:00:00Z'); // 15 days later
      const result = EntityAccumulationStrategies.calculateEntityQuality(entity, currentTime);

      expect(result).toBeCloseTo(0.71); // (0.8 * 0.7) + (0.5 * 0.3)
    });
  });

  describe('Strategy Type Detection', () => {
    it('should identify additive entity types', () => {
      const additiveTypes: AdditiveEntityType[] = ['goals', 'decisionMakers', 'painPoints'];
      
      additiveTypes.forEach(type => {
        const result = EntityAccumulationStrategies.getStrategyForEntityType(type);
        expect(result).toBe('additive');
      });
    });

    it('should identify replaceable entity types', () => {
      const replaceableTypes: ReplaceableEntityType[] = ['budget', 'timeline', 'urgency'];
      
      replaceableTypes.forEach(type => {
        const result = EntityAccumulationStrategies.getStrategyForEntityType(type);
        expect(result).toBe('replaceable');
      });
    });

    it('should identify confidence-based entity types', () => {
      const confidenceTypes: ConfidenceBasedEntityType[] = ['visitorName', 'role', 'company'];
      
      confidenceTypes.forEach(type => {
        const result = EntityAccumulationStrategies.getStrategyForEntityType(type);
        expect(result).toBe('confidence-based');
      });
    });

    it('should throw error for unknown entity type', () => {
      expect(() => {
        EntityAccumulationStrategies.getStrategyForEntityType('unknown' as any);
      }).toThrow('Unknown entity type: unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      const result = EntityAccumulationStrategies.applyReplaceableStrategy('', baseContext);
      expect(result.value).toBe('');
    });

    it('should handle whitespace-only values', () => {
      const result = EntityAccumulationStrategies.normalizeEntityValue('   ');
      expect(result).toBe('');
    });

    it('should handle very old entities in quality calculation', () => {
      const entity: EntityWithMetadata<string> = {
        value: 'test',
        extractedAt: new Date('2023-01-01T12:00:00Z'),
        confidence: 0.8,
        sourceMessageId: 'msg-1'
      };

      const currentTime = new Date('2024-01-01T12:00:00Z'); // 1 year later
      const result = EntityAccumulationStrategies.calculateEntityQuality(entity, currentTime);

      expect(result).toBeCloseTo(0.56); // (0.8 * 0.7) + (0.0 * 0.3)
    });

    it('should handle zero confidence', () => {
      const entity: EntityWithMetadata<string> = {
        value: 'test',
        extractedAt: new Date(),
        confidence: 0,
        sourceMessageId: 'msg-1'
      };

      const result = EntityAccumulationStrategies.calculateEntityQuality(entity);
      expect(result).toBeCloseTo(0.3); // (0.0 * 0.7) + (1.0 * 0.3)
    });
  });
});