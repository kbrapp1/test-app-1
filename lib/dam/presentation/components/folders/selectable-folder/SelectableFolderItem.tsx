'use client';

import React from 'react';
import { SelectableFolderList } from './components/SelectableFolderList';
import { SelectableFolderGrid } from './components/SelectableFolderGrid';
import { useSelectableFolderState } from './hooks/useSelectableFolderState';
import type { SelectableFolderItemProps } from './types';

/**
 * SelectableFolderItem - Main coordinator component
 * 
 * Follows DDD principles by delegating to specialized components.
 * Maintains clean separation between grid and list variants.
 */
export const SelectableFolderItem: React.FC<SelectableFolderItemProps> = (props) => {
  const { variant = 'grid' } = props;
  
  // State management hook
  const state = useSelectableFolderState(props);

  // Delegate to appropriate variant component
  if (variant === 'list') {
    return <SelectableFolderList {...props} state={state} />;
  }

  return <SelectableFolderGrid {...props} state={state} />;
}; 