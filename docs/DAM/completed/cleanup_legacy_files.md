# DAM Legacy File Cleanup

As part of the DAM refactoring project to adopt a layered architecture (Domain, Application, Infrastructure), the following legacy files are being deprecated and will eventually be removed. For now, they are being maintained to support a transition period, but new code should use their replacements.

## Repository Layer

| Legacy File | Replacement | Status |
|-------------|-------------|--------|
| `lib/repositories/asset.db.repo.ts` | `lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository.ts` | Removed |
| `lib/repositories/asset.storage.repo.ts` | `lib/dam/infrastructure/storage/SupabaseStorageService.ts` | Removed |
| `lib/repositories/folder-repo.ts` | `lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository.ts` | Removed |
| `lib/repositories/asset-tag.repo.ts` | `lib/dam/infrastructure/persistence/supabase/SupabaseAssetTagRepository.ts` | Removed |

## Service Layer

| Legacy File | Replacement | Status |
|-------------|-------------|--------|
| `lib/services/asset-core.service.ts` | `lib/dam/application/services/AssetService.ts` | Removed |

## Deprecation Process

1. **Phase 1: Documentation and Dual Maintenance** (Current)
   - Create new implementations in the layered architecture
   - Mark old files as deprecated with JSDoc comments
   - Document migration path for consumers
   - Keep both implementations functioning

2. **Phase 2: Migration** (Future)
   - Migrate all consuming code to use new implementations
   - Add console warnings in old implementations

3. **Phase 3: Removal** (Future)
   - Remove old implementations when all code has been migrated

## Usage Notes

Any code that was previously using these legacy repositories should be migrated to use the new use cases in `lib/dam/application/use-cases/` when possible, which include:

- `GetAssetDetailsUseCase.ts`
- `ListAssetsByFolderUseCase.ts`
- `UploadAssetUseCase.ts`
- `CreateFolderUseCase.ts`
- `AddTagToAssetUseCase.ts`

For direct repository access, the new repository interfaces and implementations should be used:

- `IAssetRepository` / `SupabaseAssetRepository`
- `IFolderRepository` / `SupabaseFolderRepository`
- `ITagRepository` / `SupabaseTagRepository`
- `IAssetTagRepository` / `SupabaseAssetTagRepository`
- `IStorageService` / `SupabaseStorageService`

See the [Migration Guide](migration_guide.md) for detailed examples of how to update code.

Date of deprecation: [Current Date] 