# lib/ Folder Refactor - Build Steps

**Goal:** Restructure `lib/` into clear layers—services, repositories, usecases, and actions—to improve maintainability, testability, and separation of concerns.

## Phase 1: Setup Directory Structure

**Step 1: Create Layer Folders**
*   [ ] Create `lib/services/` for external API wrappers (e.g., TTS, storage, external HTTP).
*   [ ] Create `lib/repositories/` for database access (Supabase queries).
*   [ ] Create `lib/usecases/` for orchestration/business logic combining services and repositories.
*   [ ] Ensure `lib/actions/` remains for server actions tied to Next.js App Router.
*   [ ] Confirm `lib/schemas/` and `lib/utils.ts` remain unchanged.

## Phase 2: Migrate External API Logic

**Step 2: Services Layer**
*   [ ] For each external integration (e.g., TTS), move raw SDK/fetch code from actions into `lib/services/`.
*   [ ] Export clean functions (e.g., `generateSpeech(text, voiceId)`).
*   [ ] Add unit tests mocking HTTP or SDK responses.

## Phase 3: Migrate Database Access

**Step 3: Repositories Layer**
*   [ ] Extract Supabase calls from DAM, notes, team actions into `lib/repositories/` (e.g., `dam-repo.ts`).
*   [ ] Define functions like `getFolders(orgId)`, `insertFolder(data)`, and use `createClient()` internally.
*   [ ] Add unit tests mocking `createClient()` and its `.from()` methods.

## Phase 4: Build Usecase Orchestrators

**Step 4: Usecases Layer**
*   [ ] Create `lib/usecases/dam/` and other domain folders under `usecases/`.
*   [ ] Implement business logic functions (e.g., `createFolderUsecase(name, parentId)`) that call repository and service functions.
*   [ ] Handle validation, error aggregation, and side effects (e.g., cache invalidation) here.
*   [ ] Add unit tests for each usecase, mocking repository/service dependencies.

## Phase 5: Thin Actions Entrypoints

**Step 5: Actions Layer**
*   [ ] Refactor existing `lib/actions/*` files to call usecases instead of raw supabase or services.
*   [ ] Add `'use server';` at top as required by Next.js server actions.
*   [ ] Ensure `actions` functions only handle request/form data, call usecase, then revalidate paths.
*   [ ] Add unit tests for actions mocking usecase functions.

## Phase 6: Update Imports and Aliases

**Step 6: Path Aliases**
*   [ ] Update `tsconfig.json` to add aliases:
    ```json
    {
      "paths": {
        "@/lib/services/*": ["lib/services/*"],
        "@/lib/repositories/*": ["lib/repositories/*"],
        "@/lib/usecases/*": ["lib/usecases/*"],
        "@/lib/actions/*": ["lib/actions/*"]
      }
    }
    ```
*   [ ] Refactor imports across codebase to use new paths.

## Phase 7: Testing & Validation

**Step 7: Write Comprehensive Tests**
*   [ ] Services: mock external APIs and assert expected output and error handling.
*   [ ] Repositories: mock Supabase client and test query logic, error paths.
*   [ ] Usecases: mock repository/services and test orchestration, validation, side effects.
*   [ ] Actions: mock usecases and test server action response shapes and cache invalidation.
*   [ ] UI integration: ensure components still render and call actions correctly (optional).

## Phase 8: Cleanup Legacy Code

**Step 8: Remove Old Logic**
*   [ ] Delete any Supabase or external API code left in actions or elsewhere.
*   [ ] Remove duplicate or deprecated helper functions.
*   [ ] Verify linter and type checks pass.

## Execution & Rollout

*   [ ] Run `pnpm test` and ensure full test suite passes.
*   [ ] Perform manual smoke tests of key features (DAM, notes, TTS, team, etc.).
*   [ ] Merge refactor PR and update project documentation (e.g., update project-structure.mdc).

**(End of lib/ Folder Refactor Build Steps)** 