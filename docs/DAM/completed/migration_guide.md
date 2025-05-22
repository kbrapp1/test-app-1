# DAM Migration Guide

## Overview

As part of the DAM refactoring to a layered architecture, several legacy files are being deprecated in favor of new implementations. This guide explains how to update your code to use the new architecture.

## Repository Layer Changes

### Asset Database Operations

**Old approach:**
```typescript
import { 
  getAssetByIdFromDb, 
  updateAssetFolderInDb 
} from '@/lib/repositories/asset.db.repo';

// Using the old repository
const { data, error } = await getAssetByIdFromDb(assetId, organizationId);
```

**New approach:**
```typescript
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { createClient } from '@/lib/supabase/server';

// Create repository instance
const supabase = createClient();
const assetRepository = new SupabaseAssetRepository(supabase);

// Using the repository
const asset = await assetRepository.findById(assetId);
if (asset && asset.organizationId === organizationId) {
  // Process asset
}
```

### Asset Storage Operations

**Old approach:**
```typescript
import { 
  removeAssetFromStorage, 
  getAssetSignedUrlFromStorage 
} from '@/lib/repositories/asset.storage.repo';

// Using the old storage repository
const { data, error } = await getAssetSignedUrlFromStorage(storagePath, expirySeconds);
```

**New approach:**
```typescript
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '@/lib/supabase/server';

// Create storage service instance
const supabase = createClient();
const storageService = new SupabaseStorageService(supabase);

// Using the storage service
const signedUrl = await storageService.getSignedUrl(storagePath, expirySeconds);
```

### Folder Operations

**Old approach:**
```typescript
import { getFolderById } from '@/lib/repositories/folder-repo';

// Using the old folder repository
const { data, error } = await getFolderById(folderId, organizationId);
```

**New approach:**
```typescript
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { createClient } from '@/lib/supabase/server';

// Create repository instance
const supabase = createClient();
const folderRepository = new SupabaseFolderRepository(supabase);

// Using the repository
const folder = await folderRepository.findById(folderId);
```

### Tag Operations

**Old approach:**
```typescript
import { addTagToAssetInDb } from '@/lib/repositories/asset-tag.repo';

// Using the old asset-tag repository
const { error } = await addTagToAssetInDb(assetId, tagId);
```

**New approach:**
```typescript
import { SupabaseAssetTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetTagRepository';
import { createClient } from '@/lib/supabase/server';

// Create repository instance
const supabase = createClient();
const assetTagRepository = new SupabaseAssetTagRepository(supabase);

// Using the repository
const success = await assetTagRepository.linkTagToAsset(assetId, tagId, organizationId, userId);
```

## Service Layer Changes

For higher-level operations, we've created service classes that encapsulate business logic:

**Old approach:**
```typescript
import { moveAssetService } from '@/lib/services/asset-core.service';

// Using the old service
const result = await moveAssetService(organizationId, assetId, targetFolderId);
```

**New approach:**
```typescript
import { AssetService } from '@/lib/dam/application/services/AssetService';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseFolderRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository';
import { SupabaseStorageService } from '@/lib/dam/infrastructure/storage/SupabaseStorageService';
import { createClient } from '@/lib/supabase/server';

// Setup dependencies
const supabase = createClient();
const assetRepository = new SupabaseAssetRepository(supabase);
const folderRepository = new SupabaseFolderRepository(supabase);
const storageService = new SupabaseStorageService(supabase);

// Create service with dependencies
const assetService = new AssetService(
  assetRepository,
  folderRepository,
  storageService
);

// Using the service
const result = await assetService.moveAsset(organizationId, assetId, targetFolderId);
```

## Use Case Layer

For complex operations involving multiple repositories, use the Use Cases in the application layer:

```typescript
import { AddTagToAssetUseCase } from '@/lib/dam/application/use-cases/AddTagToAssetUseCase';
import { SupabaseAssetRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository';
import { SupabaseTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseTagRepository';
import { SupabaseAssetTagRepository } from '@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetTagRepository';
import { createClient } from '@/lib/supabase/server';

// Setup dependencies
const supabase = createClient();
const assetRepository = new SupabaseAssetRepository(supabase);
const tagRepository = new SupabaseTagRepository(supabase);
const assetTagRepository = new SupabaseAssetTagRepository(supabase);

// Create use case with dependencies
const addTagToAssetUseCase = new AddTagToAssetUseCase(
  assetRepository,
  tagRepository,
  assetTagRepository
);

// Execute the use case
const success = await addTagToAssetUseCase.execute({
  assetId,
  tagId,
  organizationId,
  userId
});
```

## Entity Mapping Changes

The new architecture uses Domain entities rather than the previous database record types:

**Old approach:**
```typescript
import { type AssetDbRecord } from '@/lib/repositories/asset.db.repo';
import { type Asset } from '@/lib/dam/types/dam.types';

// Manual mapping
function dbRecordToAppAsset(dbRecord: AssetDbRecord): Asset {
  return {
    id: dbRecord.id,
    created_at: dbRecord.created_at,
    name: dbRecord.name,
    // ...
  };
}
```

**New approach:**
```typescript
import { Asset } from '@/lib/dam/domain/entities/Asset';

// Repositories now return Domain entities directly
const asset: Asset = await assetRepository.findById(assetId);
// asset now has properties like id, name, storagePath, etc.
```

## Benefits of the New Architecture

1. **Dependency Injection**: Makes testing easier as dependencies can be mocked
2. **Clean Interfaces**: Repository interfaces are separate from implementations
3. **Domain-Driven Design**: Focus on domain entities and business rules
4. **Testability**: Each layer can be tested independently
5. **Flexibility**: Easier to change storage providers or databases in the future 