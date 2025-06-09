'use client';
import React, { useState, useCallback } from 'react';
import { Clock, Ban } from 'lucide-react';
import { TtsHistoryPanel } from '@/components/tts/TtsHistoryPanel';
import { TtsInterface, type TtsFormInitializationData } from '@/components/tts/tts-interface';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useHeadlessAudioPlayer } from '@/hooks/useHeadlessAudioPlayer';
import { saveTtsAudioToDam } from '@/lib/actions/tts';
import { toast } from 'sonner';
import { SaveAsDialog } from '@/components/tts/SaveAsDialog';
import { useTtsSaveAsDialog } from '@/hooks/useTtsSaveAsDialog';
import { useFeatureFlag } from '@/lib/organization/presentation/hooks/useFeatureFlag';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

// TODO: Implement the TTS UI according to the design spec
// FSD: docs/text-to-speech/tts-fsd.md
// UX: docs/text-to-speech/tts-ux-design.md

export default function TextToSpeechPage() {
  const isTtsEnabled = useFeatureFlag('tts');

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<TtsFormInitializationData | undefined>(undefined);
  const [shouldRefreshHistory, setShouldRefreshHistory] = useState<boolean>(false);

  const {
    playAudio: headlessPlayAudio,
    pauseAudio: headlessPauseAudio,
    resumeAudio: headlessResumeAudio,
    stopAudio: headlessStopAudio,
    isPlaying: isHeadlessPlayerPlaying,
    currentlyPlayingUrl: headlessPlayerUrl,
    isLoading: isHeadlessPlayerLoading,
    error: headlessPlayerError,
  } = useHeadlessAudioPlayer();

  const {
    isSaveAsDialogOpen,
    openSaveAsDialog,
    submitSaveAsDialog,
    defaultSaveAsName,
    setIsSaveAsDialogOpen,
  } = useTtsSaveAsDialog({
    onSaveComplete: () => setShouldRefreshHistory(true)
  });

  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryOpen(prev => !prev);
  }, []);

  const handleTtsGenerationComplete = useCallback(() => {
    setShouldRefreshHistory(true);
  }, []);

  const handleReloadInputFromItem = useCallback((item: TtsPredictionRow) => {
    if (item.inputText && item.voiceId) {
      setFormInitialValues({
        inputText: item.inputText,
        voiceId: item.voiceId,
        provider: item.prediction_provider || undefined,
        key: Date.now(),
        outputUrl: item.outputUrl,
        dbId: item.id,
      });
      setIsHistoryOpen(false);
    } else {
      console.warn('History item is missing inputText or voiceId', item);
    }
  }, []);

  const handleReplayItem = useCallback((item: TtsPredictionRow) => {
    if (!item.outputUrl) {
      console.warn('History item is missing outputUrl for replay', item);
      if (headlessPlayerUrl === item.outputUrl) {
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
      headlessPlayAudio(item.outputUrl);
    }
  }, [headlessPlayAudio, headlessPauseAudio, headlessResumeAudio, headlessStopAudio, isHeadlessPlayerPlaying, headlessPlayerUrl]);

  const handleViewInDam = useCallback((item: TtsPredictionRow) => {
    // TODO: Implement DAM navigation
  }, []);

  const handleDeleteItem = useCallback(async (item: TtsPredictionRow) => {
    // TODO: Implement delete logic
  }, []);

  const handleSaveToDam = async (item: TtsPredictionRow): Promise<boolean> => {
    const predictionId = item.id;
    const audioUrl = item.outputUrl;
    if (!audioUrl) {
      toast.error('No audio output URL found for this item.');
      return false;
    }
    const assetName = item.inputText
      ? `${item.inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio`
      : `tts_audio_${new Date().toISOString()}`;

    const toastId = toast.loading("Saving to DAM...");
    try {
      const result = await saveTtsAudioToDam(audioUrl, assetName, predictionId, true);
      
      if (result.success && result.assetId) {
        toast.success(`Saved to DAM with ID: ${result.assetId}`, { id: toastId });
        setShouldRefreshHistory(true);
        return true;
      } else {
        toast.error(`Failed to save to DAM: ${result.error || 'Unknown error'}`, { id: toastId });
        return false;
      }
    } catch (error: any) {
      toast.error(`Error saving to DAM: ${error.message || 'Unknown error'}`, { id: toastId });
      return false;
    }
  };

  const handleSaveAsToDam = useCallback(async (item: TtsPredictionRow): Promise<boolean> => {
    openSaveAsDialog(item);
    return !!item.outputUrl;
  }, [openSaveAsDialog]);

  if (!isTtsEnabled) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[calc(100vh-200px)] text-center">
        <Ban className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Feature Not Enabled</h1>
        <p className="text-muted-foreground">
          The Text-to-Speech feature is not enabled for your organization.
        </p>
        <p className="text-muted-foreground mt-1">
          Please contact your administrator for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">AI Playground: Text to Speech</h1>
        <Button variant="outline" size="icon" onClick={toggleHistoryPanel} className="ml-auto">
          <Clock className="h-4 w-4" />
        </Button>
      </div>
      <TtsInterface
        key={formInitialValues?.key ?? 'default'}
        remountKey={formInitialValues?.key ?? 'default'}
        formInitialValues={formInitialValues}
        onGenerationComplete={handleTtsGenerationComplete}
      />

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
        onSaveToDam={handleSaveToDam}
        onSaveAsToDam={handleSaveAsToDam}
        headlessPlayerCurrentlyPlayingUrl={headlessPlayerUrl}
        isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
        isHeadlessPlayerLoading={isHeadlessPlayerLoading}
        headlessPlayerError={headlessPlayerError}
        shouldRefresh={shouldRefreshHistory}
        onRefreshComplete={() => setShouldRefreshHistory(false)}
      />

      <SaveAsDialog
        isOpen={isSaveAsDialogOpen}
        onOpenChange={setIsSaveAsDialogOpen}
        onSubmit={submitSaveAsDialog}
        defaultAssetName={defaultSaveAsName}
      />
    </div>
  );
} 