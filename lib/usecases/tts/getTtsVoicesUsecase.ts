import type { TtsVoice } from '@/types/tts';
import { AMERICAN_VOICES } from '@/lib/config/ttsConstants';

/**
 * Usecase: Fetches the list of available TTS voices.
 * Currently returns a hardcoded list.
 */
export async function getTtsVoices(): Promise<{ success: boolean; data?: TtsVoice[]; error?: string }> {
  // In a real scenario, this might fetch from a DB or configuration service
  return { success: true, data: AMERICAN_VOICES };
} 