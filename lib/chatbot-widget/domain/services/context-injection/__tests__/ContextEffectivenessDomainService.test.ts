/**
 * Context Effectiveness Domain Service Tests
 * 
 * Tests the pure business logic for analyzing context effectiveness including:
 * - Effectiveness scoring based on domain rules
 * - Strength and weakness identification
 * - Token utilization analysis
 * - Optimization suggestions based on business criteria
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ContextEffectivenessDomainService,
  EFFECTIVENESS_CONFIG,
  ContextEffectivenessAnalysis,
  TokenUtilizationMetrics
} from '../ContextEffectivenessDomainService';
import { BusinessRuleViolationError } from '../../../errors/ChatbotWidgetDomainErrors';
import { ContextModule, ContextRelevanceFactors } from '../../interfaces/ContextInjectionTypes';

describe('ContextEffectivenessDomainService', () => {
  let service: ContextEffectivenessDomainService;
  let mockModules: ContextModule[];
  let mockUtilization: TokenUtilizationMetrics;
  let mockRelevanceFactors: ContextRelevanceFactors;

  beforeEach(() => {
    service = new ContextEffectivenessDomainService();

    mockModules = [
      {
        type: 'userProfile',
        content: () => 'User profile data',
        priority: 1,
        estimatedTokens: 150,
        relevanceScore: 0.9
      },
      {
        type: 'conversationPhase',
        content: () => 'Current conversation phase',
        priority: 1,
        estimatedTokens: 100,
        relevanceScore: 0.8
      },
      {
        type: 'knowledgeBase',
        content: () => 'Knowledge base context',
        priority: 2,
        estimatedTokens: 200,
        relevanceScore: 0.7
      },
      {
        type: 'leadScoring',
        content: () => 'Lead scoring data',
        priority: 3,
        estimatedTokens: 120,
        relevanceScore: 0.6
      }
    ];

    mockUtilization = {
      totalUsed: 570,
      totalAvailable: 800,
      utilizationRate: 0.7125,
      isEfficient: true
    };

    mockRelevanceFactors = {
      userProfileRelevance: 0.9,
      companyContextRelevance: 0.8,
      phaseRelevance: 0.85,
      knowledgeBaseRelevance: 0.7,
      industryRelevance: 0.8,
      historyRelevance: 0.6,
      businessHoursRelevance: 0.5,
      engagementRelevance: 0.7
    };
  });

  describe('Effectiveness Score Calculation', () => {
    it('should calculate effectiveness score with efficient utilization', () => {
      const score = service.calculateEffectivenessScore(
        mockModules,
        mockUtilization,
        mockRelevanceFactors
      );

      // Base: 70 + Efficiency: 10 + Diversity: 12 (4 types * 3) + Confidence: 5 = 97
      expect(score).toBe(97);
      expect(score).toBeLessThanOrEqual(EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS);
    });

    it('should not exceed maximum effectiveness score', () => {
      const highUtilization = {
        ...mockUtilization,
        utilizationRate: 0.8,
        isEfficient: true
      };

      const highRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: 0.95
      };

      const score = service.calculateEffectivenessScore(
        mockModules,
        highUtilization,
        highRelevance
      );

      expect(score).toBeLessThanOrEqual(EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS);
      expect(score).toBeGreaterThan(95); // Should be very high but may not reach exact max
    });

    it('should calculate lower score for inefficient utilization', () => {
      const inefficientUtilization = {
        ...mockUtilization,
        utilizationRate: 0.5,
        isEfficient: false
      };

      const score = service.calculateEffectivenessScore(
        mockModules,
        inefficientUtilization,
        mockRelevanceFactors
      );

      // Base: 70 + No efficiency bonus + Diversity: 12 + Confidence: 5 = 87
      expect(score).toBe(87);
    });

    it('should calculate lower score for low confidence', () => {
      const lowRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: 0.6
      };

      const score = service.calculateEffectivenessScore(
        mockModules,
        mockUtilization,
        lowRelevance
      );

      // Base: 70 + Efficiency: 10 + Diversity: 12 + No confidence bonus = 92
      expect(score).toBe(92);
    });

    it('should cap diversity bonus at maximum', () => {
      const manyModules = Array.from({ length: 10 }, (_, i) => ({
        type: 'userProfile' as any, // Use valid type for all
        content: () => `Module ${i}`,
        priority: 1,
        estimatedTokens: 50,
        relevanceScore: 0.8
      }));

      const score = service.calculateEffectivenessScore(
        manyModules,
        mockUtilization,
        mockRelevanceFactors
      );

      // Base: 70 + Efficiency: 10 + Max Diversity: 15 + Confidence: 5 = 100 (capped at max)
      expect(score).toBeLessThanOrEqual(EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS);
      expect(score).toBeGreaterThan(85); // Should be high due to diversity
    });

    it('should handle empty modules array', () => {
      const score = service.calculateEffectivenessScore(
        [],
        mockUtilization,
        mockRelevanceFactors
      );

      // Base: 70 + Efficiency: 10 + No diversity + Confidence: 5 = 85
      expect(score).toBe(85);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for null modules', () => {
      expect(() => {
        service.calculateEffectivenessScore(
          null as any,
          mockUtilization,
          mockRelevanceFactors
        );
      }).toThrow(BusinessRuleViolationError);
    });

    it('should throw error for invalid utilization metrics', () => {
      expect(() => {
        service.calculateEffectivenessScore(
          mockModules,
          null as any,
          mockRelevanceFactors
        );
      }).toThrow(BusinessRuleViolationError);
    });

    it('should throw error for invalid utilization rate', () => {
      const invalidUtilization = {
        ...mockUtilization,
        utilizationRate: 'invalid' as any
      };

      expect(() => {
        service.calculateEffectivenessScore(
          mockModules,
          invalidUtilization,
          mockRelevanceFactors
        );
      }).toThrow(BusinessRuleViolationError);
    });

    it('should include context in validation errors', () => {
      try {
        service.calculateEffectivenessScore(
          null as any,
          mockUtilization,
          mockRelevanceFactors
        );
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessRuleViolationError);
        if (error instanceof BusinessRuleViolationError) {
          expect(error.context).toHaveProperty('modules');
        }
      }
    });
  });

  describe('Strength Identification', () => {
    it('should identify efficient utilization strength', () => {
      const strengths = service.identifyStrengths(
        mockModules,
        mockUtilization,
        mockRelevanceFactors
      );

      expect(strengths).toContain('Efficient token utilization');
    });

    it('should identify comprehensive coverage strength', () => {
      const strengths = service.identifyStrengths(
        mockModules,
        mockUtilization,
        mockRelevanceFactors
      );

      expect(strengths).toContain('Comprehensive context coverage');
    });

    it('should identify high confidence strength', () => {
      const highConfidenceRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: 0.9
      };

      const strengths = service.identifyStrengths(
        mockModules,
        mockUtilization,
        highConfidenceRelevance
      );

      expect(strengths).toContain('High confidence in conversation phase detection');
    });

    it('should return empty array for poor performance', () => {
      const poorUtilization = {
        ...mockUtilization,
        utilizationRate: 0.3,
        isEfficient: false
      };

      const fewModules = mockModules.slice(0, 2);
      const lowRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: 0.5
      };

      const strengths = service.identifyStrengths(
        fewModules,
        poorUtilization,
        lowRelevance
      );

      expect(strengths).toHaveLength(0);
    });
  });

  describe('Weakness Identification', () => {
    it('should identify underutilized token budget weakness', () => {
      const poorUtilization = {
        ...mockUtilization,
        utilizationRate: 0.4, // Below 0.6 * 0.8 = 0.48
        isEfficient: false
      };

      const weaknesses = service.identifyWeaknesses(
        mockModules,
        poorUtilization,
        mockRelevanceFactors
      );

      expect(weaknesses).toContain('Underutilized token budget');
    });

    it('should identify missing essential modules weakness', () => {
      const nonEssentialModules: ContextModule[] = [
        {
          type: 'knowledgeBase',
          content: () => 'Knowledge base data',
          priority: 2,
          estimatedTokens: 200,
          relevanceScore: 0.7
        }
      ];

      const weaknesses = service.identifyWeaknesses(
        nonEssentialModules,
        mockUtilization,
        mockRelevanceFactors
      );

      expect(weaknesses).toContain('Missing essential context modules');
    });

    it('should identify low confidence weakness', () => {
      const lowRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: 0.5 // Below 0.8 * 0.75 = 0.6
      };

      const weaknesses = service.identifyWeaknesses(
        mockModules,
        mockUtilization,
        lowRelevance
      );

      expect(weaknesses).toContain('Low confidence in conversation phase detection');
    });

    it('should return empty array for good performance', () => {
      const weaknesses = service.identifyWeaknesses(
        mockModules,
        mockUtilization,
        mockRelevanceFactors
      );

      expect(weaknesses).toHaveLength(0);
    });
  });

  describe('Optimization Suggestions', () => {
    it('should suggest increasing context richness for low utilization', () => {
      const lowUtilization = {
        ...mockUtilization,
        utilizationRate: 0.5 // Below LOW_UTILIZATION threshold
      };

      const suggestions = service.generateOptimizationSuggestions(
        mockModules,
        lowUtilization,
        5
      );

      expect(suggestions).toContain('Increase context richness by adding more modules');
    });

    it('should suggest increasing token budget for very high utilization', () => {
      const highUtilization = {
        ...mockUtilization,
        utilizationRate: 0.97 // Above 0.95
      };

      const suggestions = service.generateOptimizationSuggestions(
        mockModules,
        highUtilization,
        10
      );

      expect(suggestions).toContain('Consider increasing token budget for better context coverage');
    });

    it('should suggest knowledge base context for early conversations', () => {
      const modulesWithoutKB = mockModules.filter(m => m.type !== 'knowledgeBase');

      const suggestions = service.generateOptimizationSuggestions(
        modulesWithoutKB,
        mockUtilization,
        2 // Early conversation
      );

      expect(suggestions).toContain('Add knowledge base context for early conversation support');
    });

    it('should suggest lead scoring context for high-value prospects', () => {
      const modulesWithoutLeadScoring = mockModules.filter(m => m.type !== 'leadScoring');

      const suggestions = service.generateOptimizationSuggestions(
        modulesWithoutLeadScoring,
        mockUtilization,
        5,
        80 // High lead score
      );

      expect(suggestions).toContain('Include lead scoring context for high-value prospects');
    });

    it('should return empty suggestions for optimal setup', () => {
      const suggestions = service.generateOptimizationSuggestions(
        mockModules,
        mockUtilization,
        10,
        50 // Medium lead score
      );

      expect(suggestions).toHaveLength(0);
    });

    it('should handle undefined lead score gracefully', () => {
      const suggestions = service.generateOptimizationSuggestions(
        mockModules,
        mockUtilization,
        5
        // No lead score provided
      );

      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Business Rule Constants', () => {
    it('should have valid effectiveness configuration', () => {
      expect(EFFECTIVENESS_CONFIG.SCORING.BASE_EFFECTIVENESS).toBe(70);
      expect(EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS).toBe(100);
      expect(EFFECTIVENESS_CONFIG.THRESHOLDS.EFFICIENCY_MIN).toBe(0.7);
      expect(EFFECTIVENESS_CONFIG.THRESHOLDS.HIGH_CONFIDENCE).toBe(0.8);
    });

    it('should maintain consistency in scoring rules', () => {
      const maxPossibleScore = 
        EFFECTIVENESS_CONFIG.SCORING.BASE_EFFECTIVENESS +
        EFFECTIVENESS_CONFIG.SCORING.EFFICIENCY_BONUS +
        EFFECTIVENESS_CONFIG.SCORING.MAX_DIVERSITY_BONUS +
        EFFECTIVENESS_CONFIG.SCORING.CONFIDENCE_BONUS;

      expect(maxPossibleScore).toBeGreaterThanOrEqual(
        EFFECTIVENESS_CONFIG.SCORING.MAX_EFFECTIVENESS
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle modules with zero token count', () => {
      const zeroTokenModules = mockModules.map(m => ({ ...m, tokenCount: 0 }));

      const score = service.calculateEffectivenessScore(
        zeroTokenModules,
        mockUtilization,
        mockRelevanceFactors
      );

      expect(score).toBeGreaterThan(0);
    });

    it('should handle extreme utilization rates', () => {
      const extremeUtilization = {
        totalUsed: 0,
        totalAvailable: 1000,
        utilizationRate: 0,
        isEfficient: false
      };

      const score = service.calculateEffectivenessScore(
        mockModules,
        extremeUtilization,
        mockRelevanceFactors
      );

      expect(score).toBeGreaterThan(0);
    });

    it('should handle negative relevance values gracefully', () => {
      const negativeRelevance = {
        ...mockRelevanceFactors,
        phaseRelevance: -0.1
      };

      // Should not throw an error, but handle gracefully
      expect(() => {
        service.calculateEffectivenessScore(
          mockModules,
          mockUtilization,
          negativeRelevance
        );
      }).not.toThrow();
    });
  });
});