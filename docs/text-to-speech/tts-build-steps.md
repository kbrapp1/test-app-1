# Text-to-Speech (TTS) - Build Steps

This document outlines the planned steps to implement the Text-to-Speech feature based on the [tts-ux-design.md](mdc:docs/text-to-speech/tts-ux-design.md) and [tts-fsd.md](mdc:docs/text-to-speech/tts-fsd.md) documents.

**Note:** Steps assume incremental development and testing/review between major phases.

## Phase 1: Foundation & Replicate Integration

**Step 1: Prerequisites & Setup**
*   [x] **Decision:** TTS Provider API is **Replicate**, initially using **`jaaari/kokoro-82m`**.
*   [x] **Credentials:** Obtain your `REPLICATE_API_TOKEN` from your Replicate account. (User confirmed)
*   [x] **Environment:** Add `REPLICATE_API_TOKEN` to `.env.local` and `.env.example`. (User confirmed done locally, placeholders added to example)
*   [x] **Install SDK:** Install the official Replicate Node.js client: `pnpm add replicate`.
*   [x] *Testing:* Verify `REPLICATE_API_TOKEN` is loadable by the application locally. (Confirmed working via successful action calls and tests)

**Step 2: Backend - Replicate Server Actions**
*   [x] Create `lib/actions/tts.ts`.
*   [x] Implement `startSpeechGeneration` Server Action:
    *   [x] Accepts `text: string`, `sourceAssetId: string | undefined`, and `voiceId: string` (via FormData).
    *   [x] **Add validation:** Check `text` length and `voiceId` presence using Zod.
    *   [x] Initializes Replicate client using the API token.
    *   [x] Calls `replicate.predictions.create` with the `jaaari/kokoro-82m` model version, passing `text` and `voice` as input.
    *   [x] Saves initial record to `TtsPrediction` table.
    *   [x] Returns the `prediction.id` on success.
    *   [ ] Wraps errors using `lib/errors`. (Basic try/catch implemented, full integration pending)
*   [x] Implement `getSpeechGenerationResult` Server Action:
    *   [x] Accepts `predictionId: string`.
    *   [x] Initializes Replicate client.
    *   [x] Calls `replicate.predictions.get(predictionId)`.
    *   [x] Returns an object containing `{ success, status, outputUrl, error }`.
    *   [x] Updates `TtsPrediction` table on final status.
    *   [x] Downloads audio from Replicate and uploads to Supabase Storage ('assets' bucket).
    *   [ ] Wraps errors using `lib/errors`. (Basic try/catch implemented, full integration pending)
*   [x] *Testing:* Unit tests for both actions:
    *   [x] Mock the `replicate` client methods (`predictions.create`, `predictions.get`).
    *   [x] Mock the Supabase client and `cookies`.
    *   [x] Verify `create` is called with correct model/input/voice.
    *   [x] Test handling of different prediction statuses (`starting`, `processing`, `succeeded`, `failed`) returned by `get` mock.
    *   [x] Test DB interactions (insert/update).
    *   [x] Test validation logic (missing input, missing voice).
    *   [x] Test auth checks and token checks.
    *   [ ] Test error wrapping. (Pending full integration)

**Step 3: Frontend - Basic UI Structure**
*   [x] Create the page file: `app/(protected)/ai-playground/text-to-speech/page.tsx`. (Moved to protected group)
*   [x] Define the basic page layout (e.g., using CSS Grid/Flexbox for two columns via Cards).
*   [x] Create the main client component: `components/tts/tts-interface.tsx`.
*   [x] Add the `Textarea` component (`@/components/ui/textarea`) for text input to `tts-interface.tsx` (via react-hook-form).
*   [x] Add the primary "Generate Speech" `Button` (`@/components/ui/button`) to `tts-interface.tsx`.
*   [x] Include `tts-interface.tsx` within the `page.tsx`.
*   [x] *Testing:* Simple rendering tests (smoke tests) for `page.tsx` and `tts-interface.tsx` to ensure they mount without errors.

**Step 4: Frontend - Async Logic & Connection**
*   [x] In `tts-interface.tsx`, add state management (`useState`, `useTransition`, `react-hook-form`) for:
    *   [x] `inputText: string` (via react-hook-form)
    *   [x] `isLoading: boolean` (derived from `isPending` and `predictionStatus`)
    *   [x] `predictionId: string | null` (as `currentPredictionId`)
    *   [x] `pollingIntervalId: NodeJS.Timeout | null` (managed by `setInterval`/`clearInterval`)
    *   [x] `audioResultUrl: string | null` (as `audioUrl`)
    *   [x] `error: string | null` (as `errorMessage`)
