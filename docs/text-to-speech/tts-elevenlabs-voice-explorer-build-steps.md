# ElevenLabs Voice Explorer - Build Steps

This document outlines the planned steps to implement the ElevenLabs Voice Explorer feature, allowing users to browse, filter, search, and preview ElevenLabs voices. This is a sub-feature of the main Text-to-Speech functionality within the AI Playground.

**References:**
*   Main TTS Build Steps: [tts-build-steps.md](mdc:docs/text-to-speech/tts-build-steps.md)
*   UX Concept: Dedicated sub-page under "AI Playground" for voice discovery.

## Phase 1: Backend & Data Foundation

**Step 1: Investigate ElevenLabs `/v2/voices` API**
*   [ ] **Research:** Thoroughly review ElevenLabs API documentation for the `/v2/voices` endpoint (or latest equivalent).
    *   [ ] Identify request parameters for pagination (e.g., `page_size`, `next_page_token`).
    *   [ ] Identify request parameters for searching/filtering by name, labels (gender, accent, age, style, description keywords, etc.).
    *   [ ] Confirm the structure of the response, especially the voice object, `labels` field, and `preview_url`.
*   [ ] **Decision:** Determine if `/v2/voices` offers sufficient server-side filtering. If not, extensive client-side filtering or DB caching will be more critical.

**Step 2: Database Schema for Cached Voices (If Necessary)**
*   [ ] **Decision:** Based on Step 1, decide if caching voices in our DB is necessary/beneficial. Caching is recommended if:
    *   `/v2/voices` doesn't support robust server-side filtering by various labels.
    *   We want to reduce API calls to ElevenLabs for browsing.
    *   We want to augment voice data with our own tags or metadata.
*   [ ] If caching:
    *   [ ] Define schema for a new table (e.g., `elevenlabs_cached_voices`):
        *   `voice_id: TEXT PRIMARY KEY` (from ElevenLabs)
        *   `name: TEXT`
        *   `provider: TEXT` (default 'elevenlabs')
        *   `api_version: TEXT` (e.g., 'v1', 'v2')
        *   `raw_labels: JSONB` (to store the full `labels` object from API)
        *   `gender: TEXT NULLABLE` (parsed from labels)
        *   `accent: TEXT NULLABLE` (parsed from labels)
        *   `age_group: TEXT NULLABLE` (parsed from labels, e.g., 'young', 'middle_aged', 'old')
        *   `description_tags: TEXT[] NULLABLE` (parsed from labels or name, e.g., ['calm', 'energetic'])
        *   `use_cases: TEXT[] NULLABLE` (parsed from labels)
        *   `preview_url: TEXT NULLABLE`
        *   `is_available: BOOLEAN DEFAULT true`
        *   `last_fetched_at: TIMESTAMPTZ`
        *   `created_at: TIMESTAMPTZ DEFAULT now()`
        *   `updated_at: TIMESTAMPTZ DEFAULT now()`
    *   [ ] Create Supabase migration for the new table.
    *   [ ] Regenerate Supabase types.

**Step 3: Backend Service/Actions for Voices**
*   [ ] **If Caching:**
    *   [ ] Create a new service `lib/services/elevenlabsVoiceCacheService.ts`.
    *   [ ] Implement `syncElevenLabsVoices` function:
        *   [ ] Fetches all voices from ElevenLabs `/v2/voices` (handling pagination).
        *   [ ] Parses relevant data (name, ID, labels, preview_url).
        *   [ ] Upserts data into `elevenlabs_cached_voices` table.
        *   [ ] Marks voices not found in API response as `is_available = false` in our DB.
    *   [ ] Create a Supabase Edge Function or a cron job to call `syncElevenLabsVoices` periodically (e.g., daily).
    *   [ ] Implement `searchCachedElevenLabsVoices` Server Action:
        *   [ ] Accepts search terms, filter parameters (gender, accent, tags, etc.), sort options, pagination.
        *   [ ] Constructs and executes a SQL query against `elevenlabs_cached_voices`.
        *   [ ] Returns paginated list of voices.
*   [ ] **If NOT Caching (direct API calls with `/v2/voices` filtering):**
    *   [ ] Enhance `lib/services/elevenlabsService.ts`.
    *   [ ] Modify/Create `listV2Voices` function:
        *   [ ] Accepts search/filter parameters.
        *   [ ] Calls ElevenLabs `/v2/voices` endpoint with these parameters.
        *   [ ] Handles pagination from the API.
        *   [ ] Maps response to a consistent `TtsVoice` (or extended) interface.
    *   [ ] Create `searchLiveElevenLabsVoices` Server Action that wraps `listV2Voices`.
*   [ ] *Testing:* Unit tests for new service functions and server actions (mocking API calls, DB interactions).

**(Review Point 1: Backend strategy for fetching/storing/searching ElevenLabs voices decided and implemented.)**

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