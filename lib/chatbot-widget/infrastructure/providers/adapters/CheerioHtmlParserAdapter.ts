/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
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
import type { CheerioAPI, Cheerio } from 'cheerio';
import * as _cheerio from 'cheerio';

export class CheerioElementAdapter implements IHtmlElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Cheerio library compatibility
  constructor(private readonly cheerioElement: Cheerio<any>) {}

  getText(): string {
    return this.cheerioElement.text() || '';
  }

  exists(): boolean {
    return this.cheerioElement.length > 0;
  }
}

export class CheerioLinkElementAdapter implements ILinkElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Required for Cheerio library compatibility
  constructor(private readonly cheerioElement: Cheerio<any>) {}

  getHref(): string {
    return this.cheerioElement.attr('href') || '';
  }

  isValid(): boolean {
    const href = this.getHref();
    return Boolean(href && href.trim().length > 0);
  }
}

export class CheerioHtmlParserAdapter implements IHtmlParser {
  constructor(private readonly $: CheerioAPI) {}

  /** Remove elements by CSS selectors */
  removeElements(selectors: string[]): void {
    selectors.forEach(selector => {
      this.$(selector).remove();
    });
  }

  // Find single element by CSS selector
  findElement(selector: string): IHtmlElement | null {
    const element = this.$(selector);
    if (element.length === 0) {
      return null;
    }
    return new CheerioElementAdapter(element);
  }

  // Get body text content
  getBodyText(): string {
    const bodyElement = this.$('body');
    if (bodyElement.length > 0) {
      return bodyElement.text() || '';
    }
    
    // Fallback to full document text if no body element
    return this.$.text() || '';
  }

  // Get all link elements
  getAllLinks(): ILinkElement[] {
    const links: ILinkElement[] = [];
    
    this.$('a[href]').each((_, element) => {
      const linkAdapter = new CheerioLinkElementAdapter(this.$(element));
      links.push(linkAdapter);
    });
    
    return links;
  }
} 