*   [x] Connect `Textarea` to form state.
*   [x] **Add client-side length check:** (Handled by Zod validation on submit).
*   [x] Add `onSubmit` handler for the form:
    *   [x] Clear previous results/errors, set initial status.
    *   [x] Call `startSpeechGeneration`, store the returned `predictionId` (`currentPredictionId`).
    *   [x] If `predictionId` received, polling starts via `useEffect` dependency change.
    *   [x] Handle errors from `startSpeechGeneration`.
*   [x] Create polling logic within `useEffect`:
    *   [x] Calls `getSpeechGenerationResult` with `predictionId`.
    *   [x] If status is `succeeded`: Clear interval, update status, set `audioResultUrl`.
    *   [x] If status is `failed` or `canceled`: Clear interval, update status, set `error`.
    *   [x] If status is `starting` or `processing`: Continue polling.
    *   [x] Handle errors from `getSpeechGenerationResult` (clear interval, set error).
*   [x] Implement cleanup (`useEffect` cleanup function) to clear interval.
*   [x] Disable button when `isLoading` or form is invalid (implicitly via RHF/Zod).
*   [x] Show loading indicator when `isLoading`.
*   [ ] *Testing:* Update integration tests for `tts-interface.tsx`:
    *   [ ] Mock `startSpeechGeneration` and `getSpeechGenerationResult`.
    *   [ ] Simulate submit -> verify `startSpeechGeneration` call -> verify polling starts.
    *   [ ] Simulate `getSpeechGenerationResult` returning different statuses (`processing`, `succeeded`, `failed`) and verify state updates, loading indicator, and interval clearing.
    *   [ ] Add tests for client-side length validation (if implemented).

**Step 5: Frontend - Basic Audio Output**
*   [x] **Decision:** Use native `<audio>` element for now. Waveform visualizer deferred.
*   [x] **Install Library:** N/A
*   [x] Create the output area within `components/tts/tts-interface.tsx`.
*   [x] Pass the `audioUrl` state to the `<audio>` element's `src`.
*   [x] Implement basic display:
    *   [x] Conditionally render the `<audio>` element only when `audioUrl` is present.
    *   [x] Use browser default controls.
*   [x] Add download button for the generated audio.
*   [x] *Testing:* Write unit tests for `tts-interface.tsx` output area:
    *   [x] Verify it renders placeholder when `audioUrl` is null/undefined.
    *   [x] Verify the `<audio>` element renders with correct `src` when `audioUrl` is provided.
    *   [x] Update `tts-interface.tsx` integration tests to check for the appearance of the audio element.

**(Review Point 1: Basic text-to-audio generation using Replicate async polling working - Achieved)**

## Phase 2: Voices, DAM Integration & History

**Step 6: Backend - Get Voices Action (Predefined)**
*   [x] Implement `getTtsVoices` Server Action in `lib/actions/tts.ts`.
*   [x] Return a hardcoded list of voice names and relevant metadata (e.g., gender, accent) based on the `jaaari/kokoro-82m` model info.
*   [x] *Testing:* Simple unit test verifying the correct list structure is returned.

**Step 7: Frontend - Voice Selection UI & Logic**
*   [x] In `tts-interface.tsx`, add state for `selectedVoiceId: string` and `voices: Voice[]`.
*   [x] Call `getTtsVoices` on mount to fetch available voices.
*   [x] Add `Combobox` pattern (`Popover`, `Command`) to the form, populated with the fetched voices.
*   [x] Update form validation (`TtsInputSchema`) to include `voiceId`.
*   [x] Pass `voiceId` from form data to `startSpeechGeneration` call.
*   [x] Disable button if form is invalid (handled by RHF).
*   [ ] *Testing:* Update `tts-interface.tsx` tests to verify `Combobox` population, form state update, and passing `voiceId` to the action.

**Step 8: Backend & DB - History Schema**
*   [x] Add `source_asset_id UUID NULL REFERENCES assets(id)` and `output_asset_id UUID NULL REFERENCES assets(id)` to the `TtsPrediction` table in `supabase/setup.sql` and apply via migration.
*   [x] Regenerate Supabase types `types/supabase.ts`.
*   [x] Implement basic `getTtsHistory` Server Action (using `TtsPrediction` table).
*   [x] Implement basic `saveTtsHistory` Server Action (Placeholder only).
*   [x] *Testing:* Unit tests for basic `getTtsHistory` action.
*   [ ] *Testing:* Unit tests for basic `saveTtsHistory` action (Pending implementation).

