/**
 * Entity Corrections Value Object Tests
 * 
 * AI INSTRUCTIONS:
 * - Test all business rules and invariants
 * - Cover both positive and negative scenarios
 * - Validate immutability and proper state transitions
 * - Follow @golden-rule testing patterns exactly
 * - Test error conditions with domain-specific errors
 * - Ensure 100% test coverage for business logic
 */

import { EntityCorrections, EntityCorrectionsProps, RemovalOperation, CorrectionOperation } from '../EntityCorrections';
import { BusinessRuleViolationError } from '../../../errors/BusinessRuleViolationError';

describe('EntityCorrections', () => {
  const mockSessionId = 'session-123';
  const mockMessageId = 'msg-456';

  describe('create', () => {
    it('should create empty corrections with valid session ID', () => {
      const corrections = EntityCorrections.create(mockSessionId);
      
      expect(corrections.correctionSessionId).toBe(mockSessionId);
      expect(corrections.totalCorrections).toBe(0);
      expect(corrections.isEmpty()).toBe(true);
      expect(corrections.hasRemovals()).toBe(false);
      expect(corrections.hasCorrections()).toBe(false);
      expect(corrections.lastCorrectionAt).toBeInstanceOf(Date);
    });

    it('should create corrections with initial data', () => {
      const initialProps = {
        removedDecisionMakers: [{
          entityValue: 'John Doe',
          metadata: {
            timestamp: new Date(),
            sourceMessageId: 'msg-1',
            confidence: 0.9,
    
          }
        }]
      };

      const corrections = EntityCorrections.create(mockSessionId, initialProps);
      
      expect(corrections.totalCorrections).toBe(1);
      expect(corrections.removedDecisionMakers).toHaveLength(1);
      expect(corrections.removedDecisionMakers[0].entityValue).toBe('John Doe');
    });

    it('should throw error for invalid session ID', () => {
      expect(() => EntityCorrections.create('')).toThrow(BusinessRuleViolationError);
      expect(() => EntityCorrections.create('   ')).toThrow(BusinessRuleViolationError);
    });
  });

  describe('withRemovedEntity', () => {
    let corrections: EntityCorrections;

    beforeEach(() => {
      corrections = EntityCorrections.create(mockSessionId);
    });

    it('should remove decision maker entity', () => {
      const result = corrections.withRemovedEntity(
        'decisionMakers',
        'Jane Smith',
        mockMessageId,
        0.95,
        'User explicitly stated Jane is not a decision maker'
      );

      expect(result.removedDecisionMakers).toHaveLength(1);
      expect(result.removedDecisionMakers[0].entityValue).toBe('Jane Smith');
      expect(result.removedDecisionMakers[0].metadata.confidence).toBe(0.95);
      expect(result.removedDecisionMakers[0].metadata.correctionReason).toBe('User explicitly stated Jane is not a decision maker');
      expect(result.totalCorrections).toBe(1);
      expect(result.hasRemovals()).toBe(true);
    });

    it('should remove pain point entity', () => {
      const result = corrections.withRemovedEntity(
        'painPoints',
        'Legacy system integration',
        mockMessageId
      );

      expect(result.removedPainPoints).toHaveLength(1);
      expect(result.removedPainPoints[0].entityValue).toBe('Legacy system integration');
      expect(result.totalCorrections).toBe(1);
    });

    it('should accumulate multiple removals of same type', () => {
      const result = corrections
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId)
        .withRemovedEntity('decisionMakers', 'Jane Smith', 'msg-2');

      expect(result.removedDecisionMakers).toHaveLength(2);
      expect(result.totalCorrections).toBe(2);
    });

    it('should maintain immutability', () => {
      const result = corrections.withRemovedEntity('decisionMakers', 'John Doe', mockMessageId);
      
      expect(corrections.removedDecisionMakers).toHaveLength(0);
      expect(corrections.totalCorrections).toBe(0);
      expect(result.removedDecisionMakers).toHaveLength(1);
    });

    it('should trim entity values', () => {
      const result = corrections.withRemovedEntity('decisionMakers', '  John Doe  ', mockMessageId);
      
      expect(result.removedDecisionMakers[0].entityValue).toBe('John Doe');
    });

    it('should throw error for empty entity value', () => {
      expect(() => corrections.withRemovedEntity('decisionMakers', '', mockMessageId))
        .toThrow(BusinessRuleViolationError);
      expect(() => corrections.withRemovedEntity('decisionMakers', '   ', mockMessageId))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw error for empty message ID', () => {
      expect(() => corrections.withRemovedEntity('decisionMakers', 'John Doe', ''))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw error for invalid confidence', () => {
      expect(() => corrections.withRemovedEntity('decisionMakers', 'John Doe', mockMessageId, -0.1))
        .toThrow(BusinessRuleViolationError);
      expect(() => corrections.withRemovedEntity('decisionMakers', 'John Doe', mockMessageId, 1.1))
        .toThrow(BusinessRuleViolationError);
    });
  });

  describe('withCorrectedEntity', () => {
    let corrections: EntityCorrections;

    beforeEach(() => {
      corrections = EntityCorrections.create(mockSessionId);
    });

    it('should correct budget entity', () => {
      const result = corrections.withCorrectedEntity(
        'budget',
        '$200K',
        mockMessageId,
        '$100K',
        0.95,
        'User corrected the budget amount'
      );

      expect(result.correctedBudget).not.toBeNull();
      expect(result.correctedBudget!.newValue).toBe('$200K');
      expect(result.correctedBudget!.previousValue).toBe('$100K');
      expect(result.correctedBudget!.metadata.confidence).toBe(0.95);
      expect(result.correctedBudget!.metadata.correctionReason).toBe('User corrected the budget amount');
      expect(result.totalCorrections).toBe(1);
      expect(result.hasCorrections()).toBe(true);
    });

    it('should correct urgency with enum value', () => {
      const result = corrections.withCorrectedEntity(
        'urgency',
        'high',
        mockMessageId,
        'medium'
      );

      expect(result.correctedUrgency).not.toBeNull();
      expect(result.correctedUrgency!.newValue).toBe('high');
      expect(result.correctedUrgency!.previousValue).toBe('medium');
    });

    it('should correct contact method with enum value', () => {
      const result = corrections.withCorrectedEntity(
        'contactMethod',
        'email',
        mockMessageId,
        'phone'
      );

      expect(result.correctedContactMethod).not.toBeNull();
      expect(result.correctedContactMethod!.newValue).toBe('email');
    });

    it('should correct role entity', () => {
      const result = corrections.withCorrectedEntity(
        'role',
        'Director',
        mockMessageId,
        'Manager'
      );

      expect(result.correctedRole).not.toBeNull();
      expect(result.correctedRole!.newValue).toBe('Director');
      expect(result.correctedRole!.previousValue).toBe('Manager');
    });

    it('should replace existing correction', () => {
      const result = corrections
        .withCorrectedEntity('budget', '$100K', mockMessageId)
        .withCorrectedEntity('budget', '$200K', 'msg-2');

      expect(result.correctedBudget!.newValue).toBe('$200K');
      expect(result.totalCorrections).toBe(2);
    });

    it('should maintain immutability', () => {
      const result = corrections.withCorrectedEntity('budget', '$100K', mockMessageId);
      
      expect(corrections.correctedBudget).toBeNull();
      expect(corrections.totalCorrections).toBe(0);
      expect(result.correctedBudget).not.toBeNull();
    });

    it('should throw error for empty new value', () => {
      expect(() => corrections.withCorrectedEntity('budget', '', mockMessageId))
        .toThrow(BusinessRuleViolationError);
      expect(() => corrections.withCorrectedEntity('role', '   ', mockMessageId))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw error for empty message ID', () => {
      expect(() => corrections.withCorrectedEntity('budget', '$100K', ''))
        .toThrow(BusinessRuleViolationError);
    });

    it('should throw error for invalid confidence', () => {
      expect(() => corrections.withCorrectedEntity('budget', '$100K', mockMessageId, '$50K', -0.1))
        .toThrow(BusinessRuleViolationError);
      expect(() => corrections.withCorrectedEntity('budget', '$100K', mockMessageId, '$50K', 1.1))
        .toThrow(BusinessRuleViolationError);
    });
  });

  describe('query methods', () => {
    it('should identify when corrections are empty', () => {
      const corrections = EntityCorrections.create(mockSessionId);
      
      expect(corrections.isEmpty()).toBe(true);
      expect(corrections.hasRemovals()).toBe(false);
      expect(corrections.hasCorrections()).toBe(false);
    });

    it('should identify when has removals', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId);
      
      expect(corrections.isEmpty()).toBe(false);
      expect(corrections.hasRemovals()).toBe(true);
      expect(corrections.hasCorrections()).toBe(false);
    });

    it('should identify when has corrections', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withCorrectedEntity('budget', '$100K', mockMessageId);
      
      expect(corrections.isEmpty()).toBe(false);
      expect(corrections.hasRemovals()).toBe(false);
      expect(corrections.hasCorrections()).toBe(true);
    });

    it('should identify when has both removals and corrections', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId)
        .withCorrectedEntity('budget', '$100K', 'msg-2');
      
      expect(corrections.isEmpty()).toBe(false);
      expect(corrections.hasRemovals()).toBe(true);
      expect(corrections.hasCorrections()).toBe(true);
    });
  });

  describe('getCorrectionSummary', () => {
    it('should provide empty summary for empty corrections', () => {
      const corrections = EntityCorrections.create(mockSessionId);
      
      expect(corrections.getCorrectionSummary()).toEqual([]);
    });

    it('should summarize removals', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId)
        .withRemovedEntity('decisionMakers', 'Jane Smith', 'msg-2')
        .withRemovedEntity('painPoints', 'Legacy system', 'msg-3');
      
      const summary = corrections.getCorrectionSummary();
      
      expect(summary).toContain('2 decision maker(s) removed');
      expect(summary).toContain('1 pain point(s) removed');
    });

    it('should summarize corrections', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withCorrectedEntity('budget', '$200K', mockMessageId)
        .withCorrectedEntity('role', 'Director', 'msg-2');
      
      const summary = corrections.getCorrectionSummary();
      
      expect(summary).toContain('Budget corrected to $200K');
      expect(summary).toContain('Role corrected to Director');
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId)
        .withCorrectedEntity('budget', '$100K', 'msg-2');
      
      const plainObject = original.toPlainObject();
      const deserialized = EntityCorrections.fromPlainObject(plainObject);
      
      expect(deserialized.correctionSessionId).toBe(original.correctionSessionId);
      expect(deserialized.totalCorrections).toBe(original.totalCorrections);
      expect(deserialized.removedDecisionMakers).toEqual(original.removedDecisionMakers);
      expect(deserialized.correctedBudget).toEqual(original.correctedBudget);
    });

    it('should maintain date objects after serialization', () => {
      const original = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John Doe', mockMessageId);
      
      const plainObject = original.toPlainObject();
      const deserialized = EntityCorrections.fromPlainObject(plainObject);
      
      expect(deserialized.lastCorrectionAt).toBeInstanceOf(Date);
      expect(deserialized.removedDecisionMakers[0].metadata.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('invariant validation', () => {
    it('should validate session ID invariants', () => {
      const invalidProps: EntityCorrectionsProps = {
        removedDecisionMakers: [],
        removedPainPoints: [],
        removedIntegrationNeeds: [],
        removedEvaluationCriteria: [],
        correctedBudget: null,
        correctedTimeline: null,
        correctedUrgency: null,
        correctedContactMethod: null,
        correctedRole: null,
        correctedIndustry: null,
        correctedCompany: null,
        correctedTeamSize: null,
        totalCorrections: 0,
        lastCorrectionAt: new Date(),
        correctionSessionId: ''
      };

      expect(() => EntityCorrections.fromPlainObject(invalidProps))
        .toThrow(BusinessRuleViolationError);
    });

    it('should validate total corrections invariants', () => {
      const invalidProps: EntityCorrectionsProps = {
        removedDecisionMakers: [],
        removedPainPoints: [],
        removedIntegrationNeeds: [],
        removedEvaluationCriteria: [],
        correctedBudget: null,
        correctedTimeline: null,
        correctedUrgency: null,
        correctedContactMethod: null,
        correctedRole: null,
        correctedIndustry: null,
        correctedCompany: null,
        correctedTeamSize: null,
        totalCorrections: -1,
        lastCorrectionAt: new Date(),
        correctionSessionId: mockSessionId
      };

      expect(() => EntityCorrections.fromPlainObject(invalidProps))
        .toThrow(BusinessRuleViolationError);
    });
  });

  describe('edge cases', () => {
    it('should handle all entity types for removals', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withRemovedEntity('decisionMakers', 'John', mockMessageId)
        .withRemovedEntity('painPoints', 'Issue', 'msg-2')
        .withRemovedEntity('integrationNeeds', 'CRM', 'msg-3')
        .withRemovedEntity('evaluationCriteria', 'Price', 'msg-4');

      expect(corrections.totalCorrections).toBe(4);
      expect(corrections.removedDecisionMakers).toHaveLength(1);
      expect(corrections.removedPainPoints).toHaveLength(1);
      expect(corrections.removedIntegrationNeeds).toHaveLength(1);
      expect(corrections.removedEvaluationCriteria).toHaveLength(1);
    });

    it('should handle all entity types for corrections', () => {
      const corrections = EntityCorrections.create(mockSessionId)
        .withCorrectedEntity('budget', '$100K', mockMessageId)
        .withCorrectedEntity('timeline', '6 months', 'msg-2')
        .withCorrectedEntity('urgency', 'high', 'msg-3')
        .withCorrectedEntity('contactMethod', 'email', 'msg-4')
        .withCorrectedEntity('role', 'Manager', 'msg-5')
        .withCorrectedEntity('industry', 'Tech', 'msg-6')
        .withCorrectedEntity('company', 'ACME Corp', 'msg-7')
        .withCorrectedEntity('teamSize', '50-100', 'msg-8');

      expect(corrections.totalCorrections).toBe(8);
      expect(corrections.correctedBudget).not.toBeNull();
      expect(corrections.correctedTimeline).not.toBeNull();
      expect(corrections.correctedUrgency).not.toBeNull();
      expect(corrections.correctedContactMethod).not.toBeNull();
      expect(corrections.correctedRole).not.toBeNull();
      expect(corrections.correctedIndustry).not.toBeNull();
      expect(corrections.correctedCompany).not.toBeNull();
      expect(corrections.correctedTeamSize).not.toBeNull();
    });
  });
}); 