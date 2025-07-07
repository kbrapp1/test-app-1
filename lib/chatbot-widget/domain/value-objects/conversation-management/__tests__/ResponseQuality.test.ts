/**
 * ResponseQuality Value Object Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test quality metrics and score calculations
 * - Focus on validation and business rule enforcement
 * - Verify immutability and boundary conditions
 * - Keep under 250 lines per @golden-rule
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseQuality, EngagementLevel, ResponseType } from '../ConversationFlowValueObjects';
import { ConversationFlowViolationError } from '../../../errors/ChatbotWidgetDomainErrors';

describe('ResponseQuality', () => {
  describe('creation', () => {
    it('should create quality with valid parameters', () => {
      const quality = ResponseQuality.create(0.8, 'high', true, 0, 0.1, 'informational');
      
      expect(quality.coherenceScore).toBe(0.8);
      expect(quality.userEngagement).toBe('high');
      expect(quality.lastResponseEffective).toBe(true);
      expect(quality.misunderstandingCount).toBe(0);
      expect(quality.topicDrift).toBe(0.1);
      expect(quality.lastResponseType).toBe('informational');
    });

    it('should create default quality instance', () => {
      const quality = ResponseQuality.createDefault();
      
      expect(quality.coherenceScore).toBe(0.8);
      expect(quality.userEngagement).toBe('medium');
      expect(quality.lastResponseEffective).toBe(true);
      expect(quality.misunderstandingCount).toBe(0);
      expect(quality.topicDrift).toBe(0.0);
      expect(quality.lastResponseType).toBe('informational');
    });

    it('should validate coherence score range', () => {
      expect(() => ResponseQuality.create(-0.1, 'medium', true, 0, 0, 'informational'))
        .toThrow(ConversationFlowViolationError);
      expect(() => ResponseQuality.create(1.1, 'medium', true, 0, 0, 'informational'))
        .toThrow(ConversationFlowViolationError);
    });

    it('should validate topic drift range', () => {
      expect(() => ResponseQuality.create(0.8, 'medium', true, 0, -0.1, 'informational'))
        .toThrow(ConversationFlowViolationError);
      expect(() => ResponseQuality.create(0.8, 'medium', true, 0, 1.1, 'informational'))
        .toThrow(ConversationFlowViolationError);
    });

    it('should validate misunderstanding count', () => {
      expect(() => ResponseQuality.create(0.8, 'medium', true, -1, 0, 'informational'))
        .toThrow(ConversationFlowViolationError);
      expect(() => ResponseQuality.create(0.8, 'medium', true, 2.5, 0, 'informational'))
        .toThrow(ConversationFlowViolationError);
    });

    it('should include context in validation errors', () => {
      try {
        ResponseQuality.create(1.5, 'medium', true, 0, 0, 'informational');
      } catch (error) {
        expect(error).toBeInstanceOf(ConversationFlowViolationError);
        if (error instanceof ConversationFlowViolationError) {
          expect(error.context).toHaveProperty('providedScore');
          expect(error.context.providedScore).toBe(1.5);
        }
      }
    });
  });

  describe('coherence updates', () => {
    let quality: ResponseQuality;

    beforeEach(() => {
      quality = ResponseQuality.createDefault();
    });

    it('should update coherence score', () => {
      const updated = quality.updateCoherence(0.9);
      
      expect(updated.coherenceScore).toBe(0.9);
      expect(updated.userEngagement).toBe(quality.userEngagement);
      expect(updated.lastResponseEffective).toBe(quality.lastResponseEffective);
    });

    it('should validate coherence score during update', () => {
      expect(() => quality.updateCoherence(-0.1)).toThrow(ConversationFlowViolationError);
      expect(() => quality.updateCoherence(1.1)).toThrow(ConversationFlowViolationError);
    });

    it('should maintain immutability during coherence update', () => {
      const originalScore = quality.coherenceScore;
      
      quality.updateCoherence(0.5);
      
      expect(quality.coherenceScore).toBe(originalScore);
    });

    it('should accept boundary values for coherence', () => {
      expect(() => quality.updateCoherence(0)).not.toThrow();
      expect(() => quality.updateCoherence(1)).not.toThrow();
    });
  });

  describe('misunderstanding tracking', () => {
    let quality: ResponseQuality;

    beforeEach(() => {
      quality = ResponseQuality.create(0.8, 'high', true, 0, 0, 'question');
    });

    it('should record misunderstanding correctly', () => {
      const updated = quality.recordMisunderstanding();
      
      expect(updated.misunderstandingCount).toBe(1);
      expect(updated.lastResponseEffective).toBe(false);
      expect(updated.coherenceScore).toBe(quality.coherenceScore);
    });

    it('should increment misunderstanding count on multiple recordings', () => {
      const first = quality.recordMisunderstanding();
      const second = first.recordMisunderstanding();
      
      expect(second.misunderstandingCount).toBe(2);
    });

    it('should maintain immutability during misunderstanding recording', () => {
      const originalCount = quality.misunderstandingCount;
      const originalEffective = quality.lastResponseEffective;
      
      quality.recordMisunderstanding();
      
      expect(quality.misunderstandingCount).toBe(originalCount);
      expect(quality.lastResponseEffective).toBe(originalEffective);
    });
  });

  describe('engagement updates', () => {
    let quality: ResponseQuality;

    beforeEach(() => {
      quality = ResponseQuality.createDefault();
    });

    const engagementLevels: EngagementLevel[] = ['low', 'medium', 'high'];

    engagementLevels.forEach(level => {
      it(`should update engagement to ${level}`, () => {
        const updated = quality.updateEngagement(level);
        
        expect(updated.userEngagement).toBe(level);
        expect(updated.coherenceScore).toBe(quality.coherenceScore);
      });
    });

    it('should maintain immutability during engagement update', () => {
      const originalEngagement = quality.userEngagement;
      
      quality.updateEngagement('low');
      
      expect(quality.userEngagement).toBe(originalEngagement);
    });
  });

  describe('topic drift updates', () => {
    let quality: ResponseQuality;

    beforeEach(() => {
      quality = ResponseQuality.createDefault();
    });

    it('should update topic drift', () => {
      const updated = quality.updateTopicDrift(0.3);
      
      expect(updated.topicDrift).toBe(0.3);
      expect(updated.coherenceScore).toBe(quality.coherenceScore);
    });

    it('should validate topic drift during update', () => {
      expect(() => quality.updateTopicDrift(-0.1)).toThrow(ConversationFlowViolationError);
      expect(() => quality.updateTopicDrift(1.1)).toThrow(ConversationFlowViolationError);
    });

    it('should accept boundary values for topic drift', () => {
      expect(() => quality.updateTopicDrift(0)).not.toThrow();
      expect(() => quality.updateTopicDrift(1)).not.toThrow();
    });
  });

  describe('response type updates', () => {
    let quality: ResponseQuality;

    beforeEach(() => {
      quality = ResponseQuality.createDefault();
    });

    const responseTypes: ResponseType[] = ['informational', 'question', 'action_request', 'clarification'];

    responseTypes.forEach(type => {
      it(`should update response type to ${type}`, () => {
        const updated = quality.updateResponseType(type, true);
        
        expect(updated.lastResponseType).toBe(type);
        expect(updated.lastResponseEffective).toBe(true);
      });
    });

    it('should update effectiveness with response type', () => {
      const updated = quality.updateResponseType('clarification', false);
      
      expect(updated.lastResponseType).toBe('clarification');
      expect(updated.lastResponseEffective).toBe(false);
    });

    it('should maintain immutability during response type update', () => {
      const originalType = quality.lastResponseType;
      const originalEffective = quality.lastResponseEffective;
      
      quality.updateResponseType('action_request', false);
      
      expect(quality.lastResponseType).toBe(originalType);
      expect(quality.lastResponseEffective).toBe(originalEffective);
    });
  });

  describe('overall quality score calculation', () => {
    it('should calculate score for high engagement and effectiveness', () => {
      const quality = ResponseQuality.create(0.9, 'high', true, 0, 0.1, 'informational');
      const score = quality.getOverallQualityScore();
      
      // (0.9 * 0.3) + (1.0 * 0.3) + (1.0 * 0.2) + (0.9 * 0.2) - 0 = 0.95
      expect(score).toBeCloseTo(0.95, 2);
    });

    it('should calculate score for medium engagement', () => {
      const quality = ResponseQuality.create(0.8, 'medium', true, 0, 0, 'question');
      const score = quality.getOverallQualityScore();
      
      // (0.8 * 0.3) + (0.6 * 0.3) + (1.0 * 0.2) + (1.0 * 0.2) - 0 = 0.82
      expect(score).toBeCloseTo(0.82, 2);
    });

    it('should calculate score for low engagement', () => {
      const quality = ResponseQuality.create(0.7, 'low', false, 2, 0.2, 'clarification');
      const score = quality.getOverallQualityScore();
      
      // (0.7 * 0.3) + (0.3 * 0.3) + (0.0 * 0.2) + (0.8 * 0.2) - 0.2 = 0.26
      expect(score).toBeCloseTo(0.26, 2);
    });

    it('should apply misunderstanding penalty correctly', () => {
      const quality = ResponseQuality.create(1.0, 'high', true, 3, 0, 'informational');
      const score = quality.getOverallQualityScore();
      
      // Should apply penalty of min(3 * 0.1, 0.5) = 0.3
      expect(score).toBeLessThan(1.0);
    });

    it('should cap misunderstanding penalty at 0.5', () => {
      const quality1 = ResponseQuality.create(1.0, 'high', true, 5, 0, 'informational');
      const quality2 = ResponseQuality.create(1.0, 'high', true, 10, 0, 'informational');
      
      // Both should have same penalty (0.5 max)
      expect(quality1.getOverallQualityScore()).toBe(quality2.getOverallQualityScore());
    });

    it('should never return negative scores', () => {
      const quality = ResponseQuality.create(0, 'low', false, 10, 1, 'clarification');
      const score = quality.getOverallQualityScore();
      
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle perfect score scenario', () => {
      const quality = ResponseQuality.create(1.0, 'high', true, 0, 0, 'informational');
      const score = quality.getOverallQualityScore();
      
      expect(score).toBe(1.0);
    });
  });
});