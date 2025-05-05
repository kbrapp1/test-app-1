import React from 'react';
import { TtsInterface } from '@/components/tts/tts-interface';

// TODO: Implement the TTS UI according to the design spec
// FSD: docs/text-to-speech/tts-fsd.md
// UX: docs/text-to-speech/tts-ux-design.md

export default function TextToSpeechPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Playground: Text to Speech</h1>
      {/* Use the client component for the interactive UI */}
      <TtsInterface />
    </div>
  );
} 