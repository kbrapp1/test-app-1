'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { AssetSelectorModal } from '@/components/dam/asset-selector-modal';
import type { Asset } from '@/types/dam';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTtsGeneration } from '@/hooks/useTtsGeneration';
import { useTtsDamIntegration } from '@/hooks/useTtsDamIntegration';
import { TtsInputCard } from './TtsInputCard';
import { TtsOutputCard } from './TtsOutputCard';
import { Loader2 } from "lucide-react";

// Validation schema definition (can be shared or defined here)
const TtsInputSchema = z.object({
  inputText: z.string()
    .min(1, 'Input text cannot be empty.')
    .max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  voiceId: z.string({ required_error: "Please select a voice." }).min(1, "Please select a voice."),
});

type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

// Prop type for initialization data
export interface TtsFormInitializationData {
  inputText: string;
  voiceId: string;
  key: number; // Used to force re-initialization if needed
  outputUrl?: string | null;
  dbId?: string | null;
}

export interface TtsInterfaceProps {
  formInitialValues?: TtsFormInitializationData;
  onGenerationComplete?: () => void;
}

export function TtsInterface({ formInitialValues, onGenerationComplete }: TtsInterfaceProps) {
  const { toast } = useToast();

  // --- Form Setup ---
  const form = useForm<TtsInputFormValues>({
    resolver: zodResolver(TtsInputSchema),
    defaultValues: {
      inputText: formInitialValues?.inputText || '',
      voiceId: formInitialValues?.voiceId || '',
    },
  });
  const currentInputText = form.watch('inputText');

  // --- Custom Hooks ---
  const { 
    isGenerating,
    predictionStatus, 
    audioUrl: generatedAudioUrl, // Renamed to avoid conflict with replay
    ttsErrorMessage,
    ttsPredictionDbId,
    startGeneration, 
    resetTtsState, 
    loadPrediction
  } = useTtsGeneration({ 
    onGenerationComplete 
  });
  
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
        form.setValue('voiceId', '' ); // Reset voice when loading from DAM text asset
        resetTtsState();
      }
  });

  const activeAudioUrl = generatedAudioUrl || null;
  console.log('[TtsInterface] Rendering. activeAudioUrl:', activeAudioUrl, 'generatedAudioUrl:', generatedAudioUrl); // DEBUG

  // Effect to handle form re-initialization from history
  useEffect(() => {
    if (formInitialValues) {
      console.log('[TtsInterface] Effect: formInitialValues changed.', formInitialValues); // DEBUG
      resetTtsState(); // Always reset first to clear any ongoing generation/polling
      
      form.reset({
        inputText: formInitialValues.inputText,
        voiceId: formInitialValues.voiceId,
      });

      if (formInitialValues.outputUrl && formInitialValues.dbId) {
        // If there's an output URL and dbId from the reloaded item, load it.
        loadPrediction({
          audioUrl: formInitialValues.outputUrl,
          dbId: formInitialValues.dbId,
          status: formInitialValues.outputUrl ? 'succeeded' : null // Or a specific 'loaded_from_history' status
        });
        console.log('[TtsInterface] Called loadPrediction with:', formInitialValues.outputUrl, formInitialValues.dbId);
      } else {
        // If no outputUrl, ensure everything is fully reset (resetTtsState already did most of this)
        // This branch might be redundant if resetTtsState is comprehensive enough
        console.log('[TtsInterface] No outputUrl in formInitialValues, relying on resetTtsState.');
      }
    }
  }, [formInitialValues, form, resetTtsState, loadPrediction]); // Added loadPrediction to dependencies

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
    if (!generatedAudioUrl) {
        toast({ title: 'Error', description: 'No audio generated yet.', variant: 'destructive' });
        return;
    }
    saveAudioToDam(generatedAudioUrl, ttsPredictionDbId);
  }, [generatedAudioUrl, ttsPredictionDbId, saveAudioToDam, toast]);

  // Placeholder Delete Handler
  const handleDeletePrediction = useCallback(async () => {
    if (!ttsPredictionDbId) return;
    setIsDeleting(true);
    console.log("TODO: Call delete action with ID:", ttsPredictionDbId);
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    toast({ title: "Info", description: "Delete functionality not fully implemented yet." });
    setIsDeleting(false);
  }, [ttsPredictionDbId, toast]);

  // --- Derived State ---
  const isProcessing = isGenerating || isTextActionLoading || isAudioActionLoading || isDeleting;

  // --- Render ---
  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2">
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

        <TtsOutputCard
          isLoading={isGenerating} 
          isPollingLoading={isGenerating}
          isSavingToDam={isAudioActionLoading} 
          isDeleting={isDeleting} 
          audioUrl={activeAudioUrl}
          predictionStatus={predictionStatus}
          errorMessage={ttsErrorMessage} 
          currentPredictionId={null}
          currentTtsPredictionDbId={ttsPredictionDbId} 
          onSaveToLibrary={handleSaveToLibrary} 
          onDeletePrediction={handleDeletePrediction}
        />

        <AssetSelectorModal
          open={isDamModalOpen}
          onOpenChange={setIsDamModalOpen}
          onAssetSelect={loadTextFromAsset}
        />
      </div>
    </TooltipProvider>
  );
} 