**Step 9: Backend - DAM Actions for TTS**
*   [x] Implement `listTextAssets` Server Action in `lib/actions/dam.ts` (filter `assets` table by text MIME types).
*   [x] Implement `getAssetContent` Server Action in `lib/actions/dam.ts` (use Supabase client to fetch file content by path/name derived from asset ID).
*   [x] Implement `saveTtsAudioToDam` Server Action in `lib/actions/tts.ts`:
    *   [x] Accepts audio URL, user ID.
    *   [x] Downloads audio from URL (e.g., using `fetch`).
    *   [x] Uploads audio Blob/Buffer to Supabase Storage (bucket: `assets`).
    *   [x] Creates a new record in the `assets` table (determine filename, MIME type, size, etc.).
    *   [x] Returns the new `asset.id`.
*   [x] *Testing:* Unit tests for these actions (mocking Supabase client, Supabase storage client, `fetch`).

**Implementation Notes:**
*   Fixed storage bucket reference from 'tts_audio' to 'assets' to match existing DAM functionality
*   Adapted code to work with camelCase column names in the database schema (e.g., 'outputUrl' instead of 'output_url')
*   Removed references to non-existent 'errorMessage' column in the TtsPrediction table to fix database errors

**Step 10: Frontend - Load Text from DAM**
*   [x] Create `components/dam/asset-selector-modal.tsx`.
    *   [x] Fetches text assets using `listTextAssets`.
    *   [x] Displays assets (e.g., using a simple list or adapting `AssetThumbnail`).
    *   [x] Includes selection handler (`onAssetSelect(assetId: string)`).
*   [x] In `tts-interface.tsx`:
    *   [x] Add state for `sourceAssetId: string | null`.
    *   [x] Add "Load from Library" button.
    *   [x] Implement logic to open/close the asset selector modal.
    *   [x] Implement handler for `onAssetSelect`: call `getAssetContent`, update `inputText` state, update `sourceAssetId` state.
*   [x] *Testing:*
    *   [x] Unit tests for modal component (`asset-selector-modal.tsx`)
        *   [x] Loading state displays correctly
        *   [x] Assets display after successful fetch
        *   [x] Empty state displays correctly (no assets found)
        *   [x] Error state displays correctly (fetch failure)
        *   [x] `onAssetSelect` callback works correctly
    *   [x] Integration tests for `tts-interface.tsx` (Load from DAM functionality)

**Step 11: Frontend - Save Audio to DAM & History Update**
*   [x] Add "Save to Library" button to `components/tts/tts-interface.tsx` (appears conditionally when audio generated).
*   [ ] In `tts-interface.tsx`, implement a handler (`handleSaveToLibrary`) triggered by the button press.
    *   [x] Sets a saving state (`isSavingToDam`).
    *   [ ] Calls `saveTtsAudioToDam` with the `audioResultUrl`.
    *   [ ] On success, receives `output_asset_id`.
    *   [ ] Calls `saveTtsHistory` with all relevant data including `sourceAssetId` (if set) and the new `output_asset_id`.
    *   [ ] Updates history display or indicates successful save (e.g., via toast).
    *   [ ] Handles errors from save actions.
*   [ ] Update the `saveTtsHistory` action call made *after polling completes* to only include `sourceAssetId` initially (or skip this initial save if saving to DAM is the primary way history gets created).
*   *Testing:* Update `tts-interface.tsx` tests to simulate clicking "Save", verify action calls (`saveTtsAudioToDam`, `saveTtsHistory`) and state updates.

**Step 12: Frontend - History UI Update**
*   [ ] Create `components/ai/tts/tts-history-list.tsx` and `tts-history-item.tsx`.
*   [ ] Fetch and display history using `getTtsHistory` on page load.
*   [ ] In `tts-history-item.tsx`:
    *   Display text snippet, voice, date.
    *   Include Play and Download buttons (using `audio_url`).
    *   Conditionally display a link to the source asset (`/dam/assets/[source_asset_id]`) if `source_asset_id` exists.
    *   Conditionally display a link to the output asset (`/dam/assets/[output_asset_id]`) if `output_asset_id` exists.
    *   Conditionally display the "Save to Library" button if `output_asset_id` is null.
*   [ ] Implement logic to refresh history list when an item is saved to DAM.
*   *Testing:* Integration tests for history display. Unit tests for list/item components verifying conditional rendering.

**Step 13: Frontend & Backend - Shareable Links**
*   [ ] **Decision:** Determine if Replicate output URLs are stable/long-lived enough or if audio needs copying to Supabase Storage.
*   [ ] If copying needed: Update `saveTtsHistory` to download from Replicate URL and upload to Supabase Storage, saving the storage URL instead.
*   [ ] Implement `generateShareableLink` action (if needed, e.g., for temporary signed URLs from Supabase Storage).
*   [ ] Add a "Share" button to `components/tts/tts-interface.tsx`