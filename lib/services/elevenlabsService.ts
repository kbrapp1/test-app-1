import type { TtsVoice } from '@/types/tts';

/** Retrieve and validate ElevenLabs API configuration */
function getElevenLabsConfig() {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
  const apiUrl = process.env.ELEVENLABS_API_URL || process.env.NEXT_PUBLIC_ELEVENLABS_API_URL;
  if (!apiKey) {
    throw new Error('Missing ELEVENLABS_API_KEY in environment');
  }
  if (!apiUrl) {
    throw new Error('Missing ELEVENLABS_API_URL in environment');
  }
  return { apiKey, apiUrl };
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: {
    gender?: string;
    accent?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Fetch the list of available voices from ElevenLabs.
 */
export async function listVoices(): Promise<TtsVoice[]> {
  const { apiKey, apiUrl } = getElevenLabsConfig();
  
  const endpoint = `${apiUrl}/voices`; // Reverted to simple v1 call

  const res = await fetch(endpoint, {
    headers: {
      'xi-api-key': apiKey,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`ElevenLabs: Failed to list voices (${res.status}): ${res.statusText}. Body: ${errorBody}`);
  }

  const json = await res.json();

  const voices: ElevenLabsVoice[] = Array.isArray(json.voices) ? json.voices : (json as any[]);

  return voices.map((v) => {
    const apiGender = v.labels?.gender?.toLowerCase();
    const apiAccent = v.labels?.accent?.toLowerCase();

    let gender: TtsVoice['gender'] = 'Other';
    if (apiGender === 'male') {
      gender = 'Male';
    } else if (apiGender === 'female') {
      gender = 'Female';
    }

    let accent: TtsVoice['accent'] = 'Other';
    if (apiAccent === 'american') {
      accent = 'American';
    } else if (apiAccent === 'british') {
      accent = 'British';
    }

    return {
      id: v.voice_id,
      name: v.name,
      gender,
      accent,
    };
  });
}

/**
 * Submit text to ElevenLabs for speech generation. 
 * Note: ElevenLabs API currently returns audio stream synchronously.
 * This function returns the raw audio ArrayBuffer.
 */
export async function submitTts(
  inputText: string,
  voiceId: string
): Promise<ArrayBuffer> {
  const { apiKey, apiUrl } = getElevenLabsConfig();
  const res = await fetch(`${apiUrl}/text-to-speech/${voiceId}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: inputText }),
  });

  if (!res.ok) {
    throw new Error(`ElevenLabs: TTS generation failed (${res.status}): ${res.statusText}`);
  }

  const audioBuffer = await res.arrayBuffer();
  return audioBuffer;
} 