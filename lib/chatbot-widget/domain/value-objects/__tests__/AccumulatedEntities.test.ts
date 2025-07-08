import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccumulatedEntities, EntityWithMetadata } from '../context/AccumulatedEntities';

describe('AccumulatedEntities Value Object', () => {
  const mockMessageId = 'msg-123';
  const mockDate = new Date('2023-01-01T00:00:00Z');

  beforeEach(() => {
    // Mock Date constructor to ensure consistent timestamps in tests
    vi.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor validation', () => {
    it('should create empty AccumulatedEntities with defaults', () => {
      const entities = AccumulatedEntities.create();

      expect(entities.goals).toEqual([]);
      expect(entities.decisionMakers).toEqual([]);
      expect(entities.painPoints).toEqual([]);
      expect(entities.integrationNeeds).toEqual([]);
      expect(entities.evaluationCriteria).toEqual([]);
      expect(entities.budget).toBeNull();
      expect(entities.timeline).toBeNull();
      expect(entities.urgency).toBeNull();
      expect(entities.contactMethod).toBeNull();
      expect(entities.visitorName).toBeNull();
      expect(entities.role).toBeNull();
      expect(entities.industry).toBeNull();
      expect(entities.company).toBeNull();
      expect(entities.teamSize).toBeNull();
      expect(entities.lastUpdated).toEqual(mockDate);
      expect(entities.totalExtractions).toBe(0);
      expect(entities.isEmpty()).toBe(true);
    });

    it('should create AccumulatedEntities with provided props', () => {
      const decisionMakers: EntityWithMetadata<string>[] = [{
        value: 'John Doe',
        extractedAt: mockDate,
        confidence: 0.9,
        sourceMessageId: 'msg-1'
      }];

      const entities = AccumulatedEntities.create({
        decisionMakers,
        totalExtractions: 1
      });

      expect(entities.decisionMakers).toEqual(decisionMakers);
      expect(entities.totalExtractions).toBe(1);
      expect(entities.isEmpty()).toBe(false);
    });

    it('should throw error for invalid confidence scores', () => {
      expect(() => {
        AccumulatedEntities.create({
          decisionMakers: [{
            value: 'John Doe',
            extractedAt: mockDate,
            confidence: 1.5, // Invalid confidence
            sourceMessageId: 'msg-1'
          }]
        });
      }).toThrow('Entity validation failed: Invalid confidence scores detected. All confidence scores must be between 0 and 1');
    });

    it('should throw error for negative total extractions', () => {
      expect(() => {
        AccumulatedEntities.create({
          totalExtractions: -1
        });
      }).toThrow('Total extractions cannot be negative');
    });
  });

  describe('additive entity strategy', () => {
    it('should add decision makers without duplicates', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withAdditiveEntity(
        'decisionMakers',
        ['John Doe', 'Jane Smith'],
        mockMessageId,
        0.8
      );

      expect(updated.decisionMakers).toHaveLength(2);
      expect(updated.decisionMakers[0].value).toBe('John Doe');
      expect(updated.decisionMakers[1].value).toBe('Jane Smith');
      expect(updated.decisionMakers[0].confidence).toBe(0.8);
      expect(updated.decisionMakers[0].sourceMessageId).toBe(mockMessageId);
      expect(updated.totalExtractions).toBe(2);
    });

    it('should deduplicate similar values', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withAdditiveEntity(
        'painPoints',
        ['Data Migration', 'data-migration', 'Data migration'],
        mockMessageId
      );

      expect(updated.painPoints).toHaveLength(1);
      expect(updated.painPoints[0].value).toBe('Data Migration');
    });

    it('should accumulate across multiple calls', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity(
        'integrationNeeds',
        ['Salesforce'],
        'msg-1'
      );
      
      entities = entities.withAdditiveEntity(
        'integrationNeeds',
        ['HubSpot', 'Slack'],
        'msg-2'
      );

      expect(entities.integrationNeeds).toHaveLength(3);
      expect(entities.integrationNeeds.map(e => e.value)).toEqual(['Salesforce', 'HubSpot', 'Slack']);
      expect(entities.totalExtractions).toBe(3);
    });

    it('should handle empty arrays gracefully', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withAdditiveEntity(
        'evaluationCriteria',
        [],
        mockMessageId
      );

      expect(updated.evaluationCriteria).toEqual([]);
      expect(updated.totalExtractions).toBe(0);
    });
  });

  describe('replaceable entity strategy', () => {
    it('should set initial replaceable entity', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withReplaceableEntity(
        'budget',
        '$50,000',
        mockMessageId,
        0.9
      );

      expect(updated.budget?.value).toBe('$50,000');
      expect(updated.budget?.confidence).toBe(0.9);
      expect(updated.budget?.sourceMessageId).toBe(mockMessageId);
      expect(updated.totalExtractions).toBe(1);
    });

    it('should replace existing entity with new value', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withReplaceableEntity('timeline', 'Q1 2024', 'msg-1');
      entities = entities.withReplaceableEntity('timeline', 'Q2 2024', 'msg-2');

      expect(entities.timeline?.value).toBe('Q2 2024');
      expect(entities.timeline?.sourceMessageId).toBe('msg-2');
      expect(entities.totalExtractions).toBe(2);
    });

    it('should handle all replaceable entity types', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withReplaceableEntity('budget', '$100K', 'msg-1');
      entities = entities.withReplaceableEntity('timeline', '6 months', 'msg-2');
      entities = entities.withReplaceableEntity('urgency', 'high', 'msg-3');
      entities = entities.withReplaceableEntity('contactMethod', 'email', 'msg-4');

      expect(entities.budget?.value).toBe('$100K');
      expect(entities.timeline?.value).toBe('6 months');
      expect(entities.urgency?.value).toBe('high');
      expect(entities.contactMethod?.value).toBe('email');
      expect(entities.totalExtractions).toBe(4);
    });
  });

  describe('confidence-based entity strategy', () => {
    it('should set initial confidence-based entity', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withConfidenceBasedEntity(
        'role',
        'CEO',
        mockMessageId,
        0.9
      );

      expect(updated.role?.value).toBe('CEO');
      expect(updated.role?.confidence).toBe(0.9);
      expect(updated.totalExtractions).toBe(1);
    });

    it('should keep higher confidence entity', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withConfidenceBasedEntity('company', 'ACME Corp', 'msg-1', 0.9);
      entities = entities.withConfidenceBasedEntity('company', 'ABC Inc', 'msg-2', 0.7);

      expect(entities.company?.value).toBe('ACME Corp');
      expect(entities.company?.confidence).toBe(0.9);
      expect(entities.totalExtractions).toBe(2);
    });

    it('should replace with higher confidence entity', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withConfidenceBasedEntity('industry', 'Technology', 'msg-1', 0.7);
      entities = entities.withConfidenceBasedEntity('industry', 'Healthcare', 'msg-2', 0.9);

      expect(entities.industry?.value).toBe('Healthcare');
      expect(entities.industry?.confidence).toBe(0.9);
    });

    it('should respect confidence threshold', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withConfidenceBasedEntity('teamSize', '50-100', 'msg-1', 0.6);
      entities = entities.withConfidenceBasedEntity('teamSize', '100-200', 'msg-2', 0.8, 0.7);

      expect(entities.teamSize?.value).toBe('100-200');
      expect(entities.teamSize?.confidence).toBe(0.8);
    });

    it('should keep existing if below threshold', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withConfidenceBasedEntity('role', 'Manager', 'msg-1', 0.8);
      entities = entities.withConfidenceBasedEntity('role', 'Director', 'msg-2', 0.9, 0.95);

      expect(entities.role?.value).toBe('Director');
      expect(entities.role?.confidence).toBe(0.9);
    });
  });

  describe('entity removal', () => {
    it('should remove entity from additive arrays', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity(
        'decisionMakers',
        ['John Doe', 'Jane Smith', 'Bob Wilson'],
        'msg-1'
      );
      
      entities = entities.withRemovedEntity(
        'decisionMakers',
        'Jane Smith',
        'msg-2'
      );

      expect(entities.decisionMakers).toHaveLength(2);
      expect(entities.decisionMakers.map(e => e.value)).toEqual(['John Doe', 'Bob Wilson']);
      expect(entities.totalExtractions).toBe(4); // 3 additions + 1 removal
    });

    it('should handle case-insensitive removal', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity('painPoints', ['Data Migration'], 'msg-1');
      entities = entities.withRemovedEntity('painPoints', 'data migration', 'msg-2');

      expect(entities.painPoints).toHaveLength(0);
    });

    it('should handle removal of non-existent entity gracefully', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity('integrationNeeds', ['Salesforce'], 'msg-1');
      entities = entities.withRemovedEntity('integrationNeeds', 'HubSpot', 'msg-2');

      expect(entities.integrationNeeds).toHaveLength(1);
      expect(entities.integrationNeeds[0].value).toBe('Salesforce');
    });
  });

  describe('entity correction', () => {
    it('should correct single-value entities', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withReplaceableEntity('budget', '$50K', 'msg-1');
      entities = entities.withCorrectedEntity('budget', '$100K', 'msg-2', 0.95);

      expect(entities.budget?.value).toBe('$100K');
      expect(entities.budget?.confidence).toBe(0.95);
      expect(entities.totalExtractions).toBe(2);
    });

    it('should handle all correctable entity types', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withCorrectedEntity('role', 'Senior Manager', 'msg-1');
      entities = entities.withCorrectedEntity('industry', 'FinTech', 'msg-2');
      entities = entities.withCorrectedEntity('company', 'TechCorp Inc', 'msg-3');
      entities = entities.withCorrectedEntity('teamSize', '200+', 'msg-4');

      expect(entities.role?.value).toBe('Senior Manager');
      expect(entities.industry?.value).toBe('FinTech');
      expect(entities.company?.value).toBe('TechCorp Inc');
      expect(entities.teamSize?.value).toBe('200+');
    });
  });

  describe('utility methods', () => {
    it('should generate correct entities summary', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity('decisionMakers', ['John Doe'], 'msg-1');
      entities = entities.withAdditiveEntity('painPoints', ['Slow reporting'], 'msg-2');
      entities = entities.withReplaceableEntity('budget', '$75K', 'msg-3');
      entities = entities.withConfidenceBasedEntity('role', 'CTO', 'msg-4');

      const summary = entities.getAllEntitiesSummary();

      expect(summary).toEqual({
        goals: [],
        decisionMakers: ['John Doe'],
        painPoints: ['Slow reporting'],
        integrationNeeds: [],
        evaluationCriteria: [],
        budget: '$75K',
        timeline: null,
        urgency: null,
        contactMethod: null,
        visitorName: null,
        role: 'CTO',
        industry: null,
        company: null,
        teamSize: null
      });
    });

    it('should count entities by category correctly', () => {
      let entities = AccumulatedEntities.create();
      
      entities = entities.withAdditiveEntity('decisionMakers', ['John', 'Jane'], 'msg-1');
      entities = entities.withAdditiveEntity('painPoints', ['Issue 1'], 'msg-2');
      entities = entities.withReplaceableEntity('budget', '$50K', 'msg-3');
      entities = entities.withReplaceableEntity('timeline', 'Q1', 'msg-4');
      entities = entities.withConfidenceBasedEntity('role', 'CEO', 'msg-5');

      const counts = entities.getEntityCountByCategory();

      expect(counts).toEqual({
        additive: 3, // 2 decision makers + 1 pain point
        replaceable: 2, // budget + timeline
        confidenceBased: 1 // role
      });
    });

    it('should correctly identify empty state', () => {
      const emptyEntities = AccumulatedEntities.create();
      expect(emptyEntities.isEmpty()).toBe(true);

      const withEntities = emptyEntities.withAdditiveEntity('decisionMakers', ['John'], 'msg-1');
      expect(withEntities.isEmpty()).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should not mutate original instance when adding entities', () => {
      const original = AccumulatedEntities.create();
      const originalExtractions = original.totalExtractions;
      
      const updated = original.withAdditiveEntity('decisionMakers', ['John Doe'], 'msg-1');
      
      expect(original.totalExtractions).toBe(originalExtractions);
      expect(original.decisionMakers).toHaveLength(0);
      expect(updated.totalExtractions).toBe(1);
      expect(updated.decisionMakers).toHaveLength(1);
    });

    it('should return new instance on all mutations', () => {
      const original = AccumulatedEntities.create();
      
      const updated1 = original.withAdditiveEntity('decisionMakers', ['John'], 'msg-1');
      const updated2 = updated1.withReplaceableEntity('budget', '$50K', 'msg-2');
      const updated3 = updated2.withConfidenceBasedEntity('role', 'CEO', 'msg-3');
      
      expect(updated1).not.toBe(original);
      expect(updated2).not.toBe(updated1);
      expect(updated3).not.toBe(updated2);
    });

    it('should protect against mutation of returned arrays', () => {
      let entities = AccumulatedEntities.create();
      entities = entities.withAdditiveEntity('decisionMakers', ['John Doe'], 'msg-1');
      
      const decisionMakers = entities.decisionMakers;
      decisionMakers.push({
        value: 'Hacker',
        extractedAt: new Date(),
        confidence: 1.0,
        sourceMessageId: 'hack'
      });
      
      // Original should be unchanged
      expect(entities.decisionMakers).toHaveLength(1);
      expect(entities.decisionMakers[0].value).toBe('John Doe');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in entity values', () => {
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withAdditiveEntity(
        'decisionMakers',
        ['John O\'Brien', 'María González', '李明'],
        'msg-1'
      );

      expect(updated.decisionMakers).toHaveLength(3);
      expect(updated.decisionMakers.map(e => e.value)).toEqual(['John O\'Brien', 'María González', '李明']);
    });

    it('should handle very long entity values', () => {
      const longValue = 'A'.repeat(1000);
      const entities = AccumulatedEntities.create();
      
      const updated = entities.withReplaceableEntity('budget', longValue, 'msg-1');
      
      expect(updated.budget?.value).toBe(longValue);
    });

    it('should handle extreme confidence values', () => {
      const entities = AccumulatedEntities.create();
      
      const updated1 = entities.withConfidenceBasedEntity('role', 'CEO', 'msg-1', 0.0);
      const updated2 = updated1.withConfidenceBasedEntity('industry', 'Tech', 'msg-2', 1.0);
      
      expect(updated2.role?.confidence).toBe(0.0);
      expect(updated2.industry?.confidence).toBe(1.0);
    });
  });
}); 