/**
 * Base Props Interfaces for DAM Presentation Layer
 * 
 * AI INSTRUCTIONS:
 * - Consolidate similar prop patterns across DAM components
 * - Follow @golden-rule DDD patterns exactly
 * - Single responsibility: Base prop definitions only
 * - Keep under 250 lines - focused on reusable interfaces
 * - Use composition over inheritance for flexibility
 * - Security-critical: organizationId fields must be preserved
 * - Presentation layer only - no domain logic
 */

import React from 'react';
import { GalleryItemDto } from '../../domain/value-objects/GalleryItem';

// ===== CORE COMPONENT PROPS =====

/**
 * Base props for all DAM components
 */
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

/**
 * Base props for interactive components
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

// ===== ITEM DISPLAY PROPS =====

/**
 * Common props for displaying gallery items (assets or folders)
 */
export interface GalleryItemDisplayProps extends BaseComponentProps {
  item: GalleryItemDto;
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
}

/**
 * Props for asset-specific display components
 */
export interface AssetDisplayProps extends BaseComponentProps {
  asset: GalleryItemDto & { type: 'asset' };
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
}

/**
 * Props for folder-specific display components
 */
export interface FolderDisplayProps extends BaseComponentProps {
  folder: GalleryItemDto & { type: 'folder' };
  variant?: 'grid' | 'list';
  isOptimisticallyHidden?: boolean;
}

// ===== SELECTION PROPS =====

/**
 * Props for components that support selection
 */
export interface SelectionProps {
  isSelected?: boolean;
  isSelecting?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

/**
 * Props for multi-select functionality
 */
export interface MultiSelectProps extends SelectionProps {
  selectionMode?: boolean;
  selectedItems?: string[];
  onBulkSelectionChange?: (selectedIds: string[]) => void;
}

// ===== ACTION PROPS =====

/**
 * Common action handlers for assets
 */
export interface AssetActionProps {
  onViewDetails?: () => void;
  onRename?: () => void;
  onMove?: (assetId: string, targetFolderId: string) => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onTag?: () => void;
}

/**
 * Common action handlers for folders
 */
export interface FolderActionProps {
  onNavigate?: () => void;
  onRename?: () => void;
  onMove?: (folderId: string, targetParentId: string) => void;
  onDelete?: () => void;
  onCreateSubfolder?: () => void;
}

/**
 * Navigation-specific action props
 */
export interface NavigationActionProps {
  onClick?: () => void;
  enableNavigation?: boolean;
  onFolderChange?: (folderId: string | null) => void;
}

// ===== DIALOG PROPS =====

/**
 * Base props for dialog components
 */
export interface BaseDialogProps extends BaseComponentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
}

/**
 * Props for confirmation dialogs
 */
export interface ConfirmationDialogProps extends BaseDialogProps {
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel?: () => void;
}

/**
 * Props for input dialogs
 */
export interface InputDialogProps extends BaseDialogProps {
  placeholder?: string;
  defaultValue?: string;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
  onSubmit: (value: string) => void;
  onCancel?: () => void;
}

// ===== BULK OPERATION PROPS =====

/**
 * Props for bulk operation dialogs
 */
export interface BulkOperationDialogProps extends BaseDialogProps {
  selectedItems: GalleryItemDto[];
  operationType: 'delete' | 'move' | 'download' | 'tag';
  onConfirm: (items: GalleryItemDto[]) => void;
  onCancel?: () => void;
}

// ===== FILTER AND SEARCH PROPS =====

/**
 * Props for filter components
 */
export interface FilterComponentProps extends BaseComponentProps {
  value?: string | number | boolean | string[] | number[];
  onChange: (value: string | number | boolean | string[] | number[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Props for search components
 */
export interface SearchComponentProps extends BaseComponentProps {
  query?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

// ===== LAYOUT PROPS =====

/**
 * Props for layout components
 */
export interface LayoutComponentProps extends BaseComponentProps {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  error?: string;
}

/**
 * Props for gallery layout components
 */
export interface GalleryLayoutProps extends LayoutComponentProps {
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

// ===== COMPOSITE PROPS =====

/**
 * Complete props for selectable asset items
 */
export interface SelectableAssetItemProps extends 
  AssetDisplayProps, 
  SelectionProps, 
  AssetActionProps, 
  NavigationActionProps {
}

/**
 * Complete props for selectable folder items
 */
export interface SelectableFolderItemProps extends 
  FolderDisplayProps, 
  SelectionProps, 
  FolderActionProps, 
  NavigationActionProps {
}

/**
 * Props for thumbnail components
 */
export interface ThumbnailProps extends BaseComponentProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: React.ReactNode;
  loading?: boolean;
}

/**
 * Props for tag-related components
 */
export interface TagComponentProps extends BaseComponentProps {
  tags?: string[];
  onTagAdd?: (tag: string) => void;
  onTagRemove?: (tag: string) => void;
  onTagClick?: (tag: string) => void;
  editable?: boolean;
  maxTags?: number;
} 