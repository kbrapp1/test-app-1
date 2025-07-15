/**
 * DAM Presentation Layer Interfaces
 * 
 * AI INSTRUCTIONS:
 * - Use base props from base-props.ts to reduce redundancy
 * - Follow @golden-rule DDD patterns exactly
 * - Single responsibility: DAM-specific interface definitions
 * - Keep under 250 lines - focused on domain-specific interfaces
 * - Security-critical: organizationId fields must be preserved
 * - Presentation layer only - no domain logic
 */

import { Asset as DomainAsset } from '../../domain/entities/Asset';
import { Folder as DomainFolder } from '../../domain/entities/Folder';
import { DamFilterParameters } from '../../application/dto/SearchCriteriaDTO';
import { 
  BaseComponentProps,
  SelectableAssetItemProps,
  SelectableFolderItemProps,
  FilterComponentProps,
  SearchComponentProps,
  LayoutComponentProps
} from './base-props';

// ===== GALLERY INTERFACES =====

/**
 * Props for main asset gallery component
 */
export interface AssetGalleryProps extends BaseComponentProps {
  folderId?: string | null;
  searchTerm?: string;
  onSelectionChange?: (selectedAssets: DomainAsset[]) => void;
  onFolderChange?: (folderId: string | null) => void;
  selectionMode?: boolean;
}

/**
 * Props for asset grid display
 */
export interface AssetGridProps extends BaseComponentProps {
  assets: DomainAsset[];
  folders: DomainFolder[];
  loading?: boolean;
  onAssetSelect?: (asset: DomainAsset) => void;
  onFolderNavigate?: (folderId: string) => void;
}

/**
 * Props for folder list display
 */
export interface FolderListProps extends BaseComponentProps {
  folders: DomainFolder[];
  onFolderSelect?: (folder: DomainFolder) => void;
  onFolderEdit?: (folder: DomainFolder) => void;
  onFolderDelete?: (folderId: string) => void;
}

// ===== SPECIFIC COMPONENT INTERFACES =====

/**
 * Asset item props - extends base selectable asset props
 */
export interface AssetItemProps extends SelectableAssetItemProps {
  onEdit?: (asset: DomainAsset) => void;
  selected?: boolean;
}

/**
 * Folder item props - extends base selectable folder props
 */
export interface FolderItemProps extends SelectableFolderItemProps {
  onEdit?: (folder: DomainFolder) => void;
}

// ===== EVENT HANDLERS =====

/**
 * Event handlers for DAM use case triggers
 */
export interface DamEventHandlers {
  onUploadAsset: (file: File, folderId?: string) => Promise<void>;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onMoveAsset: (assetId: string, targetFolderId: string) => Promise<void>;
  onRenameAsset: (assetId: string, newName: string) => Promise<void>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onSearch: (searchTerm: string) => Promise<void>;
  onFilterChange: (filters: DamFilterParameters) => Promise<void>;
}

// ===== VIEW MODELS =====

/**
 * View model for gallery display
 */
export interface DamGalleryViewModel {
  items: Array<DomainAsset | DomainFolder>;
  totalCount: number;
  currentFolder?: DomainFolder;
  breadcrumbs: Array<{ id: string; name: string }>;
  loading: boolean;
  error?: string;
}

/**
 * View model for search results
 */
export interface DamSearchViewModel {
  query: string;
  results: Array<DomainAsset | DomainFolder>;
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}

// ===== STATE MANAGEMENT =====

/**
 * Gallery state management interface
 */
export interface DamGalleryState {
  selectedAssets: DomainAsset[];
  selectedFolders: DomainFolder[];
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: DamFilterParameters;
}

// ===== SPECIALIZED INTERFACES =====

/**
 * DAM-specific filter props
 */
export interface DamFilterProps extends FilterComponentProps {
  filters: DamFilterParameters;
  onFilterChange: (filters: DamFilterParameters) => void;
}

/**
 * DAM-specific search props
 */
export interface DamSearchProps extends SearchComponentProps {
  onSearch: (query: string) => void;
  onSaveSearch?: (name: string, query: string) => void;
  savedSearches?: Array<{ id: string; name: string; query: string }>;
}

/**
 * DAM workspace layout props
 */
export interface DamWorkspaceProps extends LayoutComponentProps {
  currentFolderId?: string | null;
  onFolderChange: (folderId: string | null) => void;
  showSidebar?: boolean;
  onSidebarToggle?: () => void;
}

// ===== LEGACY COMPATIBILITY =====

/**
 * @deprecated Use ViewMode from base-props.ts instead
 */
export type ViewMode = 'grid' | 'list'; 
