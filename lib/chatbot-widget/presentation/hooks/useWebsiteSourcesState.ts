/**
 * Website Sources State Management Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage website sources state and actions
 * - Coordinate with server actions and handle loading states
 * - Follow @golden-rule patterns exactly
 * - Keep business logic in domain/application layers
 * - Handle UI state coordination only
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  addWebsiteSource, 
  removeWebsiteSource, 
  crawlWebsiteSource,
  debugCleanupWebsiteSources,
  WebsiteSourceFormData 
} from '../actions/websiteSourcesActions';
import { WebsiteSourceDto } from '../../application/dto/ChatbotConfigDto';
import { CrawlProgress, CrawledPageInfo } from '../components/admin/website-sources/WebsiteSourcesSection';

export function useWebsiteSourcesState(
  existingConfig: any,
  activeOrganizationId: string | null
) {
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<WebsiteSourceFormData>({
    url: '',
    name: '',
    description: '',
    maxPages: 50,
    maxDepth: 3,
    respectRobotsTxt: true
  });

  // UI state
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isDeletingSource, setIsDeletingSource] = useState<string | null>(null);
  const [isConfirmingAdd, setIsConfirmingAdd] = useState(false);
  const [crawlingSourceId, setCrawlingSourceId] = useState<string | null>(null);
  const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
  
  // Crawled pages state
  const [crawledPagesData, setCrawledPagesData] = useState<Record<string, CrawledPageInfo[]>>({});
  const [showCrawledPages, setShowCrawledPages] = useState<Record<string, boolean>>({});
  
  // Feedback state
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Derived state
  const websiteSources: WebsiteSourceDto[] = existingConfig?.knowledgeBase?.websiteSources || [];

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
  };

  const resetForm = () => {
    setFormData({
      url: '',
      name: '',
      description: '',
      maxPages: 50,
      maxDepth: 3,
      respectRobotsTxt: true
    });
    setFormErrors([]);
  };

  const updateFormData = (updates: Partial<WebsiteSourceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleCrawledPagesVisibility = (sourceId: string) => {
    setShowCrawledPages(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const handleAddSource = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    // Validate form
    const errors: string[] = [];
    if (!formData.url.trim()) errors.push('URL is required');
    if (!formData.name.trim()) errors.push('Name is required');
    
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setSuccessMessage(null);
    setIsDeletingSource(null);
    setIsConfirmingAdd(true);
  };

  const confirmAddSource = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    setActionLoading(true);
    try {
      const result = await addWebsiteSource(existingConfig.id, activeOrganizationId, formData);
      
      if (result.success) {
        setFormErrors([]);
        setSuccessMessage('Website source added successfully');
        setIsAddingSource(false);
        setIsConfirmingAdd(false);
        resetForm();
        invalidateQueries();
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setFormErrors([result.error?.message || 'Failed to add website source']);
      }
    } catch (error) {
      setFormErrors(['An unexpected error occurred']);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    setSuccessMessage(null);
    setIsConfirmingAdd(false);
    setIsDeletingSource(sourceId);
  };

  const confirmDeleteSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    setActionLoading(true);
    try {
      const result = await removeWebsiteSource(existingConfig.id, activeOrganizationId, sourceId);
      
      if (result.success) {
        invalidateQueries();
        setIsDeletingSource(null);
        setFormErrors([]);
        setSuccessMessage('Website source deleted successfully');
        
        // Clean up crawled pages data for deleted source
        setCrawledPagesData(prev => {
          const updated = { ...prev };
          delete updated[sourceId];
          return updated;
        });
        setShowCrawledPages(prev => {
          const updated = { ...prev };
          delete updated[sourceId];
          return updated;
        });
        
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setFormErrors([result.error?.message || 'Failed to remove website source']);
      }
    } catch (error) {
      setFormErrors(['An unexpected error occurred']);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCrawlSource = async (sourceId: string) => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    setCrawlingSourceId(sourceId);
    
    setCrawlProgress({
      sourceId,
      status: 'starting',
      progress: 0,
      pagesFound: 0,
      pagesProcessed: 0,
      message: 'Initializing crawl...'
    });

    try {
      await simulateCrawlProgress(sourceId, (progress) => {
        setCrawlProgress(prev => prev ? { ...prev, ...progress } : null);
      });

      const result = await crawlWebsiteSource(existingConfig.id, activeOrganizationId, sourceId);
      
      if (result.success) {
        setCrawlProgress(prev => prev ? {
          ...prev,
          status: 'completed',
          progress: 100,
          pagesProcessed: result.data?.itemsProcessed || 0,
          message: 'Crawl completed successfully!'
        } : null);
        
        // Store crawled pages data if available
        if (result.data?.crawledPages) {
          const source = websiteSources.find(s => s.id === sourceId);
          const crawledPages: CrawledPageInfo[] = result.data.crawledPages.map((page: any) => ({
            id: `${sourceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            url: page.url,
            title: page.title,
            content: page.content,
            category: 'general', // This would come from AI categorization
            tags: ['website', 'crawled'],
            depth: page.depth,
            contentLength: page.content.length,
            crawledAt: new Date(page.crawledAt),
            status: page.status,
            errorMessage: page.errorMessage,
            responseTime: page.responseTime,
            statusCode: page.statusCode
          }));
          
          setCrawledPagesData(prev => ({
            ...prev,
            [sourceId]: crawledPages
          }));
        }
        
        setTimeout(() => setCrawlProgress(null), 3000);
        invalidateQueries();
      } else {
        setCrawlProgress(prev => prev ? {
          ...prev,
          status: 'error',
          progress: 0,
          error: result.error?.message || 'Crawl failed',
          message: 'Crawl failed'
        } : null);
        
        setFormErrors([result.error?.message || 'Failed to crawl website source']);
      }
    } catch (error) {
      setCrawlProgress(prev => prev ? {
        ...prev,
        status: 'error',
        progress: 0,
        error: 'An unexpected error occurred during crawling',
        message: 'Crawl failed'
      } : null);
      
      setFormErrors(['An unexpected error occurred during crawling']);
    } finally {
      setCrawlingSourceId(null);
    }
  };

  const simulateCrawlProgress = async (
    sourceId: string, 
    progressCallback: (progress: Partial<CrawlProgress>) => void
  ) => {
    const source = websiteSources.find(s => s.id === sourceId);
    const baseUrl = source?.url || 'https://example.com';
    
    const steps = [
      { status: 'starting' as const, progress: 10, message: 'Connecting to website...', delay: 500 },
      { status: 'crawling' as const, progress: 25, message: 'Discovering pages...', pagesFound: 5, delay: 1000 },
      { status: 'crawling' as const, progress: 50, message: 'Crawling pages...', pagesFound: 12, pagesProcessed: 3, currentPage: `${baseUrl}/about`, delay: 1500 },
      { status: 'processing' as const, progress: 75, message: 'Processing content...', pagesFound: 15, pagesProcessed: 8, delay: 1000 },
      { status: 'vectorizing' as const, progress: 90, message: 'Creating embeddings...', pagesFound: 15, pagesProcessed: 12, delay: 800 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      progressCallback(step);
    }
  };

  const handleCleanupSources = async () => {
    if (!existingConfig?.id || !activeOrganizationId) return;
    
    setActionLoading(true);
    try {
      const result = await debugCleanupWebsiteSources(existingConfig.id, activeOrganizationId);
      
      if (result.success) {
        invalidateQueries();
        setFormErrors([]);
        
        // Clear all crawled pages data
        setCrawledPagesData({});
        setShowCrawledPages({});
      } else {
        setFormErrors([result.error?.message || 'Failed to cleanup website sources']);
      }
    } catch (error) {
      setFormErrors(['An unexpected error occurred during cleanup']);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    // State
    websiteSources,
    crawlProgress,
    isAddingSource,
    isDeletingSource,
    isConfirmingAdd,
    successMessage,
    formErrors,
    actionLoading,
    formData,
    crawledPagesData,
    showCrawledPages,
    
    // Actions
    handleAddSource,
    handleRemoveSource,
    handleCrawlSource,
    handleCleanupSources,
    confirmAddSource,
    confirmDeleteSource,
    setIsAddingSource,
    setIsConfirmingAdd,
    setIsDeletingSource,
    setCrawlProgress,
    setCrawlingSourceId,
    updateFormData,
    resetForm,
    toggleCrawledPagesVisibility
  };
} 