/**
 * Content Quality Score Value Object Tests
 * 
 * Tests to verify the ContentQualityScore value object works correctly
 * and enforces proper business rules and invariants.
 */

import { ContentQualityScore } from '../ContentQualityScore';
import { BusinessRuleViolationError } from '../../../errors/ChatbotWidgetDomainErrors';

describe('ContentQualityScore', () => {
  describe('create', () => {
    it('should create a valid quality score', () => {
      const score = ContentQualityScore.create(25, 20, 15, 10, ['Issue 1'], ['Strength 1']);
      
      expect(score.overallScore).toBe(70);
      expect(score.lengthScore).toBe(25);
      expect(score.completenessScore).toBe(20);
      expect(score.freshnessScore).toBe(15);
      expect(score.structureScore).toBe(10);
      expect(score.issues).toEqual(['Issue 1']);
      expect(score.strengths).toEqual(['Strength 1']);
    });

    it('should create a quality score with no issues or strengths', () => {
      const score = ContentQualityScore.create(20, 20, 20, 20);
      
      expect(score.overallScore).toBe(80);
      expect(score.issues).toEqual([]);
      expect(score.strengths).toEqual([]);
    });
  });

  describe('business methods', () => {
    it('should correctly identify high quality', () => {
      const highQuality = ContentQualityScore.create(25, 25, 25, 25);
      expect(highQuality.isHighQuality()).toBe(true);
      expect(highQuality.getQualityLevel()).toBe('excellent');

      const mediumQuality = ContentQualityScore.create(20, 20, 20, 20);
      expect(mediumQuality.isHighQuality()).toBe(true);
      expect(mediumQuality.getQualityLevel()).toBe('good');
    });

    it('should correctly identify low quality', () => {
      const lowQuality = ContentQualityScore.create(10, 10, 10, 10);  // Score = 40
      expect(lowQuality.isLowQuality()).toBe(true);
      expect(lowQuality.getQualityLevel()).toBe('poor');

      const fairQuality = ContentQualityScore.create(12, 12, 13, 13);  // Score = 50
      expect(fairQuality.isLowQuality()).toBe(false);
      expect(fairQuality.getQualityLevel()).toBe('fair');
    });

    it('should correctly identify content needing improvement', () => {
      const needsImprovement = ContentQualityScore.create(15, 15, 15, 15);
      expect(needsImprovement.needsImprovement()).toBe(true);

      const goodQuality = ContentQualityScore.create(20, 20, 20, 20);
      expect(goodQuality.needsImprovement()).toBe(false);
    });

    it('should correctly identify presence of issues and strengths', () => {
      const withIssues = ContentQualityScore.create(10, 10, 10, 10, ['Issue 1']);
      expect(withIssues.hasIssues()).toBe(true);
      expect(withIssues.hasStrengths()).toBe(false);

      const withStrengths = ContentQualityScore.create(25, 25, 25, 25, [], ['Strength 1']);
      expect(withStrengths.hasIssues()).toBe(false);
      expect(withStrengths.hasStrengths()).toBe(true);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid overall quality score', () => {
      expect(() => {
        ContentQualityScore.fromProps({
          qualityScore: 101,
          issues: [],
          strengths: [],
          lengthScore: 25,
          completenessScore: 25,
          freshnessScore: 25,
          structureScore: 26 // This would cause overall score > 100
        });
      }).toThrow(BusinessRuleViolationError);

      expect(() => {
        ContentQualityScore.fromProps({
          qualityScore: -1,
          issues: [],
          strengths: [],
          lengthScore: 0,
          completenessScore: 0,
          freshnessScore: 0,
          structureScore: 0
        });
      }).toThrow(BusinessRuleViolationError);
    });

    it('should throw error for invalid component scores', () => {
      expect(() => {
        ContentQualityScore.create(26, 20, 20, 20); // lengthScore > 25
      }).toThrow(BusinessRuleViolationError);

      expect(() => {
        ContentQualityScore.create(20, 26, 20, 20); // completenessScore > 25
      }).toThrow(BusinessRuleViolationError);

      expect(() => {
        ContentQualityScore.create(-1, 20, 20, 20); // negative lengthScore
      }).toThrow(BusinessRuleViolationError);
    });
  });

  describe('immutability', () => {
    it('should return copies of arrays to maintain immutability', () => {
      const originalIssues = ['Issue 1'];
      const originalStrengths = ['Strength 1'];
      const score = ContentQualityScore.create(20, 20, 20, 20, originalIssues, originalStrengths);

      const issues = score.issues;
      const strengths = score.strengths;

      // Modifying returned arrays should not affect the original
      issues.push('New Issue');
      strengths.push('New Strength');

      expect(score.issues).toEqual(['Issue 1']);
      expect(score.strengths).toEqual(['Strength 1']);
      expect(score.issues).not.toBe(issues); // Different reference
      expect(score.strengths).not.toBe(strengths); // Different reference
    });
  });

  describe('serialization', () => {
    it('should serialize and deserialize correctly', () => {
      const original = ContentQualityScore.create(25, 20, 15, 10, ['Issue'], ['Strength']);
      const serialized = original.toPlainObject();
      const deserialized = ContentQualityScore.fromProps(serialized);

      expect(deserialized.overallScore).toBe(original.overallScore);
      expect(deserialized.lengthScore).toBe(original.lengthScore);
      expect(deserialized.completenessScore).toBe(original.completenessScore);
      expect(deserialized.freshnessScore).toBe(original.freshnessScore);
      expect(deserialized.structureScore).toBe(original.structureScore);
      expect(deserialized.issues).toEqual(original.issues);
      expect(deserialized.strengths).toEqual(original.strengths);
    });
  });
});