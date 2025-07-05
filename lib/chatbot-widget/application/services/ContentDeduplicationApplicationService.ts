/**
 * Content Deduplication Application Service - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate deduplication workflows, no business logic
 * - Coordinate between domain services and repositories
 * - Handle use case coordination for deduplication processes
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines - focus on orchestration
 * - Delegate all business logic to domain services
 */

import { UrlNormalizationService } from '../../domain/services/UrlNormalizationService';
import { ContentDeduplicationService, DeduplicatableContent, DeduplicationResult } from '../../domain/services/ContentDeduplicationService';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';

/**
 * Represents existing knowledge entry for deduplication
 */
export interface ExistingKnowledgeEntry {
  id: string;
  url: string;
  content: string;
  title?: string;
  configId: string;
}

/**
 * Result of deduplication cleanup operation
 */
export interface DeduplicationCleanupResult {
  duplicatesRemoved: number;
  vectorsRemoved: number;
  entriesKept: number;
  errors: string[];
}

/**
 * Application service for coordinating content deduplication workflows
 * 
 * Orchestrates:
 * - Pre-storage deduplication checks
 * - Post-storage cleanup of duplicates
 * - Cross-reference validation between knowledge base and vectors
 */
export class ContentDeduplicationApplicationService {
  
  constructor(
    private urlNormalizationService: UrlNormalizationService,
    private contentDeduplicationService: ContentDeduplicationService,
    private vectorKnowledgeRepository: IVectorKnowledgeRepository
  ) {}
  
  /**
   * Check for existing duplicates before storing new content
   * 
   * @param newContent - Content about to be stored
   * @param configId - Configuration ID to check within
   * @returns Existing duplicate entries that should be replaced
   */
  async checkForExistingDuplicates(
    newContent: DeduplicatableContent,
    organizationId: string,
    configId: string
  ): Promise<ExistingKnowledgeEntry[]> {
    try {
      // Get all existing knowledge vectors for this config
      const existingKnowledgeVectors = await this.vectorKnowledgeRepository.getAllKnowledgeVectors(
        organizationId,
        configId
      );
      
      // Convert to deduplicatable format
      const existingContent: DeduplicatableContent[] = existingKnowledgeVectors.map((kv: { item: KnowledgeItem; vector: number[] }) => ({
        url: kv.item.source || '',
        content: kv.item.content,
        title: kv.item.title
      }));
      
      // Find duplicates for the new URL
      const duplicates = this.contentDeduplicationService.findDuplicatesForUrl(
        newContent.url,
        existingContent
      );
      
      // Convert back to ExistingKnowledgeEntry format
      const existingDuplicates: ExistingKnowledgeEntry[] = [];
      
      for (const duplicate of duplicates) {
        const existingVector = existingKnowledgeVectors.find((kv: { item: KnowledgeItem; vector: number[] }) => 
          kv.item.source === duplicate.url
        );
        if (existingVector) {
          existingDuplicates.push({
            id: existingVector.item.id,
            url: existingVector.item.source || '',
            content: duplicate.content,
            title: duplicate.title,
            configId: configId
          });
        }
      }
      
      return existingDuplicates;
      
    } catch (error) {
      console.error('❌ Error checking for existing duplicates:', error);
      return [];
    }
  }
  
  /**
   * Perform comprehensive deduplication cleanup for a configuration
   * 
   * @param organizationId - Organization ID
   * @param configId - Configuration ID to clean up
   * @returns Cleanup results with statistics
   */
  async performDeduplicationCleanup(
    organizationId: string,
    configId: string
  ): Promise<DeduplicationCleanupResult> {
    const result: DeduplicationCleanupResult = {
      duplicatesRemoved: 0,
      vectorsRemoved: 0,
      entriesKept: 0,
      errors: []
    };
    
    try {
      // Get all knowledge vectors for this config
      const allKnowledgeVectors = await this.vectorKnowledgeRepository.getAllKnowledgeVectors(
        organizationId,
        configId
      );
      
      if (allKnowledgeVectors.length <= 1) {
        result.entriesKept = allKnowledgeVectors.length;
        return result;
      }
      
      // Group by normalized URL
      const urlGroups = new Map<string, Array<{ item: KnowledgeItem; vector: number[] }>>();
      
      for (const knowledgeVector of allKnowledgeVectors) {
        const sourceUrl = knowledgeVector.item.source || '';
        if (!sourceUrl) continue;
        
        const normalizedUrl = this.urlNormalizationService.normalizeUrl(sourceUrl);
        
        if (!urlGroups.has(normalizedUrl)) {
          urlGroups.set(normalizedUrl, []);
        }
        urlGroups.get(normalizedUrl)!.push(knowledgeVector);
      }
      
      // Process each URL group
      for (const [normalizedUrl, groupEntries] of urlGroups) {
        if (groupEntries.length > 1) {
          
          // Choose canonical entry (prefer HTTPS, shorter URLs)
          const canonicalUrl = this.urlNormalizationService.getCanonicalUrl(
            groupEntries.map((entry: { item: KnowledgeItem; vector: number[] }) => entry.item.source || '')
          );
          
          const canonicalEntry = groupEntries.find((entry: { item: KnowledgeItem; vector: number[] }) => 
            entry.item.source === canonicalUrl
          );
          const duplicateEntries = groupEntries.filter((entry: { item: KnowledgeItem; vector: number[] }) => 
            entry.item.source !== canonicalUrl
          );
          
          // Remove duplicate knowledge entries
          for (const duplicate of duplicateEntries) {
            try {
              // Remove by source URL and type
              const removedCount = await this.vectorKnowledgeRepository.deleteKnowledgeItemsBySource(
                organizationId,
                configId,
                'website_crawled',
                duplicate.item.source
              );
              
              result.duplicatesRemoved++;
              result.vectorsRemoved += removedCount;
              
            } catch (error) {
              const errorMsg = `Failed to remove duplicate ${duplicate.item.source}: ${error instanceof Error ? error.message : String(error)}`;
              console.error(`❌ ${errorMsg}`);
              result.errors.push(errorMsg);
            }
          }
          
          result.entriesKept++;
          
        } else {
          // Single entry, keep it
          result.entriesKept++;
        }
      }
      
      return result;
      
    } catch (error) {
      const errorMsg = `Deduplication cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }
  
  /**
   * Remove specific duplicate entries by URL
   * 
   * @param organizationId - Organization ID
   * @param configId - Configuration ID for vector cleanup
   * @param duplicateUrls - Array of URLs to remove
   * @returns Cleanup results
   */
  async removeDuplicateEntries(
    organizationId: string,
    configId: string,
    duplicateUrls: string[]
  ): Promise<DeduplicationCleanupResult> {
    const result: DeduplicationCleanupResult = {
      duplicatesRemoved: 0,
      vectorsRemoved: 0,
      entriesKept: 0,
      errors: []
    };
    
    try {
      for (const duplicateUrl of duplicateUrls) {
        try {
          // Remove vectors for this URL
          const vectorsRemoved = await this.vectorKnowledgeRepository.deleteKnowledgeItemsBySource(
            organizationId,
            configId,
            'website_crawled',
            duplicateUrl
          );
          
          result.vectorsRemoved += vectorsRemoved;
          result.duplicatesRemoved++;
          
        } catch (error) {
          const errorMsg = `Failed to remove duplicate ${duplicateUrl}: ${error instanceof Error ? error.message : String(error)}`;
          console.error(`❌ ${errorMsg}`);
          result.errors.push(errorMsg);
        }
      }
      
      return result;
      
    } catch (error) {
      const errorMsg = `Failed to remove duplicate entries: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }
} 