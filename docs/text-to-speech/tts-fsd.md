# Text-to-Speech (TTS) - Functional Specification Document (FSD)

**Version:** 1.3
**Date:** YYYY-MM-DD

## 1. Introduction & Objectives

This document outlines the functional requirements for the Text-to-Speech (TTS) feature within the AI Playground section of the application.

The primary objectives are:
*   Allow users to convert provided text into audible speech using a selection of voices.
*   Provide options for basic speech customization (voice selection, potentially speed/pitch).
*   Enable users to listen to and download the generated audio.
*   Integrate cleanly with the existing application structure, UI components, and error handling system.
*   Provide features like generation history, audio sharing, waveform visualization, and custom voice previews.

## 2. User Stories

*   As a user, I want to enter or paste text into an input field.
*   As a user, I want to select a voice from a list of available options.
*   As a user, I want to optionally preview a voice sample before generating speech.
*   As a user, I want to click a button to generate speech from my text and selected voice.
*   As a user, I want to see a loading indicator while the speech is being generated.
*   As a user, I want to play the generated audio using standard player controls.
*   As a user, I want to download the generated audio file (e.g., as an MP3).
*   As a user, I want to receive clear feedback if the generation fails (e.g., text too long, API error).
*   As a user, I want to view a history of my previous TTS generations.
*   As a user, I want to replay or redownload audio from my history.
*   As a user, I want to generate a shareable link for a generated audio file.
*   As a user, I want to type a short custom phrase to quickly preview the selected voice.
*   As a user, when viewing my TTS generation history, I want to see which text asset (if any) was used as the input.
*   As a user, when viewing my TTS generation history, I want to see which audio asset (if any) was created when I saved the output.
*   As a user, I want clickable links in the history to navigate to the source text asset or the saved audio asset in the Asset Library.

## 3. Proposed Solution

### 3.1. User Interface (UI)

The UI will be implemented as a single page at `/ai-playground/text-to-speech`. It will utilize a two-column (desktop) / stacked (mobile) layout.

Refer to [tts-ux-design.md](mdc:docs/tts-ux-design.md) for detailed layout diagrams, component descriptions, and specific UX considerations.

### 3.2. Component Breakdown (Frontend)

*   **`app/(protected)/ai-playground/text-to-speech/page.tsx`**: The main page container component. Responsible for layout and orchestrating child components.
*   **`components/ai/tts/tts-form.tsx`**: Client component managing the form state (text input, voice selection, optional settings), handling user input, and triggering the generation action. Will likely use `useState` or `useReducer`. Handles custom voice preview input.
*   **`components/ai/tts/voice-selector.tsx`**: Client component specifically handling the fetching and display of voices in the `Select` dropdown, including grouping and potential preview functionality. Populated with predefined voices from `jaaari/kokoro-82m` model.
*   **`components/ai/tts/audio-output.tsx`**: Client component displaying the audio player with waveform visualization and download button conditionally based on the generation result. This component will likely use the Web Audio API and potentially a library like `wavesurfer.js` for the waveform. Includes waveform, share button, "Save to Library" button.
*   **`components/ai/tts/tts-history-list.tsx`**: Displays the list of past generations.
*   **`components/ai/tts/tts-history-item.tsx`**: Renders a single item in the history list. Displays text snippet, voice, date, play/download buttons. Conditionally displays:
    *   "Save to Library" button (if not yet saved).
    *   Link to source text asset (if applicable).
    *   Link to saved output asset (if applicable).
*   **`components/dam/asset-selector-modal.tsx`**: (New) Modal/Drawer component to browse and select text assets from the DAM.

### 3.3. Backend Logic

*   **Server Actions (`lib/actions/tts.ts` or similar):**
    *   **`startSpeechGeneration`:**
        *   Input: Text, voice ID.
        *   Processing: 
            *   Validate input, **including text length against a reasonable limit (e.g., 5000 characters - TBD)**.
            *   Securely call Replicate API (e.g., `replicate.predictions.create`) to *start* the TTS model prediction. Handle potential immediate errors.
        *   Output: Returns the Replicate `predictionId`.
    *   **`getSpeechGenerationResult`:**
        *   Input: `predictionId`.
        *   Processing: Securely call Replicate API (e.g., `replicate.predictions.get`) to fetch the status and result of a prediction. **Handles polling logic initially.**
        *   Output: Returns status, audio URL(s). ~~and potentially other metadata (like timing info if available)~~. If failed, returns error details.
    *   **`getTtsVoices`:**
        *   Returns a predefined list of voices supported by `jaaari/kokoro-82m` based on its documentation.
    *   **`getVoiceSample` (or integrated into `startSpeechGeneration`):**
        *   Handles generating short previews using the Replicate async flow.
    *   **`saveTtsHistory`:**
        *   Input: User ID, text snippet, voice info, audio URL, status, **`source_asset_id` (nullable)**, **`output_asset_id` (nullable)**.
        *   Processing: Saves generation details to `tts_history` table.
    *   **`getTtsHistory`:**
        *   Input: User ID, pagination parameters.
        *   Processing: Fetches user's TTS generation history from the database. Fetches history including `source_asset_id` and `output_asset_id`.
    *   **`generateShareableLink`:** (Potentially part of `saveTtsHistory` or separate)
        *   Input: History item ID or audio URL.
        *   Processing: Ensures audio is in persistent storage (e.g., Supabase Storage), generates a temporary signed URL or a persistent public URL based on requirements.
    *   **`saveTtsAudioToDam`:** (New/Combined)
        *   Input: Audio data/URL from Replicate, desired filename (optional), user ID.
        *   Processing: Downloads audio if necessary, uploads to Supabase Storage (using DAM conventions), creates an entry in the `assets` table.
        *   Output: Returns the new `asset.id` for the saved audio file.
