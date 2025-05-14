'use client';
import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { TtsHistoryPanel } from '@/components/tts/TtsHistoryPanel';
import { TtsInterface, type TtsFormInitializationData } from '@/components/tts/tts-interface';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useHeadlessAudioPlayer } from '@/hooks/useHeadlessAudioPlayer';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

// TODO: Implement the TTS UI according to the design spec
// FSD: docs/text-to-speech/tts-fsd.md
// UX: docs/text-to-speech/tts-ux-design.md

export default function TextToSpeechPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<TtsFormInitializationData | undefined>(undefined);

  // Headless audio player integration
  const {
    playAudio: headlessPlayAudio,
    pauseAudio: headlessPauseAudio,
    resumeAudio: headlessResumeAudio,
    stopAudio: headlessStopAudio, // We might not need stop directly if play always stops previous
    isPlaying: isHeadlessPlayerPlaying,
    currentlyPlayingUrl: headlessPlayerUrl,
    isLoading: isHeadlessPlayerLoading,
    error: headlessPlayerError,
  } = useHeadlessAudioPlayer();

  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);

  const handleReloadInputFromItem = useCallback((item: TtsPredictionRow) => {
    if (item.inputText && item.voiceId) {
      setFormInitialValues({
        inputText: item.inputText,
        voiceId: item.voiceId,
        key: Date.now(), // Use timestamp as a key to force re-render/reset
        outputUrl: item.outputUrl,
        dbId: item.id,
      });
      setIsHistoryOpen(false); // Close panel after reloading
    } else {
      // Handle missing data, maybe show a toast
      console.warn('History item is missing inputText or voiceId', item);
    }
  }, []);

  const handleReplayItem = useCallback((item: TtsPredictionRow) => {
    if (!item.outputUrl) {
      console.warn('History item is missing outputUrl for replay', item);
      if (headlessPlayerUrl === item.outputUrl) { // If it was trying to play this non-existent URL
        headlessStopAudio();
      }
      return;
    }

    if (headlessPlayerUrl === item.outputUrl) {
      if (isHeadlessPlayerPlaying) {
        headlessPauseAudio();
      } else {
        headlessResumeAudio();
      }
    } else {
      // If something else is playing, playAudio in the hook should handle stopping it.
      headlessPlayAudio(item.outputUrl);
    }
    // Consider if the history panel should close or stay open on replay
    // setIsHistoryOpen(false); 
  }, [headlessPlayAudio, headlessPauseAudio, headlessResumeAudio, headlessStopAudio, isHeadlessPlayerPlaying, headlessPlayerUrl]);

  const handleViewInDam = useCallback((item: TtsPredictionRow) => {
    // TODO: Implement DAM navigation
    console.log('View in DAM clicked for:', item);
    if (item.outputAssetId) {
      // Navigate to DAM page with item.outputAssetId
    } else {
      // Maybe toast "Not saved to DAM"
    }
  }, []);

  const handleDeleteItem = useCallback(async (item: TtsPredictionRow) => {
    // TODO: Implement delete with confirmation
    console.log('Delete clicked for:', item);
    // const confirmed = await showConfirmationDialog();
    // if (confirmed) {
    //   const result = await deleteTtsPrediction(item.id);
    //   if (result.success) {
    //     // Refresh history
    //   } else {
    //     // Show error toast
    //   }
    // }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">AI Playground: Text to Speech</h1>
        <Button variant="outline" size="icon" onClick={toggleHistoryPanel} className="ml-auto">
          <Clock className="h-4 w-4" />
        </Button>
      </div>
      <TtsInterface formInitialValues={formInitialValues} />
      
      {/* Overlay for when history panel is open */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40"
          onClick={toggleHistoryPanel} 
          aria-hidden="true"
        />
      )}

      <TtsHistoryPanel
        isOpen={isHistoryOpen}
        onClose={toggleHistoryPanel}
        onReloadInputFromItem={handleReloadInputFromItem}
        onReplayItem={handleReplayItem}
        onViewInDamItem={handleViewInDam}
        onDeleteItem={handleDeleteItem}
        // Pass headless player state for TtsHistoryItem to update its icon
        headlessPlayerCurrentlyPlayingUrl={headlessPlayerUrl}
        isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
        isHeadlessPlayerLoading={isHeadlessPlayerLoading}
        headlessPlayerError={headlessPlayerError}
      />
    </div>
  );
} 