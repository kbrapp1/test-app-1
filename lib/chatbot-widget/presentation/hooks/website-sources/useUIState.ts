/**
 * UI State Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage UI-specific state
 * - Handle modal and loading states
 * - Keep UI state isolated from business logic
 * - Provide clean state management interface
 */

import { useState } from 'react';

/** UI State Hook */
export function useUIState() {
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isDeletingSource, setIsDeletingSource] = useState<string | null>(null);
  const [isConfirmingAdd, setIsConfirmingAdd] = useState(false);
  const [crawlingSourceId, setCrawlingSourceId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCrawledPages, setShowCrawledPages] = useState<Record<string, boolean>>({});

  const clearMessages = () => {
    setSuccessMessage(null);
  };

  const showSuccess = (message: string, duration = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), duration);
  };

  const toggleCrawledPagesVisibility = (sourceId: string) => {
    setShowCrawledPages(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  return {
    isAddingSource,
    isDeletingSource,
    isConfirmingAdd,
    crawlingSourceId,
    actionLoading,
    successMessage,
    showCrawledPages,
    setIsAddingSource,
    setIsDeletingSource,
    setIsConfirmingAdd,
    setCrawlingSourceId,
    setActionLoading,
    clearMessages,
    showSuccess,
    toggleCrawledPagesVisibility,
    setShowCrawledPages
  };
} 