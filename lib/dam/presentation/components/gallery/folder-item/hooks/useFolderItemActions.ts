'use client';

import { useCallback } from 'react';

interface UseFolderItemActionsProps {
  isSelecting: boolean;
  isSelected: boolean;
  onSelectionChange?: (selected: boolean) => void;
  onClick: () => void;
}

interface FolderItemActions {
  handleClick: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing folder item actions
 * 
 * Single Responsibility: Event handling and interaction logic
 * Manages click behavior for selection vs navigation modes
 */
export function useFolderItemActions({
  isSelecting,
  isSelected,
  onSelectionChange,
  onClick
}: UseFolderItemActionsProps): FolderItemActions {

  /**
   * Handles click behavior based on current mode (selection vs navigation)
   */
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isSelecting && onSelectionChange) {
      // In selection mode: toggle selection state
      e.preventDefault();
      e.stopPropagation();
      onSelectionChange(!isSelected);
    } else {
      // In navigation mode: trigger folder navigation
      onClick();
    }
  }, [isSelecting, isSelected, onSelectionChange, onClick]);

  return {
    handleClick
  };
} 