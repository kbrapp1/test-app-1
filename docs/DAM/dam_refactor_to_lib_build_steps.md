# DAM Refactor to Lib - Build Steps ✅

**Status: COMPLETED**

All the planned refactoring steps have been completed. See [Migration Guide](migration_guide.md) for details on how to migrate from legacy code to the new architecture, and [Cleanup Legacy Files](cleanup_legacy_files.md) for information on the deprecation process.

**Overall Goal:** Refactor the existing Digital Asset Management (DAM) functionality into a dedicated `lib/dam` directory, adopting a layered architecture (Domain, Application, Infrastructure) to improve modularity, testability, and maintainability.

**Reference Project Structure & Schema:**
*   `project-structure.mdc`
*   `docs/supabase/full_schema_dump.sql`
*   Target `lib/dam` structure (as previously discussed)

---

## Phase 1: Setup `lib/dam` & Core Domain Entities

**Step 1: Create Initial `lib/dam` Directory Structure**
*   [x] **Action:** Create the following base directories:
    *   `lib/dam/application/`
    *   `lib/dam/application/dto/`
    *   `lib/dam/application/use-cases/`
    *   `lib/dam/domain/`
    *   `lib/dam/domain/entities/`
    *   `lib/dam/domain/repositories/` (for interfaces)
    *   `lib/dam/domain/value-objects/` (optional, for later refinement)
    *   `lib/dam/infrastructure/`
    *   `lib/dam/infrastructure/persistence/`
    *   `lib/dam/infrastructure/persistence/supabase/`
    *   `lib/dam/infrastructure/persistence/supabase/mappers/`
    *   `lib/dam/types/`
    *   `lib/dam/index.ts` (barrel file)
*   [X] **Rationale:** Establishes the foundational folder structure for the layered architecture.

**Step 2: Define Core DAM Domain Entities**
*   [x] **Files:**
    *   `lib/dam/domain/entities/Asset.ts`
    *   `lib/dam/domain/entities/Folder.ts`
    *   `lib/dam/domain/entities/Tag.ts`
*   [x] **Action:** Define basic TypeScript interfaces or classes for `Asset`, `Folder`, and `Tag`.
    *   These should reflect the properties found in your `public.assets`, `public.folders`, and `public.tags` Supabase tables.
    *   Initially, focus on properties. Business logic within entities can be added incrementally.
    *   Example for `Asset.ts` (updated to include tags):
        ```typescript
        import { Tag } from './Tag';

        export interface Asset {
          id: string; // uuid
          userId: string; // uuid
          name: string;
          storagePath: string;
          mimeType: string;
          size: number;
          createdAt: Date;
          updatedAt?: Date;
          folderId?: string | null; // uuid
          organizationId: string; // uuid
          tags?: Tag[]; // Optional tags property
          // Potentially add methods later, e.g., rename(newName: string)
        }
        ```
*   [X] **Rationale:** Establishes the core building blocks of your DAM domain.

**Step 3: Define Repository Interfaces in Domain Layer**
*   [x] **Files:**
    *   `lib/dam/domain/repositories/IAssetRepository.ts`
    *   `lib/dam/domain/repositories/IFolderRepository.ts` (Updated, e.g., with `getFolderTree`)
    *   `lib/dam/domain/repositories/ITagRepository.ts`
*   [x] **Action:** Define interfaces for repository contracts. These specify *what* data operations are possible, not *how* they are implemented.
    *   Example for `IAssetRepository.ts`:
        ```typescript
        import { Asset } from '../entities/Asset';

        export interface IAssetRepository {
          findById(id: string): Promise<Asset | null>;
          findByFolderId(folderId: string | null, organizationId: string): Promise<Asset[]>;
          // Add other common methods: save, delete, findByName, etc.
        }
        ```
*   [X] **Rationale:** Decouples application/domain logic from specific data storage implementations.

---

## Phase 2: Migrate Asset Listing & Details Functionality

