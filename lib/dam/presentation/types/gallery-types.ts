/**
 * Gallery Presentation Layer Types
 * 
 * AI INSTRUCTIONS:
 * - Use base props to reduce redundancy
 * - Follow @golden-rule DDD patterns exactly
 * - Single responsibility: Gallery-specific type definitions
 * - Maintain compatibility with existing gallery components
 * - Security-critical: organizationId fields must be preserved
 */

import { GalleryItemDto } from '../../application/use-cases/folders/ListFolderContentsUseCase';
import { MultiSelectProps } from './base-props';

/**
 * Gallery multi-select state interface
 * Extends base multi-select props with gallery-specific methods
 */
export interface GalleryMultiSelectState extends MultiSelectProps {
  selectedAssets: string[];
  selectedFolders: string[];
  isSelecting: boolean;
  selectedCount: number;
  selectItem: (id: string, type: 'asset' | 'folder') => void;
  toggleSelectionMode: () => void;
  clearSelection: () => void;
  selectAll: (items: GalleryItemDto[]) => void;
  handleSelectAllFiles: (items: GalleryItemDto[]) => void;
  handleSelectAllFolders: (items: GalleryItemDto[]) => void;
  handleBulkOperation: (operation: 'move' | 'delete' | 'download' | 'addTags') => void;
}

/**
 * Simplified multi-select state for renderer components
 * Focused on core selection functionality
 */
export interface RendererMultiSelectState extends MultiSelectProps {
  selectedAssets: string[];
  selectedFolders: string[];
  isSelectionMode: boolean;
  selectItem: (id: string, type: 'asset' | 'folder') => void;
  toggleSelectionMode: () => void;
  clearSelection: () => void;
} 