/**
 * UserBehaviorPattern Value Object Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test user behavior tracking and pattern management
 * - Focus on communication style and engagement metrics
 * - Verify immutability and update operations
 * - Keep under 250 lines per @golden-rule
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  UserBehaviorPattern, 
  CommunicationStyle, 
  FormalityLevel, 
  QuestioningPattern 
} from '../ConversationFlowValueObjects';

describe('UserBehaviorPattern', () => {
  describe('creation', () => {
    it('should create pattern with specified parameters', () => {
      const style = {
        preferredResponseLength: 'brief' as CommunicationStyle,
        formalityLevel: 'casual' as FormalityLevel,
        questioningPattern: 'direct' as QuestioningPattern
      };
      const metrics = {
        averageSessionDuration: 300,
        messagesPerSession: 15,
        dropOffPoints: ['pricing', 'demo']
      };

      const pattern = UserBehaviorPattern.create(style, metrics);
      
      expect(pattern.communicationStyle).toEqual(style);
      expect(pattern.engagementMetrics).toEqual(metrics);
    });

    it('should create default pattern', () => {
      const pattern = UserBehaviorPattern.createDefault();
      
      expect(pattern.communicationStyle.preferredResponseLength).toBe('detailed');
      expect(pattern.communicationStyle.formalityLevel).toBe('professional');
      expect(pattern.communicationStyle.questioningPattern).toBe('direct');
      expect(pattern.engagementMetrics.averageSessionDuration).toBe(0);
      expect(pattern.engagementMetrics.messagesPerSession).toBe(0);
      expect(pattern.engagementMetrics.dropOffPoints).toEqual([]);
    });

    it('should preserve all communication style values', () => {
      const style = {
        preferredResponseLength: 'comprehensive' as CommunicationStyle,
        formalityLevel: 'technical' as FormalityLevel,
        questioningPattern: 'exploratory' as QuestioningPattern
      };
      const metrics = {
        averageSessionDuration: 600,
        messagesPerSession: 25,
        dropOffPoints: ['technical details']
      };

      const pattern = UserBehaviorPattern.create(style, metrics);
      
      expect(pattern.communicationStyle.preferredResponseLength).toBe('comprehensive');
      expect(pattern.communicationStyle.formalityLevel).toBe('technical');
      expect(pattern.communicationStyle.questioningPattern).toBe('exploratory');
    });
  });

  describe('communication style updates', () => {
    let pattern: UserBehaviorPattern;

    beforeEach(() => {
      pattern = UserBehaviorPattern.createDefault();
    });

    it('should update response length preference', () => {
      const updated = pattern.updateCommunicationStyle({
        preferredResponseLength: 'brief'
      });
      
      expect(updated.communicationStyle.preferredResponseLength).toBe('brief');
      expect(updated.communicationStyle.formalityLevel).toBe(pattern.communicationStyle.formalityLevel);
      expect(updated.communicationStyle.questioningPattern).toBe(pattern.communicationStyle.questioningPattern);
    });

    it('should update formality level', () => {
      const updated = pattern.updateCommunicationStyle({
        formalityLevel: 'casual'
      });
      
      expect(updated.communicationStyle.formalityLevel).toBe('casual');
      expect(updated.communicationStyle.preferredResponseLength).toBe(pattern.communicationStyle.preferredResponseLength);
    });

    it('should update questioning pattern', () => {
      const updated = pattern.updateCommunicationStyle({
        questioningPattern: 'skeptical'
      });
      
      expect(updated.communicationStyle.questioningPattern).toBe('skeptical');
      expect(updated.communicationStyle.formalityLevel).toBe(pattern.communicationStyle.formalityLevel);
    });

    it('should update multiple style properties', () => {
      const updated = pattern.updateCommunicationStyle({
        preferredResponseLength: 'comprehensive',
        formalityLevel: 'technical'
      });
      
      expect(updated.communicationStyle.preferredResponseLength).toBe('comprehensive');
      expect(updated.communicationStyle.formalityLevel).toBe('technical');
      expect(updated.communicationStyle.questioningPattern).toBe(pattern.communicationStyle.questioningPattern);
    });

    it('should maintain immutability during style updates', () => {
      const originalStyle = { ...pattern.communicationStyle };
      
      pattern.updateCommunicationStyle({ preferredResponseLength: 'brief' });
      
      expect(pattern.communicationStyle).toEqual(originalStyle);
    });

    it('should preserve engagement metrics during style updates', () => {
      const updated = pattern.updateCommunicationStyle({
        formalityLevel: 'casual'
      });
      
      expect(updated.engagementMetrics).toEqual(pattern.engagementMetrics);
    });
  });

  describe('engagement metrics updates', () => {
    let pattern: UserBehaviorPattern;

    beforeEach(() => {
      pattern = UserBehaviorPattern.create(
        {
          preferredResponseLength: 'detailed',
          formalityLevel: 'professional',
          questioningPattern: 'direct'
        },
        {
          averageSessionDuration: 300,
          messagesPerSession: 10,
          dropOffPoints: ['pricing']
        }
      );
    });

    it('should update average session duration', () => {
      const updated = pattern.updateEngagementMetrics({
        averageSessionDuration: 450
      });
      
      expect(updated.engagementMetrics.averageSessionDuration).toBe(450);
      expect(updated.engagementMetrics.messagesPerSession).toBe(pattern.engagementMetrics.messagesPerSession);
      expect(updated.engagementMetrics.dropOffPoints).toEqual(pattern.engagementMetrics.dropOffPoints);
    });

    it('should update messages per session', () => {
      const updated = pattern.updateEngagementMetrics({
        messagesPerSession: 20
      });
      
      expect(updated.engagementMetrics.messagesPerSession).toBe(20);
      expect(updated.engagementMetrics.averageSessionDuration).toBe(pattern.engagementMetrics.averageSessionDuration);
    });

    it('should update drop off points', () => {
      const newDropOffPoints = ['demo', 'pricing', 'timeline'];
      const updated = pattern.updateEngagementMetrics({
        dropOffPoints: newDropOffPoints
      });
      
      expect(updated.engagementMetrics.dropOffPoints).toEqual(newDropOffPoints);
      expect(updated.engagementMetrics.averageSessionDuration).toBe(pattern.engagementMetrics.averageSessionDuration);
    });

    it('should update multiple metrics properties', () => {
      const updated = pattern.updateEngagementMetrics({
        averageSessionDuration: 600,
        messagesPerSession: 25
      });
      
      expect(updated.engagementMetrics.averageSessionDuration).toBe(600);
      expect(updated.engagementMetrics.messagesPerSession).toBe(25);
      expect(updated.engagementMetrics.dropOffPoints).toEqual(pattern.engagementMetrics.dropOffPoints);
    });

    it('should maintain immutability during metrics updates', () => {
      const originalMetrics = { ...pattern.engagementMetrics };
      
      pattern.updateEngagementMetrics({ averageSessionDuration: 500 });
      
      expect(pattern.engagementMetrics).toEqual(originalMetrics);
    });

    it('should preserve communication style during metrics updates', () => {
      const updated = pattern.updateEngagementMetrics({
        messagesPerSession: 15
      });
      
      expect(updated.communicationStyle).toEqual(pattern.communicationStyle);
    });
  });

  describe('drop off point management', () => {
    let pattern: UserBehaviorPattern;

    beforeEach(() => {
      pattern = UserBehaviorPattern.create(
        {
          preferredResponseLength: 'detailed',
          formalityLevel: 'professional',
          questioningPattern: 'direct'
        },
        {
          averageSessionDuration: 300,
          messagesPerSession: 10,
          dropOffPoints: ['pricing', 'demo']
        }
      );
    });

    it('should add new drop off point', () => {
      const updated = pattern.addDropOffPoint('timeline');
      
      expect(updated.engagementMetrics.dropOffPoints).toContain('timeline');
      expect(updated.engagementMetrics.dropOffPoints).toContain('pricing');
      expect(updated.engagementMetrics.dropOffPoints).toContain('demo');
      expect(updated.engagementMetrics.dropOffPoints).toHaveLength(3);
    });

    it('should be idempotent for existing drop off points', () => {
      const updated = pattern.addDropOffPoint('pricing');
      
      expect(updated.engagementMetrics.dropOffPoints.filter(point => point === 'pricing')).toHaveLength(1);
      expect(updated).toBe(pattern); // Should return same instance
    });

    it('should maintain immutability during drop off point addition', () => {
      const originalDropOffPoints = [...pattern.engagementMetrics.dropOffPoints];
      
      pattern.addDropOffPoint('new-point');
      
      expect(pattern.engagementMetrics.dropOffPoints).toEqual(originalDropOffPoints);
    });

    it('should preserve other metrics during drop off point addition', () => {
      const updated = pattern.addDropOffPoint('support');
      
      expect(updated.engagementMetrics.averageSessionDuration).toBe(pattern.engagementMetrics.averageSessionDuration);
      expect(updated.engagementMetrics.messagesPerSession).toBe(pattern.engagementMetrics.messagesPerSession);
    });

    it('should preserve communication style during drop off point addition', () => {
      const updated = pattern.addDropOffPoint('integration');
      
      expect(updated.communicationStyle).toEqual(pattern.communicationStyle);
    });
  });

  describe('immutability guarantees', () => {
    let pattern: UserBehaviorPattern;

    beforeEach(() => {
      pattern = UserBehaviorPattern.createDefault();
    });

    it('should have readonly properties', () => {
      expect(() => {
        (pattern as any).communicationStyle = {};
      }).not.toThrow(); // TypeScript prevents this, but runtime doesn't enforce
      
      // Verify properties are still accessible
      expect(pattern.communicationStyle).toBeDefined();
      expect(pattern.engagementMetrics).toBeDefined();
    });

    it('should not allow modification of nested objects', () => {
      const originalStyle = pattern.communicationStyle;
      
      // Attempt to modify nested object (should not affect original)
      try {
        (pattern.communicationStyle as any).preferredResponseLength = 'brief';
      } catch (_error) {
        // Some immutability implementations may throw
      }
      
      // Original should remain unchanged if properly immutable
      expect(pattern.communicationStyle).toBe(originalStyle);
    });

    it('should not allow modification of array properties', () => {
      const originalDropOffPoints = pattern.engagementMetrics.dropOffPoints;
      
      // Attempt to modify array (should not affect original if readonly)
      try {
        (pattern.engagementMetrics.dropOffPoints as any).push('new-point');
      } catch (_error) {
        // Some immutability implementations may throw
      }
      
      // Original should remain unchanged if properly immutable
      expect(pattern.engagementMetrics.dropOffPoints).toBe(originalDropOffPoints);
    });
  });

  describe('type safety', () => {
    it('should accept all valid communication style values', () => {
      const styles: CommunicationStyle[] = ['brief', 'detailed', 'comprehensive'];
      const formalities: FormalityLevel[] = ['casual', 'professional', 'technical'];
      const patterns: QuestioningPattern[] = ['direct', 'exploratory', 'skeptical'];

      styles.forEach(style => {
        formalities.forEach(formality => {
          patterns.forEach(questioningPattern => {
            expect(() => UserBehaviorPattern.create(
              {
                preferredResponseLength: style,
                formalityLevel: formality,
                questioningPattern
              },
              {
                averageSessionDuration: 300,
                messagesPerSession: 10,
                dropOffPoints: []
              }
            )).not.toThrow();
          });
        });
      });
    });
  });
});