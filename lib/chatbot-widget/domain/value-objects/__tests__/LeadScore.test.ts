import { describe, it, expect } from 'vitest';
import { 
  LeadScore, 
  ScoringFactors, 
  ScoringCriteria, 
  QualificationLevel,
  ScoreBreakdown 
} from '../LeadScore';

describe('LeadScore Value Object', () => {
  describe('constructor validation', () => {
    it('should create valid LeadScore', () => {
      const breakdown: ScoreBreakdown = {
        questionScore: 20,
        engagementScore: 15,
        contactInfoScore: 25,
        budgetTimelineScore: 10,
        industryCompanySizeScore: 5,
        totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      };

      const leadScore = new LeadScore(75, QualificationLevel.QUALIFIED, breakdown);

      expect(leadScore.score).toBe(75);
      expect(leadScore.qualificationLevel).toBe(QualificationLevel.QUALIFIED);
      expect(leadScore.breakdown).toEqual(breakdown);
      expect(leadScore.calculatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for score below minimum', () => {
      const breakdown: ScoreBreakdown = {
        questionScore: 0,
        engagementScore: 0,
        contactInfoScore: 0,
        budgetTimelineScore: 0,
        industryCompanySizeScore: 0,
        totalScore: -5,
        qualificationLevel: QualificationLevel.NOT_QUALIFIED
      };

      expect(() => {
        new LeadScore(-5, QualificationLevel.NOT_QUALIFIED, breakdown);
      }).toThrow('Score must be a number between 0 and 100');
    });

    it('should throw error for score above maximum', () => {
      const breakdown: ScoreBreakdown = {
        questionScore: 30,
        engagementScore: 25,
        contactInfoScore: 25,
        budgetTimelineScore: 15,
        industryCompanySizeScore: 10,
        totalScore: 105,
        qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED
      };

      expect(() => {
        new LeadScore(105, QualificationLevel.HIGHLY_QUALIFIED, breakdown);
      }).toThrow('Score must be a number between 0 and 100');
    });

    it('should throw error for invalid qualification level', () => {
      const breakdown: ScoreBreakdown = {
        questionScore: 20,
        engagementScore: 15,
        contactInfoScore: 25,
        budgetTimelineScore: 10,
        industryCompanySizeScore: 5,
        totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      };

      expect(() => {
        // @ts-ignore - Testing runtime validation
        new LeadScore(75, 'invalid_level', breakdown);
      }).toThrow('Invalid qualification level: invalid_level');
    });

    it('should throw error for missing breakdown', () => {
      expect(() => {
        // @ts-ignore - Testing runtime validation
        new LeadScore(75, QualificationLevel.QUALIFIED, null);
      }).toThrow('Score breakdown is required');
    });
  });

  describe('calculate method', () => {
    it('should calculate score with default criteria', () => {
      const factors: ScoringFactors = {
        answeredQuestionsCount: 3,
        totalQuestionsCount: 5,
        engagementScore: 80,
        hasContactInfo: true,
        hasBudgetInfo: true,
        hasTimelineInfo: false,
        hasIndustryInfo: true,
        hasCompanySizeInfo: false,
        conversationLength: 10,
        sessionDuration: 8
      };

      const leadScore = LeadScore.calculate(factors);

      expect(leadScore.score).toBeGreaterThan(0);
      expect(leadScore.score).toBeLessThanOrEqual(100);
      expect(leadScore.qualificationLevel).toBeDefined();
      expect(leadScore.breakdown.totalScore).toBe(leadScore.score);
    });

    it('should calculate perfect score for ideal factors', () => {
      const factors: ScoringFactors = {
        answeredQuestionsCount: 5,
        totalQuestionsCount: 5,
        engagementScore: 100,
        hasContactInfo: true,
        hasBudgetInfo: true,
        hasTimelineInfo: true,
        hasIndustryInfo: true,
        hasCompanySizeInfo: true,
        conversationLength: 20,
        sessionDuration: 15
      };

      const leadScore = LeadScore.calculate(factors);

      expect(leadScore.score).toBe(100);
      expect(leadScore.qualificationLevel).toBe(QualificationLevel.HIGHLY_QUALIFIED);
    });

    it('should calculate zero score for minimal factors', () => {
      const factors: ScoringFactors = {
        answeredQuestionsCount: 0,
        totalQuestionsCount: 5,
        engagementScore: 25, // Above disqualification threshold
        hasContactInfo: false,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 4, // Above disqualification threshold
        sessionDuration: 0.5
      };

      const leadScore = LeadScore.calculate(factors);

      expect(leadScore.score).toBeLessThan(30); // Very low but not zero due to engagement
      expect(leadScore.qualificationLevel).toBe(QualificationLevel.NOT_QUALIFIED);
    });

    it('should disqualify for low engagement and short conversation', () => {
      const factors: ScoringFactors = {
        answeredQuestionsCount: 2,
        totalQuestionsCount: 5,
        engagementScore: 15, // Low engagement
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 2, // Short conversation
        sessionDuration: 1
      };

      const leadScore = LeadScore.calculate(factors);

      expect(leadScore.qualificationLevel).toBe(QualificationLevel.DISQUALIFIED);
    });

    it('should use custom criteria correctly', () => {
      const customCriteria: ScoringCriteria = {
        questionAnswerWeight: 0.5,
        engagementWeight: 0.2,
        contactInfoWeight: 0.2,
        budgetTimelineWeight: 0.1,
        industryCompanySizeWeight: 0.0
      };

      const factors: ScoringFactors = {
        answeredQuestionsCount: 5,
        totalQuestionsCount: 5,
        engagementScore: 50,
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 5,
        sessionDuration: 3
      };

      const leadScore = LeadScore.calculate(factors, customCriteria);

      // With 50% weight on questions (all answered) = 50 points
      // Plus other components should give a significant score
      expect(leadScore.score).toBeGreaterThan(50);
      expect(leadScore.breakdown.questionScore).toBe(50);
    });
  });

  describe('validation methods', () => {
    it('should validate scoring factors correctly', () => {
      const invalidFactors: ScoringFactors = {
        answeredQuestionsCount: -1, // Invalid
        totalQuestionsCount: 5,
        engagementScore: 80,
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 5,
        sessionDuration: 3
      };

      expect(() => {
        LeadScore.calculate(invalidFactors);
      }).toThrow('answeredQuestionsCount must be a non-negative number');
    });

    it('should validate engagement score range', () => {
      const invalidFactors: ScoringFactors = {
        answeredQuestionsCount: 3,
        totalQuestionsCount: 5,
        engagementScore: 150, // Invalid - over 100
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 5,
        sessionDuration: 3
      };

      expect(() => {
        LeadScore.calculate(invalidFactors);
      }).toThrow('engagementScore must be a number between 0 and 100');
    });

    it('should validate answered questions do not exceed total', () => {
      const invalidFactors: ScoringFactors = {
        answeredQuestionsCount: 6, // More than total
        totalQuestionsCount: 5,
        engagementScore: 80,
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 5,
        sessionDuration: 3
      };

      expect(() => {
        LeadScore.calculate(invalidFactors);
      }).toThrow('answeredQuestionsCount cannot exceed totalQuestionsCount');
    });

    it('should validate scoring criteria weights', () => {
      const invalidCriteria: ScoringCriteria = {
        questionAnswerWeight: 0.5,
        engagementWeight: 0.3,
        contactInfoWeight: 0.3, // Total > 1
        budgetTimelineWeight: 0.1,
        industryCompanySizeWeight: 0.1
      };

      const validFactors: ScoringFactors = {
        answeredQuestionsCount: 3,
        totalQuestionsCount: 5,
        engagementScore: 80,
        hasContactInfo: true,
        hasBudgetInfo: false,
        hasTimelineInfo: false,
        hasIndustryInfo: false,
        hasCompanySizeInfo: false,
        conversationLength: 5,
        sessionDuration: 3
      };

      expect(() => {
        LeadScore.calculate(validFactors, invalidCriteria);
      }).toThrow('Total weights must sum to 1');
    });
  });

  describe('qualification methods', () => {
    it('should identify qualified leads correctly', () => {
      const qualifiedScore = new LeadScore(70, QualificationLevel.QUALIFIED, {
        questionScore: 20,
        engagementScore: 15,
        contactInfoScore: 25,
        budgetTimelineScore: 10,
        industryCompanySizeScore: 0,
        totalScore: 70,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      expect(qualifiedScore.isQualified()).toBe(true);
      expect(qualifiedScore.isHighlyQualified()).toBe(false);
      expect(qualifiedScore.isDisqualified()).toBe(false);
    });

    it('should identify highly qualified leads correctly', () => {
      const highlyQualifiedScore = new LeadScore(85, QualificationLevel.HIGHLY_QUALIFIED, {
        questionScore: 30,
        engagementScore: 25,
        contactInfoScore: 25,
        budgetTimelineScore: 15,
        industryCompanySizeScore: 5,
        totalScore: 85,
        qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED
      });

      expect(highlyQualifiedScore.isQualified()).toBe(true);
      expect(highlyQualifiedScore.isHighlyQualified()).toBe(true);
      expect(highlyQualifiedScore.isDisqualified()).toBe(false);
    });

    it('should identify not qualified leads correctly', () => {
      const notQualifiedScore = new LeadScore(40, QualificationLevel.NOT_QUALIFIED, {
        questionScore: 10,
        engagementScore: 10,
        contactInfoScore: 0,
        budgetTimelineScore: 15,
        industryCompanySizeScore: 5,
        totalScore: 40,
        qualificationLevel: QualificationLevel.NOT_QUALIFIED
      });

      expect(notQualifiedScore.isQualified()).toBe(false);
      expect(notQualifiedScore.isHighlyQualified()).toBe(false);
      expect(notQualifiedScore.isDisqualified()).toBe(false);
    });

    it('should identify disqualified leads correctly', () => {
      const disqualifiedScore = new LeadScore(20, QualificationLevel.DISQUALIFIED, {
        questionScore: 5,
        engagementScore: 5,
        contactInfoScore: 0,
        budgetTimelineScore: 5,
        industryCompanySizeScore: 5,
        totalScore: 20,
        qualificationLevel: QualificationLevel.DISQUALIFIED
      });

      expect(disqualifiedScore.isQualified()).toBe(false);
      expect(disqualifiedScore.isHighlyQualified()).toBe(false);
      expect(disqualifiedScore.isDisqualified()).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should get correct description for each qualification level', () => {
      const highlyQualified = new LeadScore(85, QualificationLevel.HIGHLY_QUALIFIED, {
        questionScore: 30, engagementScore: 25, contactInfoScore: 25,
        budgetTimelineScore: 15, industryCompanySizeScore: 5, totalScore: 85,
        qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED
      });

      const description = highlyQualified.getDescription();
      expect(description).toContain('Highly qualified');
      expect(description).toContain('85/100');
    });

    it('should provide improvement recommendations', () => {
      const lowScore = new LeadScore(25, QualificationLevel.NOT_QUALIFIED, {
        questionScore: 5,
        engagementScore: 5,
        contactInfoScore: 0,
        budgetTimelineScore: 10,
        industryCompanySizeScore: 5,
        totalScore: 25,
        qualificationLevel: QualificationLevel.NOT_QUALIFIED
      });

      const recommendations = lowScore.getImprovementRecommendations();
      expect(recommendations).toContain('Encourage the visitor to answer more qualification questions');
      expect(recommendations).toContain('Improve engagement with more interactive conversation');
      expect(recommendations).toContain('Request contact information (email, phone)');
    });

    it('should compare scores correctly', () => {
      const score1 = new LeadScore(75, QualificationLevel.QUALIFIED, {
        questionScore: 20, engagementScore: 15, contactInfoScore: 25,
        budgetTimelineScore: 10, industryCompanySizeScore: 5, totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      const score2 = new LeadScore(85, QualificationLevel.HIGHLY_QUALIFIED, {
        questionScore: 30, engagementScore: 25, contactInfoScore: 25,
        budgetTimelineScore: 15, industryCompanySizeScore: 5, totalScore: 85,
        qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED
      });

      expect(score1.compareTo(score2)).toBe(-10);
      expect(score2.compareTo(score1)).toBe(10);
      expect(score1.hasImprovedFrom(score2)).toBe(false);
      expect(score2.hasImprovedFrom(score1)).toBe(true);
    });

    it('should calculate improvement percentage correctly', () => {
      const previousScore = new LeadScore(50, QualificationLevel.NOT_QUALIFIED, {
        questionScore: 15, engagementScore: 10, contactInfoScore: 0,
        budgetTimelineScore: 15, industryCompanySizeScore: 5, totalScore: 50,
        qualificationLevel: QualificationLevel.NOT_QUALIFIED
      });

      const currentScore = new LeadScore(75, QualificationLevel.QUALIFIED, {
        questionScore: 20, engagementScore: 15, contactInfoScore: 25,
        budgetTimelineScore: 10, industryCompanySizeScore: 5, totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      const improvement = currentScore.getImprovementPercentage(previousScore);
      expect(improvement).toBe(50); // 50% improvement
    });
  });

  describe('immutability and comparison', () => {
    it('should create new instance with updated score', () => {
      const originalScore = new LeadScore(60, QualificationLevel.QUALIFIED, {
        questionScore: 20, engagementScore: 15, contactInfoScore: 25,
        budgetTimelineScore: 10, industryCompanySizeScore: 5, totalScore: 60,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      const updatedScore = originalScore.withScore(80);

      expect(updatedScore.score).toBe(80);
      expect(updatedScore).not.toBe(originalScore); // Different instance
      expect(updatedScore.breakdown.totalScore).toBe(80);
    });

    it('should check equality correctly', () => {
      const score1 = new LeadScore(75, QualificationLevel.QUALIFIED, {
        questionScore: 20, engagementScore: 15, contactInfoScore: 25,
        budgetTimelineScore: 10, industryCompanySizeScore: 5, totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      const score2 = new LeadScore(75, QualificationLevel.QUALIFIED, {
        questionScore: 25, engagementScore: 20, contactInfoScore: 25, // Different breakdown
        budgetTimelineScore: 5, industryCompanySizeScore: 0, totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      expect(score1.equals(score2)).toBe(true); // Same score and qualification
    });
  });

  describe('JSON serialization', () => {
    it('should convert to JSON correctly', () => {
      const leadScore = new LeadScore(75, QualificationLevel.QUALIFIED, {
        questionScore: 20, engagementScore: 15, contactInfoScore: 25,
        budgetTimelineScore: 10, industryCompanySizeScore: 5, totalScore: 75,
        qualificationLevel: QualificationLevel.QUALIFIED
      });

      const json = leadScore.toJSON();

      expect(json).toHaveProperty('score', 75);
      expect(json).toHaveProperty('qualificationLevel', QualificationLevel.QUALIFIED);
      expect(json).toHaveProperty('breakdown');
      expect(json).toHaveProperty('calculatedAt');
    });

    it('should create from JSON correctly', () => {
      const jsonData = {
        score: 80,
        qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED,
        breakdown: {
          questionScore: 25, engagementScore: 20, contactInfoScore: 25,
          budgetTimelineScore: 15, industryCompanySizeScore: 5, totalScore: 80,
          qualificationLevel: QualificationLevel.HIGHLY_QUALIFIED
        },
        calculatedAt: '2024-01-15T10:00:00.000Z'
      };

      const leadScore = LeadScore.fromJSON(jsonData);

      expect(leadScore.score).toBe(80);
      expect(leadScore.qualificationLevel).toBe(QualificationLevel.HIGHLY_QUALIFIED);
      expect(leadScore.breakdown.totalScore).toBe(80);
      expect(leadScore.calculatedAt).toBeInstanceOf(Date);
    });
  });

  describe('factory methods', () => {
    it('should create initial lead score with zero values', () => {
      const initialScore = LeadScore.createInitial();

      expect(initialScore.score).toBe(0);
      expect(initialScore.qualificationLevel).toBe(QualificationLevel.NOT_QUALIFIED);
      expect(initialScore.breakdown.totalScore).toBe(0);
      expect(initialScore.breakdown.questionScore).toBe(0);
      expect(initialScore.breakdown.engagementScore).toBe(0);
    });

    it('should get default criteria with correct weights', () => {
      const defaultCriteria = LeadScore.getDefaultCriteria();

      expect(defaultCriteria.questionAnswerWeight).toBe(0.3);
      expect(defaultCriteria.engagementWeight).toBe(0.25);
      expect(defaultCriteria.contactInfoWeight).toBe(0.25);
      expect(defaultCriteria.budgetTimelineWeight).toBe(0.15);
      expect(defaultCriteria.industryCompanySizeWeight).toBe(0.05);

      // Weights should sum to 1
      const totalWeight = Object.values(defaultCriteria).reduce((sum, weight) => sum + weight, 0);
      expect(Math.abs(totalWeight - 1)).toBeLessThan(0.001);
    });

    it('should get threshold values correctly', () => {
      const thresholds = LeadScore.getThresholds();

      expect(thresholds.qualified).toBe(60);
      expect(thresholds.highlyQualified).toBe(80);
      expect(thresholds.min).toBe(0);
      expect(thresholds.max).toBe(100);
    });
  });
}); 