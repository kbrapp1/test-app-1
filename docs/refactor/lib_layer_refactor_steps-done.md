# lib/ Folder Refactor - Incremental Build Steps

**Goal:** Incrementally refactor the `lib/` directory into clear layers—services, repositories, usecases, and actions—by tackling one module at a time and verifying UI functionality at each step.

## Phase 1A: Folder Setup Only

- [x] Create empty layer folders:
  - `lib/services/`
  - `lib/repositories/`
  - `lib/usecases/`
  - Keep existing `lib/actions/`, `lib/schemas/`, and `lib/utils.ts` unchanged.
- **Manual UI Test:** Launch the app (`pnpm dev`) and navigate to key feature pages (e.g., `/dam`, `/ai-playground/text-to-speech`) to confirm nothing is broken.

## Phase 1B: Migrate One Service (TTS)

- [X] Move TTS integration code from `lib/actions/tts.ts` into `lib/services/tts.ts` and update all imports accordingly.
- **Manual UI Test:** Use the Text-to-Speech UI to generate audio and simulate error cases to verify success and failure flows still work.

## Phase 1C: Migrate One Repository (DAM)

- [X] Extract all DAM-related Supabase queries into `lib/repositories/dam-repo.ts` and update imports in server actions and components.
- **Manual UI Test:** Visit the DAM page (`/dam`) and confirm folder listing, creation, and deletion still function correctly.

## Phase 1D: Wire Up Usecase & Action (createFolder)

- [X] Create `lib/usecases/dam/createFolderUsecase.ts` to encapsulate folder creation logic; refactor the `createFolder` server action to delegate to this usecase.
- **Manual UI Test:** Open the New Folder dialog in the UI, create a folder, and verify it appears in the sidebar and main view.

## Phase 1E: Repeat for Remaining Features

- [x] For each remaining feature (e.g., moveAsset, deleteAsset, listTextAssets), repeat:
  1. Move logic into service/repository/usecase layers.
  2. Update imports in actions and UI components.
  3. **Manual UI Test:** Navigate to the relevant UI, perform the action, and confirm correct behavior.

## Phase 1F: Cleanup Legacy Logic

- [X] Delete deprecated code from old action modules (e.g., `lib/actions/dam.ts`, legacy helpers).
- [X] **Manual UI Test:** Smoke-test all major features (DAM, notes, TTS, team) end-to-end in the UI to ensure full functionality.

**End of Incremental Refactor Steps** 