**Step 4: Implement Supabase Asset Repository**
*   [x] **File:** `lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository.ts`
*   [x] **Action:**
    *   Create `SupabaseAssetRepository` class that implements `IAssetRepository`.
    *   Move relevant data fetching logic for assets from:
        *   `lib/repositories/asset.db.repo.ts`
        *   `app/api/dam/dam-api.helpers.ts` (functions like `fetchSearchResults` if applicable to simple listing)
        *   `app/api/dam/dam-api.query-builders.ts` (asset-related query builders)
    *   Adapt this logic to use the Supabase client (`createSupabaseServerClient` or similar).
    *   Implement methods defined in `IAssetRepository` (e.g., `findById`, `findByFolderId`).
*   [x] **Mappers (Optional but Recommended):**
    *   Create `lib/dam/infrastructure/persistence/supabase/mappers/AssetMapper.ts`. (Verified and updated to map tags correctly for `toDomain` and `fromDomainToRawApi`)
    *   Implement functions to map data from Supabase (e.g., snake_case fields) to your `Asset` domain entity and vice-versa if needed.
*   [X] **Testing (Unit/Integration):** Write tests for the new repository methods to ensure they fetch and map data correctly from Supabase.
*   [x] **Rationale:** Creates the first concrete implementation of a repository within the new structure.

**Step 5: Create Application Use Case for Getting Asset Details**
*   [x] **File:** `lib/dam/application/use-cases/GetAssetDetailsUseCase.ts`
*   [x] **Action:**
    *   Create a `GetAssetDetailsUseCase` class or function.
    *   It should take `assetId` and `organizationId` (for RLS context) as input.
    *   Inject an instance of `IAssetRepository` (dependency injection).
    *   The use case will call `assetRepository.findById(assetId)`.
    *   Return the `Asset` or a DTO.
*   [X] **DTO (Optional):**
    *   Define `lib/dam/application/dto/AssetDetailsDTO.ts` if the data exposed to the API/UI differs from the full `Asset` entity.
*   [x] **Rationale:** Implements the first application-specific operation using the new layers.

**Step 6: Refactor API Route for Asset Details**
*   [x] **File:** `app/api/dam/[assetId]/route.ts`
*   [x] **Action:**
    *   Modify the API route handler (e.g., `GET` method).
    *   Instantiate `SupabaseAssetRepository` and `GetAssetDetailsUseCase`.
    *   Call the use case with parameters from the request.
    *   Return the result from the use case.
    *   Remove direct Supabase calls or calls to old helper/repository files for this specific functionality.
*   [X] **Testing (E2E):** Test the API endpoint to ensure it returns asset details correctly.
*   [X] **Rationale:** Connects the UI/client request to the new application layer.

**Step 7: Create Application Use Case for Listing Assets (e.g., by Folder)**
*   [x] **File:** `lib/dam/application/use-cases/ListAssetsByFolderUseCase.ts`
*   [x] **Action:**
    *   Similar to Step 5, create a use case for listing assets (e.g., by `folderId` and `organizationId`).
    *   Inject `IAssetRepository` and call `assetRepository.findByFolderId(...)`.
*   [X] **DTO (Optional):**
    *   Define `lib/dam/application/dto/AssetListItemDTO.ts` if needed.
*   [x] **Rationale:** Extends application services for common DAM operations.

**Step 8: Refactor API Route/Server Action for Listing Assets**
*   [x] **Files:**
    *   Relevant API route in `app/api/dam/route.ts` (for GET requests with folderId query param).
    *   Or, if handled by server actions: relevant action in `lib/actions/dam/asset-crud.actions.ts`.
*   [x] **Action:**
    *   Modify the route handler or server action.
    *   Instantiate and call `ListAssetsByFolderUseCase`.
    *   Return the list of assets/DTOs.
*   [X] **Testing (E2E/Integration):** Test listing assets for different folders.
*   [X] **Rationale:** Adapts existing endpoints/actions to the new architecture.

---

## Phase 3: Migrate Asset Upload Functionality

