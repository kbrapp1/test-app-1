/**
 * Content Extraction Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 250 lines - refactor into smaller services
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Always validate inputs using value objects
 * - Delegate complex calculations to separate methods
 * - Handle domain errors with specific error types
 * - No infrastructure concerns (Cheerio abstracted via interface)
 */

import { ContentExtractionError } from '../errors/ChatbotWidgetDomainErrors';

/**
 * Interface for HTML parser abstraction
 * 
 * AI INSTRUCTIONS:
 * - Abstract external HTML parsing library from domain logic
 * - Enable testing with mock implementations
 * - Keep domain layer pure from infrastructure dependencies
 */
export interface IHtmlParser {
  removeElements(selectors: string[]): void;
  findElement(selector: string): IHtmlElement | null;
  getBodyText(): string;
  getAllLinks(): ILinkElement[];
}

export interface IHtmlElement {
  getText(): string;
  exists(): boolean;
}

export interface ILinkElement {
  getHref(): string;
  isValid(): boolean;
}

/** Content Extraction Domain Service */
export class ContentExtractionService {
  /** Extract main content from HTML parser */
  extractMainContent(htmlParser: IHtmlParser): string {
    try {
      // Domain rule: Remove unwanted elements that don't contain meaningful content
      this.removeUnwantedElements(htmlParser);
      
      // Domain rule: Try to find main content areas in order of preference
      const content = this.findMainContentArea(htmlParser);
      
      // Domain rule: Validate content meets minimum quality standards
      const cleanedContent = this.cleanAndValidateContent(content);
      
      if (!this.isValidContent(cleanedContent)) {
        throw new ContentExtractionError(
          'Extracted content does not meet quality standards',
          { 
            contentLength: cleanedContent.length,
            minLength: this.getMinContentLength()
          }
        );
      }
      
      return cleanedContent;
      
    } catch (error) {
      if (error instanceof ContentExtractionError) {
        throw error;
      }
      
      throw new ContentExtractionError(
        'Failed to extract content from HTML',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /** Extract internal links for crawling */
  extractInternalLinks(
    htmlParser: IHtmlParser,
    baseUrl: string,
    maxDepth: number
  ): string[] {
    try {
      const allLinks = htmlParser.getAllLinks();
      const baseDomain = this.extractDomain(baseUrl);
      const validLinks: string[] = [];

      for (const link of allLinks) {
        try {
          if (!link.isValid()) continue;
          
          const href = link.getHref();
          const absoluteUrl = this.convertToAbsoluteUrl(href, baseUrl);
          const linkDomain = this.extractDomain(absoluteUrl);

          // Domain rule: Only include internal links
          if (linkDomain === baseDomain && 
              !validLinks.includes(absoluteUrl) &&
              this.isContentUrl(absoluteUrl)) {
            validLinks.push(absoluteUrl);
          }
        } catch (_error) {
          // Skip invalid URLs
          continue;
        }
      }

      return validLinks;
      
    } catch (error) {
      throw new ContentExtractionError(
        'Failed to extract internal links',
        { 
          baseUrl,
          error: error instanceof Error ? error.message : String(error)
        }
      );
    }
  }

  /** Check if URL is likely to contain text content worth crawling */
  isContentUrl(url: string): boolean {
    // Domain rule: Exclude obvious non-content URLs
    if (this.isExcludedPath(url)) {
      return false;
    }
    
    // Domain rule: Positive indicators for text content
    const textContentPatterns = [
      /\/(blog|article|news|post|page|content|about|help|faq|docs|documentation)/i,
      /\.(html|htm|php|asp|aspx)$/i,
      /\/$/  // Directory paths often contain HTML pages
    ];
    
    // Domain rule: URLs with no file extension are likely pages
    const hasNoExtension = !url.match(/\.[a-z0-9]{2,4}$/i);
    const hasTextIndicators = textContentPatterns.some(pattern => pattern.test(url));
    
    return hasNoExtension || hasTextIndicators;
  }

  /** Remove unwanted HTML elements that don't contain meaningful content */
  private removeUnwantedElements(htmlParser: IHtmlParser): void {
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside',
      '.ads', '.advertisement', '.sidebar', '.navigation',
      '.menu', '.popup', '.modal', '.cookie-notice'
    ];
    
    htmlParser.removeElements(unwantedSelectors);
  }

  /** Find main content area using business rules */
  private findMainContentArea(htmlParser: IHtmlParser): string {
    // Domain rule: Content area priority order
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main'
    ];

    for (const selector of contentSelectors) {
      const element = htmlParser.findElement(selector);
      if (element && element.exists()) {
        const content = element.getText();
        if (content.trim().length > 0) {
          return content;
        }
      }
    }

    // Fallback to body if no main content found
    return htmlParser.getBodyText();
  }

  /** Clean and validate content according to domain rules */
  private cleanAndValidateContent(content: string): string {
    return content
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/\n+/g, '\n') // Normalize line breaks
      .trim();
  }

  /** Validate content meets domain quality standards */
  private isValidContent(content: string): boolean {
    const minLength = this.getMinContentLength();
    return content.length >= minLength && 
           content.trim().length > 0 &&
           this.containsMeaningfulText(content);
  }

  /** Check if content contains meaningful text */
  private containsMeaningfulText(content: string): boolean {
    // Domain rule: Content should have reasonable word count
    const words = content.split(/\s+/).filter(word => word.length > 2);
    return words.length >= 10;
  }

  /** Get minimum content length requirement */
  private getMinContentLength(): number {
    return 100; // Domain rule: Minimum 100 characters for meaningful content
  }

  /** Extract domain from URL */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch (error) {
      throw new ContentExtractionError(
        'Invalid URL format',
        { url }
      );
    }
  }

  /** Convert relative URL to absolute URL */
  private convertToAbsoluteUrl(href: string, baseUrl: string): string {
    try {
      return new URL(href, baseUrl).href;
    } catch (error) {
      throw new ContentExtractionError(
        'Invalid URL format',
        { href, baseUrl }
      );
    }
  }

  /** Check if a path should be excluded from crawling */
  private isExcludedPath(url: string): boolean {
    const excludedPatterns = [
      // Media files - no textual content
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff|tif)$/i,
      /\.(mp4|avi|mov|wmv|flv|webm|mkv|mp3|wav|ogg|flac|aac)$/i,
      
      // Document files
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|7z)$/i,
      
      // Binary files
      /\.(exe|dmg|pkg|deb|rpm|msi|app)$/i,
      
      // Assets
      /\.(css|js|json|xml|rss|atom)$/i,
      
      // Admin areas
      /\/(admin|wp-admin|login|register|checkout|cart|account|profile|dashboard)/i,
      
      // Tracking and sharing
      /#/, /\?.*utm_/i, /\?.*fbclid/i, /\?.*gclid/i,
      /\/(api|wp-json|feed|rss|sitemap|share|print|email)/i
    ];

    return excludedPatterns.some(pattern => pattern.test(url));
  }
} 