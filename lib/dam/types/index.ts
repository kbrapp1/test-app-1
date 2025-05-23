// Types for lib/dam module
export {};

// Re-export component types
export type {
  ComponentAsset as Asset,
  ComponentFolder as Folder,
  CombinedItem,
  ComponentFilterParameters as DamFilterParameters,
  ComponentSortParameters as DamSortParameters,
  UploadFormData,
} from './component';

// Re-export domain types for convenience
export type { Asset as DomainAsset } from '../domain/entities/Asset';
export type { Folder as DomainFolder } from '../domain/entities/Folder';
export type { Tag as DomainTag } from '../domain/entities/Tag';

// Re-export tag types
export type { Tag } from '@/lib/actions/dam/tag.actions'; 