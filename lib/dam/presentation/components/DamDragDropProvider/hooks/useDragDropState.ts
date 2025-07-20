import { useState, useEffect, useCallback } from 'react';
import type { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';

interface DragItem {
  type: 'asset' | 'folder';
  item: GalleryItemDto;
}

interface DragDropState {
  activeItem: DragItem | null;
  isProcessing: boolean;
  showOverlay: boolean;
  selectedAssets: string[];
  selectedFolders: string[];
}

/**
 * Hook for managing drag and drop state
 * 
 * Single Responsibility: State management for drag and drop operations
 */
export function useDragDropState() {
  const [state, setState] = useState<DragDropState>({
    activeItem: null,
    isProcessing: false,
    showOverlay: false,
    selectedAssets: [],
    selectedFolders: []
  });

  // Individual state setters for better control
  const setActiveItem = useCallback((item: DragItem | null) => {
    setState(prev => ({ ...prev, activeItem: item }));
  }, []);

  const setIsProcessing = useCallback((processing: boolean) => {
    setState(prev => ({ ...prev, isProcessing: processing }));
  }, []);

  const setShowOverlay = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showOverlay: show }));
  }, []);

  const setSelectedAssets = useCallback((assets: string[]) => {
    setState(prev => ({ ...prev, selectedAssets: assets }));
  }, []);

  const setSelectedFolders = useCallback((folders: string[]) => {
    setState(prev => ({ ...prev, selectedFolders: folders }));
  }, []);

  // Composite state setters for common operations
  const startDrag = useCallback((item: DragItem) => {
    setState(prev => ({
      ...prev,
      activeItem: item,
      showOverlay: true,
      isProcessing: false
    }));
  }, []);

  const startProcessing = useCallback(() => {
    setState(prev => ({ ...prev, isProcessing: true }));
  }, []);

  const completeDragSuccess = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeItem: null,
      showOverlay: false,
      isProcessing: false,
      selectedAssets: [],
      selectedFolders: []
    }));
  }, []);

  const cancelDrag = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeItem: null,
      showOverlay: false,
      isProcessing: false
      // Don't reset selection state on cancellation - keep items selected for next drag
    }));
  }, []);

  const resetState = useCallback(() => {
    setState({
      activeItem: null,
      isProcessing: false,
      showOverlay: false,
      selectedAssets: [],
      selectedFolders: []
    });
  }, []);

  // Listen for selection updates from the global selection system
  useEffect(() => {
    const handleSelectionUpdate = (event: CustomEvent) => {
      const { selectedAssets: assets, selectedFolders: folders } = event.detail;
      setState(prev => ({
        ...prev,
        selectedAssets: assets || [],
        selectedFolders: folders || []
      }));
    };

    window.addEventListener('damSelectionUpdate', handleSelectionUpdate as EventListener);
    return () => window.removeEventListener('damSelectionUpdate', handleSelectionUpdate as EventListener);
  }, []);

  return {
    // State values
    ...state,
    
    // Individual setters
    setActiveItem,
    setIsProcessing,
    setShowOverlay,
    setSelectedAssets,
    setSelectedFolders,
    
    // Composite operations
    startDrag,
    startProcessing,
    completeDragSuccess,
    cancelDrag,
    resetState
  };
} 