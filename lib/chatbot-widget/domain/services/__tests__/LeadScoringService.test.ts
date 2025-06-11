import { describe, it, expect, beforeEach } from 'vitest';
import { LeadScoringService } from '../LeadScoringService';
import { QualificationData, QualificationAnswer } from '../../entities/Lead';
import { SessionContext } from '../../entities/ChatSession';

describe('LeadScoringService', () => {
  let scoringService: LeadScoringService;
  let mockQualificationData: QualificationData;
  let mockSessionContext: SessionContext;

  beforeEach(() => {
    scoringService = new LeadScoringService();

    // Mock qualification data
    mockQualificationData = {
      painPoints: ['cost', 'efficiency'],
      interests: ['automation', 'reporting'],
      answeredQuestions: [
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
      ],
      engagementLevel: 'high',
      budget: '25k_50k',
             timeline: 'within_quarter',
      decisionMaker: true,
      industry: 'technology',
      companySize: 'medium'
    };

    // Mock session context
    mockSessionContext = {
      visitorName: 'John Doe',
      email: 'john@company.com',
      company: 'Acme Corporation',
      previousVisits: 2,
      pageViews: [
        {
          url: '/pricing',
          title: 'Pricing',
          timestamp: new Date('2024-01-01T09:50:00Z'),
          timeOnPage: 120
        },
        {
          url: '/features',
          title: 'Features',
          timestamp: new Date('2024-01-01T09:55:00Z'),
          timeOnPage: 180
        },
        {
          url: '/contact',
          title: 'Contact Us',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          timeOnPage: 300
        }
      ],
      conversationSummary: 'User is interested in our enterprise solution for their mid-size technology company. They have a defined budget and timeline.',
      topics: ['pricing', 'features', 'enterprise', 'integration'],
      interests: ['api-access', 'custom-integrations', 'support'],
      engagementScore: 85
    };
  });

  describe('calculateLeadScore', () => {
    it('should calculate comprehensive lead score for high-quality lead', () => {
      const result = scoringService.calculateLeadScore(mockQualificationData, mockSessionContext);

      expect(result.totalScore).toBeGreaterThan(50);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.questionScore).toBeGreaterThan(0);
      expect(result.breakdown.engagementScore).toBeGreaterThan(0);
      expect(result.breakdown.budgetScore).toBeGreaterThan(0);
      expect(result.qualificationReasons).toBeDefined();
      expect(result.disqualificationReasons).toBeDefined();
    });

    it('should give higher scores for complete qualification data', () => {
      const result = scoringService.calculateLeadScore(mockQualificationData, mockSessionContext);
      
      // Remove some qualification data for comparison
      const incompleteData = {
        ...mockQualificationData,
        answeredQuestions: mockQualificationData.answeredQuestions.slice(0, 1), // Only email
        budget: undefined,
        timeline: undefined,
        decisionMaker: undefined
      };

      const incompleteResult = scoringService.calculateLeadScore(incompleteData, mockSessionContext);

      expect(result.totalScore).toBeGreaterThan(incompleteResult.totalScore);
      expect(result.breakdown.budgetScore).toBeGreaterThan(incompleteResult.breakdown.budgetScore);
      expect(result.breakdown.timelineScore).toBeGreaterThan(incompleteResult.breakdown.timelineScore);
    });

         it('should handle minimal qualification data', () => {
       const minimalData: QualificationData = {
         painPoints: [],
         interests: [],
         answeredQuestions: [],
         engagementLevel: 'low'
       };

      const result = scoringService.calculateLeadScore(minimalData);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThan(30);
      expect(result.breakdown.questionScore).toBe(0);
      expect(result.breakdown.engagementScore).toBeGreaterThanOrEqual(0);
    });

         it('should apply industry and company size bonuses', () => {
       // Use minimal baseline data to avoid hitting max score
       const baselineData: QualificationData = {
         painPoints: [],
         interests: [],
         answeredQuestions: [
           {
             questionId: 'email',
             question: 'What is your email?',
             answer: 'test@example.com',
             answeredAt: new Date(),
             scoringWeight: 5,
             scoreContribution: 4
           }
         ],
         engagementLevel: 'medium'
       };

       const techLargeData = {
         ...baselineData,
         industry: 'technology',
         companySize: 'large'
       };

       const nonProfitSmallData = {
         ...baselineData,
         industry: 'nonprofit',
         companySize: 'small'
       };

       const techResult = scoringService.calculateLeadScore(techLargeData);
       const nonProfitResult = scoringService.calculateLeadScore(nonProfitSmallData);

       expect(techResult.totalScore).toBeGreaterThan(nonProfitResult.totalScore);
       expect(techResult.breakdown.industryScore).toBeGreaterThan(nonProfitResult.breakdown.industryScore);
       expect(techResult.breakdown.companySizeScore).toBeGreaterThan(nonProfitResult.breakdown.companySizeScore);
     });

    it('should penalize no budget scenarios', () => {
      const noBudgetData = {
        ...mockQualificationData,
        budget: 'no_budget'
      };

      const result = scoringService.calculateLeadScore(noBudgetData, mockSessionContext);

      expect(result.breakdown.budgetScore).toBeLessThan(0);
             expect(result.disqualificationReasons).toContain('No budget available');
    });
  });

  describe('qualification thresholds', () => {
    it('should provide correct qualification thresholds', () => {
      const thresholds = scoringService.getQualificationThresholds();

      expect(thresholds.disqualified).toBeLessThan(thresholds.notQualified);
      expect(thresholds.notQualified).toBeLessThan(thresholds.qualified);
      expect(thresholds.qualified).toBeLessThan(thresholds.highlyQualified);
      expect(thresholds.highlyQualified).toBeLessThanOrEqual(100);
    });
  });

  describe('scoring criteria updates', () => {
    it('should allow updating scoring criteria', () => {
      const customCriteria = {
        budgetBonus: 25,
        timelineBonus: 15
      };

      const updatedService = scoringService.updateCriteria(customCriteria);
      expect(updatedService).toBeInstanceOf(LeadScoringService);
      expect(updatedService).not.toBe(scoringService); // Should be a new instance
    });
  });

  describe('edge cases', () => {
         it('should handle empty qualification data', () => {
       const emptyData: QualificationData = {
         painPoints: [],
         interests: [],
         answeredQuestions: [],
         engagementLevel: 'low'
       };

      const result = scoringService.calculateLeadScore(emptyData);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.questionScore).toBe(0);
      expect(typeof result.totalScore).toBe('number');
    });

    it('should handle qualification data without session context', () => {
      const result = scoringService.calculateLeadScore(mockQualificationData);

      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });

    it('should handle invalid budget and timeline values', () => {
      const invalidData = {
        ...mockQualificationData,
        budget: 'invalid_budget_option',
        timeline: 'invalid_timeline_option'
      };

      const result = scoringService.calculateLeadScore(invalidData, mockSessionContext);

      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.breakdown.budgetScore).toBe(0);
      expect(result.breakdown.timelineScore).toBe(0);
    });
  });
}); 