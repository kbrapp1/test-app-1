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
import { IWebsiteKnowledgeRepository } from '../../domain/repositories/IWebsiteKnowledgeRepository';
import { VectorKnowledge } from '../../domain/entities/VectorKnowledge';
import { WebsiteSource } from '../../domain/value-objects/ai-configuration/KnowledgeBase';

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
    private vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private websiteKnowledgeRepository: IWebsiteKnowledgeRepository
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
    configId: string
  ): Promise<ExistingKnowledgeEntry[]> {
    try {
      console.log(`🔍 Checking for existing duplicates: ${newContent.url}`);
      
      // Get all existing knowledge for this config
      const existingKnowledge = await this.websiteKnowledgeRepository.getByConfigId(configId);
      
      // Convert to deduplicatable format
      const existingContent: DeduplicatableContent[] = existingKnowledge.map(kb => ({
        url: kb.source.url,
        content: '', // We don't have the full content here, so we'll do URL-based dedup only
        title: kb.source.url
      }));
      
      // Add the new content to check against existing
      const allContent = [...existingContent, newContent];
      
      // Find duplicates for the new URL
      const duplicates = this.contentDeduplicationService.findDuplicatesForUrl(
        newContent.url,
        existingContent
      );
      
      console.log(`📊 Found ${duplicates.length} existing duplicates for ${newContent.url}`);
      
      // Convert back to ExistingKnowledgeEntry format
      const existingDuplicates: ExistingKnowledgeEntry[] = [];
      
      for (const duplicate of duplicates) {
        const existingEntry = existingKnowledge.find(kb => kb.source.url === duplicate.url);
        if (existingEntry) {
          existingDuplicates.push({
            id: existingEntry.id,
            url: existingEntry.source.url,
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
   * @param configId - Configuration ID to clean up
   * @returns Cleanup results with statistics
   */
  async performDeduplicationCleanup(configId: string): Promise<DeduplicationCleanupResult> {
    const result: DeduplicationCleanupResult = {
      duplicatesRemoved: 0,
      vectorsRemoved: 0,
      entriesKept: 0,
      errors: []
    };
    
    try {
      console.log(`🧹 Starting deduplication cleanup for config: ${configId}`);
      
      // Get all knowledge entries for this config
      const allKnowledge = await this.websiteKnowledgeRepository.getByConfigId(configId);
      console.log(`📊 Found ${allKnowledge.length} knowledge entries to analyze`);
      
      if (allKnowledge.length <= 1) {
        console.log('ℹ️ Only one or no entries found, no deduplication needed');
        result.entriesKept = allKnowledge.length;
        return result;
      }
      
      // For this cleanup, we'll focus on URL-based deduplication since we don't have content
      const urlGroups = new Map<string, typeof allKnowledge>();
      
      for (const knowledge of allKnowledge) {
        const normalizedUrl = this.urlNormalizationService.normalizeUrl(knowledge.source.url);
        
        if (!urlGroups.has(normalizedUrl)) {
          urlGroups.set(normalizedUrl, []);
        }
        urlGroups.get(normalizedUrl)!.push(knowledge);
      }
      
      console.log(`📊 Found ${urlGroups.size} unique normalized URLs from ${allKnowledge.length} entries`);
      
      // Process each URL group
      for (const [normalizedUrl, groupEntries] of urlGroups) {
        if (groupEntries.length > 1) {
          console.log(`🔄 Processing ${groupEntries.length} duplicates for: ${normalizedUrl}`);
          
          // Choose canonical entry (prefer HTTPS, shorter URLs)
          const canonicalUrl = this.urlNormalizationService.getCanonicalUrl(
            groupEntries.map(entry => entry.source.url)
          );
          
          const canonicalEntry = groupEntries.find(entry => entry.source.url === canonicalUrl);
          const duplicateEntries = groupEntries.filter(entry => entry.source.url !== canonicalUrl);
          
          console.log(`📌 Keeping canonical: ${canonicalUrl}`);
          console.log(`🗑️ Removing ${duplicateEntries.length} duplicates`);
          
          // Remove duplicate knowledge entries and their vectors
          for (const duplicate of duplicateEntries) {
            try {
              // Remove vectors first
              await this.vectorKnowledgeRepository.deleteByUrl(duplicate.source.url, configId);
              
              // Remove knowledge entry
              await this.websiteKnowledgeRepository.delete(duplicate.id);
              
              result.duplicatesRemoved++;
              console.log(`✅ Removed duplicate: ${duplicate.source.url}`);
              
            } catch (error) {
              const errorMsg = `Failed to remove duplicate ${duplicate.source.url}: ${error instanceof Error ? error.message : String(error)}`;
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
      
      console.log(`🎉 Deduplication cleanup completed:`, {
        duplicatesRemoved: result.duplicatesRemoved,
        entriesKept: result.entriesKept,
        errors: result.errors.length
      });
      
      return result;
      
    } catch (error) {
      const errorMsg = `Deduplication cleanup failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      result.errors.push(errorMsg);
      return result;
    }
  }
  
  /**
   * Remove specific duplicate entries by ID
   * 
   * @param duplicateIds - Array of knowledge entry IDs to remove
   * @param configId - Configuration ID for vector cleanup
   * @returns Cleanup results
   */
  async removeDuplicateEntries(
    duplicateIds: string[],
    configId: string
  ): Promise<DeduplicationCleanupResult> {
    const result: DeduplicationCleanupResult = {
      duplicatesRemoved: 0,
      vectorsRemoved: 0,
      entriesKept: 0,
      errors: []
    };
    
    try {
      console.log(`🗑️ Removing ${duplicateIds.length} specific duplicate entries`);
      
      for (const duplicateId of duplicateIds) {
        try {
          // Get the entry first to get its URL for vector cleanup
          const knowledgeEntry = await this.websiteKnowledgeRepository.getById(duplicateId);
          
          if (knowledgeEntry) {
            // Remove vectors for this URL
            const vectorsRemoved = await this.vectorKnowledgeRepository.deleteByUrl(
              knowledgeEntry.source.url,
              configId
            );
            result.vectorsRemoved += vectorsRemoved;
            
            // Remove knowledge entry
            await this.websiteKnowledgeRepository.delete(duplicateId);
            result.duplicatesRemoved++;
            
            console.log(`✅ Removed duplicate entry: ${knowledgeEntry.source.url}`);
          }
          
        } catch (error) {
          const errorMsg = `Failed to remove duplicate ${duplicateId}: ${error instanceof Error ? error.message : String(error)}`;
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