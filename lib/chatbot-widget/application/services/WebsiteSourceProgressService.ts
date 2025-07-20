/**
 * Website Source Progress Tracking Application Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates progress tracking for website source crawling
 * - Handles status updates and progress callbacks
 * - Maintains security by preserving organizationId
 * - Single responsibility: progress tracking coordination
 */

import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

export interface CrawlProgressData {
  vectorizedItems: number;
  totalItems: number;
  currentItem: string;
}

export interface PageProgressData {
  pagesFound?: number;
  pagesProcessed?: number;
}

export class WebsiteSourceProgressService {
  /**
   * Updates website source status during crawling phases
   */
  public async updateCrawlStatus(
    configId: string,
    sourceId: string,
    status: 'vectorizing',
    progress: CrawlProgressData
  ): Promise<void> {
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
    
    const config = await configRepository.findById(configId);
    if (!config) return;

    const updatedKnowledgeBase = config.knowledgeBase.updateWebsiteSource(sourceId, {
      status: 'vectorizing',
      pageCount: progress.vectorizedItems,
      errorMessage: `Vectorizing ${progress.vectorizedItems}/${progress.totalItems}: ${progress.currentItem}`
    });
    
    const updatedConfig = config.updateKnowledgeBase(updatedKnowledgeBase);
    await configRepository.update(updatedConfig);
  }

  /**
   * Updates page processing progress during crawling
   */
  public async updatePageProgress(
    configId: string,
    sourceId: string,
    type: 'pages_found' | 'pages_processed',
    data: PageProgressData
  ): Promise<void> {
    try {
      const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
      
      const config = await configRepository.findById(configId);
      if (!config) return;

      let updateData: Record<string, unknown> = {};
      
      switch (type) {
        case 'pages_found':
          updateData = { pageCount: data.pagesFound };
          break;
        case 'pages_processed':
          updateData = { 
            pageCount: data.pagesProcessed,
            errorMessage: `Processing ${data.pagesProcessed} pages...`
          };
          break;
      }
      
      if (Object.keys(updateData).length > 0) {
        const updatedKnowledgeBase = config.knowledgeBase.updateWebsiteSource(sourceId, updateData);
        const updatedConfig = config.updateKnowledgeBase(updatedKnowledgeBase);
        await configRepository.update(updatedConfig);
      }
    } catch {
      // Silently handle database update failures
    }
  }

  /**
   * Creates status update callback for crawling operations
   */
  public createStatusUpdateCallback(configId: string, sourceId: string) {
    return async (status: 'vectorizing', progress: CrawlProgressData) => {
      if (status === 'vectorizing') {
        await this.updateCrawlStatus(configId, sourceId, status, progress);
      }
    };
  }

  /**
   * Creates crawl progress callback for real-time database updates
   */
  public createCrawlProgressCallback(configId: string, sourceId: string) {
    return async (type: string, data: Record<string, unknown>) => {
      const progressData = data as PageProgressData;
      
      if (type === 'pages_found' || type === 'pages_processed') {
        await this.updatePageProgress(configId, sourceId, type as 'pages_found' | 'pages_processed', progressData);
      }
    };
  }
}