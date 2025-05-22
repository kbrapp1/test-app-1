# DAM API Layer Refactor - Build Steps

**Status: PENDING**

**Overall Goal:** Refactor the legacy DAM API helper, query-builder, and transformer files (`app/api/dam/dam-api.*.ts`) to align with the layered architecture established in `lib/dam`. This involves moving business logic to Application Use Cases and data access/query logic to Infrastructure Repositories.

**Reference Files (Legacy):**
*   `app/api/dam/dam-api.helpers.ts`
*   `app/api/dam/dam-api.query-builders.ts`
*   `app/api/dam/dam-api.transformers.ts`
*   `app/api/dam/route.ts` (as the primary consumer)

---

## Phase 1: Refactor Folder Fetching in API Route (Non-Search Scenario)

**Affected API Route Logic:** The part of `app/api/dam/route.ts` that handles requests without a `searchTerm`, typically for browsing a specific folder or the root.

**Step 1.1: Create `ListFoldersUseCase`**
*   [ ] **File:** `lib/dam/application/use-cases/ListFoldersUseCase.ts`
*   [ ] **Action:**
    *   Define a `ListFoldersUseCase` class.
    *   Inject `IFolderRepository`.
    *   Input: `{ parentFolderId: string | null, organizationId: string, sortParams?: DamSortParameters, filters?: DamFilterParameters }` (Define `DamSortParameters` and `DamFilterParameters` if not already shared, or use relevant existing types).
    *   Logic:
        *   Call `folderRepository.findFoldersByParentId(parentFolderId, organizationId, sortParams, filters)`. (The repository method will need to be enhanced).
        *   Return `Folder[]` (domain entities).
*   [ ] **Rationale:** Encapsulates the logic for listing folders within the application layer.

**Step 1.2: Enhance `SupabaseFolderRepository`**
*   [ ] **File:** `lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository.ts`
*   [ ] **Action:**
    *   Modify `findFoldersByParentId` (or create a new, more specific method like `findAndFilterFoldersByParentId`) to accept optional `sortParams` and `filters`.
    *   Incorporate sorting logic (e.g., by `name`, `created_at`) and filtering logic (e.g., by `type` if applicable, `creationDateOption`, `ownerId`) currently found in `app/api/dam/dam-api.query-builders.ts` (`buildFolderBaseQueryInternal`) into this repository method.
*   [ ] **Rationale:** Consolidates folder data access and query construction within the repository.

**Step 1.3: Update `app/api/dam/route.ts` (Non-Search Path)**
*   [ ] **File:** `app/api/dam/route.ts`
*   [ ] **Action:**
    *   In the conditional branch for non-search scenarios:
        *   Instantiate `SupabaseFolderRepository` and `ListFoldersUseCase`.
        *   Call `listFoldersUseCase.execute(...)` to fetch folders instead of using `buildFolderBaseQueryInternal` directly.
        *   The result will be `Folder[]` (domain entities).
*   [ ] **Rationale:** Updates the API route to use the new use case for fetching folders.

---

## Phase 2: Refactor Search Functionality (`fetchSearchResults`)

**Affected API Route Logic:** The part of `app/api/dam/route.ts` that calls `fetchSearchResults`.

**Step 2.1: Create `SearchDamItemsUseCase`**
*   [ ] **File:** `lib/dam/application/use-cases/SearchDamItemsUseCase.ts`
*   [ ] **Action:**
    *   Define a `SearchDamItemsUseCase` class.
    *   Inject `IAssetRepository` and `IFolderRepository`.
    *   Input: `{ organizationId: string, searchTerm?: string, tagIds?: string[], filters?: DamFilterParameters, sortParams?: DamSortParameters, limitOptions?: LimitOptions, isGlobalFilterOnlyMode?: boolean }`
    *   Logic:
        *   Call new search methods on `assetRepository` (e.g., `assetRepository.search(criteria)`) and `folderRepository` (e.g., `folderRepository.search(criteria)`).
        *   The criteria object will pass all necessary search, filter, and sort parameters.
        *   Combine results from both repositories.
        *   Return `{ assets: Asset[], folders: Folder[] }` (domain entities).
*   [ ] **Rationale:** Encapsulates the complex search logic for both assets and folders.

**Step 2.2: Enhance `SupabaseAssetRepository` with Search Capability**
*   [ ] **File:** `lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository.ts`
*   [ ] **Action:**
    *   Create a new method, e.g., `search(criteria: AssetSearchCriteria): Promise<Asset[]>`.
    *   Define `AssetSearchCriteria` type to include `searchTerm`, `organizationId`, `tagIds`, `filters` (type, date, owner, size), `sortParams`.
    *   Move asset-specific query building logic from `app/api/dam/dam-api.query-builders.ts` (`buildAssetBaseQueryInternal`, relevant parts of `getAssetIdsForTagFilter`, `applyDateFiltersToQuery`) into this method.
