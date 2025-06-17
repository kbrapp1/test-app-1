/**
 * Entity Accumulation Service Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all business rules and domain logic
 * - Cover both positive and negative scenarios
 * - Validate entity merging strategies work correctly
 * - Follow @golden-rule testing patterns exactly
 * - Test error conditions with domain-specific errors
 * - Ensure 100% test coverage for business logic
 */

import { EntityAccumulationService, EntityMergeContext, EntityMergeResult } from '../EntityAccumulationService';
import { AccumulatedEntities } from '../../../value-objects/context/AccumulatedEntities';
import { EntityCorrections } from '../../../value-objects/context/EntityCorrections';
import { ExtractedEntities } from '../../../value-objects/message-processing/IntentResult';
import { BusinessRuleViolationError } from '../../../errors/BusinessRuleViolationError';

describe('EntityAccumulationService', () => {
  const mockContext: EntityMergeContext = {
    messageId: 'msg-123',
    defaultConfidence: 0.9,
    enableDeduplication: true,
    confidenceThreshold: 0.7
  };

  describe('mergeEntitiesWithCorrections', () => {
    it('should create new accumulated entities when none exist', () => {
      const freshEntities: ExtractedEntities = {
        budget: '10000',
        timeline: 'Q2 2024',
        company: 'Acme Corp',
        industry: 'Technology'
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        null,
        freshEntities,
        mockContext
      );

      expect(result.accumulatedEntities).toBeDefined();
      expect(result.accumulatedEntities.budget?.value).toBe('10000');
      expect(result.accumulatedEntities.timeline?.value).toBe('Q2 2024');
      expect(result.accumulatedEntities.company?.value).toBe('Acme Corp');
      expect(result.accumulatedEntities.industry?.value).toBe('Technology');
      expect(result.mergeMetadata.newEntitiesAdded).toBe(4);
      expect(result.processedCorrections).toBeNull();
    });

    it('should merge with existing accumulated entities', () => {
      const existing = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '5000', 'msg-old', 0.8);

      const freshEntities: ExtractedEntities = {
        budget: '10000',
        timeline: 'Q2 2024'
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        existing,
        freshEntities,
        mockContext
      );

      expect(result.accumulatedEntities.budget?.value).toBe('10000');
      expect(result.accumulatedEntities.timeline?.value).toBe('Q2 2024');
      expect(result.mergeMetadata.newEntitiesAdded).toBe(2);
    });

    it('should process corrections before accumulation', () => {
      const existing = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '5000', 'msg-old', 0.8);

      const corrections = EntityCorrections.create('session-123')
        .withCorrectedEntity('budget', '8000', 'msg-correction', 'explicit', 0.95);

      const freshEntities: ExtractedEntities & { corrections?: EntityCorrections } = {
        budget: '10000',
        corrections
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        existing,
        freshEntities,
        mockContext
      );

      expect(result.processedCorrections).toBe(corrections);
      expect(result.mergeMetadata.correctionsApplied).toBe(1);
      expect(result.mergeMetadata.totalEntitiesProcessed).toBe(2); // 1 correction + 1 fresh entity
    });

    it('should handle empty fresh entities', () => {
      const existing = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '5000', 'msg-old', 0.8);

      const freshEntities: ExtractedEntities = {};

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        existing,
        freshEntities,
        mockContext
      );

      expect(result.accumulatedEntities.budget?.value).toBe('5000');
      expect(result.mergeMetadata.newEntitiesAdded).toBe(0);
      expect(result.mergeMetadata.totalEntitiesProcessed).toBe(0);
    });

    it('should validate merge context', () => {
      const invalidContext = { ...mockContext, messageId: '' };
      const freshEntities: ExtractedEntities = { budget: '10000' };

      expect(() => 
        EntityAccumulationService.mergeEntitiesWithCorrections(null, freshEntities, invalidContext)
      ).toThrow(BusinessRuleViolationError);
    });

    it('should validate confidence values', () => {
      const invalidContext = { ...mockContext, defaultConfidence: 1.5 };
      const freshEntities: ExtractedEntities = { budget: '10000' };

      expect(() => 
        EntityAccumulationService.mergeEntitiesWithCorrections(null, freshEntities, invalidContext)
      ).toThrow(BusinessRuleViolationError);
    });
  });

  describe('mergeEntities (legacy method)', () => {
    it('should work as backward-compatible wrapper', () => {
      const freshEntities: ExtractedEntities = {
        budget: '10000',
        company: 'Acme Corp'
      };

      const result = EntityAccumulationService.mergeEntities(
        null,
        freshEntities,
        mockContext
      );

      expect(result).toBeInstanceOf(AccumulatedEntities);
      expect(result.budget?.value).toBe('10000');
      expect(result.company?.value).toBe('Acme Corp');
    });
  });

  describe('buildEntityContextPrompt', () => {
    it('should build context prompt from accumulated entities', () => {
      const entities = AccumulatedEntities.create()
        .withAdditiveEntity('decisionMakers', ['John Doe', 'Jane Smith'], 'msg-1', 0.9)
        .withAdditiveEntity('painPoints', ['Slow processes', 'High costs'], 'msg-2', 0.8)
        .withReplaceableEntity('budget', '50000', 'msg-3', 0.9)
        .withReplaceableEntity('timeline', 'Q2 2024', 'msg-4', 0.8)
        .withConfidenceBasedEntity('company', 'Acme Corp', 'msg-5', 0.95, 0.7);

      const prompt = EntityAccumulationService.buildEntityContextPrompt(entities);

      expect(prompt).toContain('ACCUMULATED CONVERSATION CONTEXT:');
      expect(prompt).toContain('Decision makers identified: John Doe, Jane Smith');
      expect(prompt).toContain('Pain points mentioned: Slow processes, High costs');
      expect(prompt).toContain('Budget mentioned: 50000');
      expect(prompt).toContain('Timeline mentioned: Q2 2024');
      expect(prompt).toContain('Company: Acme Corp');
    });

    it('should return empty string for empty entities', () => {
      const entities = AccumulatedEntities.create();
      const prompt = EntityAccumulationService.buildEntityContextPrompt(entities);
      expect(prompt).toBe('');
    });

    it('should include entity age in prompt', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      const entities = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '50000', 'msg-1', 0.9);

      // Mock the extractedAt date
      Object.defineProperty(entities.budget!, 'extractedAt', {
        value: pastDate,
        writable: false
      });

      const prompt = EntityAccumulationService.buildEntityContextPrompt(entities);
      expect(prompt).toContain('2h ago');
    });
  });

  describe('confidence-based entity merging', () => {
    it('should keep higher confidence entity', () => {
      const existing = AccumulatedEntities.create()
        .withConfidenceBasedEntity('company', 'Old Corp', 'msg-old', 0.95, 0.7);

      const freshEntities: ExtractedEntities = {
        company: 'New Corp' // Will use default confidence 0.9
      };

      const result = EntityAccumulationService.mergeEntities(
        existing,
        freshEntities,
        mockContext
      );

      // Should keep existing higher confidence entity
      expect(result.company?.value).toBe('Old Corp');
      expect(result.company?.confidence).toBe(0.95);
    });

    it('should replace with higher confidence entity', () => {
      const existing = AccumulatedEntities.create()
        .withConfidenceBasedEntity('company', 'Old Corp', 'msg-old', 0.6, 0.7);

      const freshEntities: ExtractedEntities = {
        company: 'New Corp' // Will use default confidence 0.9
      };

      const result = EntityAccumulationService.mergeEntities(
        existing,
        freshEntities,
        mockContext
      );

      // Should replace with new higher confidence entity
      expect(result.company?.value).toBe('New Corp');
      expect(result.company?.confidence).toBe(0.9);
    });
  });

  describe('replaceable entity strategy', () => {
    it('should always replace with newest value', () => {
      const existing = AccumulatedEntities.create()
        .withReplaceableEntity('budget', '5000', 'msg-old', 0.9);

      const freshEntities: ExtractedEntities = {
        budget: '10000'
      };

      const result = EntityAccumulationService.mergeEntities(
        existing,
        freshEntities,
        mockContext
      );

      expect(result.budget?.value).toBe('10000');
      expect(result.budget?.sourceMessageId).toBe('msg-123');
    });
  });

  describe('entity counting', () => {
    it('should count all extracted entities correctly', () => {
      const freshEntities: ExtractedEntities = {
        location: 'New York',
        budget: '10000',
        timeline: 'Q2 2024',
        company: 'Acme Corp',
        industry: 'Technology',
        teamSize: '50',
        urgency: 'high',
        contactMethod: 'email'
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        null,
        freshEntities,
        mockContext
      );

      expect(result.mergeMetadata.totalEntitiesProcessed).toBe(8);
    });

    it('should handle partial entity sets', () => {
      const freshEntities: ExtractedEntities = {
        budget: '10000',
        company: 'Acme Corp'
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        null,
        freshEntities,
        mockContext
      );

      expect(result.mergeMetadata.totalEntitiesProcessed).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values gracefully', () => {
      const freshEntities: ExtractedEntities = {
        budget: undefined,
        timeline: 'Q2 2024'
      };

      const result = EntityAccumulationService.mergeEntities(
        null,
        freshEntities,
        mockContext
      );

      expect(result.budget).toBeNull();
      expect(result.timeline?.value).toBe('Q2 2024');
    });

    it('should handle empty string values', () => {
      const freshEntities: ExtractedEntities = {
        budget: '',
        timeline: 'Q2 2024'
      };

      const result = EntityAccumulationService.mergeEntities(
        null,
        freshEntities,
        mockContext
      );

      // Empty strings are filtered out and become null
      expect(result.budget).toBeNull();
      expect(result.timeline?.value).toBe('Q2 2024');
    });
  });

  describe('metadata tracking', () => {
    it('should track processing metadata correctly', () => {
      const freshEntities: ExtractedEntities = {
        budget: '10000',
        timeline: 'Q2 2024'
      };

      const result = EntityAccumulationService.mergeEntitiesWithCorrections(
        null,
        freshEntities,
        mockContext
      );

      expect(result.mergeMetadata.processingTimestamp).toBeInstanceOf(Date);
      expect(result.mergeMetadata.newEntitiesAdded).toBe(2);
      expect(result.mergeMetadata.correctionsApplied).toBe(0);
      expect(result.mergeMetadata.entitiesRemoved).toBe(0);
      expect(result.mergeMetadata.totalEntitiesProcessed).toBe(2);
    });
  });
}); 