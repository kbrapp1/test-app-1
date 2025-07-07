import { describe, it, expect } from 'vitest';
import { MessageCostCalculationService } from '../MessageCostCalculationService';

describe('MessageCostCalculationService', () => {
  describe('calculateTotalCost', () => {
    it('should calculate total cost for GPT-4o-mini correctly', () => {
      const totalCost = MessageCostCalculationService.calculateTotalCost(
        'gpt-4o-mini',
        1000, // prompt tokens
        500   // completion tokens
      );

      // Should return a number representing total cost in cents
      expect(typeof totalCost).toBe('number');
      expect(totalCost).toBeGreaterThan(0);
      expect(totalCost).toBeLessThan(1); // Should be a small fraction for this token count
    });

    it('should handle zero tokens correctly', () => {
      const totalCost = MessageCostCalculationService.calculateTotalCost('gpt-4o-mini', 0, 0);

      expect(totalCost).toBe(0);
    });

    it('should calculate cost for different models', () => {
      const gpt4Cost = MessageCostCalculationService.calculateTotalCost('gpt-4o', 1000, 500);
      const gpt4MiniCost = MessageCostCalculationService.calculateTotalCost('gpt-4o-mini', 1000, 500);

      // GPT-4o should cost more than GPT-4o-mini
      expect(gpt4Cost).toBeGreaterThan(gpt4MiniCost);
      expect(gpt4Cost).toBeGreaterThan(0);
      expect(gpt4MiniCost).toBeGreaterThan(0);
    });
  });

  describe('calculateCostBreakdown', () => {
    it('should provide detailed cost breakdown', () => {
      const breakdown = MessageCostCalculationService.calculateCostBreakdown(
        'gpt-4o-mini',
        1000,
        500
      );

      expect(breakdown.promptTokensCents).toBeGreaterThan(0);
      expect(breakdown.completionTokensCents).toBeGreaterThan(0);
      expect(breakdown.totalCents).toBeGreaterThan(0);
      expect(breakdown.displayCents).toBeGreaterThan(0);
      
      // Total should equal sum of components
      expect(breakdown.totalCents).toBeCloseTo(
        breakdown.promptTokensCents + breakdown.completionTokensCents,
        6
      );
    });

    it('should handle zero tokens in breakdown', () => {
      const breakdown = MessageCostCalculationService.calculateCostBreakdown('gpt-4o-mini', 0, 0);

      expect(breakdown.promptTokensCents).toBe(0);
      expect(breakdown.completionTokensCents).toBe(0);
      expect(breakdown.totalCents).toBe(0);
      expect(breakdown.displayCents).toBe(0);
    });

    it('should round display cents appropriately', () => {
      const breakdown = MessageCostCalculationService.calculateCostBreakdown('gpt-4o-mini', 1, 1);

      // Display cents should be rounded version of total cents
      expect(breakdown.displayCents).toBeLessThanOrEqual(breakdown.totalCents + 0.0001);
      expect(breakdown.displayCents).toBeGreaterThanOrEqual(breakdown.totalCents - 0.0001);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for given token count', () => {
      const estimatedCost = MessageCostCalculationService.estimateCost('gpt-4o-mini', 1000);

      expect(typeof estimatedCost).toBe('number');
      expect(estimatedCost).toBeGreaterThan(0);
      expect(estimatedCost).toBeLessThan(1); // Should be reasonable for 1000 tokens
    });

    it('should handle zero token estimation', () => {
      const estimatedCost = MessageCostCalculationService.estimateCost('gpt-4o-mini', 0);

      expect(estimatedCost).toBe(0);
    });

    it('should provide different estimates for different models', () => {
      const gpt4Estimate = MessageCostCalculationService.estimateCost('gpt-4o', 1000);
      const gpt4MiniEstimate = MessageCostCalculationService.estimateCost('gpt-4o-mini', 1000);

      expect(gpt4Estimate).toBeGreaterThan(gpt4MiniEstimate);
    });
  });

  describe('edge cases', () => {
    it('should handle large token counts', () => {
      const cost = MessageCostCalculationService.calculateTotalCost('gpt-4o-mini', 100000, 50000);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
      expect(isFinite(cost)).toBe(true);
    });

    it('should handle unknown models gracefully', () => {
      // Should fall back to default pricing (gpt-4o-mini)
      const cost = MessageCostCalculationService.calculateTotalCost('unknown-model', 1000, 500);

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should maintain precision for micro-costs', () => {
      const breakdown = MessageCostCalculationService.calculateCostBreakdown('gpt-4o-mini', 1, 1);

      // Should handle very small costs without losing precision
      expect(breakdown.totalCents).toBeGreaterThan(0);
      expect(breakdown.totalCents).toBeLessThan(0.001);
    });
  });
});