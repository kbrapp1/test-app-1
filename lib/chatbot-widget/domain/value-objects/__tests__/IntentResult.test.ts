import { describe, it, expect } from 'vitest';
import { IntentResult, IntentType, ExtractedEntities } from '../message-processing/IntentResult';

describe('IntentResult', () => {
  const mockMetadata = {
    model: 'gpt-4o',
    processingTimeMs: 150,
    alternativeIntents: []
  };

  describe('create', () => {
    it('should create a valid intent result', () => {
      const entities: ExtractedEntities = {
        budget: '$5000',
        timeline: 'next month'
      };

      const result = IntentResult.create(
        'sales_inquiry',
        0.85,
        entities,
        'User shows strong buying intent',
        mockMetadata
      );

      expect(result.intent).toBe('sales_inquiry');
      expect(result.confidence).toBe(0.85);
      expect(result.entities).toEqual(entities);
      expect(result.reasoning).toBe('User shows strong buying intent');
      expect(result.metadata).toEqual(mockMetadata);
    });

    it('should throw error for invalid confidence score', () => {
      expect(() => {
        IntentResult.create('greeting', 1.5, {}, '', mockMetadata);
      }).toThrow('Confidence must be between 0 and 1');

      expect(() => {
        IntentResult.create('greeting', -0.1, {}, '', mockMetadata);
      }).toThrow('Confidence must be between 0 and 1');
    });
  });

  describe('createUnknown', () => {
    it('should create unknown intent with low confidence', () => {
      const result = IntentResult.createUnknown('Unable to classify');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0.1);
      expect(result.reasoning).toBe('Unable to classify');
      expect(result.metadata.model).toBe('fallback');
    });

    it('should use default reasoning when none provided', () => {
      const result = IntentResult.createUnknown();

      expect(result.reasoning).toBe('Unable to classify intent');
    });
  });

  describe('isSalesIntent', () => {
    it('should return true for sales-related intents', () => {
      const salesIntents: IntentType[] = [
        'sales_inquiry',
        'booking_request',
        'demo_request',
        'qualification',
        'closing'
      ];

      salesIntents.forEach(intent => {
        const result = IntentResult.create(intent, 0.8, {}, '', mockMetadata);
        expect(result.isSalesIntent()).toBe(true);
      });
    });

    it('should return false for non-sales intents', () => {
      const nonSalesIntents: IntentType[] = [
        'greeting',
        'faq_general',
        'support_request',
        'unknown'
      ];

      nonSalesIntents.forEach(intent => {
        const result = IntentResult.create(intent, 0.8, {}, '', mockMetadata);
        expect(result.isSalesIntent()).toBe(false);
      });
    });
  });

  describe('isSupportIntent', () => {
    it('should return true for support-related intents', () => {
      const supportIntents: IntentType[] = [
        'support_request',
        'faq_general',
        'faq_pricing',
        'faq_features'
      ];

      supportIntents.forEach(intent => {
        const result = IntentResult.create(intent, 0.8, {}, '', mockMetadata);
        expect(result.isSupportIntent()).toBe(true);
      });
    });

    it('should return false for non-support intents', () => {
      const nonSupportIntents: IntentType[] = [
        'sales_inquiry',
        'demo_request',
        'greeting',
        'unknown'
      ];

      nonSupportIntents.forEach(intent => {
        const result = IntentResult.create(intent, 0.8, {}, '', mockMetadata);
        expect(result.isSupportIntent()).toBe(false);
      });
    });
  });

  describe('isHighConfidence', () => {
    it('should return true when confidence meets threshold', () => {
      const result = IntentResult.create('sales_inquiry', 0.8, {}, '', mockMetadata);
      expect(result.isHighConfidence(0.7)).toBe(true);
      expect(result.isHighConfidence()).toBe(true); // Default threshold 0.7
    });

    it('should return false when confidence below threshold', () => {
      const result = IntentResult.create('sales_inquiry', 0.6, {}, '', mockMetadata);
      expect(result.isHighConfidence(0.7)).toBe(false);
      expect(result.isHighConfidence()).toBe(false);
    });
  });

  describe('getCategory', () => {
    it('should return correct categories for different intents', () => {
      const testCases: Array<[IntentType, string]> = [
        ['sales_inquiry', 'sales'],
        ['demo_request', 'sales'],
        ['faq_pricing', 'support'],
        ['support_request', 'support'],
        ['greeting', 'general'],
        ['unknown', 'unknown']
      ];

      testCases.forEach(([intent, expectedCategory]) => {
        const result = IntentResult.create(intent, 0.8, {}, '', mockMetadata);
        expect(result.getCategory()).toBe(expectedCategory);
      });
    });
  });

  describe('hasQualifyingEntities', () => {
    it('should return true when qualifying entities are present', () => {
      const entities: ExtractedEntities = {
        budget: '$10000',
        company: 'Acme Corp'
      };

      const result = IntentResult.create('sales_inquiry', 0.8, entities, '', mockMetadata);
      expect(result.hasQualifyingEntities()).toBe(true);
    });

    it('should return false when no qualifying entities', () => {
      const entities: ExtractedEntities = {
        location: 'New York'
      };

      const result = IntentResult.create('sales_inquiry', 0.8, entities, '', mockMetadata);
      expect(result.hasQualifyingEntities()).toBe(false);
    });

    it('should return false when no entities at all', () => {
      const result = IntentResult.create('sales_inquiry', 0.8, {}, '', mockMetadata);
      expect(result.hasQualifyingEntities()).toBe(false);
    });
  });

  describe('getUrgencyLevel', () => {
    it('should return explicit urgency from entities', () => {
      const entities: ExtractedEntities = {
        urgency: 'high'
      };

      const result = IntentResult.create('sales_inquiry', 0.8, entities, '', mockMetadata);
      expect(result.getUrgencyLevel()).toBe('high');
    });

    it('should infer urgency from intent type', () => {
      const highUrgencyResult = IntentResult.create('closing', 0.8, {}, '', mockMetadata);
      expect(highUrgencyResult.getUrgencyLevel()).toBe('high');

      const mediumUrgencyResult = IntentResult.create('sales_inquiry', 0.8, {}, '', mockMetadata);
      expect(mediumUrgencyResult.getUrgencyLevel()).toBe('medium');

      const lowUrgencyResult = IntentResult.create('greeting', 0.8, {}, '', mockMetadata);
      expect(lowUrgencyResult.getUrgencyLevel()).toBe('low');
    });
  });

  describe('toPlainObject', () => {
    it('should convert to plain object with all computed properties', () => {
      const entities: ExtractedEntities = {
        budget: '$5000',
        urgency: 'high'
      };

      const result = IntentResult.create('sales_inquiry', 0.85, entities, 'Strong buying signal', mockMetadata);
      const plainObject = result.toPlainObject();

      expect(plainObject).toEqual({
        intent: 'sales_inquiry',
        confidence: 0.85,
        entities,
        reasoning: 'Strong buying signal',
        metadata: mockMetadata,
        category: 'sales',
        urgencyLevel: 'high',
        isSalesIntent: true,
        hasQualifyingEntities: true
      });
    });
  });
}); 