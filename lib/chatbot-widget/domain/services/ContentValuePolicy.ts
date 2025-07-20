/**
 * Content Value Policy Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Content value assessment and filtering
 * - Keep content evaluation logic pure and deterministic
 * - Never exceed 250 lines per @golden-rule
 * - Handle business rules for content value decisions
 * - Support configurable content filtering strategies
 */

/** Domain model for content value assessment */
export interface ContentValueAssessment {
  readonly hasValue: boolean;
  readonly reason: string;
  readonly contentType: 'high-value' | 'medium-value' | 'low-value' | 'excluded';
  readonly isLeadGenerated: boolean;
}

/**
 * Specialized Service for Content Value Assessment
 * 
 * AI INSTRUCTIONS:
 * - Handle content value evaluation for crawling decisions
 * - Apply business rules for content filtering
 * - Support lead generation content identification
 * - Enable content type categorization
 * - Provide clear reasoning for content value decisions
 */
export class ContentValuePolicy {

  /** Assess content value for general crawling */
  assessContentValue(url: string): ContentValueAssessment {
    // First check if content is generally valuable
    if (!this.isValuableContent(url)) {
      return {
        hasValue: false,
        reason: 'Low-value content type or pattern',
        contentType: 'excluded',
        isLeadGenerated: false
      };
    }

    // Check if content is valuable for lead generation
    const isLeadGen = this.isValuableLeadGenContent(url);
    const contentType = this.categorizeContentType(url);

    return {
      hasValue: true,
      reason: 'Meets content value criteria',
      contentType,
      isLeadGenerated: isLeadGen
    };
  }

  /** Determine if URL points to valuable content */
  isValuableContent(url: string): boolean {
    // Exclude file downloads and media
    if (this.isFileDownloadOrMedia(url)) {
      return false;
    }

    // Exclude administrative and system paths
    if (this.isAdministrativePath(url)) {
      return false;
    }

    // Exclude URLs with tracking parameters or fragments
    if (this.hasTrackingElements(url)) {
      return false;
    }

    // Exclude very long URLs (likely dynamic/generated)
    if (url.length > 200) {
      return false;
    }

    return true;
  }

  /** Determine if URL points to valuable content for lead generation */
  isValuableLeadGenContent(url: string): boolean {
    // First apply basic content filtering
    if (!this.isValuableContent(url)) {
      return false;
    }

    // Exclude pages that don't help with lead generation
    if (this.isExcludedFromLeadGen(url)) {
      return false;
    }

    // Include high-value lead generation pages
    if (this.isHighValueLeadGenContent(url)) {
      return true;
    }

    // For blog/article content, only include if it's service/product related
    if (this.isBlogContent(url)) {
      return this.isServiceRelatedBlogContent(url);
    }

    // Default: include if it doesn't match excluded patterns
    return true;
  }

  /** Categorize content type for prioritization */
  categorizeContentType(url: string): 'high-value' | 'medium-value' | 'low-value' | 'excluded' {
    if (!this.isValuableContent(url)) {
      return 'excluded';
    }

    // High-value content patterns
    const highValuePatterns = [
      /\/(services|service|what-we-do|solutions|offerings)/i,
      /\/(products|product|portfolio)/i,
      /\/(about|company|who-we-are|overview)/i,
      /\/(benefits|value|why-choose|advantages)/i,
      /\/(case-study|case-studies|success|client|customer)/i,
      /\/(contact|get-started|quote|consultation|demo)/i
    ];

    if (highValuePatterns.some(pattern => pattern.test(url))) {
      return 'high-value';
    }

    // Medium-value content patterns
    const mediumValuePatterns = [
      /\/(testimonial|review|feedback)/i,
      /\/(faq|help|support|documentation)/i,
      /\/(pricing|cost|investment|package|plan)/i,
      /\/(blog|article|news|post)/i,
      /\/(process|methodology|approach|how-it-works)/i
    ];

    if (mediumValuePatterns.some(pattern => pattern.test(url))) {
      return 'medium-value';
    }

    return 'low-value';
  }