*   [ ] **Rationale:** Consolidates asset search and query logic within its repository.

**Step 2.3: Enhance `SupabaseFolderRepository` with Search Capability**
*   [ ] **File:** `lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository.ts`
*   [ ] **Action:**
    *   Create a new method, e.g., `search(criteria: FolderSearchCriteria): Promise<Folder[]>`.
    *   Define `FolderSearchCriteria` type to include `searchTerm`, `organizationId`, `filters` (type, date, owner), `sortParams`.
    *   Move folder-specific query building logic from `app/api/dam/dam-api.query-builders.ts` (`buildFolderBaseQueryInternal`, `applyDateFiltersToQuery`) into this method.
*   [ ] **Rationale:** Consolidates folder search and query logic within its repository.

**Step 2.4: Update `app/api/dam/route.ts` (Search Path)**
*   [ ] **File:** `app/api/dam/route.ts`
*   [ ] **Action:**
    *   In the conditional branch for search scenarios:
        *   Instantiate `SupabaseAssetRepository`, `SupabaseFolderRepository`, and `SearchDamItemsUseCase`.
        *   Call `searchDamItemsUseCase.execute(...)` instead of `fetchSearchResults`.
        *   The result will be `{ assets: Asset[], folders: Folder[] }` (domain entities).
*   [ ] **Rationale:** Updates the API route to use the new use case for search.

---

## Phase 3: Refactor Data Transformation and DTO Mapping

**Affected Files:** `app/api/dam/dam-api.transformers.ts`, `app/api/dam/route.ts`

**Step 3.1: Review and Enhance Domain Entity Mappers**
*   [ ] **Files:**
    *   `lib/dam/infrastructure/persistence/supabase/mappers/AssetMapper.ts`
    *   `lib/dam/infrastructure/persistence/supabase/mappers/FolderMapper.ts`
*   [ ] **Action:**
    *   Ensure `AssetMapper.toDomain` and `FolderMapper.toDomain` map all necessary fields from raw Supabase data to create rich domain entities. This includes fields currently added by `dam-api.transformers.ts` like `publicUrl` for assets (already present in `Asset` domain entity) and `has_children` for folders.
    *   Consider if `ownerName` or `parentFolderName` should be part of the core domain entities or fetched on-demand by use cases/API layer if not always required.
*   [ ] **Rationale:** Ensures domain entities are comprehensive, reducing the need for downstream transformations.

**Step 3.2: Update API Route for DTO Mapping**
*   [ ] **File:** `app/api/dam/route.ts`
*   [ ] **Action:**
    *   After receiving domain entities (`Asset[]`, `Folder[]`) from use cases:
        *   If the specific DTO shapes (`TransformedAsset`, `TransformedFolder` from `app/api/dam/dam-api.types.ts`) are still needed for the API response, implement mapping logic directly in the route handler or a local DTO mapping utility.
        *   This mapping should now be simpler, primarily selecting fields from the rich domain entities.
        *   If `ownerName` or other on-demand data is needed for DTOs, fetch it here (e.g., call a user service).
*   [ ] **Rationale:** Moves DTO transformation to the API boundary, using domain entities as the source.

**Step 3.3: Deprecate/Remove `dam-api.transformers.ts`**
*   [ ] **File:** `app/api/dam/dam-api.transformers.ts`
*   [ ] **Action:**
    *   Once domain entities are sufficiently rich and DTO mapping is handled in the API route, the functions in `dam-api.transformers.ts` (like `transformAndEnrichData`, `getOwnerNames`, etc.) should become largely redundant.
    *   Refactor any remaining useful small utility functions or remove the file.
*   [ ] **Rationale:** Eliminates the legacy transformation layer.

---

## Phase 4: Cleanup Legacy API Files

**Step 4.1: Remove `dam-api.helpers.ts`**
*   [ ] **File:** `app/api/dam/dam-api.helpers.ts`
*   [ ] **Action:** Once `fetchSearchResults` and `applyQuickSearchLimits` (if not moved to `route.ts` locally) are no longer used, delete this file.
*   [ ] **Rationale:** Removes legacy helper functions.

**Step 4.2: Remove `dam-api.query-builders.ts`**
*   [ ] **File:** `app/api/dam/dam-api.query-builders.ts`
*   [ ] **Action:** Once all query building logic is moved into the respective repositories, delete this file.
*   [ ] **Rationale:** Removes legacy query builder functions.

**Step 4.3: Update `dam-api.types.ts`**
*   [ ] **File:** `app/api/dam/dam-api.types.ts`
*   [ ] **Action:** Review and remove any types that were specific to the legacy helpers, query builders, or transformers and are no longer needed.
*   [ ] **Rationale:** Keeps API type definitions clean and relevant.

--- 