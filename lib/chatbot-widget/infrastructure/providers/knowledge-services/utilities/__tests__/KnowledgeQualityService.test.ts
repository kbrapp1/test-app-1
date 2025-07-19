/**
 * Knowledge Quality Service Tests
 * 
 * Tests to verify the refactored KnowledgeQualityService works correctly
 * and maintains backward compatibility with the original API.
 */

import { KnowledgeQualityService } from '../KnowledgeQualityService';
import { KnowledgeItem } from '../../../../../domain/services/interfaces/IKnowledgeRetrievalService';

describe('KnowledgeQualityService (Refactored)', () => {
  const createMockKnowledgeItem = (overrides: Partial<KnowledgeItem> = {}): KnowledgeItem => ({
    id: 'test-id',
    title: 'Test Title',
    content: 'This is test content that is reasonably long and well structured.',
    category: 'general',
    tags: ['test', 'quality'],
    relevanceScore: 0.8,
    lastUpdated: new Date(),
    source: 'test',
    ...overrides
  });

  describe('analyzeContentQuality', () => {
    it('should return quality analysis for good content', () => {
      const items = [
        createMockKnowledgeItem({
          content: 'This is a well-structured piece of content with good length and proper formatting. It has headers and bullet points:\n\n# Header\n\n- Point 1\n- Point 2\n\nAnd it provides comprehensive information about the topic.'
        }),
        createMockKnowledgeItem({
          content: 'Another quality piece of content that demonstrates good practices:\n\n## Section\n\n1. Step one\n2. Step two\n\nWith detailed explanations and proper structure.'
        })
      ];

      const result = KnowledgeQualityService.analyzeContentQuality(items);

      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('strengths');
      expect(typeof result.qualityScore).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(result.qualityScore).toBeGreaterThan(0);
    });

    it('should return low quality score for poor content', () => {
      const items = [
        createMockKnowledgeItem({
          content: 'Short',
          title: '',
          tags: []
        })
      ];

      const result = KnowledgeQualityService.analyzeContentQuality(items);

      expect(result.qualityScore).toBeLessThan(50);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle empty items array', () => {
      const result = KnowledgeQualityService.analyzeContentQuality([]);

      expect(result).toHaveProperty('qualityScore');
      expect(result).toHaveProperty('issues');
      expect(result).toHaveProperty('strengths');
    });
  });

  describe('assessContentCompleteness', () => {
    it('should assess completeness correctly', () => {
      const items = [
        createMockKnowledgeItem(),
        createMockKnowledgeItem({ title: '', tags: [] })
      ];

      const result = KnowledgeQualityService.assessContentCompleteness(items);

      expect(result).toHaveProperty('completenessScore');
      expect(result).toHaveProperty('missingElements');
      expect(typeof result.completenessScore).toBe('number');
      expect(Array.isArray(result.missingElements)).toBe(true);
    });
  });

  describe('calculateContentFreshness', () => {
    it('should calculate freshness correctly', () => {
      const items = [
        createMockKnowledgeItem({ lastUpdated: new Date() }),
        createMockKnowledgeItem({ lastUpdated: new Date(2020, 0, 1) }) // Old date
      ];

      const result = KnowledgeQualityService.calculateContentFreshness(items);

      expect(result).toHaveProperty('freshnessScore');
      expect(result).toHaveProperty('staleItems');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.freshnessScore).toBe('number');
      expect(typeof result.staleItems).toBe('number');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('calculateReadabilityMetrics', () => {
    it('should calculate readability metrics', () => {
      const items = [
        createMockKnowledgeItem({
          content: 'This is easy to read. Short sentences. Clear content.'
        }),
        createMockKnowledgeItem({
          content: 'This is a more complex sentence with multiple clauses and longer structure that might be harder to read and understand for some users.'
        })
      ];

      const result = KnowledgeQualityService.calculateReadabilityMetrics(items);

      expect(result).toHaveProperty('averageReadability');
      expect(result).toHaveProperty('distribution');
      expect(typeof result.averageReadability).toBe('number');
      expect(typeof result.distribution).toBe('object');
      expect(result.distribution).toHaveProperty('easy');
      expect(result.distribution).toHaveProperty('medium');
      expect(result.distribution).toHaveProperty('hard');
    });
  });

  describe('analyzeContentDuplication', () => {
    it('should detect duplicate content', () => {
      const items = [
        createMockKnowledgeItem({ id: '1', content: 'Duplicate content' }),
        createMockKnowledgeItem({ id: '2', content: 'Duplicate content' }),
        createMockKnowledgeItem({ id: '3', content: 'Unique content' })
      ];

      const result = KnowledgeQualityService.analyzeContentDuplication(items);

      expect(result).toHaveProperty('duplicateCount');
      expect(result).toHaveProperty('duplicateRate');
      expect(result).toHaveProperty('examples');
      expect(result.duplicateCount).toBeGreaterThan(0);
      expect(Array.isArray(result.examples)).toBe(true);
    });
  });

  describe('analyzeContentStructure', () => {
    it('should analyze content structure', () => {
      const items = [
        createMockKnowledgeItem({
          content: '# Header\n\n- Bullet point\n\n1. Numbered list'
        }),
        createMockKnowledgeItem({
          content: 'Plain text without structure'
        })
      ];

      const result = KnowledgeQualityService.analyzeContentStructure(items);

      expect(result).toHaveProperty('structureTypes');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.structureTypes).toBe('object');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('identifyContentGaps', () => {
    it('should identify content gaps', () => {
      const items = [
        createMockKnowledgeItem({
          content: 'Technical API documentation with configuration details'
        }),
        createMockKnowledgeItem({
          content: 'Step by step process how to configure the system'
        })
      ];

      const result = KnowledgeQualityService.identifyContentGaps(items);

      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('coverage');
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(typeof result.coverage).toBe('object');
    });
  });

  describe('calculateReadabilityScore', () => {
    it('should calculate readability for single item', () => {
      const item = createMockKnowledgeItem({
        content: 'This is a simple sentence. Easy to read.'
      });

      const result = KnowledgeQualityService.calculateReadabilityScore(item);

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('API Compatibility', () => {
    it('should maintain the same API as before refactoring', () => {
      const items = [createMockKnowledgeItem()];

      // All these methods should exist and return the expected structure
      expect(typeof KnowledgeQualityService.analyzeContentQuality).toBe('function');
      expect(typeof KnowledgeQualityService.assessContentCompleteness).toBe('function');
      expect(typeof KnowledgeQualityService.calculateContentFreshness).toBe('function');
      expect(typeof KnowledgeQualityService.calculateReadabilityMetrics).toBe('function');
      expect(typeof KnowledgeQualityService.analyzeContentDuplication).toBe('function');
      expect(typeof KnowledgeQualityService.analyzeContentStructure).toBe('function');
      expect(typeof KnowledgeQualityService.identifyContentGaps).toBe('function');
      expect(typeof KnowledgeQualityService.calculateReadabilityScore).toBe('function');

      // Test that each method returns the expected structure
      const qualityResult = KnowledgeQualityService.analyzeContentQuality(items);
      expect(qualityResult).toEqual(
        expect.objectContaining({
          qualityScore: expect.any(Number),
          issues: expect.any(Array),
          strengths: expect.any(Array)
        })
      );
    });
  });
});