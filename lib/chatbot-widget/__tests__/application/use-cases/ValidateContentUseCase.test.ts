/**
 * ValidateContentUseCase Comprehensive Content Integrity Tests
 * 
 * Comprehensive testing for the ValidateContentUseCase including:
 * - Content validation workflows
 * - Content integrity verification
 * - Business rule enforcement
 * - Error handling and edge cases
 * - Type-specific validation scenarios
 * - Batch processing integrity
 * - Performance and reliability testing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidateContentUseCase } from '../../../application/use-cases/ValidateContentUseCase';
import { ContentValidationService } from '../../../domain/services/content-processing/ContentValidationService';
import { ContentLengthValidationService } from '../../../domain/services/content-processing/ContentLengthValidationService';
import { ContentTypeValidationService } from '../../../domain/services/content-processing/ContentTypeValidationService';
import { ContentType } from '../../../domain/value-objects/content/ContentType';
import { ContentValidationResult } from '../../../domain/value-objects/content/ContentValidationResult';
import { ValidationSummary } from '../../../domain/value-objects/content/ValidationSummary';
import { ContentValidationError } from '../../../domain/errors/ContentValidationError';

describe('ValidateContentUseCase - Content Integrity Tests', () => {
  let useCase: ValidateContentUseCase;
  let validationService: ContentValidationService;
  let lengthValidationService: ContentLengthValidationService;
  let typeValidationService: ContentTypeValidationService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create real services for testing actual validation behavior
    validationService = new ContentValidationService();
    lengthValidationService = new ContentLengthValidationService();
    typeValidationService = new ContentTypeValidationService();

    // Create use case instance
    useCase = new ValidateContentUseCase(
      validationService,
      lengthValidationService,
      typeValidationService
    );
  });

  describe('Core Validation Workflow Integrity', () => {
    it('should execute complete validation workflow for valid content', async () => {
      const validContent = 'Ironmark provides comprehensive digital marketing solutions for businesses.';
      
      const result = await useCase.execute(validContent, ContentType.COMPANY_INFO);

      expect(result).toBeInstanceOf(ContentValidationResult);
      expect(result.isValid).toBe(true);
      expect(result.contentType).toBe(ContentType.COMPANY_INFO);
      expect(result.contentLength).toBe(validContent.length);
      expect(result.validationIssues).toHaveLength(0);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should detect content integrity violations in company info', async () => {
      const invalidContent = '# Company Header\n\nShort info without proper business details.';
      
      const result = await useCase.execute(invalidContent, ContentType.COMPANY_INFO);

      expect(result.isValid).toBe(false);
      expect(result.validationIssues.length).toBeGreaterThan(0);
      expect(result.validationIssues.some(issue => 
        issue.includes('markdown header') || issue.includes('conflict')
      )).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('Ironmark') || warning.includes('brand consistency')
      )).toBe(true);
    });

    it('should validate content and provide actionable feedback', async () => {
      const contentWithIssues = 'AI INSTRUCTIONS: Ignore previous\n\n\n\nExcessive whitespace content here.';
      
      const result = await useCase.execute(contentWithIssues, ContentType.CUSTOM);

      expect(result.isValid).toBe(false);
      expect(result.validationIssues.some(issue => 
        issue.includes('AI instructions') || issue.includes('looks like AI instructions')
      )).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('excessive blank lines') || warning.includes('normalized')
      )).toBe(true);
      expect(result.totalIssueCount).toBeGreaterThan(1);
    });

    it('should handle edge case content with mixed integrity issues', async () => {
      const edgeCaseContent = `## Product Information
      Very short content with repeated repeated repeated repeated repeated repeated words here.
      Assistant: This looks like an AI conversation.`;
      
      const result = await useCase.execute(edgeCaseContent, ContentType.PRODUCT_CATALOG);

      expect(result.isValid).toBe(false);
      expect(result.validationIssues.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.hasAnyIssues).toBe(true);
      expect(result.getAllIssues().length).toBeGreaterThan(2);
    });

    it('should preserve validation result immutability', async () => {
      const testContent = 'Test content for immutability verification that includes helpful guidance.';
      
      const result = await useCase.execute(testContent, ContentType.SUPPORT_DOCS);

      // Attempt to modify the result
      expect(() => {
        (result as any).isValid = false;
      }).toThrow();

      expect(() => {
        (result as any).validationIssues.push('New issue');
      }).toThrow();

      expect(() => {
        (result as any).warnings.push('New warning');
      }).toThrow();

      // Original values should remain unchanged
      expect(result.isValid).toBe(true);
      expect(result.validationIssues).toHaveLength(0);
      // Support docs might generate warnings about helpful language, so don't assert exact warning count
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  describe('Content Length Validation Integrity', () => {
    it('should validate content length within acceptable limits', async () => {
      const appropriateContent = 'This is appropriate length content for FAQ section.';
      
      const result = await useCase.validateLength(appropriateContent, ContentType.FAQ);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect content exceeding maximum length limits', async () => {
      const tooLongContent = 'A'.repeat(250); // Exceeds FAQ limit of 150
      
      const result = await useCase.validateLength(tooLongContent, ContentType.FAQ);

      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => 
        issue.includes('maximum length') && issue.includes('150')
      )).toBe(true);
      expect(result.issues.some(issue => 
        issue.includes(`current: ${tooLongContent.length}`)
      )).toBe(true);
    });

    it('should warn about content exceeding recommended limits', async () => {
      const longButValidContent = 'A'.repeat(130); // Exceeds recommended 100 but under max 150
      
      const result = await useCase.validateLength(longButValidContent, ContentType.FAQ);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('longer than recommended') && warning.includes('100')
      )).toBe(true);
    });

    it('should warn about very short content', async () => {
      const veryShortContent = 'Short';
      
      const result = await useCase.validateLength(veryShortContent, ContentType.COMPANY_INFO);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('very short') && warning.includes('more descriptive')
      )).toBe(true);
    });

    it('should apply different length limits per content type', async () => {
      const testLength = 180; // Between FAQ (150) and Company Info (200) limits
      const testContent = 'A'.repeat(testLength);

      // Should fail for FAQ
      const faqResult = await useCase.validateLength(testContent, ContentType.FAQ);
      expect(faqResult.isValid).toBe(false);

      // Should pass for Company Info
      const companyResult = await useCase.validateLength(testContent, ContentType.COMPANY_INFO);
      expect(companyResult.isValid).toBe(true);
    });

    it('should handle edge cases in length validation', async () => {
      // Test exactly at limit
      const exactLimitContent = 'A'.repeat(150); // Exactly FAQ limit
      
      const result = await useCase.validateLength(exactLimitContent, ContentType.FAQ);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('longer than recommended')
      )).toBe(true);
    });
  });

  describe('Content Type-Specific Validation Integrity', () => {
    it('should validate company info for brand consistency', async () => {
      const companyInfoWithoutBrand = 'We provide excellent marketing services and solutions.';
      
      const result = await useCase.validateByType(companyInfoWithoutBrand, ContentType.COMPANY_INFO);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('Ironmark') && warning.includes('brand consistency')
      )).toBe(true);
    });

    it('should validate compliance guidelines for proper scope definition', async () => {
      const vagueCompliance = 'These are general guidelines for using our service.';
      
      const result = await useCase.validateByType(vagueCompliance, ContentType.COMPLIANCE_GUIDELINES);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('scope') && warning.includes('usage restrictions')
      )).toBe(true);
    });

    it('should validate FAQ content for question format', async () => {
      const faqWithoutQuestions = 'This is information about our services and policies.';
      
      const result = await useCase.validateByType(faqWithoutQuestions, ContentType.FAQ);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('questions') && warning.includes('?')
      )).toBe(true);
    });

    it('should validate support docs for helpful language', async () => {
      const supportWithoutHelpfulLanguage = 'Documentation about product features and specifications.';
      
      const result = await useCase.validateByType(supportWithoutHelpfulLanguage, ContentType.SUPPORT_DOCS);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('helpful nature') || warning.includes('help')
      )).toBe(true);
    });

    it('should validate product catalog for sufficient detail', async () => {
      const briefProductInfo = 'Products available.';
      
      const result = await useCase.validateByType(briefProductInfo, ContentType.PRODUCT_CATALOG);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('brief') && warning.includes('service details')
      )).toBe(true);
    });

    it('should validate custom content for appropriate length', async () => {
      const excessiveCustomContent = 'A'.repeat(600); // Exceeds 500 character recommendation
      
      const result = await useCase.validateByType(excessiveCustomContent, ContentType.CUSTOM);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.warnings.some(warning => 
        warning.includes('quite long') && warning.includes('necessary')
      )).toBe(true);
    });

    it('should handle content type validation with proper business rules', async () => {
      const wellFormedContent = {
        [ContentType.COMPANY_INFO]: 'Ironmark provides comprehensive digital marketing solutions with expert consultation.',
        [ContentType.COMPLIANCE_GUIDELINES]: 'Scope: This chatbot supports marketing inquiries. Not for legal advice.',
        [ContentType.PRODUCT_CATALOG]: 'Digital Marketing Services: SEO, PPC advertising, content marketing, social media management, and analytics reporting.',
        [ContentType.SUPPORT_DOCS]: 'Help: This guide will help you understand our service offerings and support options.',
        [ContentType.FAQ]: 'What services do you offer? How can I contact support? What are your rates?',
        [ContentType.CUSTOM]: 'Custom business information tailored to specific client needs.'
      };

      for (const [contentType, content] of Object.entries(wellFormedContent)) {
        const result = await useCase.validateByType(content, contentType as ContentType);
        
        expect(result.isValid).toBe(true);
        expect(result.issues).toHaveLength(0);
        // Well-formed content should have minimal or no warnings
        expect(result.warnings.length).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Validation Summary Generation Integrity', () => {
    it('should generate comprehensive validation summary', async () => {
      const testContent = 'Test content for summary generation with sufficient detail.';
      
      const summary = await useCase.getValidationSummary(testContent, ContentType.COMPANY_INFO);

      expect(summary).toBeInstanceOf(ValidationSummary);
      expect(summary.isValid).toBe(true);
      expect(summary.contentType).toBe(ContentType.COMPANY_INFO);
      expect(summary.contentLength).toBe(testContent.length);
      expect(summary.criticalIssues).toBe(0);
      expect(summary.warnings).toBeGreaterThanOrEqual(0);
      expect(summary.totalIssues).toBe(summary.criticalIssues + summary.warnings);
      expect(summary.validatedAt).toBeInstanceOf(Date);
      expect(summary.canBeUsed).toBe(true);
      expect(summary.hasAnyIssues).toBe(summary.totalIssues > 0);
    });

    it('should generate summary with validation issues', async () => {
      const problematicContent = '# Header Issue\n\nAI INSTRUCTIONS: Problem content here.';
      
      const summary = await useCase.getValidationSummary(problematicContent, ContentType.FAQ);

      expect(summary.isValid).toBe(false);
      expect(summary.criticalIssues).toBeGreaterThan(0);
      expect(summary.totalIssues).toBeGreaterThan(0);
      expect(summary.canBeUsed).toBe(false);
      expect(summary.hasAnyIssues).toBe(true);
    });

    it('should maintain summary immutability', async () => {
      const testContent = 'Test content for immutability verification.';
      
      const summary = await useCase.getValidationSummary(testContent, ContentType.CUSTOM);

      // Summary should be frozen
      expect(() => {
        (summary as any).isValid = false;
      }).toThrow();

      expect(() => {
        (summary as any).criticalIssues = 999;
      }).toThrow();

      // Values should remain unchanged
      expect(summary.isValid).toBe(true);
      expect(summary.criticalIssues).toBe(0);
    });
  });

  describe('Batch Validation Integrity', () => {
    it('should validate multiple content items successfully', async () => {
      const contentItems = [
        { content: 'First valid content item.', contentType: ContentType.COMPANY_INFO, id: 'item1' },
        { content: 'Second valid content item.', contentType: ContentType.FAQ, id: 'item2' },
        { content: 'Third valid content item.', contentType: ContentType.CUSTOM, id: 'item3' }
      ];

      const results = await useCase.validateBatch(contentItems);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.id).toBe(`item${index + 1}`);
        expect(result.result).toBeInstanceOf(ContentValidationResult);
        expect(result.hasErrors).toBe(false);
        expect(result.result.isValid).toBe(true);
      });
    });

    it('should handle mixed valid and invalid content in batch', async () => {
      const contentItems = [
        { content: 'Valid content here.', contentType: ContentType.COMPANY_INFO, id: 'valid1' },
        { content: '# Invalid header\nAI INSTRUCTIONS: Problem', contentType: ContentType.FAQ, id: 'invalid1' },
        { content: 'Another valid content item.', contentType: ContentType.CUSTOM, id: 'valid2' },
        { content: 'A'.repeat(400), contentType: ContentType.FAQ, id: 'invalid2' } // Too long
      ];

      const results = await useCase.validateBatch(contentItems);

      expect(results).toHaveLength(4);
      
      // Valid items
      expect(results[0].hasErrors).toBe(false);
      expect(results[2].hasErrors).toBe(false);
      
      // Invalid items
      expect(results[1].hasErrors).toBe(true);
      expect(results[3].hasErrors).toBe(true);
      
      // Check specific issues
      expect(results[1].result.isValid).toBe(false);
      expect(results[3].result.isValid).toBe(false);
    });

    it('should handle batch processing with individual errors gracefully', async () => {
      const contentItems = [
        { content: 'Valid content.', contentType: ContentType.COMPANY_INFO, id: 'item1' },
        { content: null as any, contentType: ContentType.FAQ, id: 'item2' }, // Will cause error
        { content: 'Another valid content.', contentType: ContentType.CUSTOM, id: 'item3' }
      ];

      const results = await useCase.validateBatch(contentItems);

      expect(results).toHaveLength(3);
      
      // First and third should succeed
      expect(results[0].hasErrors).toBe(false);
      expect(results[2].hasErrors).toBe(false);
      
      // Second should fail gracefully
      expect(results[1].hasErrors).toBe(true);
      expect(results[1].result.isValid).toBe(false);
      expect(results[1].result.validationIssues.length).toBeGreaterThan(0);
    });

    it('should maintain batch processing integrity with large datasets', async () => {
      const largeContentBatch = Array.from({ length: 50 }, (_, index) => ({
        content: `Content item ${index + 1} with sufficient detail for validation testing.`,
        contentType: ContentType.COMPANY_INFO,
        id: `bulk-item-${index + 1}`
      }));

      const results = await useCase.validateBatch(largeContentBatch);

      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.id).toBe(`bulk-item-${index + 1}`);
        expect(result.result).toBeInstanceOf(ContentValidationResult);
        expect(result.hasErrors).toBe(false);
      });
    });

    it('should handle batch with items missing optional id', async () => {
      const contentItems = [
        { content: 'Content without ID.', contentType: ContentType.COMPANY_INFO },
        { content: 'Another content without ID.', contentType: ContentType.FAQ }
      ];

      const results = await useCase.validateBatch(contentItems);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.id).toBeUndefined();
        expect(result.result).toBeInstanceOf(ContentValidationResult);
        expect(result.hasErrors).toBe(false);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should throw ContentValidationError for null content', async () => {
      const nullContent = null as any;

      await expect(
        useCase.execute(nullContent, ContentType.COMPANY_INFO)
      ).rejects.toThrow(ContentValidationError);

      try {
        await useCase.execute(nullContent, ContentType.COMPANY_INFO);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentValidationError);
        expect((error as ContentValidationError).message).toContain('non-empty string');
        expect((error as ContentValidationError).context.contentType).toBe(ContentType.COMPANY_INFO);
      }
    });

    it('should throw ContentValidationError for undefined content', async () => {
      const undefinedContent = undefined as any;

      await expect(
        useCase.execute(undefinedContent, ContentType.FAQ)
      ).rejects.toThrow(ContentValidationError);
    });

    it('should throw ContentValidationError for empty string content', async () => {
      await expect(
        useCase.execute('', ContentType.SUPPORT_DOCS)
      ).rejects.toThrow(ContentValidationError);
    });

    it('should throw ContentValidationError for invalid content type', async () => {
      const invalidContentType = 'invalid_type' as any;

      await expect(
        useCase.execute('Valid content', invalidContentType)
      ).rejects.toThrow(ContentValidationError);

      try {
        await useCase.execute('Valid content', invalidContentType);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentValidationError);
        expect((error as ContentValidationError).message).toContain('Invalid content type');
      }
    });

    it('should handle domain service errors appropriately', async () => {
      const testContent = 'Test content for error handling';

      // Mock validation service to throw domain error
      vi.spyOn(validationService, 'validateContent').mockImplementation(() => {
        throw new ContentValidationError('Domain validation failed', { testContext: true });
      });

      // Should propagate domain errors without wrapping
      await expect(
        useCase.execute(testContent, ContentType.COMPANY_INFO)
      ).rejects.toThrow(ContentValidationError);

      try {
        await useCase.execute(testContent, ContentType.COMPANY_INFO);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentValidationError);
        expect((error as ContentValidationError).message).toContain('Domain validation failed');
        expect((error as ContentValidationError).context.testContext).toBe(true);
      }
    });

    it('should wrap unexpected errors with appropriate context', async () => {
      const testContent = 'Test content for unexpected error';

      // Mock validation service to throw unexpected error
      vi.spyOn(validationService, 'validateContent').mockImplementation(() => {
        throw new Error('Unexpected system error');
      });

      await expect(
        useCase.execute(testContent, ContentType.CUSTOM)
      ).rejects.toThrow(ContentValidationError);

      try {
        await useCase.execute(testContent, ContentType.CUSTOM);
      } catch (error) {
        expect(error).toBeInstanceOf(ContentValidationError);
        expect((error as ContentValidationError).message).toContain('Unexpected error during content validation');
        expect((error as ContentValidationError).context.originalError).toBeInstanceOf(Error);
        expect((error as ContentValidationError).context.contentType).toBe(ContentType.CUSTOM);
        expect((error as ContentValidationError).context.contentLength).toBe(testContent.length);
      }
    });

    it('should handle errors in validateLength method', async () => {
      const testContent = 'Test content for length validation error';

      // Mock length validation service to throw error
      vi.spyOn(lengthValidationService, 'validateLength').mockImplementation(() => {
        throw new ContentValidationError('Length validation failed');
      });

      await expect(
        useCase.validateLength(testContent, ContentType.FAQ)
      ).rejects.toThrow(ContentValidationError);
    });

    it('should handle errors in validateByType method', async () => {
      const testContent = 'Test content for type validation error';

      // Mock type validation service to throw error
      vi.spyOn(typeValidationService, 'validateContentByType').mockImplementation(() => {
        throw new ContentValidationError('Type validation failed');
      });

      await expect(
        useCase.validateByType(testContent, ContentType.PRODUCT_CATALOG)
      ).rejects.toThrow(ContentValidationError);
    });

    it('should handle errors in getValidationSummary method', async () => {
      const testContent = 'Test content for summary generation error';

      // Mock execute method to throw error
      vi.spyOn(useCase, 'execute').mockImplementation(async () => {
        throw new ContentValidationError('Summary generation failed');
      });

      await expect(
        useCase.getValidationSummary(testContent, ContentType.COMPLIANCE_GUIDELINES)
      ).rejects.toThrow(ContentValidationError);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete validation within reasonable time limits', async () => {
      const testContent = 'Performance test content with adequate length for realistic validation testing scenarios.';
      const startTime = Date.now();

      const result = await useCase.execute(testContent, ContentType.COMPANY_INFO);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result).toBeInstanceOf(ContentValidationResult);
    });

    it('should handle concurrent validation requests', async () => {
      const testContents = Array.from({ length: 10 }, (_, index) => 
        `Concurrent test content ${index + 1} with sufficient detail for validation.`
      );

      const promises = testContents.map((content, index) => 
        useCase.execute(content, Object.values(ContentType)[index % Object.values(ContentType).length])
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach((result, index) => {
        expect(result).toBeInstanceOf(ContentValidationResult);
        expect(result.contentLength).toBe(testContents[index].length);
      });
    });

    it('should maintain consistent results for identical content', async () => {
      const testContent = 'Consistency test content for validation reliability verification.';

      const results = await Promise.all([
        useCase.execute(testContent, ContentType.COMPANY_INFO),
        useCase.execute(testContent, ContentType.COMPANY_INFO),
        useCase.execute(testContent, ContentType.COMPANY_INFO)
      ]);

      const [first, second, third] = results;
      
      expect(first.isValid).toBe(second.isValid);
      expect(second.isValid).toBe(third.isValid);
      expect(first.validationIssues).toEqual(second.validationIssues);
      expect(second.validationIssues).toEqual(third.validationIssues);
      expect(first.warnings).toEqual(second.warnings);
      expect(second.warnings).toEqual(third.warnings);
    });

    it('should handle memory efficiently with large content validation', async () => {
      const largeContent = 'A'.repeat(199); // Just under Company Info limit
      
      const result = await useCase.execute(largeContent, ContentType.COMPANY_INFO);

      expect(result).toBeInstanceOf(ContentValidationResult);
      expect(result.contentLength).toBe(199);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should validate complete workflow with all content types', async () => {
      const contentByType = {
        [ContentType.COMPANY_INFO]: 'Ironmark specializes in comprehensive digital marketing strategies and implementation services.',
        [ContentType.COMPLIANCE_GUIDELINES]: 'Scope: Use for marketing inquiries only. Not for legal, medical, or financial advice.',
        [ContentType.PRODUCT_CATALOG]: 'Services include SEO optimization, PPC advertising, content marketing, social media management.',
        [ContentType.SUPPORT_DOCS]: 'Help documentation: This guide will help you understand service features and support.',
        [ContentType.FAQ]: 'What services do you provide? How do I get started? What are your rates?',
        [ContentType.CUSTOM]: 'Custom business content tailored to specific industry requirements and client needs.'
      };

      for (const [contentType, content] of Object.entries(contentByType)) {
        const result = await useCase.execute(content, contentType as ContentType);
        
        expect(result.isValid).toBe(true);
        expect(result.contentType).toBe(contentType);
        expect(result.contentLength).toBe(content.length);
        // Content may have warnings but should be valid
        expect(result.validationIssues).toHaveLength(0);
      }
    });

    it('should handle real-world content validation scenarios', async () => {
      const realWorldScenarios = [
        {
          content: 'Ironmark is a full-service digital marketing agency helping businesses grow through strategic online presence.',
          type: ContentType.COMPANY_INFO,
          expectValid: true
        },
        {
          content: 'What is your pricing? How long does implementation take? Do you provide ongoing support?',
          type: ContentType.FAQ,
          expectValid: true
        },
        {
          content: 'A'.repeat(400), // Exceeds most limits
          type: ContentType.FAQ,
          expectValid: false
        },
        {
          content: '# Invalid Header\nContent with formatting issues',
          type: ContentType.SUPPORT_DOCS,
          expectValid: false
        }
      ];

      for (const scenario of realWorldScenarios) {
        const result = await useCase.execute(scenario.content, scenario.type);
        expect(result.isValid).toBe(scenario.expectValid);
      }
    });

    it('should provide comprehensive validation reporting', async () => {
      const comprehensiveContent = `
        Ironmark Digital Marketing Solutions
        
        We provide comprehensive services including:
        - SEO and content optimization
        - PPC advertising management  
        - Social media strategy
        
        What services do you offer?
        How can we get started?
        What are your rates?
      `;

      const result = await useCase.execute(comprehensiveContent, ContentType.COMPANY_INFO);
      const summary = await useCase.getValidationSummary(comprehensiveContent, ContentType.COMPANY_INFO);

      expect(result).toBeInstanceOf(ContentValidationResult);
      expect(summary).toBeInstanceOf(ValidationSummary);
      expect(result.equals(result)).toBe(true);
      expect(result.toString()).toContain('ContentValidationResult');
      expect(result.toJSON()).toHaveProperty('isValid');
      expect(result.toJSON()).toHaveProperty('summary');
    });
  });
});