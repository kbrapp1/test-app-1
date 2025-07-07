/**
 * SanitizedContent Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable value object representing processed content
 * - Ensures content has been sanitized according to business rules
 * - Provides metadata about sanitization process
 * - Follow @golden-rule value object patterns exactly
 * - Include validation and immutability guarantees
 * - Support comparison and equality operations
 */

import { ContentType } from './ContentType';

export class SanitizedContent {
  private readonly _content: string;
  private readonly _contentType: ContentType;
  private readonly _originalContent: string;
  private readonly _sanitizedAt: Date;
  private readonly _originalLength: number;
  private readonly _sanitizedLength: number;
  private readonly _wasTruncated: boolean;

  // AI: Validate all inputs in constructor, ensure immutability, calculate metadata
  constructor(
    sanitizedContent: string,
    contentType: ContentType,
    originalContent: string
  ) {
    this.validateInputs(sanitizedContent, contentType, originalContent);
    
    this._content = sanitizedContent;
    this._contentType = contentType;
    this._originalContent = originalContent;
    this._sanitizedAt = new Date();
    this._originalLength = originalContent.length;
    this._sanitizedLength = sanitizedContent.length;
    this._wasTruncated = sanitizedContent.endsWith('...');
    
    // Freeze the object to ensure immutability
    Object.freeze(this);
  }

  // AI: Get the sanitized content
  get content(): string {
    return this._content;
  }

  // AI: Get the content type
  get contentType(): ContentType {
    return this._contentType;
  }

  // AI: Get the original content before sanitization
  get originalContent(): string {
    return this._originalContent;
  }

  // AI: Get the timestamp when content was sanitized
  get sanitizedAt(): Date {
    return new Date(this._sanitizedAt);
  }

  // AI: Get the original content length
  get originalLength(): number {
    return this._originalLength;
  }

  // AI: Get the sanitized content length
  get sanitizedLength(): number {
    return this._sanitizedLength;
  }

  // AI: Check if content was truncated during sanitization
  get wasTruncated(): boolean {
    return this._wasTruncated;
  }

  // AI: Check if content was modified during sanitization
  get wasModified(): boolean {
    return this._content !== this._originalContent;
  }

  // AI: Get the percentage of content reduction
  get reductionPercentage(): number {
    if (this._originalLength === 0) return 0;
    return Math.round(((this._originalLength - this._sanitizedLength) / this._originalLength) * 100);
  }

  // AI: Provide useful metadata for debugging, include key sanitization metrics
  getSanitizationSummary(): {
    contentType: ContentType;
    originalLength: number;
    sanitizedLength: number;
    reductionPercentage: number;
    wasTruncated: boolean;
    wasModified: boolean;
    sanitizedAt: Date;
  } {
    return {
      contentType: this._contentType,
      originalLength: this._originalLength,
      sanitizedLength: this._sanitizedLength,
      reductionPercentage: this.reductionPercentage,
      wasTruncated: this._wasTruncated,
      wasModified: this.wasModified,
      sanitizedAt: this.sanitizedAt
    };
  }

  // AI: Compare based on content and type, not timestamps, support value object equality
  equals(other: SanitizedContent): boolean {
    if (!(other instanceof SanitizedContent)) {
      return false;
    }
    
    return (
      this._content === other._content &&
      this._contentType === other._contentType &&
      this._originalContent === other._originalContent
    );
  }

  // AI: Create a string representation for debugging
  toString(): string {
    return `SanitizedContent(${this._contentType}, ${this._sanitizedLength} chars, ${this.wasModified ? 'modified' : 'unchanged'})`;
  }

  // AI: Support immutable updates by creating new instances, maintain value object semantics
  withContent(newContent: string): SanitizedContent {
    return new SanitizedContent(newContent, this._contentType, this._originalContent);
  }

  // AI: Validate all required parameters, ensure content is not null, check content type validity
  private validateInputs(
    sanitizedContent: string,
    contentType: ContentType,
    originalContent: string
  ): void {
    if (typeof sanitizedContent !== 'string') {
      throw new Error('Sanitized content must be a string');
    }
    
    if (typeof originalContent !== 'string') {
      throw new Error('Original content must be a string');
    }
    
    if (!Object.values(ContentType).includes(contentType)) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    if (sanitizedContent.length > originalContent.length + 10) {
      // Allow for small additions like "..." but not major expansions
      throw new Error('Sanitized content cannot be significantly longer than original');
    }
  }
} 