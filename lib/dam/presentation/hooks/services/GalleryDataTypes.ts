import { GalleryItemDto } from '../../../domain/value-objects/GalleryItem';

// Domain interfaces for gallery data management
export interface GalleryDataParams {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string[];
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: number;
  filterSizeMax?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface GalleryDataResult {
  success: boolean;
  data?: {
    items: GalleryItemDto[];
  };
  error?: string;
}

export interface UseDamGalleryDataProps {
  currentFolderId: string | null;
  searchTerm?: string;
  tagIds?: string;
  filterType?: string;
  filterCreationDateOption?: string;
  filterDateStart?: string;
  filterDateEnd?: string;
  filterOwnerId?: string;
  filterSizeOption?: string;
  filterSizeMin?: string;
  filterSizeMax?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface DomainGalleryState {
  items: GalleryItemDto[];
  loading: boolean;
  isFirstLoad: boolean;
  error?: string;
}

export interface UseDamGalleryDataReturn extends DomainGalleryState {
  fetchData: (forceRefresh?: boolean) => Promise<void>;
  updateItems: (newItems: GalleryItemDto[]) => void;
  folders: (GalleryItemDto & { type: 'folder' })[];
  assets: (GalleryItemDto & { type: 'asset' })[];
} 
