/**
 * Content Similarity Utilities Tests
 * 
 * AI INSTRUCTIONS:
 * - Test core similarity algorithms and duplicate detection
 * - Validate consolidation doesn't break existing functionality
 * - Keep test focused and under 200 lines per @golden-rule
 */

import { ContentSimilarityUtilities, SimilarityOptions } from '../ContentSimilarityUtilities';

describe('ContentSimilarityUtilities', () => {
  const sampleItems = [
    { id: '1', content: 'This is a test content' },
    { id: '2', content: 'This is a test content' }, // Exact duplicate
    { id: '3', content: 'Different content here' },
    { id: '4', content: 'this is a test content' }, // Case variation
  ];

  describe('normalizeContent', () => {
    it('should normalize content by lowercasing and trimming', () => {
      expect(ContentSimilarityUtilities.normalizeContent('  TEST Content  ')).toBe('test content');
    });
  });

  describe('findExactDuplicates', () => {
    it('should find exact duplicate content', () => {
      const result = ContentSimilarityUtilities.findExactDuplicates(sampleItems);
      
      expect(result.duplicateCount).toBe(2); // Items 2 and 4 are duplicates of 1
      expect(result.duplicateIds).toContain('2');
      expect(result.duplicateIds).toContain('4');
      expect(result.duplicateGroups).toHaveLength(1);
      expect(result.duplicateGroups[0].count).toBe(3);
    });

    it('should return empty results when no duplicates exist', () => {
      const uniqueItems = [
        { id: '1', content: 'Unique content one' },
        { id: '2', content: 'Unique content two' },
      ];
      
      const result = ContentSimilarityUtilities.findExactDuplicates(uniqueItems);
      
      expect(result.duplicateCount).toBe(0);
      expect(result.duplicateIds).toHaveLength(0);
      expect(result.duplicateGroups).toHaveLength(0);
    });
  });

  describe('calculateJaccardSimilarity', () => {
    it('should calculate similarity between texts', () => {
      const similarity = ContentSimilarityUtilities.calculateJaccardSimilarity(
        'the quick brown fox',
        'the quick red fox'
      );
      
      expect(similarity).toBeGreaterThan(0.5);
      expect(similarity).toBeLessThan(1);
    });

    it('should return 1 for identical texts', () => {
      const similarity = ContentSimilarityUtilities.calculateJaccardSimilarity(
        'identical text',
        'identical text'
      );
      
      expect(similarity).toBe(1);
    });

    it('should return 0 for empty texts', () => {
      const similarity = ContentSimilarityUtilities.calculateJaccardSimilarity('', 'some text');
      expect(similarity).toBe(0);
    });
  });

  describe('areContentsSimilar', () => {
    it('should detect exact similarity', () => {
      const options: SimilarityOptions = { algorithm: 'exact' };
      
      expect(ContentSimilarityUtilities.areContentsSimilar(
        'Test Content',
        'test content',
        options
      )).toBe(true);
    });

    it('should detect Jaccard similarity above threshold', () => {
      const options: SimilarityOptions = { 
        algorithm: 'jaccard',
        threshold: 0.3 // Lower threshold for test phrases
      };
      
      expect(ContentSimilarityUtilities.areContentsSimilar(
        'the quick brown fox jumps',
        'the quick red fox runs',
        options
      )).toBe(true);
    });

    it('should detect normalized similarity for FAQ-style questions', () => {
      const options: SimilarityOptions = { algorithm: 'normalized' };
      
      expect(ContentSimilarityUtilities.areContentsSimilar(
        'What is the return policy for products?',
        'What is the return policy for items?',
        options
      )).toBe(true);
    });
  });

  describe('calculateDuplicationRate', () => {
    it('should calculate duplication percentage', () => {
      const rate = ContentSimilarityUtilities.calculateDuplicationRate(sampleItems);
      
      expect(rate).toBe(50); // 2 duplicates out of 4 items = 50%
    });

    it('should return 0 for items with no duplicates', () => {
      const uniqueItems = [
        { id: '1', content: 'Unique one' },
        { id: '2', content: 'Unique two' },
      ];
      
      const rate = ContentSimilarityUtilities.calculateDuplicationRate(uniqueItems);
      expect(rate).toBe(0);
    });
  });
});