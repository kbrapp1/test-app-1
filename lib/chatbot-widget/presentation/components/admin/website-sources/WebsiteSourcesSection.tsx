'use client';

/**
 * Website Sources Section Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Website source management UI coordination
 * - Delegate to specialized sub-components for different concerns
 * - Keep under 200-250 lines by extracting sub-components
 * - Use composition pattern for complex UI sections
 * - Follow @golden-rule patterns exactly
 * - Coordinate state and actions, delegate rendering
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useOrganization } from '../../../../../organization/application/providers/OrganizationProvider';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';
import { useWebsiteSourcesState } from '../../../hooks/useWebsiteSourcesState';
import { WebsiteSourcesHeader } from './WebsiteSourcesHeader';
import { WebsiteSourcesStats } from './WebsiteSourcesStats';
import { WebsiteSourcesGettingStarted } from './WebsiteSourcesGettingStarted';
import { WebsiteSourcesForm } from './WebsiteSourcesForm';
import { WebsiteSourcesList } from './WebsiteSourcesList';
import { WebsiteSourcesDialogs } from './WebsiteSourcesDialogs';
import { WebsiteSourcesMessages } from './WebsiteSourcesMessages';
import { CrawlProgressTracker } from './CrawlProgressTracker';

export interface CrawlProgress {
  sourceId: string;
  status: 'starting' | 'crawling' | 'processing' | 'vectorizing' | 'completed' | 'error';
  progress: number; // 0-100
  currentPage?: string;
  pagesFound: number;
  pagesProcessed: number;
  message?: string;
  error?: string;
}

export interface CrawledPageInfo {
  id: string;
  url: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  depth: number;
  contentLength: number;
  crawledAt: Date;
  status: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  responseTime?: number;
  statusCode?: number;
}

export function WebsiteSourcesSection() {
  const { activeOrganizationId } = useOrganization();
  const { config: existingConfig, isLoading, error } = useChatbotConfiguration({ 
    enableFormState: false 
  });

  const {
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
    clearCrawlProgress,
    setCrawlingSourceId,
    updateFormData,
    resetForm,
    toggleCrawledPagesVisibility
  } = useWebsiteSourcesState(
    activeOrganizationId || '', 
    existingConfig?.id || '', 
    existingConfig, 
    activeOrganizationId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full animate-pulse" />
          <p className="text-muted-foreground">Loading website sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load website sources. Please try again or contact support if the problem persists.
        </AlertDescription>
      </Alert>
    );
  }

  if (!existingConfig) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please configure your chatbot first before setting up website sources.
        </AlertDescription>
      </Alert>
    );
  }

  const hasAnySources = websiteSources.length > 0;

  return (
    <div className="space-y-8">
      <WebsiteSourcesHeader 
        hasAnySources={hasAnySources}
        onCleanup={handleCleanupSources}
        actionLoading={actionLoading}
      />

      <WebsiteSourcesMessages 
        formErrors={formErrors}
        successMessage={successMessage}
      />

      {crawlProgress && (
        <CrawlProgressTracker 
          sourceId={crawlProgress.sourceId}
          progress={crawlProgress}
          onCancel={() => {
            clearCrawlProgress();
            setCrawlingSourceId(null);
          }}
        />
      )}

      {hasAnySources && (
        <WebsiteSourcesStats websiteSources={websiteSources} />
      )}

      {!hasAnySources && (
        <WebsiteSourcesGettingStarted 
          onAddFirst={() => setIsAddingSource(true)}
        />
      )}

      {isAddingSource && (
        <WebsiteSourcesForm
          formData={formData}
          onUpdateFormData={updateFormData}
          onSubmit={handleAddSource}
          onCancel={() => {
            setIsAddingSource(false);
            resetForm();
          }}
          actionLoading={actionLoading}
        />
      )}

      {hasAnySources && (
        <WebsiteSourcesList
          sources={websiteSources}
          crawlProgress={crawlProgress}
          crawledPagesData={crawledPagesData}
          showCrawledPages={showCrawledPages}
          onCrawlSource={handleCrawlSource}
          onRemoveSource={handleRemoveSource}
          onToggleCrawledPages={toggleCrawledPagesVisibility}
        />
      )}

      <WebsiteSourcesDialogs
        isDeletingSource={isDeletingSource}
        isConfirmingAdd={isConfirmingAdd}
        websiteSources={websiteSources}
        formData={formData}
        actionLoading={actionLoading}
        onConfirmDelete={confirmDeleteSource}
        onConfirmAdd={confirmAddSource}
        onCancelDelete={() => setIsDeletingSource(null)}
        onCancelAdd={() => setIsConfirmingAdd(false)}
      />
    </div>
  );
} 