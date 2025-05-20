# Text-to-Speech (TTS) - ElevenLabs Integration Build Steps

This document outlines the incremental build steps and manual tests for integrating ElevenLabs as a second TTS provider alongside Replicate.

## Phase 1: Prerequisites & Setup

### Step 1: Credentials & Environment
* [X] **Decision:** Adopt ElevenLabs as an additional TTS provider.
* [X] **API Key:** Obtain `ELEVENLABS_API_KEY` from your ElevenLabs account.
* [X] **Environment Variables:** Add to `.env.local` and `.env.example`:
  ```env
  ELEVENLABS_API_KEY=your_key_here
  ELEVENLABS_API_URL=https://api.elevenlabs.io/v1
  ```
* **Manual Testing:**
  1. Restart your dev server (`pnpm dev`) and verify no missing-env errors.
  2. In a temporary server action or console.log, output `process.env.ELEVENLABS_API_KEY` to confirm it's loaded.

## Phase 2: Schema & Types

### Step 2: Extend TypeScript Types
* [X] **TtsProvider Union:** Updated `types/tts.ts` to include `'elevenlabs'`:
  ```ts
  export type TtsProvider = 'replicate' | 'elevenlabs';
  ```
* **Manual Testing:**
  1. In a TS REPL, import `TtsProvider` and confirm `'elevenlabs'` is accepted without type errors.

## Phase 3: ElevenLabs Service Client

### Step 3: Implement ElevenLabs Client
* [X] Create `lib/services/elevenlabsService.ts` with methods:
  ```ts
  export async function listVoices(): Promise<TtsVoice[]> { /* ... */ }
  export async function submitTts(inputText: string, voiceId: string): Promise<ArrayBuffer> { /* ... */ }
  ```
* [X] Handle authentication via `xi-api-key` header and base URL.
* [X] `listVoices` correctly maps API response to `TtsVoice[]`.
* [X] `submitTts` correctly calls ElevenLabs stream endpoint and returns `ArrayBuffer`.
* **Manual Testing:** (Assuming completed as part of development)
  1. [X] Write a quick script/test that calls `listVoices()` and logs the response.
  2. [X] Verify you receive a valid JSON list of voices from ElevenLabs.
  3. [X] Test `submitTts` to ensure it fetches an audio buffer without errors.

## Phase 4: Service Layer Integration

### Step 4: Wire into TTS Service
* [X] In `lib/usecases/tts/startSpeechGenerationUsecase.ts`, branch calls to use `createReplicatePrediction` for `replicate` and `submitElevenLabsTts` (from `elevenlabsService.ts`) for `elevenlabs`.
* **Manual Testing:**
  1. [X] Call the `startSpeechGeneration` server action with `provider: 'elevenlabs'` and a valid `voiceId` + `inputText`.
  2. [X] Verify the ElevenLabs flow is invoked and that a new `TtsPrediction` row with `prediction_provider='elevenlabs'` appears in the database.

## Phase 5: Usecase & Action Layer

### Step 5: Update Usecases for ElevenLabs Output
- [X] In `lib/usecases/tts/startSpeechGenerationUsecase.ts`:
  - [X] For ElevenLabs, after `submitElevenLabsTts` returns the audio buffer:
    - [X] Call `uploadAudioBuffer` (from `ttsService.ts`) to upload the buffer to Supabase Storage.
    - [X] Store the `publicUrl` from `uploadAudioBuffer` in `TtsPrediction.outputUrl`.
    - [X] Store `storagePath`, `contentType`, and `fileSize` in `TtsPrediction` table (new columns added).
    - [X] Set `TtsPrediction.status` to `succeeded`.
    - [X] Generate a new UUID for `TtsPrediction.prediction_id` (as ElevenLabs sync doesn't have a job ID).
- [X] In `lib/usecases/tts/saveTtsAudioToDamUsecase.ts`:
  - [X] For ElevenLabs provider, use `output_storage_path`, `output_content_type`, `output_file_size` from `TtsPrediction` record instead of downloading.
* **Manual Testing:**
  1. [X] Call `startSpeechGeneration` with `provider: 'elevenlabs'`.
  2. [X] Verify a new `TtsPrediction` row is created.
  3. [X] Check that `prediction_provider` is `elevenlabs`.
  4. [X] Confirm `status` is `succeeded`.
  5. [X] **Crucially, verify `outputUrl` contains a valid Supabase Storage URL.**
  6. [X] **Verify `output_storage_path`, `output_content_type`, `output_file_size` are populated.**
  7. [X] Attempt to play the audio from this URL in your browser to ensure it's correct.
  8. [X] Test "Save to DAM" for an ElevenLabs item and verify the asset is created using the stored metadata, not by re-downloading.

## Phase 6: Frontend Updates

### Step 6: UI - Provider Picker & Voice Selector
* [X] In `components/tts/TtsInputCard.tsx`, add a provider selector (radio buttons or dropdown).
* [X] Update `components/tts/VoiceSelector.tsx` to fetch voices via the new use-case when `provider === 'elevenlabs'`.
* **Manual Testing:**
  1. On the Text-to-Speech page, switch to ElevenLabs provider.
  2. Open the voice selector and verify voice options load correctly.

## Phase 7: End-to-End Manual Test

* **Manual Testing:**
  1. Enter sample text, select the ElevenLabs provider and a voice.
  2. Click "Generate Speech" and confirm polling until the job completes.
  3. Verify audio playback via the output player corresponds to ElevenLabs output.

## Phase 8: Cleanup & Documentation

* [X] **Tests:** Write unit tests for `elevenlabsService`, use-cases, and API routes.
* [X] **Docs:** Update `docs/text-to-speech/tts-fsd.md` and `tts-ux-design.md` with ElevenLabs detals.
* [X] **Integration Tests:** Add E2E or integration tests covering the new provider flow.

> **Note:** After each step, proceed only once manual verification passes.  
> Keep this checklist updated as you progress. 