**Step 9: Refactor Asset Upload Functionality**
*   [x] **Existing File:** `lib/usecases/dam/uploadAssetUsecase.ts`
*   [x] **Target File:** `lib/dam/application/use-cases/UploadAssetUseCase.ts`
*   [x] **Action:**
    *   Move and refactor `uploadAssetUsecase.ts` into the new location.
    *   This use case will likely involve:
        *   Interacting with an `IAssetRepository` (to save asset metadata).
        *   Interacting with a new `IStorageService` interface (defined in domain/application) for file uploads.
    *   Define `UploadAssetDTO.ts` in `lib/dam/application/dto/` for input.
*   [x] **Rationale:** Centralizes the logic for one of the most critical DAM operations.

**Step 10: Define `IStorageService` and Implement Supabase Storage Service**
*   [x] **Interface File:** `lib/dam/domain/repositories/IStorageService.ts` (or `lib/dam/application/services/IStorageService.ts`)
    *   Define methods like `uploadFile(file: File, path: string): Promise<{ publicUrl: string; storagePath: string }>`
*   [x] **Implementation File:** `lib/dam/infrastructure/storage/SupabaseStorageService.ts`
    *   Implement `IStorageService` using Supabase Storage client (`supabase.storage.from(...).upload(...)`).
    *   Move logic from `lib/repositories/asset.storage.repo.ts` here.
*   [x] **Rationale:** Abstracts file storage operations.

**Step 11: Update `UploadAssetUseCase` Dependencies**
*   [x] **File:** `lib/dam/application/use-cases/UploadAssetUseCase.ts`
*   [x] **Action:**
    *   Inject `IAssetRepository` and `IStorageService` into `UploadAssetUseCase`.
    *   Update the use case to use these injected services.
*   [x] **Rationale:** Ensures the use case uses the new abstracted services.

**Step 12: Refactor API Route for Asset Upload**
*   [x] **File:** `app/api/dam/upload/route.ts`
*   [x] **Action:**
    *   Modify the API route handler.
    *   Instantiate `SupabaseAssetRepository`, `SupabaseStorageService`, and `UploadAssetUseCase`.
    *   Call the `UploadAssetUseCase`.
    *   Handle file parsing (e.g., `await request.formData()`).
*   [x] **Testing (E2E):** Thoroughly test asset uploads.
*   [x] **Rationale:** Connects the upload endpoint to the refactored application logic.

---

## Phase 4: Migrate Folder & Tag Management

**Step 13: Implement Supabase Folder & Tag Repositories**
*   [x] **Files:**
    *   `lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository.ts` (Verified, updated, includes `getFolderTree`)
    *   `lib/dam/infrastructure/persistence/supabase/SupabaseTagRepository.ts` (Completed from prior work)
    *   `lib/dam/infrastructure/persistence/supabase/SupabaseAssetTagRepository.ts` (for the join table) (Implemented)
*   [x] **Action:**
    *   Implement these repositories similar to `SupabaseAssetRepository` (Step 4). `SupabaseFolderRepository`, `SupabaseTagRepository`, and `SupabaseAssetTagRepository` are now implemented. `FolderMapper.ts` and `TagMapper.ts` are aligned.
    *   Move logic from `lib/repositories/folder-repo.ts` and `lib/repositories/tag-repo.ts`, `lib/repositories/asset-tag.repo.ts`. (This step might require further verification if old files still exist and contain logic not yet migrated).
    *   Implement methods defined in `IFolderRepository` (all covered), `ITagRepository` (all covered), and `IAssetTagRepository` (all covered).
*   [x] **Rationale:** Provides data access for folders, tags, and their relationships.

**Step 14: Create/Refactor Folder & Tag Management Use Cases**
*   [x] **Files:** In `lib/dam/application/use-cases/` (e.g., `CreateFolderUseCase.ts`, `AddTagToAssetUseCase.ts`)
*   [x] **Action:**
    *   Create use cases for folder and tag management.
    *   Consider common use cases: `CreateFolderUseCase.ts` for creating folders, `AddTagToAssetUseCase.ts` for linking tags to assets.
    *   Inject the appropriate repositories (e.g., `IFolderRepository`, `ITagRepository`, `IAssetTagRepository`).
    *   Handle validation, business rules, and error conditions within use cases.
*   [x] **Rationale:** Centralizes business logic for folder and tag operations in a layer separate from repositories and API routes.