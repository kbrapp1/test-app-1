'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { TtsHistoryItem } from '../types/TtsPresentation';
import { saveTtsAudioToDam } from '../../application/actions/tts';

interface UseTtsSaveAsDialogProps {
  onSaveComplete: () => void; // Callback to trigger refresh or other actions
}

export function useTtsSaveAsDialog({ onSaveComplete }: UseTtsSaveAsDialogProps) {
  const [isSaveAsDialogOpen, setIsSaveAsDialogOpen] = useState(false);
  const [currentItemForSaveAs, setCurrentItemForSaveAs] = useState<TtsHistoryItem | null>(null);
  const [defaultSaveAsName, setDefaultSaveAsName] = useState('');

  const openSaveAsDialog = useCallback((item: TtsHistoryItem) => {
    if (!item.outputUrl) {
      toast.error('No audio output URL found for this item.');
      // It's important that TtsHistoryItem resets its local saving state.
      // Returning false from the original handler achieved this.
      // The caller of openSaveAsDialog will need to handle this if it's a direct replacement.
      // For now, the hook itself doesn't return a boolean for this part.
      return;
    }
    const inputText = item.inputText;
    const generatedDefaultName = inputText 
      ? `${inputText.substring(0, 30).trim().replace(/[^a-zA-Z0-9_\s-]/g, '')}_tts_audio_copy` 
      : `tts_audio_copy_${new Date().toISOString()}`;
    
    setDefaultSaveAsName(generatedDefaultName);
    setCurrentItemForSaveAs(item);
    setIsSaveAsDialogOpen(true);
  }, []);

  const submitSaveAsDialog = async (assetName: string) => {
    if (!currentItemForSaveAs || !currentItemForSaveAs.outputUrl) {
      toast.error('Error: No item context for Save As operation.');
      setIsSaveAsDialogOpen(false);
      return;
    }

    const { outputUrl, id: predictionId } = currentItemForSaveAs;
    const toastId = toast.loading("Saving as new asset in DAM...");

    try {
      // For "Save As", we don't link to the original prediction by default in the assetDB, so linkToPredictionId is false
      const result = await saveTtsAudioToDam(outputUrl, assetName, predictionId, false); 
      if (result.success && result.assetId) {
        toast.success(`New asset created in DAM with ID: ${result.assetId}`, { id: toastId });
        onSaveComplete(); // Trigger refresh
      } else {
        toast.error(`Failed to save as new asset: ${result.error || 'Unknown error'}`, { id: toastId });
      }
    } catch (error: any) {
      toast.error(`Error saving as new asset: ${error.message || 'Unknown error'}`, { id: toastId });
    }
    setIsSaveAsDialogOpen(false);
    setCurrentItemForSaveAs(null);
  };

  const closeSaveAsDialog = useCallback(() => {
    setIsSaveAsDialogOpen(false);
    setCurrentItemForSaveAs(null);
    setDefaultSaveAsName('');
  }, []);

  return {
    isSaveAsDialogOpen,
    openSaveAsDialog,
    submitSaveAsDialog,
    closeSaveAsDialog, // if manual close is needed, e.g. on 'Esc' or overlay click
    currentItemForSaveAs, // though dialog component might not need this directly if it takes defaultName
    defaultSaveAsName,
    setIsSaveAsDialogOpen, // expose setter for SaveAsDialog's onOpenChange
  };
} 