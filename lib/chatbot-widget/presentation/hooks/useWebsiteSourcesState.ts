/**
 * Website Sources State Management Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate website sources state and actions
 * - Delegate to specialized hooks and utilities
 * - Follow @golden-rule patterns exactly
 * - Keep under 250 lines by extracting concerns
 * - Handle UI state coordination only
 */

import { useQueryClient } from '@tanstack/react-query';
import { 
  addWebsiteSource, 
  removeWebsiteSource, 
  crawlWebsiteSource,
  cleanupWebsiteSources
} from '../actions/websiteSourcesActions';
import { WebsiteSourceDto } from '../../application/dto/ChatbotConfigDto';
import { useCrawledPagesData } from './website-sources/useCrawledPagesData';
import { useFormState } from './website-sources/useFormState';
import { useUIState } from './website-sources/useUIState';
import { useCrawlProgress } from './website-sources/useCrawlProgress';
import { simulateCrawlProgress } from '../utils/crawlProgressSimulator';

/** Main Website Sources State Hook */
export function useWebsiteSourcesState(
  organizationId: string,
  chatbotConfigId: string,
  existingConfig: any,
  activeOrganizationId: string | null
) {
  const queryClient = useQueryClient();
  
  // Sub-hooks for different concerns
  const formState = useFormState();
  const uiState = useUIState();
  const crawlProgressState = useCrawlProgress();
  
  // Data fetching
  const {
    data: crawledPagesData = {},
    refetch: refetchCrawledPages
  } = useCrawledPagesData(organizationId, chatbotConfigId, existingConfig);

  // Derived state
  const websiteSources: WebsiteSourceDto[] = existingConfig?.knowledgeBase?.websiteSources || [];

  // Helper functions
  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
    refetchCrawledPages();
  };

  // Action handlers
  const handleAddSource = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    if (!formState.validateForm()) return;
    
    uiState.clearMessages();
    uiState.setIsDeletingSource(null);
    uiState.setIsConfirmingAdd(true);
  };

  const confirmAddSource = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await addWebsiteSource(existingConfig.id, activeOrganizationId, formState.formData);
      
      if (result.success) {
        formState.setFormErrors([]);
        uiState.showSuccess('Website source added successfully');
        uiState.setIsAddingSource(false);
        uiState.setIsConfirmingAdd(false);
        formState.resetForm();
        invalidateQueries();
      } else {
        formState.setFormErrors([result.error?.message || 'Failed to add website source']);
      }
    } catch (error) {
      formState.setFormErrors(['An unexpected error occurred']);
    } finally {
      uiState.setActionLoading(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    uiState.clearMessages();
    uiState.setIsConfirmingAdd(false);
    uiState.setIsDeletingSource(sourceId);
  };

  const confirmDeleteSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await removeWebsiteSource(existingConfig.id, activeOrganizationId, sourceId);
      
      if (result.success) {
        invalidateQueries();
        uiState.setIsDeletingSource(null);
        formState.setFormErrors([]);
        uiState.showSuccess('Website source deleted successfully');
        
        refetchCrawledPages();
        uiState.setShowCrawledPages((prev: Record<string, boolean>) => {
          const updated = { ...prev };
          delete updated[sourceId];
          return updated;
        });
      } else {
        formState.setFormErrors([result.error?.message || 'Failed to remove website source']);
      }
    } catch (error) {
      formState.setFormErrors(['An unexpected error occurred']);
    } finally {
      uiState.setActionLoading(false);
    }
  };

  const handleCrawlSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    uiState.setCrawlingSourceId(sourceId);
    crawlProgressState.startCrawlProgress(sourceId);

    try {
      // AI: Run simulation first for visual feedback
      await simulateCrawlProgress(sourceId, websiteSources, crawlProgressState.updateCrawlProgress);

      // AI: Update message to show real processing is starting
      crawlProgressState.updateCrawlProgress({
        status: 'processing',
        progress: 99,
        message: 'Starting actual crawl...'
      });

      // AI: Add timeout protection for actual crawling (2 minutes max)
      const crawlPromise = crawlWebsiteSource(existingConfig.id, activeOrganizationId, sourceId);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Crawling timed out after 2 minutes')), 120000);
      });

      // AI: Race between crawling and timeout
      const result = await Promise.race([crawlPromise, timeoutPromise]) as any;
      
      if (result.success) {
        crawlProgressState.completeCrawlProgress(result.data?.itemsProcessed || 0);
        refetchCrawledPages();
        setTimeout(() => crawlProgressState.clearCrawlProgress(), 3000);
        invalidateQueries();
      } else {
        crawlProgressState.errorCrawlProgress(result.error?.message || 'Crawl failed');
        formState.setFormErrors([result.error?.message || 'Failed to crawl website source']);
      }
    } catch (error) {
      // AI: Handle both timeout and other errors
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during crawling';
      crawlProgressState.errorCrawlProgress(errorMessage);
      formState.setFormErrors([errorMessage]);
    } finally {
      uiState.setCrawlingSourceId(null);
    }
  };

  const handleCleanupSources = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await cleanupWebsiteSources(existingConfig.id, activeOrganizationId);
      
      if (result.success) {
        invalidateQueries();
        formState.setFormErrors([]);
        refetchCrawledPages();
        uiState.setShowCrawledPages({});
      } else {
        formState.setFormErrors([result.error?.message || 'Failed to cleanup website sources']);
      }
    } catch (error) {
      formState.setFormErrors(['An unexpected error occurred during cleanup']);
    } finally {
      uiState.setActionLoading(false);
    }
  };

  return {
    // State
    websiteSources,
    crawledPagesData,
    
    // Form state
    ...formState,
    
    // UI state
    ...uiState,
    
    // Crawl progress state
    ...crawlProgressState,
    
    // Actions
    handleAddSource,
    handleRemoveSource,
    handleCrawlSource,
    handleCleanupSources,
    confirmAddSource,
    confirmDeleteSource
  };
} 