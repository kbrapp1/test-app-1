import type { TtsVoice } from '@/types/tts';

/**
 * Replicate model identifier for TTS.
 */
export const MODEL_IDENTIFIER = 'jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13';

/**
 * Hardcoded list of American English voices from jaaari/kokoro-82m.
 * TODO: Consider fetching this dynamically or moving to a database configuration.
 */
export const AMERICAN_VOICES: TtsVoice[] = [
  { id: 'af_alloy', name: 'Alloy', gender: 'Female', accent: 'American' },
  { id: 'af_aoede', name: 'Aoede', gender: 'Female', accent: 'American' },
  { id: 'af_bella', name: 'Bella', gender: 'Female', accent: 'American' },
  { id: 'af_jessica', name: 'Jessica', gender: 'Female', accent: 'American' },
  { id: 'af_kore', name: 'Kore', gender: 'Female', accent: 'American' },
  { id: 'af_nicole', name: 'Nicole', gender: 'Female', accent: 'American' },
  { id: 'af_nova', name: 'Nova', gender: 'Female', accent: 'American' },
  { id: 'af_river', name: 'River', gender: 'Female', accent: 'American' },
  { id: 'af_sarah', name: 'Sarah', gender: 'Female', accent: 'American' },
  { id: 'af_sky', name: 'Sky', gender: 'Female', accent: 'American' },
  { id: 'am_adam', name: 'Adam', gender: 'Male', accent: 'American' },
  { id: 'am_echo', name: 'Echo', gender: 'Male', accent: 'American' },
  { id: 'am_eric', name: 'Eric', gender: 'Male', accent: 'American' },
  { id: 'am_fenrir', name: 'Fenrir', gender: 'Male', accent: 'American' },
  { id: 'am_liam', name: 'Liam', gender: 'Male', accent: 'American' },
  { id: 'am_michael', name: 'Michael', gender: 'Male', accent: 'American' },
  { id: 'am_onyx', name: 'Onyx', gender: 'Male', accent: 'American' },
  { id: 'am_puck', name: 'Puck', gender: 'Male', accent: 'American' },
]; 