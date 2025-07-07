/**
 * ContentExtractionService Tests
 * 
 * Comprehensive tests for the content extraction domain service.
 * Tests HTML content extraction, link processing, and business rules.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentExtractionService, IHtmlParser, IHtmlElement, ILinkElement } from '../ContentExtractionService';
import { ContentExtractionError } from '../../errors/ChatbotWidgetDomainErrors';

describe('ContentExtractionService', () => {
  let service: ContentExtractionService;
  let mockHtmlParser: IHtmlParser;
  let mockElement: IHtmlElement;
  let mockLink: ILinkElement;

  beforeEach(() => {
    service = new ContentExtractionService();

    // Create mock HTML element
    mockElement = {
      getText: vi.fn(),
      exists: vi.fn()
    };

    // Create mock link element
    mockLink = {
      getHref: vi.fn(),
      isValid: vi.fn()
    };

    // Create mock HTML parser
    mockHtmlParser = {
      removeElements: vi.fn(),
      findElement: vi.fn(),
      getBodyText: vi.fn(),
      getAllLinks: vi.fn()
    };
  });

  describe('extractMainContent', () => {
    it('should extract content from main element successfully', () => {
      // Arrange
      const expectedContent = 'This is the main content of the page with meaningful text that meets quality standards. The content contains many words that are longer than two characters each and provides sufficient meaningful information for the domain validation rules to pass successfully.';
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(expectedContent);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(mockHtmlParser.removeElements).toHaveBeenCalledWith([
        'script', 'style', 'nav', 'header', 'footer', 'aside',
        '.ads', '.advertisement', '.sidebar', '.navigation',
        '.menu', '.popup', '.modal', '.cookie-notice'
      ]);
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('main');
      expect(result).toBe(expectedContent);
    });

    it('should try multiple content selectors in priority order', () => {
      // Arrange
      const expectedContent = 'Article content with sufficient length and meaningful words to pass validation standards. This content contains many meaningful words that are longer than two characters each and provides sufficient content for domain validation rules to pass successfully.';
      
      // Mock main element not found
      mockHtmlParser.findElement = vi.fn()
        .mockReturnValueOnce(null) // main
        .mockReturnValueOnce(mockElement); // article
      
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(expectedContent);

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('main');
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('article');
      expect(result).toBe(expectedContent);
    });

    it('should fallback to body text when no main content found', () => {
      // Arrange
      const bodyContent = 'Body text content that contains enough meaningful words to satisfy domain validation rules for content quality.';
      mockHtmlParser.findElement = vi.fn().mockReturnValue(null);
      mockHtmlParser.getBodyText = vi.fn().mockReturnValue(bodyContent);

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(mockHtmlParser.getBodyText).toHaveBeenCalled();
      expect(result).toBe(bodyContent);
    });

    it('should normalize whitespace in extracted content', () => {
      // Arrange
      const contentWithExtraSpaces = 'This   content  has    extra   spaces\n\n\nand   multiple\n\nline   breaks  with  meaningful  words  that  are  longer  than  two  characters  each  for  domain  validation  to  pass  successfully  and  meet  quality  standards.';
      const expectedNormalized = 'This content has extra spaces and multiple line breaks with meaningful words that are longer than two characters each for domain validation to pass successfully and meet quality standards.';
      
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(contentWithExtraSpaces);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(result).toBe(expectedNormalized);
    });

    it('should throw error for content below minimum length', () => {
      // Arrange
      const shortContent = 'Too short'; // Below 100 character minimum
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(shortContent);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act & Assert
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);
    });

    it('should throw error for content without meaningful words', () => {
      // Arrange
      const meaninglessContent = 'a b c d e f g h i j k l m n o p q r s t u v w x y z 1 2 3 4 5 6 7 8 9 0 ! @ # $ % ^ & * ( ) - + = { } [ ] | \\ : ; " \' < > , . ? /';
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(meaninglessContent);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act & Assert
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);
    });

    it('should handle HTML parsing errors gracefully', () => {
      // Arrange
      const parsingError = new Error('HTML parsing failed');
      mockHtmlParser.removeElements = vi.fn().mockImplementation(() => {
        throw parsingError;
      });

      // Act & Assert
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);
    });

    it('should validate content has at least 10 meaningful words', () => {
      // Arrange
      const validContent = 'This content has exactly ten meaningful words plus some extra content for good measure and validation.';
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(validContent);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(result).toBe(validContent);
    });
  });

  describe('extractInternalLinks', () => {
    it('should extract valid internal links', () => {
      // Arrange
      const baseUrl = 'https://example.com';
      const maxDepth = 2;
      
      const mockLinks = [
        { getHref: () => '/about', isValid: () => true },
        { getHref: () => '/contact', isValid: () => true },
        { getHref: () => 'https://example.com/services', isValid: () => true },
        { getHref: () => 'https://external.com/page', isValid: () => true }, // External
        { getHref: () => '/image.jpg', isValid: () => true } // Non-content
      ];

      mockHtmlParser.getAllLinks = vi.fn().mockReturnValue(mockLinks);

      // Act
      const result = service.extractInternalLinks(mockHtmlParser, baseUrl, maxDepth);

      // Assert
      expect(result).toEqual([
        'https://example.com/about',
        'https://example.com/contact',
        'https://example.com/services'
      ]);
    });

    it('should filter out duplicate URLs', () => {
      // Arrange
      const baseUrl = 'https://example.com';
      const mockLinks = [
        { getHref: () => '/about', isValid: () => true },
        { getHref: () => '/about', isValid: () => true }, // Duplicate
        { getHref: () => 'https://example.com/about', isValid: () => true } // Same as relative
      ];

      mockHtmlParser.getAllLinks = vi.fn().mockReturnValue(mockLinks);

      // Act
      const result = service.extractInternalLinks(mockHtmlParser, baseUrl, 2);

      // Assert
      expect(result).toEqual(['https://example.com/about']);
    });

    it('should handle invalid URLs gracefully', () => {
      // Arrange
      const baseUrl = 'https://example.com';
      const mockLinks = [
        { getHref: () => 'javascript:void(0)', isValid: () => false },
        { getHref: () => '/valid-page', isValid: () => true },
        { getHref: () => 'mailto:test@example.com', isValid: () => false }
      ];

      mockHtmlParser.getAllLinks = vi.fn().mockReturnValue(mockLinks);

      // Act
      const result = service.extractInternalLinks(mockHtmlParser, baseUrl, 2);

      // Assert
      expect(result).toEqual(['https://example.com/valid-page']);
    });

    it('should throw error for invalid base URL', () => {
      // Arrange
      const invalidBaseUrl = 'not-a-url';
      mockHtmlParser.getAllLinks = vi.fn().mockReturnValue([]);

      // Act & Assert
      expect(() => service.extractInternalLinks(mockHtmlParser, invalidBaseUrl, 2))
        .toThrow(ContentExtractionError);
    });

    it('should handle link extraction errors', () => {
      // Arrange
      const baseUrl = 'https://example.com';
      const extractionError = new Error('Link extraction failed');
      mockHtmlParser.getAllLinks = vi.fn().mockImplementation(() => {
        throw extractionError;
      });

      // Act & Assert
      expect(() => service.extractInternalLinks(mockHtmlParser, baseUrl, 2))
        .toThrow(ContentExtractionError);
    });
  });

  describe('isContentUrl', () => {
    it('should identify content URLs correctly', () => {
      // Arrange & Act & Assert
      expect(service.isContentUrl('https://example.com/blog/post-title')).toBe(true);
      expect(service.isContentUrl('https://example.com/article/news-story')).toBe(true);
      expect(service.isContentUrl('https://example.com/about')).toBe(true);
      expect(service.isContentUrl('https://example.com/help/faq')).toBe(true);
      expect(service.isContentUrl('https://example.com/docs/documentation')).toBe(true);
      expect(service.isContentUrl('https://example.com/page.html')).toBe(true);
      expect(service.isContentUrl('https://example.com/content.php')).toBe(true);
      expect(service.isContentUrl('https://example.com/directory/')).toBe(true);
      expect(service.isContentUrl('https://example.com/no-extension')).toBe(true);
    });

    it('should exclude non-content URLs', () => {
      // Arrange & Act & Assert
      
      // Media files
      expect(service.isContentUrl('https://example.com/image.jpg')).toBe(false);
      expect(service.isContentUrl('https://example.com/video.mp4')).toBe(false);
      expect(service.isContentUrl('https://example.com/audio.mp3')).toBe(false);
      expect(service.isContentUrl('https://example.com/icon.svg')).toBe(false);
      
      // Document files
      expect(service.isContentUrl('https://example.com/document.pdf')).toBe(false);
      expect(service.isContentUrl('https://example.com/spreadsheet.xlsx')).toBe(false);
      expect(service.isContentUrl('https://example.com/presentation.pptx')).toBe(false);
      
      // Binary files
      expect(service.isContentUrl('https://example.com/installer.exe')).toBe(false);
      expect(service.isContentUrl('https://example.com/archive.zip')).toBe(false);
      
      // Assets
      expect(service.isContentUrl('https://example.com/styles.css')).toBe(false);
      expect(service.isContentUrl('https://example.com/script.js')).toBe(false);
      expect(service.isContentUrl('https://example.com/data.json')).toBe(false);
      
      // Admin areas
      expect(service.isContentUrl('https://example.com/admin/dashboard')).toBe(false);
      expect(service.isContentUrl('https://example.com/wp-admin/login')).toBe(false);
      expect(service.isContentUrl('https://example.com/checkout/payment')).toBe(false);
      
      // Tracking URLs
      expect(service.isContentUrl('https://example.com/page#section')).toBe(false);
      expect(service.isContentUrl('https://example.com/page?utm_source=google')).toBe(false);
      expect(service.isContentUrl('https://example.com/page?fbclid=123')).toBe(false);
      expect(service.isContentUrl('https://example.com/api/endpoint')).toBe(false);
      expect(service.isContentUrl('https://example.com/feed/rss')).toBe(false);
    });

    it('should handle edge cases', () => {
      // Arrange & Act & Assert
      expect(service.isContentUrl('https://example.com/')).toBe(true); // Root directory
      expect(service.isContentUrl('https://example.com/')).toBe(true); // No trailing slash (testing with slash)
      expect(service.isContentUrl('https://example.com/page-with-dashes')).toBe(true);
      expect(service.isContentUrl('https://example.com/123-numeric-page')).toBe(true);
    });
  });

  describe('Business Rule Validation', () => {
    it('should enforce minimum content length of 100 characters', () => {
      // Arrange
      const contentJustUnder100 = 'A'.repeat(99);
      const contentJustOver100 = 'This content has exactly one hundred characters or more and contains meaningful words for testing purposes.';
      
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Test content under 100 characters
      mockElement.getText = vi.fn().mockReturnValue(contentJustUnder100);
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);

      // Test content over 100 characters
      mockElement.getText = vi.fn().mockReturnValue(contentJustOver100);
      expect(() => service.extractMainContent(mockHtmlParser)).not.toThrow();
    });

    it('should require at least 10 meaningful words', () => {
      // Arrange
      const contentWith9Words = 'The content has exactly nine meaningful words only here'; // 9 words > 2 chars, but need 100+ chars
      const contentWith10Words = 'This content has exactly ten meaningful words that are properly formed and provides sufficient length for domain validation rules to pass successfully and meet quality standards perfectly.'; // 10+ words > 2 chars
      
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Test content with 9 meaningful words
      mockElement.getText = vi.fn().mockReturnValue(contentWith9Words + ' '.repeat(50)); // Pad to meet length requirement
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);

      // Test content with 10 meaningful words
      mockElement.getText = vi.fn().mockReturnValue(contentWith10Words);
      expect(() => service.extractMainContent(mockHtmlParser)).not.toThrow();
    });

    it('should validate that meaningful words are longer than 2 characters', () => {
      // Arrange
      const contentWithShortWords = 'a b c d e f g h i j k l m n o p q r s t u v w x y z aa bb cc dd ee ff gg hh ii jj kk ll mm nn oo pp qq rr ss tt uu vv ww xx yy zz';
      const contentWithLongWords = 'This content contains meaningful words that are longer than two characters each and should pass the validation check successfully.';
      
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Test content with words ≤ 2 characters
      mockElement.getText = vi.fn().mockReturnValue(contentWithShortWords);
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);

      // Test content with words > 2 characters
      mockElement.getText = vi.fn().mockReturnValue(contentWithLongWords);
      expect(() => service.extractMainContent(mockHtmlParser)).not.toThrow();
    });

    it('should only extract links from same domain', () => {
      // Arrange
      const baseUrl = 'https://example.com';
      const mockLinks = [
        { getHref: () => 'https://example.com/internal', isValid: () => true },
        { getHref: () => 'https://other.com/external', isValid: () => true },
        { getHref: () => 'https://subdomain.example.com/sub', isValid: () => true },
        { getHref: () => '/relative-internal', isValid: () => true }
      ];

      mockHtmlParser.getAllLinks = vi.fn().mockReturnValue(mockLinks);

      // Act
      const result = service.extractInternalLinks(mockHtmlParser, baseUrl, 2);

      // Assert
      expect(result).toEqual([
        'https://example.com/internal',
        'https://example.com/relative-internal'
      ]);
      expect(result).not.toContain('https://other.com/external');
      expect(result).not.toContain('https://subdomain.example.com/sub');
    });
  });

  describe('Error Handling', () => {
    it('should wrap non-domain errors in ContentExtractionError', () => {
      // Arrange
      const systemError = new TypeError('System error');
      mockHtmlParser.removeElements = vi.fn().mockImplementation(() => {
        throw systemError;
      });

      // Act & Assert
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(ContentExtractionError);
    });

    it('should preserve ContentExtractionError instances', () => {
      // Arrange
      const domainError = new ContentExtractionError('Domain validation failed', { test: true });
      mockHtmlParser.removeElements = vi.fn().mockImplementation(() => {
        throw domainError;
      });

      // Act & Assert
      expect(() => service.extractMainContent(mockHtmlParser))
        .toThrow(domainError);
    });

    it('should provide meaningful error context', () => {
      // Arrange
      const shortContent = 'Short';
      mockElement.exists = vi.fn().mockReturnValue(true);
      mockElement.getText = vi.fn().mockReturnValue(shortContent);
      mockHtmlParser.findElement = vi.fn().mockReturnValue(mockElement);

      // Act & Assert
      try {
        service.extractMainContent(mockHtmlParser);
        expect.fail('Should have thrown ContentExtractionError');
      } catch (error) {
        expect(error).toBeInstanceOf(ContentExtractionError);
        expect((error as ContentExtractionError).context).toEqual({
          contentLength: shortContent.length,
          minLength: 100
        });
      }
    });
  });

  describe('Content Selector Priority', () => {
    it('should try content selectors in correct priority order', () => {
      // Arrange
      const content = 'Priority content that meets all validation requirements and contains sufficient meaningful words for testing.';
      let selectorCallCount = 0;
      const expectedSelectors = [
        'main',
        'article', 
        '[role="main"]',
        '.content',
        '.main-content',
        '#content',
        '#main'
      ];

      mockHtmlParser.findElement = vi.fn().mockImplementation((selector) => {
        expect(selector).toBe(expectedSelectors[selectorCallCount]);
        selectorCallCount++;
        
        // Return element only for the 4th selector (.content)
        if (selector === '.content') {
          mockElement.exists = vi.fn().mockReturnValue(true);
          mockElement.getText = vi.fn().mockReturnValue(content);
          return mockElement;
        }
        return null;
      });

      // Act
      const result = service.extractMainContent(mockHtmlParser);

      // Assert
      expect(selectorCallCount).toBe(4); // Should stop at .content
      expect(result).toBe(content);
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('main');
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('article');
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('[role="main"]');
      expect(mockHtmlParser.findElement).toHaveBeenCalledWith('.content');
    });
  });
});