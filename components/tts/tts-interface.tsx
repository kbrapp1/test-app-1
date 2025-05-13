'use client';

import React, { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { AssetSelectorModal } from '@/components/dam/asset-selector-modal';
import type { Asset } from '@/types/dam';
import { TooltipProvider } from "@/components/ui/tooltip";

// Import the new hooks and subcomponents
import { useTtsGeneration } from '@/hooks/useTtsGeneration';
import { useTtsDamIntegration } from '@/hooks/useTtsDamIntegration';
import { TtsInputCard } from './TtsInputCard';
import { TtsOutputCard } from './TtsOutputCard';

// Validation schema definition (can be shared or defined here)
const TtsInputSchema = z.object({
  inputText: z.string()
    .min(1, 'Input text cannot be empty.')
    .max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  voiceId: z.string({ required_error: "Please select a voice." }).min(1, "Please select a voice."),
});

type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

export function TtsInterface() {
  const { toast } = useToast();

  // --- Form Setup ---
  const form = useForm<TtsInputFormValues>({
    resolver: zodResolver(TtsInputSchema),
    defaultValues: {
      inputText: '',
      voiceId: '', // Make sure voiceId is initialized
    },
  });
  const currentInputText = form.watch('inputText');

  // --- Custom Hooks ---
  const { 
    isGenerating,
    predictionStatus, 
    audioUrl, 
    ttsErrorMessage,
    ttsPredictionDbId,
    startGeneration, 
    resetTtsState 
  } = useTtsGeneration();
  
  const { 
    isDamModalOpen, 
    setIsDamModalOpen, 
    isTextActionLoading, 
    isAudioActionLoading,
    sourceAssetId, 
    originalLoadedText, 
    damErrorMessage, 
    loadTextFromAsset, 
    saveTextToAsset, 
    saveTextAsNewAsset, 
    saveAudioToDam, 
  } = useTtsDamIntegration({
      onTextLoaded: (text, assetId) => {
        form.setValue('inputText', text, { shouldValidate: true });
        resetTtsState();
      }
  });

  // --- State for Delete --- 
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Event Handlers ---

  const onSubmit = (values: TtsInputFormValues) => {
    const formData = new FormData();
    formData.append('inputText', values.inputText);
    formData.append('voiceId', values.voiceId);
    startGeneration(formData);
  };

  const handleSaveText = useCallback(() => {
    saveTextToAsset(form.getValues('inputText'));
  }, [form, saveTextToAsset]);

  const handleSaveTextAs = useCallback(() => {
    const currentText = form.getValues('inputText');
    const desiredName = prompt("Enter a name for the new text asset (e.g., my-speech-script.txt):");
    if (!desiredName?.trim()) return;
    const finalName = desiredName.endsWith('.txt') ? desiredName : `${desiredName}.txt`;
    saveTextAsNewAsset(currentText, finalName);
  }, [form, saveTextAsNewAsset]);

  const handleSaveToLibrary = useCallback(() => {
    if (!audioUrl) {
        toast({ title: 'Error', description: 'No audio generated yet.', variant: 'destructive' });
        return;
    }
    saveAudioToDam(audioUrl, ttsPredictionDbId);
  }, [audioUrl, ttsPredictionDbId, saveAudioToDam, toast]);

  // Placeholder Delete Handler
  const handleDeletePrediction = useCallback(async () => {
    if (!ttsPredictionDbId) return;
    setIsDeleting(true);
    console.log("TODO: Call delete action with ID:", ttsPredictionDbId);
    // Placeholder: Replace with actual delete action call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    toast({ title: "Info", description: "Delete functionality not fully implemented yet." });
    // On successful deletion from backend:
    // resetTtsState(); 
    setIsDeleting(false);
  }, [ttsPredictionDbId, toast]);

  // --- Derived State ---
  const isProcessing = isGenerating || isTextActionLoading || isAudioActionLoading || isDeleting;

  // --- Render ---
  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Card Component */}
        <TtsInputCard 
          form={form}
          onSubmit={onSubmit}
          isProcessing={isProcessing}
          isGenerating={isGenerating}
          isTextActionLoading={isTextActionLoading}
          sourceAssetId={sourceAssetId}
          originalLoadedText={originalLoadedText}
          currentInputText={currentInputText}
          handleSaveText={handleSaveText}
          handleSaveTextAs={handleSaveTextAs}
          onLoadFromLibraryClick={() => setIsDamModalOpen(true)}
        />

        {/* Output Card Component - Corrected Props */}
        <TtsOutputCard
          isLoading={isGenerating} 
          isPollingLoading={isGenerating}
          isSavingToDam={isAudioActionLoading} 
          isDeleting={isDeleting} 
          audioUrl={audioUrl}
          predictionStatus={predictionStatus}
          errorMessage={ttsErrorMessage} 
          currentPredictionId={null}
          currentTtsPredictionDbId={ttsPredictionDbId} 
          onSaveToLibrary={handleSaveToLibrary} 
          onDeletePrediction={handleDeletePrediction}
        />

        {/* DAM Asset Selector Modal (remains controlled by the parent) */} 
        <AssetSelectorModal
          open={isDamModalOpen}
          onOpenChange={setIsDamModalOpen}
          onAssetSelect={loadTextFromAsset} // Pass the handler from the hook
        />
      </div>
    </TooltipProvider>
  );
} 