*   **Server Actions (`lib/actions/dam.ts`):**
    *   **`listTextAssets`:** (New) Fetches assets filtered by text MIME types for the asset selector modal.
    *   **`getAssetContent`:** (New) Fetches the text content of a specific asset ID from Supabase Storage.
*   **Database Schema:**
    *   `tts_history` table: Add `source_asset_id UUID NULL REFERENCES assets(id)`, `output_asset_id UUID NULL REFERENCES assets(id)`.

### 3.4. TTS Provider API

*   **Chosen Provider:** **Replicate**
*   **Model:** **`jaaari/kokoro-82m`** ([https://replicate.com/jaaari/kokoro-82m](https://replicate.com/jaaari/kokoro-82m))
*   **API Key Management:** `REPLICATE_API_TOKEN` environment variable required, accessed server-side only.
*   **Interaction:** Asynchronous prediction start (`predictions.create`) and result fetching (`predictions.get`). **Initial implementation will use client-side or server-action-based polling.** Webhooks noted as a future optimization.
*   **Feature Check:**
    *   SSML: **No** (based on README)
    *   Timing Info (Highlighting): **No** (based on README)
    *   Speed/Pitch Control: **No** (based on README)
    *   Format Selection: **No** (based on README)
    *   Voices: Predefined list (e.g., `af_bella`).

## 4. Data Flow

*   (Specify polling)
1.  Page Load: Fetch voices, fetch initial history.
2.  User Interaction: Enters text, selects voice, clicks "Generate Speech".
3.  Frontend: **(Optional: Basic client-side length check)**. Calls `startSpeechGeneration` action.
4.  Backend (`startSpeechGeneration`): **Validates text length**. Calls Replicate `predictions.create`, returns `predictionId`.
5.  Frontend: Stores `predictionId`, **starts polling** `getSpeechGenerationResult` action using `setInterval`.
6.  Backend (`getSpeechGenerationResult`): Calls Replicate `predictions.get`, returns status/result.
7.  Frontend (Polling callback on success): Clears interval. Receives audio URL. Calls `saveTtsHistory`. Updates UI. Fetches updated history.
8.  Frontend (Polling callback on failure): Clears interval. Displays error.
9.  User Interaction: Plays audio, downloads, shares, etc.

## 5. Error Handling

*   Leverage the existing error handling system (`lib/errors`).
*   **Client-side Validation:** Basic checks in `tts-form.tsx` (e.g., text not empty, voice selected) before calling the action.
*   **Server-side Validation:** Robust validation, **including text length**, returning `ValidationError`.
*   **API Errors:** Catch errors from the TTS provider API call, wrap them in `ExternalServiceError` or a more specific custom error, and return to the client.
*   **UI Feedback:** Use `Alert` for persistent errors related to input or API configuration, `Toast` for success/transient errors.
*   Handle Replicate-specific errors (prediction failures, timeouts).
*   Handle polling errors/timeouts.
*   Handle history saving/loading errors.

## 6. Enhancements (Now Core Requirements - Adjusted)

*   **Generation History:** Implement backend storage and frontend list view.
*   **Shareable Links:** Generate links for generated audio.
*   **Custom Voice Preview:** Implement quick preview functionality.
*   **Waveform Visualizer:** Implement using Web Audio API / library.

## 7. Future Considerations

*   Saving generated audio snippets for later use.
*   Caching voice lists.
*   Usage tracking/limits.
*   More advanced audio format options.
*   Implement Webhook support for Replicate callbacks (more efficient than polling).
*   Usage limits and cost estimation/display.
*   More granular progress feedback during generation.
*   Model abstraction layer to support different TTS providers/models. 