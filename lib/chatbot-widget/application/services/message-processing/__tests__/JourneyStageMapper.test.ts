/**
 * Journey Stage Mapper Tests
 * 
 * AI INSTRUCTIONS:
 * - Test the refactored JourneyStageMapper component
 * - Verify mapping logic for lead scores to journey stages
 * - Ensure all business rules are preserved after refactoring
 */

import { describe, it, expect } from 'vitest';
import { JourneyStageMapper } from '../JourneyStageMapper';
import { EnhancedContext } from '../WorkflowTypes';

describe('JourneyStageMapper', () => {
  describe('buildJourneyState', () => {
    it('should map lead score 85 to qualified-ready stage', () => {
      const enhancedContext: EnhancedContext = {
        leadScore: {
          totalScore: 85
        }
      };

      const result = JourneyStageMapper.buildJourneyState(enhancedContext);

      expect(result).toEqual({
        currentStage: 'qualified-ready',
        completedStages: ['initial', 'engaged', 'interested', 'qualified'],
        nextRecommendedStage: undefined,
        progressPercentage: 85
      });
    });

    it('should map lead score 60 to interested stage', () => {
      const enhancedContext: EnhancedContext = {
        leadScore: {
          totalScore: 60
        }
      };

      const result = JourneyStageMapper.buildJourneyState(enhancedContext);

      expect(result).toEqual({
        currentStage: 'interested',
        completedStages: ['initial', 'engaged'],
        nextRecommendedStage: 'qualified',
        progressPercentage: 60
      });
    });

    it('should map lead score 25 to initial stage', () => {
      const enhancedContext: EnhancedContext = {
        leadScore: {
          totalScore: 25
        }
      };

      const result = JourneyStageMapper.buildJourneyState(enhancedContext);

      expect(result).toEqual({
        currentStage: 'initial',
        completedStages: [],
        nextRecommendedStage: 'engaged',
        progressPercentage: 25
      });
    });

    it('should return undefined when no lead score available', () => {
      const enhancedContext: EnhancedContext = {};

      const result = JourneyStageMapper.buildJourneyState(enhancedContext);

      expect(result).toBeUndefined();
    });
  });

  describe('buildIntentAnalysis', () => {
    it('should build intent analysis from unified analysis', () => {
      const enhancedContext: EnhancedContext = {
        unifiedAnalysis: {
          primaryIntent: 'pricing-inquiry',
          primaryConfidence: 0.85,
          entities: {
            product: 'enterprise',
            budget: '50000'
          }
        }
      };

      const result = JourneyStageMapper.buildIntentAnalysis(enhancedContext);

      expect(result).toEqual({
        primaryIntent: 'pricing-inquiry',
        confidence: 0.85,
        entities: [
          { name: 'product', value: 'enterprise', confidence: 1.0 },
          { name: 'budget', value: '50000', confidence: 1.0 }
        ],
        followUpIntents: []
      });
    });

    it('should handle missing unified analysis', () => {
      const enhancedContext: EnhancedContext = {};

      const result = JourneyStageMapper.buildIntentAnalysis(enhancedContext);

      expect(result).toBeUndefined();
    });
  });
});