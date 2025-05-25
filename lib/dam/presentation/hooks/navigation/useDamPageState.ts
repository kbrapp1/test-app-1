'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ViewMode } from '../types/interfaces';

export interface UseDamPageStateParams {
  initialCurrentFolderId: string | null;
  initialCurrentSearchTerm: string;
}

export interface UseDamPageStateReturn {
  // Core state
  currentFolderId: string | null;
  gallerySearchTerm: string;
  viewMode: ViewMode;
  refreshKey: number;
  
  // State setters
  setCurrentFolderId: (folderId: string | null) => void;
  setGallerySearchTerm: (term: string) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Actions
  handleGalleryRefresh: () => void;
}

/**
 * useDamPageState - Domain Hook for DAM Page State Management
 * 
 * Handles core state management and URL parameter synchronization:
 * - Current folder and search term state
 * - View mode persistence with localStorage
 * - URL parameter synchronization
 * - Gallery refresh mechanism
 * - Custom view mode event handling
 */
export function useDamPageState({
  initialCurrentFolderId,
  initialCurrentSearchTerm,
}: UseDamPageStateParams): UseDamPageStateReturn {
  const searchParams = useSearchParams();
  
  // Core state
  const [currentFolderId, setCurrentFolderId] = useState(initialCurrentFolderId);
  const [gallerySearchTerm, setGallerySearchTerm] = useState(initialCurrentSearchTerm);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync with initial props when they change
  useEffect(() => {
    setCurrentFolderId(initialCurrentFolderId);
  }, [initialCurrentFolderId]);

  useEffect(() => {
    setGallerySearchTerm(initialCurrentSearchTerm);
  }, [initialCurrentSearchTerm]);

  // Listen for URL parameter changes (for saved search execution)
  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentFolder = searchParams.get('folderId') || null;
    
    // Update search term if it changed via URL
    if (currentSearch !== gallerySearchTerm) {
      setGallerySearchTerm(currentSearch);
    }
    
    // Update folder if it changed via URL  
    if (currentFolder !== currentFolderId) {
      setCurrentFolderId(currentFolder);
    }
  }, [searchParams, gallerySearchTerm, currentFolderId]);

  // View mode persistence with localStorage
  useEffect(() => {
    const storedViewMode = localStorage.getItem('damViewMode') as ViewMode | null;
    if (storedViewMode && (storedViewMode === 'grid' || storedViewMode === 'list')) {
      setViewMode(storedViewMode);
    }
  }, []);

  // Custom view mode event listener
  useEffect(() => {
    const handleViewModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ newViewMode: ViewMode }>;
      if (customEvent.detail?.newViewMode) {
        setViewMode(customEvent.detail.newViewMode);
      }
    };
    window.addEventListener('damViewModeChange', handleViewModeChange);
    return () => {
      window.removeEventListener('damViewModeChange', handleViewModeChange);
    };
  }, []);

  // Gallery refresh handler
  const handleGalleryRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return {
    // Core state
    currentFolderId,
    gallerySearchTerm,
    viewMode,
    refreshKey,
    
    // State setters
    setCurrentFolderId,
    setGallerySearchTerm,
    setViewMode,
    
    // Actions
    handleGalleryRefresh,
  };
} 
