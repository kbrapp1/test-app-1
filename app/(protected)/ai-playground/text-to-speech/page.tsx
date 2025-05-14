'use client';
import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { TtsHistoryPanel } from '@/components/tts/TtsHistoryPanel';
import { TtsInterface, type TtsFormInitializationData } from '@/components/tts/tts-interface';
import type { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import { useHeadlessAudioPlayer } from '@/hooks/useHeadlessAudioPlayer';
import { getTtsVoices, startSpeechGeneration, getSpeechGenerationResult, saveTtsAudioToDam, getTtsHistory } from '@/lib/actions/tts';
import { toast } from 'sonner';
import { SaveAsDialog } from '@/components/tts/SaveAsDialog';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

// TODO: Implement the TTS UI according to the design spec
// FSD: docs/text-to-speech/tts-fsd.md
// UX: docs/text-to-speech/tts-ux-design.md

export default function TextToSpeechPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [formInitialValues, setFormInitialValues] = useState<TtsFormInitializationData | undefined>(undefined);
  const [shouldRefreshHistory, setShouldRefreshHistory] = useState<boolean>(false); // Flag to trigger history refresh

  // State for Save As Dialog
  const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
  const [currentItemForSaveAs, setCurrentItemForSaveAs] = useState<TtsPredictionRow | null>(null);
  const [defaultSaveAsName, setDefaultSaveAsName] = useState('');

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

  const handleSaveToDam = async (item: TtsPredictionRow): Promise<boolean> => {
    const predictionId = item.id;
    const audioUrl = item.outputUrl;
    if (!audioUrl) {
      toast.error('No audio output URL found for this item.');
      return false;
    }

    // Automatically generate asset name for quick save
    const assetName = item.inputText 
      ? `${item.inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio` 
      : `tts_audio_${new Date().toISOString()}`;
    
    // No prompt for quick save
    // const assetName = prompt("Enter a name for the asset in DAM:", defaultAssetName);
    // if (!assetName) {
    //   toast.info('Save to DAM cancelled.');
    //   return false;
    // }

    const toastId = toast.loading("Saving to DAM...");
    try {
      // Call saveTtsAudioToDam, linkToPrediction is true by default
      const result = await saveTtsAudioToDam(audioUrl, assetName, predictionId);
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

  // This function now just opens the dialog
  const handleSaveAsToDam = async (item: TtsPredictionRow): Promise<boolean> => {
    if (!item.outputUrl) {
      toast.error('No audio output URL found for this item.');
      return false; // Still return false for TtsHistoryItem to reset its local saving state
    }
    const generatedDefaultName = item.inputText 
      ? `${item.inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio_copy` 
      : `tts_audio_copy_${new Date().toISOString()}`;
    
    setDefaultSaveAsName(generatedDefaultName);
    setCurrentItemForSaveAs(item);
    setIsSaveAsDialogOpen(true);
    return Promise.resolve(false); // Return false because the actual save happens after dialog submit.
                                 // TtsHistoryItem expects a boolean to reset its own isSavingAsToDam state if the *initial* action fails.
                                 // Here, opening the dialog is always "successful" in a sense, but the save isn't done yet.
                                 // To ensure TtsHistoryItem resets its spinner immediately, we make it think the initial call didn't complete a save.
  };

  // This function is called when the SaveAsDialog is submitted
  const submitSaveAsFromDialog = async (assetName: string) => {
    if (!currentItemForSaveAs || !currentItemForSaveAs.outputUrl) {
      toast.error('Error: No item context for Save As operation.');
      setIsSaveAsDialogOpen(false);
      return;
    }

    const { outputUrl, id: predictionId } = currentItemForSaveAs;
    const toastId = toast.loading("Saving as new asset in DAM...");

    try {
      const result = await saveTtsAudioToDam(outputUrl, assetName, predictionId, false);
      if (result.success && result.assetId) {
        toast.success(`New asset created in DAM with ID: ${result.assetId}`, { id: toastId });
        setShouldRefreshHistory(true);
      } else {
        toast.error(`Failed to save as new asset: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error saving as new asset: ${error.message || 'Unknown error'}`, { id: toastId });
    }
    setIsSaveAsDialogOpen(false);
    setCurrentItemForSaveAs(null);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">AI Playground: Text to Speech</h1>
        <Button variant="outline" size="icon" onClick={toggleHistoryPanel} className="ml-auto">
          <Clock className="h-4 w-4" />
        </Button>
      </div>
      <TtsInterface 
        formInitialValues={formInitialValues} 
        onGenerationComplete={() => setShouldRefreshHistory(true)}
      />
      
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
        onSaveToDam={handleSaveToDam}
        onSaveAsToDam={handleSaveAsToDam}
        headlessPlayerCurrentlyPlayingUrl={headlessPlayerUrl}
        isHeadlessPlayerPlaying={isHeadlessPlayerPlaying}
        isHeadlessPlayerLoading={isHeadlessPlayerLoading}
        headlessPlayerError={headlessPlayerError}
        shouldRefresh={shouldRefreshHistory}
        onRefreshComplete={() => setShouldRefreshHistory(false)}
      />

      {/* Render the SaveAsDialog */}
      <SaveAsDialog
        isOpen={isSaveAsDialogOpen}
        onOpenChange={setIsSaveAsDialogOpen}
        onSubmit={submitSaveAsFromDialog}
        defaultAssetName={defaultSaveAsName}
      />
    </div>
  );
} 