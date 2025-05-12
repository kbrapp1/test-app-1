# DAM Actions Refactoring - Build Steps

**Goal:** Refactor the monolithic `lib/actions/dam.ts` into smaller, more manageable files (`asset.actions.ts` and `folder.actions.ts`) to improve organization, maintainability, and testability. This document outlines the steps to achieve this, allowing for testing at each phase.

**Reference:** The original file to be refactored is `lib/actions/dam.ts`.

## Phase 1: Setup and Folder Actions Migration

**Step 1: Prepare Directory Structure & Index File**
*   [x] **File System:** Create new directory `lib/actions/dam/`. (This might have been done in a previous step that created an initial `index.ts`).
*   [x] **File:** Create/Confirm `lib/actions/dam/index.ts`. Its initial content should be:
    ```typescript
    // lib/actions/dam/index.ts
    // We will add exports here as actions are migrated.
    // For now, it might be empty or export from non-existent files,
    // leading to temporary linter errors.
    export * from './asset.actions'; // Add this line
    export * from './folder.actions';// Add this line
    ```
*   [x] **Testing:**
    *   Verify the directory `lib/actions/dam/` exists.
    *   Verify `lib/actions/dam/index.ts` exists with the specified content. (Linter errors about missing modules `./asset.actions` and `./folder.actions` are expected at this point and will be resolved as those files are created).

**Step 2: Create `folder.actions.ts` and Migrate Folder Logic**
*   [x] **File:** Create `lib/actions/dam/folder.actions.ts`.
*   [x] **Code:** Move the following functions from `lib/actions/dam.ts` to `lib/actions/dam/folder.actions.ts`:
    *   `createFolder`
    *   `updateFolder`
    *   `deleteFolder`
*   [x] **Code:** Move the `FolderActionResult` interface and any other helper types or constants that are *solely* used by these folder actions from `lib/actions/dam.ts` to `lib/actions/dam/folder.actions.ts`.
*   [x] **Code:** Ensure all necessary imports (e.g., `createServerActionClient` (or `createClient`), `revalidatePath`, `getActiveOrganizationId`, `Folder` type from `types/dam`) are correctly added or updated at the top of `lib/actions/dam/folder.actions.ts`. Add `'use server';` at the top.
*   [x] **Code:** Review `lib/actions/dam/index.ts` and ensure `export * from './folder.actions';` is present.
*   [x] **Testing:**
    *   Verify that folder-related actions can be imported into other parts of your application using `import { createFolder /*, etc. */ } from '@/lib/actions/dam';`.
    *   Thoroughly test all folder operations (create, rename/update, delete) in your application. Ensure they function as expected using the actions from their new location.

## Phase 2: Asset Actions Migration

**Step 3: Create `asset.actions.ts` and Migrate Asset Logic**
*   [x] **File:** Create `lib/actions/dam/asset.actions.ts`.
*   [x] **Code:** Add 'use server'; at the top of the new file.
*   [x] **Code:** Move the following functions from `lib/actions/dam.ts` to `lib/actions/dam/asset.actions.ts`:
    *   `moveAsset`
    *   `deleteAsset`
    *   `listTextAssets`
    *   `getAssetContent`
    *   `updateAssetText`
    *   `saveAsNewTextAsset`
    *   `getAssetDownloadUrl`
*   [x] **Code:** Move associated helper types/interfaces (e.g., `TextAssetSummary`) that are *solely* used by these asset actions to `lib/actions/dam/asset.actions.ts`.
*   [x] **Constants:**
    *   Identify the `TEXT_MIME_TYPES` array used in `listTextAssets`, `getAssetContent`, and `updateAssetText`.
    *   Define this array once as a constant (e.g., `const DAM_TEXT_MIME_TYPES = [...]`) within `lib/actions/dam/asset.actions.ts` or in a new shared constants file like `lib/actions/dam/dam.constants.ts` and import it.
*   [x] **Imports:**
    *   Ensure all necessary imports (e.g., `createClient`, `revalidatePath`, `getActiveOrganizationId`, `randomUUID` from `crypto`) are correctly added/updated in `lib/actions/dam/asset.actions.ts`.
    *   The original `dam.ts` had `import crypto from 'crypto';` commented out but later used `crypto.randomUUID()`. Ensure `saveAsNewTextAsset` can correctly use `randomUUID()`. It should be `import { randomUUID } from 'crypto';`.
*   [x] **Code:** Review `lib/actions/dam/index.ts` and ensure `export * from './asset.actions';` is present.
*   [x] **Testing:**
    *   Verify that asset-related actions can be imported using `import { moveAsset /*, etc. */ } from '@/lib/actions/dam';`.
    *   Thoroughly test all asset operations:
        *   Moving assets.
        *   Deleting assets.
        *   Listing text assets.
        *   Getting asset content.
        *   Updating asset text.
        *   Saving new text assets.
        *   Getting asset download URLs.
    *   Ensure they function as expected using the actions from their new location.

## Phase 3: Integration, Testing, and Cleanup

**Step 4: Update All Imports Across the Application**
*   [x] **Refactor:** Perform a global search in your codebase for any remaining imports from the old `lib/actions/dam.ts` path.
*   [x] **Refactor:** Update these imports to point to the new modules (`asset.actions.ts` and `folder.actions.ts`).
*   [x] **Testing:**
    *   Perform a full regression test of all DAM-related features in the application. (User has confirmed tests passed.)
    *   This includes UI interactions for folder management, asset management (including uploads, viewing, editing text assets), and any pages that list or depend on DAM data.

**Step 5: Refactor Corresponding Test Files**
*   [x] **File (Asset Tests):** Create `lib/actions/dam/asset.actions.test.ts` and move all asset-related tests from `dam.assetManipulation.test.ts`. Update imports to reference `asset.actions.ts`.
*   [ ] **File (Folder Tests):** Create `lib/actions/dam/folder.actions.test.ts` and move all folder-related tests (e.g., `createFolder`, `updateFolder`, `deleteFolder`) into this new file. Update imports to reference `folder.actions.ts`.
*   [x] **Execution:** Run your entire test suite (e.g., `pnpm test`).
*   [x] **Fixes:** Address any failing tests and ensure mocks/spies target the refactored action modules.
*   [x] **Testing:** Confirm all tests pass after refactor.

**Step 6: Final Cleanup**
*   [x] **File System:** Delete the original `lib/actions/dam.ts` file and the old test file `lib/actions/dam.assetManipulation.test.ts`.
*   [x] **Final Check:** Perform a quick smoke test of the main DAM functionalities to ensure everything works.
*   [x] **Testing:** Run the test suite one last time.

**(End of DAM Actions Refactoring: The `lib/actions/dam.ts` file has been successfully modularized. The codebase related to DAM actions is now cleaner, more organized, and easier to maintain and test.)** 