import { Asset as DomainAsset } from '../../domain/entities/Asset';
import { Folder as DomainFolder } from '../../domain/entities/Folder';
import { GetDamDataResult } from '../../application/use-cases/GetDamDataUseCase';

// Presentation Layer Interfaces for DAM Components
// These define the contracts between the domain and UI layers

export interface AssetGalleryProps {
  folderId?: string | null;
  searchTerm?: string;
  onSelectionChange?: (selectedAssets: DomainAsset[]) => void;
  onFolderChange?: (folderId: string | null) => void;
  selectionMode?: boolean;
}

export interface AssetGridProps {
  assets: DomainAsset[];
  folders: DomainFolder[];
  loading?: boolean;
  onAssetSelect?: (asset: DomainAsset) => void;
  onFolderNavigate?: (folderId: string) => void;
}

export interface FolderListProps {
  folders: DomainFolder[];
  onFolderSelect?: (folder: DomainFolder) => void;
  onFolderEdit?: (folder: DomainFolder) => void;
  onFolderDelete?: (folderId: string) => void;
}

export interface AssetItemProps {
  asset: DomainAsset;
  onSelect?: (asset: DomainAsset) => void;
  onEdit?: (asset: DomainAsset) => void;
  onDelete?: (assetId: string) => void;
  onMove?: (assetId: string, targetFolderId: string) => void;
  selected?: boolean;
}

export interface FolderItemProps {
  folder: DomainFolder;
  onNavigate?: (folderId: string) => void;
  onEdit?: (folder: DomainFolder) => void;
  onDelete?: (folderId: string) => void;
  onMove?: (folderId: string, targetParentId: string) => void;
}

// Event handlers for use case triggers
export interface DamEventHandlers {
  onUploadAsset: (file: File, folderId?: string) => Promise<void>;
  onCreateFolder: (name: string, parentId?: string) => Promise<void>;
  onDeleteAsset: (assetId: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
  onMoveAsset: (assetId: string, targetFolderId: string) => Promise<void>;
  onRenameAsset: (assetId: string, newName: string) => Promise<void>;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onSearch: (searchTerm: string) => Promise<void>;
  onFilterChange: (filters: any) => Promise<void>;
}

// View models for transforming domain data for UI
export interface DamGalleryViewModel {
  items: Array<DomainAsset | DomainFolder>;
  totalCount: number;
  currentFolder?: DomainFolder;
  breadcrumbs: Array<{ id: string; name: string }>;
  loading: boolean;
  error?: string;
}

export interface DamSearchViewModel {
  query: string;
  results: Array<DomainAsset | DomainFolder>;
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}

// Component state management interfaces
export interface DamGalleryState {
  selectedAssets: DomainAsset[];
  selectedFolders: DomainFolder[];
  viewMode: 'grid' | 'list';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>;
}

// View mode for gallery display
export type ViewMode = 'grid' | 'list'; 