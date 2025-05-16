import type { TtsVoice } from '@/types/tts';

/**
 * Replicate model identifier for TTS.
 * @deprecated Prefer REPLICATE_MODELS.KOKORO_82M from ttsProviderConfig.ts
 */
// export const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';

/**
 * Hardcoded list of American English voices from jaaari/kokoro-82m.
 * @deprecated Prefer ttsProvidersConfig from ttsProviderConfig.ts
 */
// export const AMERICAN_VOICES: TtsVoice[] = [
//   { id: 'af_alloy', name: 'Alloy', gender: 'Female', accent: 'American' },
//   { id: 'af_aoede', name: 'Aoede', gender: 'Female', accent: 'American' },
//   { id: 'af_bella', name: 'Bella', gender: 'Female', accent: 'American' },
//   { id: 'af_jessica', name: 'Jessica', gender: 'Female', accent: 'American' },
//   { id: 'af_kore', name: 'Kore', gender: 'Female', accent: 'American' },
//   { id: 'af_nicole', name: 'Nicole', gender: 'Female', accent: 'American' },
//   { id: 'af_nova', name: 'Nova', gender: 'Female', accent: 'American' },
//   { id: 'af_river', name: 'River', gender: 'Female', accent: 'American' },
//   { id: 'af_sarah', name: 'Sarah', gender: 'Female', accent: 'American' },
//   { id: 'af_sky', name: 'Sky', gender: 'Female', accent: 'American' },
//   { id: 'am_adam', name: 'Adam', gender: 'Male', accent: 'American' },
//   { id: 'am_echo', name: 'Echo', gender: 'Male', accent: 'American' },
//   { id: 'am_eric', name: 'Eric', gender: 'Male', accent: 'American' },
//   { id: 'am_fenrir', name: 'Fenrir', gender: 'Male', accent: 'American' },
//   { id: 'am_liam', name: 'Liam', gender: 'Male', accent: 'American' },
//   { id: 'am_michael', name: 'Michael', gender: 'Male', accent: 'American' },
//   { id: 'am_onyx', name: 'Onyx', gender: 'Male', accent: 'American' },
//   { id: 'am_puck', name: 'Puck', gender: 'Male', accent: 'American' },
// ];

/**
 * Hardcoded list of British English voices from jaaari/kokoro-82m.
 * @deprecated Prefer ttsProvidersConfig from ttsProviderConfig.ts
 */
// export const BRITISH_VOICES: TtsVoice[] = [
//   { id: 'bf_alice', name: 'Alice', gender: 'Female', accent: 'British' },
//   { id: 'bf_emma', name: 'Emma', gender: 'Female', accent: 'British' },
//   { id: 'bf_isabella', name: 'Isabella', gender: 'Female', accent: 'British' },
//   { id: 'bf_lily', name: 'Lily', gender: 'Female', accent: 'British' },
//   { id: 'bm_daniel', name: 'Daniel', gender: 'Male', accent: 'British' },
//   { id: 'bm_fable', name: 'Fable', gender: 'Male', accent: 'British' },
//   { id: 'bm_george', name: 'George', gender: 'Male', accent: 'British' },
//   { id: 'bm_lewis', name: 'Lewis', gender: 'Male', accent: 'British' },
// ];

/**
 * Combined list of available voices for the jaaari/kokoro-82m model on Replicate.
 * @deprecated Prefer ttsProvidersConfig from ttsProviderConfig.ts
 */
// export const KOKORO_JAARI_VOICES: TtsVoice[] = [
//   ...AMERICAN_VOICES,
//   ...BRITISH_VOICES,
// ];

// This file can be kept for other TTS related constants that are not provider/voice specific
// or removed if no such constants remain. 