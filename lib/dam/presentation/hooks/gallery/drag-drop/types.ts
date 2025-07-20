/**
 * Domain types for drag and drop operations
 * 
 * Single Responsibility: Type definitions and domain modeling
 * Following DDD principles with clear value objects
 */

import type { GalleryItemDto } from '../../../../domain/value-objects/GalleryItem';

// Value Objects
export interface DragOperation {
  readonly itemId: string;
  readonly itemType: 'asset' | 'folder';
  readonly targetId: string | null;
  readonly sourceItem: GalleryItemDto | unknown;
}

export interface DragValidationResult {
  readonly isValid: boolean;
  readonly reason?: string;
}

export interface BulkMoveSelection {
  readonly selectedAssets: string[];
  readonly selectedFolders: string[];
}

export interface DragEndResult {
  readonly success: boolean;
  readonly cancelled?: boolean;
  readonly error?: string;
  readonly reason?: string;
}

// Props interfaces
export interface UseDamDragAndDropProps {
  onItemsUpdate: (updater: (items: GalleryItemDto[]) => GalleryItemDto[]) => void;
  onToast: (toast: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  onRefreshData?: () => Promise<void> | void;
}

export interface DragEndParams {
  event: unknown; // DragEndEvent from @dnd-kit/core
  selectionState?: BulkMoveSelection;
  activeItemData?: GalleryItemDto;
} 