  /** Check if URL is file download or media */
  private isFileDownloadOrMedia(url: string): boolean {
    const excludedExtensions = [
      /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i, // Images
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,   // Documents
      /\.(zip|rar|tar|gz|7z)$/i,                // Archives
      /\.(mp4|avi|mov|wmv|mp3|wav)$/i,          // Media
      /\.(css|js|xml|json)$/i                   // Technical files
    ];

    return excludedExtensions.some(pattern => pattern.test(url));
  }

  /** Check if URL is administrative path */
  private isAdministrativePath(url: string): boolean {
    const excludedPaths = [
      /\/(admin|login|api|feed|rss)/i,
      /\/(wp-admin|wp-login|wp-json)/i,  // WordPress specific
      /\/(user|account|profile|settings)/i,
      /\/(cart|checkout|payment)/i,
      /\/(search|filter)\?/i
    ];

    return excludedPaths.some(pattern => pattern.test(url));
  }

  /** Check if URL has tracking elements */
  private hasTrackingElements(url: string): boolean {
    return /#/.test(url) || /[?&]utm_/.test(url);
  }

  /** Check if URL should be excluded from lead generation */
  private isExcludedFromLeadGen(url: string): boolean {
    const excludedLeadGenPaths = [
      /\/(career|careers|jobs|job-posting|employment)/i,
      /\/(privacy|terms|legal|cookie|gdpr)/i,
      /\/(blog|news|press|media|article)(?!.*?(service|product|solution|benefit))/i,
      /\/(event|webinar|conference)(?!.*?(service|product|solution))/i,
      /\/(team|staff|employee|bio|biography)/i,
      /\/(history|timeline|milestone|award)/i,
      /\/(download|resource)(?!.*?(guide|whitepaper|case-study))/i,
      /\/(sitemap|index|archive|tag|category)$/i,
      /\/(thank-you|thanks|confirmation|success)/i,
      /\/(404|error|maintenance)/i,
      /\/(login|register|signup|account|profile)/i,
      /\/(search|filter|sort)[\?&]/i
    ];

    return excludedLeadGenPaths.some(pattern => pattern.test(url));
  }

  /** Check if URL is high-value lead generation content */
  private isHighValueLeadGenContent(url: string): boolean {
    const highValueLeadGenPaths = [
      /\/(services|service|what-we-do|solutions|offerings)/i,
      /\/(products|product|portfolio)/i,
      /\/(about|company|who-we-are|overview)/i,
      /\/(benefits|value|why-choose|advantages)/i,
      /\/(case-study|case-studies|success|client|customer)/i,
      /\/(testimonial|review|feedback)/i,
      /\/(contact|get-started|quote|consultation|demo)/i,
      /\/(faq|help|support|documentation)/i,
      /\/(pricing|cost|investment|package|plan)/i,
      /\/(industry|sector|vertical)/i,
      /\/(process|methodology|approach|how-it-works)/i,
      /\/(expertise|specialization|capability)/i,
      /\/(integration|partnership|collaboration)/i,
      /\/(compliance|security|certification)/i,
      /\/(roi|return|value|benefit|impact)/i,
      /\/(guide|whitepaper|ebook|resource).*?(service|product|solution)/i
    ];

    return highValueLeadGenPaths.some(pattern => pattern.test(url));
  }

  /** Check if URL is blog content */
  private isBlogContent(url: string): boolean {
    return /\/(blog|article|news|post)/i.test(url);
  }

  /** Check if blog content is service-related */
  private isServiceRelatedBlogContent(url: string): boolean {
    const serviceRelatedPatterns = [
      /\b(service|product|solution|benefit|advantage|feature|capability)\b/i,
      /\b(how-to|guide|tutorial|best-practice|tip|strategy)\b/i,
      /\b(case-study|success-story|client-story|customer-story)\b/i,
      /\b(industry|sector|vertical|market|trend)\b/i,
      /\b(roi|return|value|cost|saving|efficiency)\b/i
    ];

    return serviceRelatedPatterns.some(pattern => pattern.test(url));
  }
}