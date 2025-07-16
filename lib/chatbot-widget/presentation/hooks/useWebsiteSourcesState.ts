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
  crawlWebsiteSource as crawlWebsiteSourceAction,
  cleanupWebsiteSources
} from '../actions/websiteSourcesActions';
import { WebsiteSourceDto } from '../../application/dto/ChatbotConfigDto';
import { useCrawledPagesData } from './website-sources/useCrawledPagesData';
import { useFormState } from './website-sources/useFormState';
import { useUIState } from './website-sources/useUIState';
import { useCrawlProgress } from './website-sources/useCrawlProgress';
import { useToast } from '@/components/ui/use-toast';

/** Main Website Sources State Hook */
export function useWebsiteSourcesState(
  organizationId: string | null,
  chatbotConfigId: string,
  existingConfig: unknown
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Sub-hooks for different concerns
  const formState = useFormState();
  const uiState = useUIState();
  const crawlProgressState = useCrawlProgress();
  
  // Data fetching
  const {
    data: crawledPagesData = {},
    refetch: refetchCrawledPages
  } = useCrawledPagesData(organizationId || '', chatbotConfigId, existingConfig);

  // Derived state - safely cast existingConfig
  const configData = existingConfig as { knowledgeBase?: { websiteSources?: WebsiteSourceDto[] } };
  const websiteSources: WebsiteSourceDto[] = configData?.knowledgeBase?.websiteSources || [];

  // Helper functions
  const invalidateQueries = () => {
    if (organizationId) {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', organizationId] });
      refetchCrawledPages();
    }
  };

  // Action handlers
  const handleAddSource = async () => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    if (!formState.validateForm()) return;
    
    uiState.clearMessages();
    uiState.setIsDeletingSource(null);
    uiState.setIsConfirmingAdd(true);
  };

  const confirmAddSource = async () => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await addWebsiteSource(config.id, organizationId, formState.formData);
      
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
    } catch {
      formState.setFormErrors(['An unexpected error occurred']);
    } finally {
      uiState.setActionLoading(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    uiState.clearMessages();
    uiState.setIsConfirmingAdd(false);
    uiState.setIsDeletingSource(sourceId);
  };

  const confirmDeleteSource = async (sourceId: string) => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await removeWebsiteSource(config.id, organizationId, sourceId);
      
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
    } catch {
      formState.setFormErrors(['An unexpected error occurred']);
    } finally {
      uiState.setActionLoading(false);
    }
  };

  // AI: Crawl website source with real database polling
  const crawlWebsiteSource = async (sourceId: string) => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    try {
      crawlProgressState.startCrawlProgress(sourceId);
      
      // AI: Start database polling for real progress updates  
      crawlProgressState.startPolling(organizationId, chatbotConfigId, sourceId);
      
      // AI: Execute crawl in background - polling will show real progress
      const result = await crawlWebsiteSourceAction(config.id, organizationId, sourceId);
      
      if (result.success && result.data) {
        crawlProgressState.completeCrawlProgress(result.data.itemsProcessed);
        
        // AI: Refresh data to show final results
        await queryClient.invalidateQueries({ 
          queryKey: ['chatbot-config', organizationId] 
        });
        
        toast({
          title: "Crawl Completed",
          description: `Successfully crawled and processed ${result.data.itemsProcessed} pages`
        });
      } else {
        const errorMsg = result.error?.message || 'Crawl failed';
        crawlProgressState.errorCrawlProgress(errorMsg);
        toast({
          title: "Crawl Failed",
          description: errorMsg,
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      crawlProgressState.errorCrawlProgress(errorMessage);
      toast({
        title: "Crawl Failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleCleanupSources = async () => {
    const config = configData as { id?: string };
    if (!config?.id || !organizationId) return;
    
    uiState.setActionLoading(true);
    try {
      const result = await cleanupWebsiteSources(config.id, organizationId);
      
      if (result.success) {
        invalidateQueries();
        formState.setFormErrors([]);
        refetchCrawledPages();
        uiState.setShowCrawledPages({});
      } else {
        formState.setFormErrors([result.error?.message || 'Failed to cleanup website sources']);
      }
    } catch {
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
    handleCrawlSource: crawlWebsiteSource,
    handleCleanupSources,
    confirmAddSource,
    confirmDeleteSource
  };
} 