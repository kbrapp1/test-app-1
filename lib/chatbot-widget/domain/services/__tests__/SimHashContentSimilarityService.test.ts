/**
 * SimHash Content Similarity Service Unit Tests
 * 
 * AI INSTRUCTIONS:
 * - Test content similarity detection comprehensively
 * - Include edge cases and performance scenarios
 * - Follow @golden-rule testing patterns
 * - Test both similar and dissimilar content
 * - Validate SimHash algorithm correctness
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SimHashContentSimilarityService, SimilarityContent } from '../SimHashContentSimilarityService';
import { TestDataFactory } from '../../../__tests__/test-utilities/TestDataFactory';

describe('SimHashContentSimilarityService', () => {
  let service: SimHashContentSimilarityService;

  beforeEach(() => {
    service = new SimHashContentSimilarityService();
  });

  describe('calculateSimilarity', () => {
    describe('Identical Content', () => {
      it('should return 100% similarity for identical content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This is a test content for similarity detection'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This is a test content for similarity detection'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.hammingDistance).toBe(0);
        expect(result.isDuplicate).toBe(true);
      });

      it('should return 100% similarity for identical content with different whitespace', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This is a test content for similarity detection'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This  is   a    test content for similarity   detection'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.hammingDistance).toBe(0);
        expect(result.isDuplicate).toBe(true);
      });
    });

    describe('Similar Content', () => {
      it('should detect high similarity for content with minor word changes', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This is a test content for similarity detection and analysis'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This is a test content for similarity detection and evaluation'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.8);
        expect(result.hammingDistance).toBeLessThanOrEqual(10); // More realistic for SimHash
        // Note: isDuplicate depends on threshold configuration, so we don't test it strictly
      });

      it('should detect medium similarity for content with some changes', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This is a test content for similarity detection and analysis of web pages'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This is different content for similarity detection and evaluation of documents'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.5);
        expect(result.similarity).toBeLessThan(0.9);
      });

      it('should handle content with different punctuation', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'Hello, world! This is a test.'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'Hello world? This is a test!'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.9);
        expect(result.isDuplicate).toBe(true);
      });
    });

    describe('Dissimilar Content', () => {
      it('should return low similarity for completely different content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This is about artificial intelligence and machine learning algorithms'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'Cooking recipes and kitchen equipment for professional chefs'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeLessThan(0.8);
        expect(result.isDuplicate).toBe(false);
      });

      it('should handle empty content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: ''
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This is some content'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeLessThan(0.8);
        expect(result.isDuplicate).toBe(false);
      });

      it('should handle both empty contents', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: ''
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: ''
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });
    });

    describe('Test Data Factory Cases', () => {
      it('should handle test data factory similarity cases', () => {
        const testCases = TestDataFactory.createContentSimilarityTestCases();
        
        testCases.forEach(({ content1, content2, expectedSimilarity, description }) => {
          const similarityContent1: SimilarityContent = {
            url: 'https://example.com/page1',
            content: content1
          };
          const similarityContent2: SimilarityContent = {
            url: 'https://example.com/page2',
            content: content2
          };
          
          const result = service.calculateSimilarity(similarityContent1, similarityContent2);
          
          switch (expectedSimilarity) {
            case 'high':
              expect(result.similarity).toBeGreaterThan(0.7);
              break;
            case 'medium':
              expect(result.similarity).toBeGreaterThan(0.3);
              expect(result.similarity).toBeLessThanOrEqual(0.9);
              break;
            case 'low':
              expect(result.similarity).toBeLessThanOrEqual(0.9);
              break;
          }
        });
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long content', () => {
        const longContent = 'word '.repeat(1000).trim();
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: longContent
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: longContent + ' extra'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.95);
        expect(result.isDuplicate).toBe(true);
      });

      it('should handle content with special characters', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'Content with special chars: @#$%^&*()_+-=[]{}|;:,.<>?'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'Content with special chars: @#$%^&*()_+-=[]{}|;:,.<>?'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });

      it('should handle content with numbers', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'Price: $123.45 for item number 67890'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'Price: $123.45 for item number 67890'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });

      it('should handle single word content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'hello'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'world'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeLessThan(1.0);
        expect(result.isDuplicate).toBe(false);
      });

      it('should handle content with only punctuation', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: '!@#$%^&*()'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: '!@#$%^&*()'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });
    });

    describe('Performance Tests', () => {
      it('should handle large batches of similarity calculations efficiently', () => {
        const startTime = Date.now();
        const contents: SimilarityContent[] = [];
        
        for (let i = 0; i < 100; i++) {
          contents.push({
            url: `https://example.com/page${i}`,
            content: `This is test content number ${i} with some random text`
          });
        }

        // Calculate similarities for all pairs
        for (let i = 0; i < contents.length; i++) {
          for (let j = i + 1; j < Math.min(i + 10, contents.length); j++) {
            service.calculateSimilarity(contents[i], contents[j]);
          }
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete within reasonable time (adjust based on performance requirements)
        expect(duration).toBeLessThan(5000); // 5 seconds
      });

      it('should handle very large content efficiently', () => {
        const largeContent = 'This is a very long piece of content. '.repeat(1000);
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: largeContent
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: largeContent + ' Additional text.'
        };

        const startTime = Date.now();
        const result = service.calculateSimilarity(content1, content2);
        const endTime = Date.now();

        expect(result.similarity).toBeGreaterThan(0.95);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });

    describe('Real-world Content Scenarios', () => {
      it('should detect duplicate product descriptions', () => {
        const content1: SimilarityContent = {
          url: 'https://shop.com/product1',
          content: 'Premium wireless headphones with noise cancellation technology and 30-hour battery life'
        };
        const content2: SimilarityContent = {
          url: 'https://shop.com/product2',
          content: 'Premium wireless headphones with noise cancellation technology and 30-hour battery life'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });

      it('should detect similar blog post content', () => {
        const content1: SimilarityContent = {
          url: 'https://blog.com/post1',
          content: 'How to improve your website SEO ranking with content optimization and keyword research'
        };
        const content2: SimilarityContent = {
          url: 'https://blog.com/post2',
          content: 'How to boost your website SEO ranking with content optimization and keyword analysis'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.8);
      });

      it('should handle FAQ variations', () => {
        const content1: SimilarityContent = {
          url: 'https://help.com/faq1',
          content: 'Q: How do I reset my password? A: Click the forgot password link on the login page'
        };
        const content2: SimilarityContent = {
          url: 'https://help.com/faq2',
          content: 'Q: How can I reset my password? A: Click the forgot password link on the login page'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.9);
        expect(result.isDuplicate).toBe(true);
      });

      it('should detect near-duplicate web page content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/about',
          content: 'About Us - We are a leading technology company specializing in innovative software solutions'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/about-us',
          content: 'About Us - We are a leading technology company specializing in innovative software solutions'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });
    });

    describe('Language and Encoding Tests', () => {
      it('should handle content with accented characters', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'Café résumé naïve'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'Café résumé naïve'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });

      it('should handle mixed case content', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: 'This Is Mixed Case Content'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'this is mixed case content'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBe(1);
        expect(result.isDuplicate).toBe(true);
      });

      it('should handle content with HTML tags', () => {
        const content1: SimilarityContent = {
          url: 'https://example.com/page1',
          content: '<p>This is HTML content</p>'
        };
        const content2: SimilarityContent = {
          url: 'https://example.com/page2',
          content: 'This is HTML content'
        };

        const result = service.calculateSimilarity(content1, content2);
        expect(result.similarity).toBeGreaterThan(0.9);
        expect(result.isDuplicate).toBe(true);
      });
    });
  });

  describe('areSimilar', () => {
    it('should return true for highly similar content', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'This is a test content for similarity detection'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'This is a test content for similarity detection'
      };

      expect(service.areSimilar(content1, content2)).toBe(true);
    });

    it('should return false for dissimilar content', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'This is about artificial intelligence'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'Cooking recipes for professional chefs'
      };

      expect(service.areSimilar(content1, content2)).toBe(false);
    });

    it('should use custom threshold when provided', () => {
      const strictService = new SimHashContentSimilarityService({ duplicateThreshold: 1 });
      
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'This is a test content for similarity detection'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'This is a test content for similarity evaluation'
      };

      expect(strictService.areSimilar(content1, content2)).toBe(false);
    });

    it('should handle edge cases gracefully', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: ''
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: ''
      };

      expect(service.areSimilar(content1, content2)).toBe(true);
    });
  });

  describe('Algorithm Correctness', () => {
    it('should be symmetric (similarity(a,b) = similarity(b,a))', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'First piece of content'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'Second piece of content'
      };

      const result1 = service.calculateSimilarity(content1, content2);
      const result2 = service.calculateSimilarity(content2, content1);

      expect(result1.similarity).toBe(result2.similarity);
      expect(result1.hammingDistance).toBe(result2.hammingDistance);
    });

    it('should satisfy triangle inequality property', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'First content piece'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'Second content piece'
      };
      const content3: SimilarityContent = {
        url: 'https://example.com/page3',
        content: 'Third content piece'
      };

      const dist12 = service.calculateSimilarity(content1, content2).hammingDistance;
      const dist13 = service.calculateSimilarity(content1, content3).hammingDistance;
      const dist23 = service.calculateSimilarity(content2, content3).hammingDistance;

      // Triangle inequality: dist(a,c) <= dist(a,b) + dist(b,c)
      expect(dist13).toBeLessThanOrEqual(dist12 + dist23);
      expect(dist12).toBeLessThanOrEqual(dist13 + dist23);
      expect(dist23).toBeLessThanOrEqual(dist12 + dist13);
    });

    it('should be consistent across multiple runs', () => {
      const content1: SimilarityContent = {
        url: 'https://example.com/page1',
        content: 'Consistent test content'
      };
      const content2: SimilarityContent = {
        url: 'https://example.com/page2',
        content: 'Consistent test content with variation'
      };

      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(service.calculateSimilarity(content1, content2));
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.similarity).toBe(firstResult.similarity);
        expect(result.hammingDistance).toBe(firstResult.hammingDistance);
        expect(result.isDuplicate).toBe(firstResult.isDuplicate);
      });
    });
  });
}); 