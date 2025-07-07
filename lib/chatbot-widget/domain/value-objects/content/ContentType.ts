/**
 * ContentType Value Object
 * 
 * AI INSTRUCTIONS:
 * - Immutable enumeration for content classification
 * - Used to apply type-specific business rules
 * - Supports content sanitization and validation logic
 * - Enables content length limits and processing rules
 * - Follow @golden-rule value object patterns
 */

export enum ContentType {
  COMPANY_INFO = 'company_info',
  COMPLIANCE_GUIDELINES = 'compliance_guidelines',
  PRODUCT_CATALOG = 'product_catalog',
  SUPPORT_DOCS = 'support_docs',
  FAQ = 'faq',
  CUSTOM = 'custom'
}

// AI INSTRUCTIONS: Provide helper methods for content type operations.
// Keep functions pure and side-effect free. Support content type validation and conversion
export class ContentTypeUtils {
  // AI: Get human-readable label for content type
  static getLabel(contentType: ContentType): string {
    switch (contentType) {
      case ContentType.COMPANY_INFO:
        return 'Company Information';
      case ContentType.COMPLIANCE_GUIDELINES:
        return 'Compliance Guidelines';
      case ContentType.PRODUCT_CATALOG:
        return 'Product Catalog';
      case ContentType.SUPPORT_DOCS:
        return 'Support Documentation';
      case ContentType.FAQ:
        return 'FAQ';
      case ContentType.CUSTOM:
        return 'Custom Content';
      default:
        return 'Unknown Content Type';
    }
  }

  // AI: Get content type description for UI help text
  static getDescription(contentType: ContentType): string {
    switch (contentType) {
      case ContentType.COMPANY_INFO:
        return 'General information about your company, services, and expertise';
      case ContentType.COMPLIANCE_GUIDELINES:
        return 'Usage restrictions and service scope limitations for the chatbot';
      case ContentType.PRODUCT_CATALOG:
        return 'Information about your products and services offered';
      case ContentType.SUPPORT_DOCS:
        return 'Documentation and help resources for customers';
      case ContentType.FAQ:
        return 'Frequently asked questions and their answers';
      case ContentType.CUSTOM:
        return 'Custom content for specific business needs';
      default:
        return 'Content type description not available';
    }
  }

  // AI: Check if content type is valid
  static isValid(value: string): value is ContentType {
    return Object.values(ContentType).includes(value as ContentType);
  }

  // AI: Get all available content types
  static getAllTypes(): ContentType[] {
    return Object.values(ContentType);
  }

  // AI: Convert string to ContentType with validation
  static fromString(value: string): ContentType {
    if (!ContentTypeUtils.isValid(value)) {
      throw new Error(`Invalid content type: ${value}`);
    }
    return value as ContentType;
  }
} 