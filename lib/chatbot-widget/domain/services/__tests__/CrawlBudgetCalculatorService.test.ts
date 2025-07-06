/**
 * CrawlBudgetCalculatorService Tests
 * 
 * AI INSTRUCTIONS:
 * - Test budget calculation formulas and logic
 * - Test risk assessment algorithms
 * - Test recommendation generation
 * - Test constraint enforcement
 * - Test business rule validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CrawlBudgetCalculatorService } from '../CrawlBudgetCalculatorService';
import { WebsiteCrawlSettings } from '../../value-objects/ai-configuration/KnowledgeBase';

describe('CrawlBudgetCalculatorService', () => {
  let service: CrawlBudgetCalculatorService;
  let mockCrawlSettings: WebsiteCrawlSettings;

  beforeEach(() => {
    service = new CrawlBudgetCalculatorService();
    mockCrawlSettings = {
      maxPages: 50,
      maxDepth: 3,
      includePatterns: [],
      excludePatterns: [],
      respectRobotsTxt: true,
      crawlFrequency: 'weekly' as const,
      includeImages: false,
      includePDFs: true
    };
  });

  describe('calculateOptimalBudget', () => {
    it('should calculate comprehensive budget for valid settings', () => {
      const budget = service.calculateOptimalBudget(mockCrawlSettings);

      expect(budget).toMatchObject({
        maxPages: expect.any(Number),
        maxDepth: expect.any(Number),
        estimatedTime: expect.any(Number),
        recommendedConcurrency: expect.any(Number),
        estimatedCost: expect.any(Number),
        riskLevel: expect.any(String),
        recommendations: expect.any(Array)
      });
    });

    it('should enforce maximum page limits', () => {
      const largeCrawlSettings = { ...mockCrawlSettings, maxPages: 150 };
      const budget = service.calculateOptimalBudget(largeCrawlSettings);

      expect(budget.maxPages).toBeLessThanOrEqual(100);
    });

    it('should enforce maximum depth limits', () => {
      const deepCrawlSettings = { ...mockCrawlSettings, maxDepth: 10 };
      const budget = service.calculateOptimalBudget(deepCrawlSettings);

      expect(budget.maxDepth).toBeLessThanOrEqual(5);
    });

    it('should scale concurrency based on page count', () => {
      const smallBudget = service.calculateOptimalBudget({ ...mockCrawlSettings, maxPages: 5 });
      const largeBudget = service.calculateOptimalBudget({ ...mockCrawlSettings, maxPages: 80 });

      expect(largeBudget.recommendedConcurrency).toBeGreaterThan(smallBudget.recommendedConcurrency);
    });

    it('should include risk assessment', () => {
      const budget = service.calculateOptimalBudget(mockCrawlSettings);

      expect(['low', 'medium', 'high']).toContain(budget.riskLevel);
    });

    it('should include cost estimation', () => {
      const budget = service.calculateOptimalBudget(mockCrawlSettings);

      expect(budget.estimatedCost).toBeGreaterThan(0);
    });

    it('should include recommendations', () => {
      const budget = service.calculateOptimalBudget(mockCrawlSettings);

      expect(budget.recommendations.length).toBeGreaterThan(0);
      expect(budget.recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });
  });

  describe('estimateCrawlTime', () => {
    it('should estimate reasonable time for small crawls', () => {
      const time = service.estimateCrawlTime(10, 2);

      expect(time).toBeGreaterThan(0);
      expect(time).toBeLessThan(300); // Should be less than 5 minutes for small crawl
    });

    it('should estimate longer time for large crawls', () => {
      const smallTime = service.estimateCrawlTime(10, 2);
      const largeTime = service.estimateCrawlTime(50, 3);

      expect(largeTime).toBeGreaterThan(smallTime);
    });

    it('should increase time with depth complexity', () => {
      const shallowTime = service.estimateCrawlTime(20, 1);
      const deepTime = service.estimateCrawlTime(20, 4);

      expect(deepTime).toBeGreaterThan(shallowTime);
    });

    it('should include buffer for network delays', () => {
      const baseTime = 20 * 2.5; // 20 pages × 2.5 seconds base time
      const estimatedTime = service.estimateCrawlTime(20, 1);

      expect(estimatedTime).toBeGreaterThan(baseTime);
    });

    it('should return integer values', () => {
      const time = service.estimateCrawlTime(25, 3);

      expect(Number.isInteger(time)).toBe(true);
    });
  });

  describe('calculateOptimalConcurrency', () => {
    it('should return 1 for very small crawls', () => {
      expect(service.calculateOptimalConcurrency(5)).toBe(1);
      expect(service.calculateOptimalConcurrency(10)).toBe(1);
    });

    it('should return 2 for small crawls', () => {
      expect(service.calculateOptimalConcurrency(25)).toBe(2);
      expect(service.calculateOptimalConcurrency(50)).toBe(2);
    });

    it('should return 3 for medium crawls', () => {
      expect(service.calculateOptimalConcurrency(75)).toBe(3);
      expect(service.calculateOptimalConcurrency(100)).toBe(3);
    });

    it('should scale for large crawls but cap at reasonable limits', () => {
      const concurrency = service.calculateOptimalConcurrency(120);
      
      expect(concurrency).toBeGreaterThan(3);
      expect(concurrency).toBeLessThanOrEqual(4);
    });

    it('should never return concurrency greater than 4', () => {
      const largeConcurrency = service.calculateOptimalConcurrency(300);
      
      expect(largeConcurrency).toBeLessThanOrEqual(4);
    });
  });

  describe('estimateCrawlCost', () => {
    it('should calculate cost based on time and pages', () => {
      const cost = service.estimateCrawlCost(50, 300);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should scale cost with page count', () => {
      const smallCost = service.estimateCrawlCost(10, 100);
      const largeCost = service.estimateCrawlCost(50, 100);

      expect(largeCost).toBeGreaterThan(smallCost);
    });

    it('should scale cost with time', () => {
      const shortCost = service.estimateCrawlCost(20, 100);
      const longCost = service.estimateCrawlCost(20, 500);

      expect(longCost).toBeGreaterThan(shortCost);
    });

    it('should return reasonable precision', () => {
      const cost = service.estimateCrawlCost(25, 200);

      expect(cost.toString().split('.')[1]?.length).toBeLessThanOrEqual(3);
    });
  });

  describe('assessCrawlRisk', () => {
    it('should return low risk for small, shallow crawls', () => {
      const risk = service.assessCrawlRisk(10, 2, 1);

      expect(risk).toBe('low');
    });

    it('should return medium risk for moderate crawls', () => {
      const risk = service.assessCrawlRisk(50, 3, 2);

      expect(risk).toBe('medium');
    });

    it('should return high risk for large, deep crawls', () => {
      const risk = service.assessCrawlRisk(90, 5, 4);

      expect(risk).toBe('high');
    });

    it('should increase risk with page count', () => {
      const lowRisk = service.assessCrawlRisk(20, 2, 1);
      const highRisk = service.assessCrawlRisk(80, 2, 1);

      expect(highRisk).not.toBe('low');
      if (lowRisk === 'low') {
        expect(['medium', 'high']).toContain(highRisk);
      }
    });

    it('should increase risk with depth', () => {
      const shallowRisk = service.assessCrawlRisk(30, 2, 2);
      const deepRisk = service.assessCrawlRisk(30, 5, 2);

      expect(deepRisk).not.toBe('low');
      if (shallowRisk === 'low') {
        expect(['medium', 'high']).toContain(deepRisk);
      }
    });

    it('should increase risk with concurrency', () => {
      const lowConcurrencyRisk = service.assessCrawlRisk(30, 3, 1);
      const highConcurrencyRisk = service.assessCrawlRisk(30, 3, 4);

      if (lowConcurrencyRisk === 'low') {
        expect(['medium', 'high']).toContain(highConcurrencyRisk);
      }
    });
  });

  describe('generateBudgetRecommendations', () => {
    it('should provide recommendations for long crawls', () => {
      const recommendations = service.generateBudgetRecommendations(50, 3, 700, 'medium');

      expect(recommendations).toContain('Consider reducing page count or depth for faster crawling');
    });

    it('should provide risk-specific recommendations', () => {
      const highRiskRecs = service.generateBudgetRecommendations(50, 3, 300, 'high');
      const mediumRiskRecs = service.generateBudgetRecommendations(50, 3, 300, 'medium');

      expect(highRiskRecs).toContain('High risk crawl - consider splitting into smaller batches');
      expect(mediumRiskRecs).toContain('Medium risk crawl - implement retry logic for failed pages');
    });

    it('should provide efficiency recommendations', () => {
      const shallowWideRecs = service.generateBudgetRecommendations(60, 2, 200, 'low');
      const deepNarrowRecs = service.generateBudgetRecommendations(15, 4, 200, 'low');

      expect(shallowWideRecs).toContain('Shallow but wide crawl - consider increasing concurrency');
      expect(deepNarrowRecs).toContain('Deep but narrow crawl - single-threaded approach recommended');
    });

    it('should provide progress tracking recommendation for long crawls', () => {
      const recommendations = service.generateBudgetRecommendations(40, 3, 400, 'medium');

      expect(recommendations).toContain('Long crawl detected - implement progress tracking and resumption');
    });

    it('should provide optimal recommendation for good configurations', () => {
      const recommendations = service.generateBudgetRecommendations(20, 2, 120, 'low');

      expect(recommendations).toContain('Optimal crawl configuration - proceed with confidence');
    });

    it('should return non-empty recommendations', () => {
      const recommendations = service.generateBudgetRecommendations(30, 3, 250, 'medium');

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should return string array', () => {
      const recommendations = service.generateBudgetRecommendations(25, 2, 150, 'low');

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });
  });

  describe('business rule enforcement', () => {
    it('should enforce 100 page limit', () => {
      const settingsOverLimit = { ...mockCrawlSettings, maxPages: 150 };
      const budget = service.calculateOptimalBudget(settingsOverLimit);

      expect(budget.maxPages).toBe(100);
    });

    it('should enforce 5 depth limit', () => {
      const settingsOverLimit = { ...mockCrawlSettings, maxDepth: 10 };
      const budget = service.calculateOptimalBudget(settingsOverLimit);

      expect(budget.maxDepth).toBe(5);
    });

    it('should allow valid settings within limits', () => {
      const validSettings = { ...mockCrawlSettings, maxPages: 75, maxDepth: 4 };
      const budget = service.calculateOptimalBudget(validSettings);

      expect(budget.maxPages).toBe(75);
      expect(budget.maxDepth).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum valid settings', () => {
      const minSettings = { ...mockCrawlSettings, maxPages: 1, maxDepth: 1 };
      const budget = service.calculateOptimalBudget(minSettings);

      expect(budget.maxPages).toBe(1);
      expect(budget.maxDepth).toBe(1);
      expect(budget.estimatedTime).toBeGreaterThan(0);
      expect(budget.recommendedConcurrency).toBe(1);
    });

    it('should handle maximum valid settings', () => {
      const maxSettings = { ...mockCrawlSettings, maxPages: 100, maxDepth: 5 };
      const budget = service.calculateOptimalBudget(maxSettings);

      expect(budget.maxPages).toBe(100);
      expect(budget.maxDepth).toBe(5);
      expect(budget.riskLevel).toBe('high');
    });

    it('should provide consistent results for same input', () => {
      const budget1 = service.calculateOptimalBudget(mockCrawlSettings);
      const budget2 = service.calculateOptimalBudget(mockCrawlSettings);

      expect(budget1).toEqual(budget2);
    });
  });
});