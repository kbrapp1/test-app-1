# ElevenLabs Voice Explorer - Build Steps

This document outlines the planned steps to implement the ElevenLabs Voice Explorer feature, allowing users to browse, filter, search, and preview ElevenLabs voices. This is a sub-feature of the main Text-to-Speech functionality within the AI Playground.

**References:**
*   Main TTS Build Steps: [tts-build-steps.md](mdc:docs/text-to-speech/tts-build-steps.md)
*   UX Concept: Slide-out panel (similar to TTS History) for voice discovery, triggered from the TTS input form. A dedicated sub-page is an alternative if data complexity is very high.

## Phase 1: Backend & Data Foundation

**Step 1: Investigate ElevenLabs `/v2/voices` API**
*   [x] **Research:** Thoroughly review ElevenLabs API documentation for the `/v2/voices` endpoint.
    *   [x] Identified request parameters for pagination (`page_size`, `next_page_token`).
    *   [x] Identified request parameters for searching (`search` string for name, description, labels, category) and filtering (`category`, `voice_type`, etc.).
    *   [x] Confirmed the structure of the response (voice object, `labels`, `description`, `preview_url`, pagination fields).
*   [x] **Decision:** `/v2/voices` offers sufficient server-side search and basic filtering. Direct API calls will be used initially, deferring custom DB caching.

**Step 2: Database Schema for Cached Voices (If Necessary)**
*   [ ] **Decision:** Deferred. Will rely on direct `/v2/voices` API calls with its search/filter capabilities first. Revisit if performance or more advanced/offline filtering becomes critical.
*   [ ] ~~If caching: ...~~ (All sub-items under this are now deferred)

**Step 3: Backend Service/Actions for Voices**
*   [ ] **Update `TtsVoice` type:** In `types/tts.ts`, extend the `TtsVoice` interface (or create a new `DetailedTtsVoice` extending it) to include:
    *   `labels?: Record<string, string | undefined>` (to store the full `labels` object from API)
    *   `description?: string | null` (the main voice description)
    *   `category?: string | null`
    *   `previewUrl?: string | null`
    *   *(Consider other relevant fields from the v2 response if needed for display/filtering)*
*   [ ] **Enhance `lib/services/elevenlabsService.ts` (or create `elevenlabsV2Service.ts`):**
    *   [ ] Implement `searchOrListV2Voices` function:
        *   [ ] Accepts parameters: `searchTerm?: string`, `filters?: { category?: string, voice_type?: string, ... }`, `sort?: { by: 'name' | 'created_at_unix', direction: 'asc' | 'desc' }`, `pagination?: { page_size?: number, next_page_token?: string }`.
        *   [ ] Constructs the query string for `GET https://api.elevenlabs.io/v2/voices` based on provided parameters.
        *   [ ] Handles API authentication (`xi-api-key`).
        *   [ ] Fetches data from the API.
        *   [ ] Parses the response, including the list of voices, `has_more`, `total_count`, and `next_page_token`.
        *   [ ] Maps the API voice objects to our extended `TtsVoice` (or `DetailedTtsVoice`) interface.
        *   [ ] Returns `{ voices: DetailedTtsVoice[], hasMore: boolean, totalCount: number, nextPageToken?: string, error?: string }`.
*   [ ] **Create Server Action:** In `lib/actions/tts.ts` (or a new `elevenlabsActions.ts`):
    *   [ ] Implement `getElevenLabsExploreVoices` Server Action:
        *   [ ] Accepts search, filter, sort, and pagination parameters from the client.
        *   [ ] Performs basic validation/sanitization of parameters.
        *   [ ] Calls the `searchOrListV2Voices` service function.
        *   [ ] Returns the result to the client, handling potential errors.
*   [ ] *Testing:* Unit tests for the new service function and server action (mocking API calls, validating parameter construction and response mapping).

**(Review Point 1: Backend strategy for fetching/searching ElevenLabs voices via `/v2/voices` API decided and core backend components outlined.)**

## Phase 2: Frontend - Voice Explorer Page & UI

**Step 4: Page and Basic UI Structure**
*   [ ] Create the page file: `app/(protected)/ai-playground/elevenlabs-voices/page.tsx`.
*   [ ] Define the basic page layout (e.g., sidebar for filters, main area for voice list/grid).
*   [ ] Create the main client component: `components/tts/elevenlabs-voice-explorer.tsx`.
*   [ ] Include `elevenlabs-voice-explorer.tsx` within the `page.tsx`.

