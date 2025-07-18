/**
 * ContentAnalyticsService Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Handle content statistics and analytics at infrastructure boundary
 * - Provide content metrics and validation status analysis
 * - Follow @golden-rule infrastructure layer patterns exactly
 * - Keep under 250 lines - focus on analytics and statistics only
 * - Maintain separation between infrastructure and domain concerns
 * - Support monitoring and reporting requirements
 */

import { ContentType } from '../../../../domain/value-objects/content/ContentType';
import { ContentProcessingMetadata } from '../../../../domain/repositories/IKnowledgeContentRepository';
import { ContentProcessingService } from './ContentProcessingService';

export interface ContentStatistics {
  totalContentItems: number;
  contentTypes: ContentType[];
  totalCharacters: number;
  lastModified: Date | null;
  validationStatus: 'valid' | 'warnings' | 'errors';
}

export class ContentAnalyticsService {
  private readonly contentProcessor: ContentProcessingService;

  constructor(contentProcessor?: ContentProcessingService) {
    this.contentProcessor = contentProcessor ?? new ContentProcessingService();
  }

  // AI: Analyze content statistics for analytics dashboard
  async analyzeContentStatistics(
    rawContent: {
      companyInfo: string | null;
      complianceGuidelines: string | null;
      productCatalog: string | null;
      supportDocs: string | null;
      faqs: readonly { question: string; answer: string; }[];
    },
    metadata: ContentProcessingMetadata
  ): Promise<ContentStatistics> {
    const contentTypes: ContentType[] = [];
    let totalCharacters = 0;
    let totalContentItems = 0;
    let hasWarnings = false;
    let hasErrors = false;

    // AI: Analyze each content type
    const contentMappings = [
      { content: rawContent.companyInfo, type: ContentType.COMPANY_INFO },
      { content: rawContent.complianceGuidelines, type: ContentType.COMPLIANCE_GUIDELINES },
      { content: rawContent.productCatalog, type: ContentType.PRODUCT_CATALOG },
      { content: rawContent.supportDocs, type: ContentType.SUPPORT_DOCS }
    ];

    for (const { content, type } of contentMappings) {
      if (content && content.trim()) {
        contentTypes.push(type);
        totalCharacters += content.length;
        totalContentItems++;

        // AI: Check validation status
        try {
          const validation = await this.contentProcessor.validateContent(content, type);
          if (!validation.isValid) {
            hasErrors = true;
          }
          if (validation.warnings.length > 0) {
            hasWarnings = true;
          }
        } catch {
          hasErrors = true;
        }
      }
    }

    // AI: Handle FAQs separately
    if (rawContent.faqs.length > 0) {
      contentTypes.push(ContentType.FAQ);
      totalContentItems += rawContent.faqs.length;
      totalCharacters += rawContent.faqs.reduce((sum, faq) => sum + faq.question.length + faq.answer.length, 0);
    }

    const validationStatus = hasErrors ? 'errors' : hasWarnings ? 'warnings' : 'valid';

    return {
      totalContentItems,
      contentTypes: [...new Set(contentTypes)], // Remove duplicates
      totalCharacters,
      lastModified: metadata.lastUpdated,
      validationStatus
    };
  }

  // AI: Generate content processing metadata for monitoring
  async generateContentMetadata(
    organizationId: string,
    rawContent: {
      companyInfo: string | null;
      complianceGuidelines: string | null;
      productCatalog: string | null;
      supportDocs: string | null;
      faqs: readonly { question: string; answer: string; }[];
    },
    lastUpdated?: Date
  ): Promise<ContentProcessingMetadata> {
    // AI: Count validation errors across all content types
    const contentTypes = [
      { content: rawContent.companyInfo, type: ContentType.COMPANY_INFO },
      { content: rawContent.complianceGuidelines, type: ContentType.COMPLIANCE_GUIDELINES },
      { content: rawContent.productCatalog, type: ContentType.PRODUCT_CATALOG },
      { content: rawContent.supportDocs, type: ContentType.SUPPORT_DOCS }
    ];

    const validationErrorCount = await this.contentProcessor.countValidationErrors(
      contentTypes.filter(item => item.content).map(item => ({ content: item.content!, type: item.type }))
    );

    return {
      organizationId,
      lastUpdated: lastUpdated ?? new Date(),
      processedAt: new Date(),
      sanitizationVersion: '1.0.0',
      hasValidationErrors: validationErrorCount > 0,
      validationErrorCount
    };
  }

  // AI: Calculate content health score for monitoring
  calculateContentHealthScore(statistics: ContentStatistics): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    let score = 100;
    const recommendations: string[] = [];

    // AI: Deduct points for validation issues
    if (statistics.validationStatus === 'errors') {
      score -= 30;
      recommendations.push('Fix content validation errors');
    } else if (statistics.validationStatus === 'warnings') {
      score -= 15;
      recommendations.push('Address content validation warnings');
    }

    // AI: Deduct points for low content coverage
    if (statistics.totalContentItems < 3) {
      score -= 20;
      recommendations.push('Add more content types for better coverage');
    }

    // AI: Deduct points for very short content
    if (statistics.totalCharacters < 500) {
      score -= 15;
      recommendations.push('Expand content with more detailed information');
    }

    // AI: Bonus points for comprehensive content
    if (statistics.contentTypes.length >= 4) {
      score += 5;
    }

    // AI: Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // AI: Determine status based on score
    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 90) {
      status = 'excellent';
    } else if (score >= 75) {
      status = 'good';
    } else if (score >= 60) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return { score, status, recommendations };
  }

  // AI: Get content type distribution for analytics
  getContentTypeDistribution(statistics: ContentStatistics): Record<ContentType, {
    present: boolean;
    percentage: number;
  }> {
    const distribution: Record<string, { present: boolean; percentage: number }> = {};
    const _totalTypes = Object.values(ContentType).length;

    // AI: Initialize all content types
    Object.values(ContentType).forEach(type => {
      distribution[type] = {
        present: statistics.contentTypes.includes(type),
        percentage: 0
      };
    });

    // AI: Calculate percentages
    if (statistics.contentTypes.length > 0) {
      statistics.contentTypes.forEach(type => {
        distribution[type].percentage = (1 / statistics.contentTypes.length) * 100;
      });
    }

    return distribution as Record<ContentType, { present: boolean; percentage: number }>;
  }
} 