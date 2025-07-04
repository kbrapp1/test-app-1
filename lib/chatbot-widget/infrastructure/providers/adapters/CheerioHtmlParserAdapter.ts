/**
 * Cheerio HTML Parser Adapter - Infrastructure Layer
 * 
 * AI INSTRUCTIONS:
 * - Implement domain interface for HTML parsing
 * - Abstract Cheerio library from domain layer
 * - Provide clean abstraction for HTML manipulation
 * - Handle technical implementation details only
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines
 */

import { 
  IHtmlParser, 
  IHtmlElement, 
  ILinkElement 
} from '../../../domain/services/ContentExtractionService';

/**
 * Cheerio Element Adapter
 * 
 * AI INSTRUCTIONS:
 * - Wrap Cheerio element with domain interface
 * - Hide Cheerio-specific implementation details
 * - Provide clean abstraction for element operations
 */
export class CheerioElementAdapter implements IHtmlElement {
  constructor(private readonly cheerioElement: any) {}

  getText(): string {
    return this.cheerioElement.text() || '';
  }

  exists(): boolean {
    return this.cheerioElement.length > 0;
  }
}

/**
 * Cheerio Link Element Adapter
 * 
 * AI INSTRUCTIONS:
 * - Wrap Cheerio link element with domain interface
 * - Provide link-specific operations
 * - Handle href extraction and validation
 */
export class CheerioLinkElementAdapter implements ILinkElement {
  constructor(private readonly cheerioElement: any) {}

  getHref(): string {
    return this.cheerioElement.attr('href') || '';
  }

  isValid(): boolean {
    const href = this.getHref();
    return Boolean(href && href.trim().length > 0);
  }
}

/**
 * Cheerio HTML Parser Adapter
 * 
 * AI INSTRUCTIONS:
 * - Implement domain HTML parser interface using Cheerio
 * - Abstract all Cheerio-specific operations
 * - Provide clean API for domain services
 * - Handle technical implementation only
 */
export class CheerioHtmlParserAdapter implements IHtmlParser {
  constructor(private readonly $: any) {}

  /**
   * Remove elements by CSS selectors
   */
  removeElements(selectors: string[]): void {
    selectors.forEach(selector => {
      this.$(selector).remove();
    });
  }

  /**
   * Find single element by CSS selector
   */
  findElement(selector: string): IHtmlElement | null {
    const element = this.$(selector);
    if (element.length === 0) {
      return null;
    }
    return new CheerioElementAdapter(element);
  }

  /**
   * Get body text content
   */
  getBodyText(): string {
    const bodyElement = this.$('body');
    if (bodyElement.length > 0) {
      return bodyElement.text() || '';
    }
    
    // Fallback to full document text if no body element
    return this.$.text() || '';
  }

  /**
   * Get all link elements
   */
  getAllLinks(): ILinkElement[] {
    const links: ILinkElement[] = [];
    
    this.$('a[href]').each((_: any, element: any) => {
      const linkAdapter = new CheerioLinkElementAdapter(this.$(element));
      links.push(linkAdapter);
    });
    
    return links;
  }
} 