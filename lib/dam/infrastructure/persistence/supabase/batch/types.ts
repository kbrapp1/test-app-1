/**
 * Shared types for batch operations
 */
export interface BatchOperationResult {
  successful: string[];
  failed: string[];
  errors: string[];
}

export interface ValidatedEntity {
  id: string;
  name?: string;
  organizationId: string;
}

export interface AssetEntity extends ValidatedEntity {
  storage_path?: string;
}

export interface FolderEntity extends ValidatedEntity {
  parent_folder_id: string | null;
}

export interface ValidationResult<T = ValidatedEntity> {
  valid: T[];
  invalid: string[];
  errors: string[];
} 