# DAM Legacy Code Migration - Phase 2 Plan

## Identified Consumers of Legacy Code

Based on our analysis, the following files still import and use the legacy code:

### 1. Using `folder-repo.ts`:
- `lib/services/asset-core.service.ts` - Already has a wrapper
- `lib/actions/dam/folder.action.helpers.ts`
- `components/dam/AssetGallery.tsx`

### 2. Using `asset.db.repo.ts`:
- ~~`lib/usecases/tts/saveTtsAudioToDamUsecase.ts`~~ - Migrated ✅
- ~~`lib/usecases/tts/saveTtsAudioToDamUsecase.test.ts`~~ - Migrated ✅

### 3. Using `asset-core.service.ts`:
- ~~`lib/usecases/dam/deleteAssetUsecase.ts`~~ - Migrated ✅
- ~~`lib/usecases/dam/moveAssetUsecase.ts`~~ - Migrated ✅
- ~~`lib/usecases/dam/renameAssetUsecase.ts`~~ - Migrated ✅
- ~~`lib/usecases/dam/getAssetDownloadUrlUsecase.ts`~~ - Migrated ✅
- ~~`lib/actions/dam/asset-url.actions.ts`~~ - Migrated ✅

## Migration Approach

For each consumer, we'll:

1. Replace imports from legacy files with imports from the new architecture
2. Update function calls to use the new API
3. Handle any type conversions
4. Test the changes

## Migration Steps by Consumer Group

### Group 1: TTS Audio to DAM - COMPLETED ✅

**Files Updated:**
- `lib/usecases/tts/saveTtsAudioToDamUsecase.ts` - Migrated to use SupabaseAssetRepository
- `lib/usecases/tts/saveTtsAudioToDamUsecase.test.ts` - Updated tests to use SupabaseAssetRepository

**Changes Made:**
- Replaced `createAssetRecordInDb` with direct usage of `SupabaseAssetRepository.save()`
- Updated input object structure to match new repository method
- Updated test mocks to use the new patterns

### Group 2: DAM Usecases - COMPLETED ✅

**Files Updated:**
- `lib/usecases/dam/deleteAssetUsecase.ts` - Migrated to use AssetService
- `lib/usecases/dam/moveAssetUsecase.ts` - Migrated to use AssetService
- `lib/usecases/dam/renameAssetUsecase.ts` - Migrated to use AssetService
- `lib/usecases/dam/getAssetDownloadUrlUsecase.ts` - Migrated to use AssetService

**Changes Made:**
- Replaced service imports from `asset-core.service.ts` with imports from `lib/dam/application/services/AssetService.ts`
- Implemented dependency injection pattern for the AssetService
- Created new instances of all required dependencies
- Updated method calls to use the new service methods

### Group 3: DAM UI Components

**Files to Update:**
- `components/dam/AssetGallery.tsx`

**Changes Needed:**
- Replace `getFolderById` with direct usage of `SupabaseFolderRepository.findById()`
- Update any UI components that depend on the old data structure

### Group 4: Action Helpers - COMPLETED ✅

**Files Updated:**
- ~~`lib/actions/dam/asset-url.actions.ts`~~ - Migrated to use AssetService
- `lib/actions/dam/folder.action.helpers.ts`

**Changes Made:**
- Replaced legacy imports with new architecture imports
- Updated function signatures and return types
- Added improved functionality (forceDownload parameter)

## Testing Strategy

1. Update tests alongside code changes
2. Add new tests for any edge cases
3. Verify that all functionality works as expected in dev environment
4. Monitor console for any remaining deprecation warnings

## Timeline

- Group 1: TTS Audio to DAM - COMPLETED
- Group 2: DAM Usecases - COMPLETED
- Group 4: Action Helpers - COMPLETED
- Group 3: DAM UI Components - [DATE]

## Progress Tracking

| File | Status | Notes |
|------|--------|-------|
| `lib/usecases/tts/saveTtsAudioToDamUsecase.ts` | ✅ Completed | Migrated to use SupabaseAssetRepository.save() |
| `lib/usecases/tts/saveTtsAudioToDamUsecase.test.ts` | ✅ Completed | Updated test mocks for new architecture |
| `lib/usecases/dam/deleteAssetUsecase.ts` | ✅ Completed | Migrated to use AssetService with DI pattern |
| `lib/usecases/dam/moveAssetUsecase.ts` | ✅ Completed | Migrated to use AssetService with DI pattern |
| `lib/usecases/dam/renameAssetUsecase.ts` | ✅ Completed | Migrated to use AssetService with DI pattern |
| `lib/usecases/dam/getAssetDownloadUrlUsecase.ts` | ✅ Completed | Migrated to use AssetService with DI pattern |
| `lib/actions/dam/asset-url.actions.ts` | ✅ Completed | Migrated to use AssetService with DI pattern and added forceDownload option |
| `lib/actions/dam/folder.action.helpers.ts` | Pending | |
| `components/dam/AssetGallery.tsx` | Pending | | 