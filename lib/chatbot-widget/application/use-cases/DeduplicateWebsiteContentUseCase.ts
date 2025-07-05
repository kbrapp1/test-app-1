/**
 * Deduplicate Website Content Use Case - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate website content deduplication workflow
 * - Use existing repository interfaces and methods
 * - Coordinate between vector and knowledge repositories
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on use case orchestration
 * - Handle domain errors properly
 */

import { UrlNormalizationService } from '../../domain/services/UrlNormalizationService';
import { ContentDeduplicationService, DeduplicatableContent } from '../../domain/services/ContentDeduplicationService';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

/**
 * Result of deduplication operation
 */
export interface DeduplicationResult {
  totalItemsAnalyzed: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  uniqueItemsKept: number;
  errors: string[];
}

/**
 * Use case for deduplicating website content in knowledge base
 * 
 * Handles:
 * - URL normalization to identify duplicate URLs
 * - Content-based deduplication for different URLs with same content
 * - Cleanup of orphaned vectors
 */
export class DeduplicateWebsiteContentUseCase {
  
  constructor(
    private urlNormalizationService: UrlNormalizationService,
    private contentDeduplicationService: ContentDeduplicationService,
    private vectorKnowledgeRepository: IVectorKnowledgeRepository
  ) {}
  
  /**
   * Execute deduplication for website-crawled content in a configuration
   * 
   * @param organizationId - Organization ID
   * @param chatbotConfigId - Chatbot configuration ID
   * @returns Deduplication results with statistics
   */
  async execute(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<DeduplicationResult> {
    
    const result: DeduplicationResult = {
      totalItemsAnalyzed: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      uniqueItemsKept: 0,
      errors: []
    };
    
    try {
      // Get all knowledge vectors for website-crawled content
      const allVectors = await this.vectorKnowledgeRepository.getAllKnowledgeVectors(
        organizationId,
        chatbotConfigId
      );
      
      // Filter only website-crawled content
      const websiteVectors = allVectors.filter(v => 
        v.item.source && v.item.source.startsWith('http')
      );
      
      result.totalItemsAnalyzed = websiteVectors.length;
      
      if (websiteVectors.length <= 1) {
        result.uniqueItemsKept = websiteVectors.length;
        return result;
      }
      
      // Convert to deduplicatable content format
      const deduplicatableContent: DeduplicatableContent[] = websiteVectors.map(vector => ({
        url: vector.item.source || '',
        content: vector.item.content,
        title: vector.item.title
      }));
      
      // Perform deduplication analysis
      const deduplicationResults = this.contentDeduplicationService.deduplicateContent(deduplicatableContent);
      
      // Process each group and remove duplicates
      for (const group of deduplicationResults) {
        if (group.duplicates.length > 0) {
          
          result.duplicatesFound += group.duplicates.length;
          
          // Remove duplicate vectors by deleting and re-storing only canonical
          for (const duplicate of group.duplicates) {
            try {
              // Delete vectors for this specific URL using the sourceUrl parameter
              const deletedCount = await this.vectorKnowledgeRepository.deleteKnowledgeItemsBySource(
                organizationId,
                chatbotConfigId,
                'website_crawled',
                duplicate.url
              );
              
              if (deletedCount > 0) {
                result.duplicatesRemoved += deletedCount;
              }
              
            } catch (error) {
              const errorMsg = `Failed to remove duplicate ${duplicate.url}: ${error instanceof Error ? error.message : String(error)}`;
              console.error(`❌ ${errorMsg}`);
              result.errors.push(errorMsg);
            }
          }
          
          result.uniqueItemsKept++;
          
        } else {
          // No duplicates in this group
          result.uniqueItemsKept++;
        }
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Deduplication use case failed:', errorMessage);
      
      result.errors.push(`Deduplication failed: ${errorMessage}`);
      
      throw new BusinessRuleViolationError(
        `Website content deduplication failed: ${errorMessage}`,
        { 
          organizationId, 
          chatbotConfigId,
          totalItemsAnalyzed: result.totalItemsAnalyzed 
        }
      );
    }
  }
  
  /**
   * Preview deduplication without making changes
   * 
   * @param organizationId - Organization ID  
   * @param chatbotConfigId - Chatbot configuration ID
   * @returns Preview of what would be deduplicated
   */
  async preview(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    duplicateGroups: Array<{
      canonical: string;
      duplicates: string[];
      similarity: number;
    }>;
  }> {
    
    try {
      // Get all knowledge vectors for website-crawled content
      const allVectors = await this.vectorKnowledgeRepository.getAllKnowledgeVectors(
        organizationId,
        chatbotConfigId
      );
      
      // Filter only website-crawled content
      const websiteVectors = allVectors.filter(v => 
        v.item.source && v.item.source.startsWith('http')
      );
      
      // Convert to deduplicatable content format
      const deduplicatableContent: DeduplicatableContent[] = websiteVectors.map(vector => ({
        url: vector.item.source || '',
        content: vector.item.content,
        title: vector.item.title
      }));
      
      // Perform deduplication analysis
      const deduplicationResults = this.contentDeduplicationService.deduplicateContent(deduplicatableContent);
      
      // Extract groups with duplicates
      const duplicateGroups = deduplicationResults
        .filter(group => group.duplicates.length > 0)
        .map(group => ({
          canonical: group.canonical.url,
          duplicates: group.duplicates.map(d => d.url),
          similarity: this.contentDeduplicationService.calculateContentSimilarity(
            group.canonical.content,
            group.duplicates[0]?.content || ''
          )
        }));
      
      return {
        totalItems: websiteVectors.length,
        duplicateGroups
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Deduplication preview failed:', errorMessage);
      
      throw new BusinessRuleViolationError(
        `Deduplication preview failed: ${errorMessage}`,
        { organizationId, chatbotConfigId }
      );
    }
  }
} 