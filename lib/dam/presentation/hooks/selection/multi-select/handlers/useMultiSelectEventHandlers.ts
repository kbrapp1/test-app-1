'use client';

import React, { useCallback, useEffect } from 'react';
import type { MultiSelectState } from '../types';

/**
 * Multi-select event handlers hook - Event Management
 * 
 * Handles keyboard events and global event management.
 * Follows SRP by focusing solely on event handling.
 */
export const useMultiSelectEventHandlers = (
  state: MultiSelectState,
  operations: { clearSelection: () => void }
) => {
  const { isSelecting, exitSelectionMode } = state;
  const { clearSelection } = operations;

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent | React.KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    
    switch (event.key) {
      case 'Escape':
        if (isSelecting) {
          exitSelectionMode();
          event.preventDefault();
        }
        break;
        
      case 'a':
      case 'A':
        if (isCtrlOrCmd && isSelecting) {
          // selectAll would need items - this should be handled by parent component
          event.preventDefault();
        }
        break;
        
      case 'd':
      case 'D':
        if (isCtrlOrCmd && isSelecting) {
          clearSelection();
          event.preventDefault();
        }
        break;
    }
  }, [isSelecting, exitSelectionMode, clearSelection]);

  // Global keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      handleKeyDown(event);
    };

    if (isSelecting) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => document.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [isSelecting, handleKeyDown]);

  return {
    handleKeyDown
  };
}; 