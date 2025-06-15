/**
 * Lead Scoring Service Tests
 * 
 * Tests for the refactored LeadScoringService following DDD patterns
 * Updated to work with static methods and QualificationData value object
 */

import { describe, it, expect } from 'vitest';
import { LeadScoringService, QualificationStatus, LeadScoringResult } from '../lead-management/LeadScoringService';
import { QualificationData, QualificationAnswer } from '../../value-objects/lead-management/QualificationData';

describe('LeadScoringService', () => {
  const createMockQualificationData = (overrides: Partial<any> = {}): QualificationData => {
    const defaultAnswers: QualificationAnswer[] = [
      {
        questionId: 'email',
        question: 'What is your email address?',
        answer: 'john@company.com',
        answeredAt: new Date('2024-01-01T10:00:00Z'),
        scoringWeight: 10,
        scoreContribution: 8
      },
      {
        questionId: 'company',
        question: 'What company do you work for?',
        answer: 'Acme Corporation',
        answeredAt: new Date('2024-01-01T10:02:00Z'),
        scoringWeight: 12,
        scoreContribution: 10
      },
      {
        questionId: 'budget',
        question: 'What is your budget range?',
        answer: '25k_50k',
        answeredAt: new Date('2024-01-01T10:04:00Z'),
        scoringWeight: 15,
        scoreContribution: 15
      }
    ];

    return QualificationData.create({
      painPoints: ['cost', 'efficiency'],
      interests: ['automation', 'reporting'],
      answeredQuestions: defaultAnswers,
      engagementLevel: 'high',
      budget: '25k_50k',
      timeline: 'within_quarter',
      decisionMaker: true,
      industry: 'technology',
      companySize: 'medium',
      ...overrides
    });
  };

  describe('calculateScore', () => {
    it('should calculate comprehensive lead score for high-quality lead', () => {
      const qualificationData = createMockQualificationData();
      const result = LeadScoringService.calculateScore(qualificationData);

      expect(result.score).toBeGreaterThan(50);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.qualificationStatus).toBe('highly_qualified');
      expect(result.scoreBreakdown).toBeDefined();
      expect(result.scoreBreakdown.baseScore).toBeGreaterThan(0);
      expect(result.scoreBreakdown.engagementBonus).toBe(20); // high engagement
      expect(result.scoreBreakdown.budgetBonus).toBe(15);
      expect(result.scoreBreakdown.timelineBonus).toBe(10);
      expect(result.scoreBreakdown.decisionMakerBonus).toBe(20);
    });

    it('should give higher scores for complete qualification data', () => {
      const completeData = createMockQualificationData();
      const incompleteData = createMockQualificationData({
        answeredQuestions: [
          {
            questionId: 'email',
            question: 'What is your email?',
            answer: 'test@example.com',
            answeredAt: new Date(),
            scoringWeight: 5,
            scoreContribution: 3
          }
        ],
        budget: undefined,
        timeline: undefined,
        decisionMaker: undefined
      });

      const completeResult = LeadScoringService.calculateScore(completeData);
      const incompleteResult = LeadScoringService.calculateScore(incompleteData);

      expect(completeResult.score).toBeGreaterThan(incompleteResult.score);
      expect(completeResult.scoreBreakdown.budgetBonus).toBeGreaterThan(incompleteResult.scoreBreakdown.budgetBonus);
      expect(completeResult.scoreBreakdown.timelineBonus).toBeGreaterThan(incompleteResult.scoreBreakdown.timelineBonus);
      expect(completeResult.scoreBreakdown.decisionMakerBonus).toBeGreaterThan(incompleteResult.scoreBreakdown.decisionMakerBonus);
    });

    it('should handle minimal qualification data', () => {
      const minimalData = QualificationData.create({
        painPoints: [],
        interests: [],
        answeredQuestions: [],
        engagementLevel: 'low'
      });

      const result = LeadScoringService.calculateScore(minimalData);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThan(30);
      expect(result.scoreBreakdown.baseScore).toBe(0);
      expect(result.scoreBreakdown.engagementBonus).toBe(0); // low engagement
      expect(result.qualificationStatus).toBe('not_qualified');
    });

    it('should apply engagement level bonuses correctly', () => {
      // Use minimal data to avoid hitting score cap
      const baseData = {
        answeredQuestions: [
          {
            questionId: 'email',
            question: 'What is your email?',
            answer: 'test@example.com',
            answeredAt: new Date(),
            scoringWeight: 10,
            scoreContribution: 5
          }
        ],
        budget: undefined,
        timeline: undefined,
        decisionMaker: undefined
      };

      const lowEngagement = createMockQualificationData({ ...baseData, engagementLevel: 'low' });
      const mediumEngagement = createMockQualificationData({ ...baseData, engagementLevel: 'medium' });
      const highEngagement = createMockQualificationData({ ...baseData, engagementLevel: 'high' });

      const lowResult = LeadScoringService.calculateScore(lowEngagement);
      const mediumResult = LeadScoringService.calculateScore(mediumEngagement);
      const highResult = LeadScoringService.calculateScore(highEngagement);

      expect(lowResult.scoreBreakdown.engagementBonus).toBe(0);
      expect(mediumResult.scoreBreakdown.engagementBonus).toBe(10);
      expect(highResult.scoreBreakdown.engagementBonus).toBe(20);

      expect(highResult.score).toBeGreaterThan(mediumResult.score);
      expect(mediumResult.score).toBeGreaterThan(lowResult.score);
    });

    it('should disqualify leads with no budget', () => {
      const noBudgetData = createMockQualificationData({
        budget: 'no_budget'
      });

      const result = LeadScoringService.calculateScore(noBudgetData);

      expect(result.score).toBe(0);
      expect(result.qualificationStatus).toBe('disqualified');
    });

    it('should disqualify leads with no timeline', () => {
      const noTimelineData = createMockQualificationData({
        timeline: 'no_timeline'
      });

      const result = LeadScoringService.calculateScore(noTimelineData);

      expect(result.score).toBe(0);
      expect(result.qualificationStatus).toBe('disqualified');
    });

    it('should disqualify leads who are not decision makers', () => {
      const notDecisionMakerData = createMockQualificationData({
        decisionMaker: false
      });

      const result = LeadScoringService.calculateScore(notDecisionMakerData);

      expect(result.score).toBe(0);
      expect(result.qualificationStatus).toBe('disqualified');
    });

    it('should calculate correct qualification status based on score', () => {
      // Create data that will result in different score ranges
      const highScoreData = createMockQualificationData(); // Should be highly_qualified (80+)
      
      const mediumScoreData = createMockQualificationData({
        answeredQuestions: [
          {
            questionId: 'email',
            question: 'What is your email?',
            answer: 'test@example.com',
            answeredAt: new Date(),
            scoringWeight: 20,
            scoreContribution: 16 // Higher contribution to reach qualified range
          }
        ],
        engagementLevel: 'medium', // +10 bonus
        budget: '5k_10k', // +15 bonus
        timeline: undefined,
        decisionMaker: undefined
      }); // Should be qualified (60-79)

      const lowScoreData = createMockQualificationData({
        answeredQuestions: [],
        engagementLevel: 'low',
        budget: undefined,
        timeline: undefined,
        decisionMaker: undefined
      }); // Should be not_qualified (<60)

      const highResult = LeadScoringService.calculateScore(highScoreData);
      const mediumResult = LeadScoringService.calculateScore(mediumScoreData);
      const lowResult = LeadScoringService.calculateScore(lowScoreData);

      expect(highResult.qualificationStatus).toBe('highly_qualified');
      expect(mediumResult.qualificationStatus).toBe('qualified');
      expect(lowResult.qualificationStatus).toBe('not_qualified');
    });
  });

  describe('utility methods', () => {
    it('should return correct score grades', () => {
      expect(LeadScoringService.getScoreGrade(95)).toBe('A');
      expect(LeadScoringService.getScoreGrade(85)).toBe('B');
      expect(LeadScoringService.getScoreGrade(75)).toBe('C');
      expect(LeadScoringService.getScoreGrade(65)).toBe('D');
      expect(LeadScoringService.getScoreGrade(45)).toBe('F');
    });

    it('should correctly identify qualified scores', () => {
      expect(LeadScoringService.isQualifiedScore(80)).toBe(true);
      expect(LeadScoringService.isQualifiedScore(60)).toBe(true);
      expect(LeadScoringService.isQualifiedScore(59)).toBe(false);
      expect(LeadScoringService.isQualifiedScore(0)).toBe(false);
    });

    it('should correctly identify highly qualified scores', () => {
      expect(LeadScoringService.isHighlyQualifiedScore(90)).toBe(true);
      expect(LeadScoringService.isHighlyQualifiedScore(80)).toBe(true);
      expect(LeadScoringService.isHighlyQualifiedScore(79)).toBe(false);
      expect(LeadScoringService.isHighlyQualifiedScore(60)).toBe(false);
    });

    it('should provide qualification descriptions', () => {
      expect(LeadScoringService.getQualificationDescription('not_qualified')).toContain('does not meet');
      expect(LeadScoringService.getQualificationDescription('qualified')).toContain('meets the basic');
      expect(LeadScoringService.getQualificationDescription('highly_qualified')).toContain('excellent prospect');
      expect(LeadScoringService.getQualificationDescription('disqualified')).toContain('disqualified');
    });

    it('should provide score recommendations', () => {
      const highQualityData = createMockQualificationData();
      const lowQualityData = createMockQualificationData({
        answeredQuestions: [],
        engagementLevel: 'low',
        budget: undefined,
        timeline: undefined,
        decisionMaker: undefined
      });

      const highResult = LeadScoringService.calculateScore(highQualityData);
      const lowResult = LeadScoringService.calculateScore(lowQualityData);

      const highRecommendations = LeadScoringService.getScoreRecommendations(highResult);
      const lowRecommendations = LeadScoringService.getScoreRecommendations(lowResult);

      expect(highRecommendations).toContain('High-priority lead - contact immediately');
      expect(lowRecommendations).toContain('Consider nurturing this lead with educational content');
      expect(lowRecommendations.length).toBeGreaterThan(highRecommendations.length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty qualification data', () => {
      const emptyData = QualificationData.createEmpty();
      const result = LeadScoringService.calculateScore(emptyData);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.scoreBreakdown.baseScore).toBe(0);
      expect(typeof result.score).toBe('number');
      expect(result.qualificationStatus).toBe('not_qualified');
    });

    it('should handle qualification data with no answered questions', () => {
      const noQuestionsData = createMockQualificationData({
        answeredQuestions: []
      });

      const result = LeadScoringService.calculateScore(noQuestionsData);

      expect(result.score).toBeGreaterThan(0); // Should still have bonuses
      expect(result.scoreBreakdown.baseScore).toBe(0);
      expect(result.scoreBreakdown.budgetBonus).toBe(15);
      expect(result.scoreBreakdown.timelineBonus).toBe(10);
      expect(result.scoreBreakdown.decisionMakerBonus).toBe(20);
      expect(result.scoreBreakdown.engagementBonus).toBe(20);
    });

    it('should cap scores at 100', () => {
      // Create data with maximum possible scores
      const maxScoreData = createMockQualificationData({
        answeredQuestions: [
          {
            questionId: 'test',
            question: 'Test question',
            answer: 'Test answer',
            answeredAt: new Date(),
            scoringWeight: 100,
            scoreContribution: 100 // Perfect score
          }
        ],
        engagementLevel: 'high'
      });

      const result = LeadScoringService.calculateScore(maxScoreData);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should ensure scores are never negative', () => {
      const minimalData = QualificationData.createEmpty();
      const result = LeadScoringService.calculateScore(minimalData);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('score breakdown validation', () => {
    it('should have consistent score breakdown calculations', () => {
      const qualificationData = createMockQualificationData();
      const result = LeadScoringService.calculateScore(qualificationData);

      const expectedTotal = result.scoreBreakdown.baseScore + result.scoreBreakdown.totalBonuses;
      
      expect(result.scoreBreakdown.finalScore).toBe(Math.min(100, Math.max(0, expectedTotal)));
      expect(result.scoreBreakdown.totalBonuses).toBe(
        result.scoreBreakdown.engagementBonus +
        result.scoreBreakdown.budgetBonus +
        result.scoreBreakdown.timelineBonus +
        result.scoreBreakdown.decisionMakerBonus
      );
    });
  });
}); 