**Step 5: Voice Listing & Search/Filter UI**
*   [ ] In `elevenlabs-voice-explorer.tsx`:
    *   [ ] State management for search terms, active filters, sort order, pagination, voice list, loading/error states.
    *   [ ] Implement UI for search input.
    *   [ ] Implement UI for filters (e.g., `CheckboxGroup` for tags, `Select` for gender/accent).
        *   Filter options could be hardcoded initially or dynamically populated from distinct values in the cached DB / API response.
    *   [ ] Implement UI for sort selection.
*   [ ] `useEffect` hook to call the backend Server Action (`searchCachedElevenLabsVoices` or `searchLiveElevenLabsVoices`) when search/filter/sort/pagination parameters change.
*   [ ] Display the fetched voices in a list or grid format.
    *   [ ] Create `components/tts/elevenlabs-voice-card.tsx` (or list item).
    *   [ ] Each card/item should display: Voice Name, key labels (gender, accent), short description/tags, "Play Preview" button, "Use this voice" button.
*   [ ] Implement pagination controls.
*   [ ] Display loading skeletons and error messages appropriately.

**Step 6: Voice Preview Functionality**
*   [ ] In `elevenlabs-voice-card.tsx`:
    *   [ ] The "Play Preview" button should use the `preview_url` for the voice.
    *   [ ] Implement a simple audio player for previews (could be a shared headless player hook or a simple inline `<audio>` element that gets replaced on each play).
    *   [ ] Indicate loading/playing state for the preview.
*   [ ] *Testing:* Unit tests for `elevenlabs-voice-card.tsx` (rendering, preview play). Integration tests for `elevenlabs-voice-explorer.tsx` (fetching, filtering, pagination).

**(Review Point 2: Voice Explorer page displays voices, allows searching/filtering, and previews work.)**

## Phase 3: Integration with TTS Generation Page

**Step 7: "Use this voice" Functionality**
*   [ ] In `elevenlabs-voice-card.tsx`, the "Use this voice" button:
    *   [ ] Needs to store the selected `voice_id` (and provider 'elevenlabs').
    *   [ ] Navigate the user back to the main TTS generation page (`/ai-playground/text-to-speech`).
*   [ ] Modify the main TTS page (`app/(protected)/ai-playground/text-to-speech/page.tsx`) and `components/tts/tts-interface.tsx`:
    *   [ ] Check for URL query parameters or a shared state (e.g., Zustand store, React Context) for a pre-selected voice ID and provider upon loading.
    *   [ ] If a voice is pre-selected from the explorer, update `formInitialValues` in `page.tsx` to set the provider and voice ID in the `TtsInterface` form.
    *   [ ] Ensure the `VoiceSelector` and `Provider` select components correctly reflect this pre-selection.

**Step 8: Entry Point from TTS Page**
*   [ ] In `components/tts/TtsInputCard.tsx`:
    *   [ ] When "ElevenLabs" is the selected provider, display an icon button (e.g., "Browse Voices", "Explore Library") next to the `VoiceSelector` or `Provider` select.
    *   [ ] This button should link/navigate to the `/ai-playground/elevenlabs-voices` page.
*   [ ] *Testing:* E2E style testing for the flow: TTS Page -> Voice Explorer -> Select Voice -> Back to TTS Page with voice pre-filled.

**(Review Point 3: Full loop of discovering, previewing, and selecting an ElevenLabs voice for TTS generation is functional.)**

## Phase 4: Polish & Refinements

*   [ ] **UI/UX Polish:**
    *   [ ] Responsive design for the Voice Explorer page.
    *   [ ] Accessibility improvements.
    *   [ ] Consistent styling with the rest of the application.
*   [ ] **Error Handling:** Robust error handling for API calls, data fetching, previews.
*   [ ] **Performance:** Optimize voice list rendering, especially if dealing with hundreds/thousands of voices (virtualization if needed).
*   [ ] **State Management:** Review and refine state management for filters and selections (consider `useSearchParams` for making filter state URL-shareable).
*   [ ] **Empty States:** Ensure clear and helpful empty states (no voices match filter, no voices loaded, etc.).
*   [ ] **Documentation:** Update any relevant user/developer documentation.

This provides a structured approach to building out the ElevenLabs Voice Explorer. 