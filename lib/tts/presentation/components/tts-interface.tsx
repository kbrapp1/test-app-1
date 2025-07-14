'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';
import { AssetSelectorModal } from '@/lib/dam/presentation/components/dialogs';
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTtsGeneration } from '../hooks/useTtsGeneration';
import { useTtsDamIntegration } from '../hooks/useTtsDamIntegration';
import { DamAssetManagementAdapter } from '../../infrastructure/adapters/DamAssetManagementAdapter';
import { TtsInputCard } from './TtsInputCard';
import { TtsOutputCard } from './TtsOutputCard';
import { ttsProvidersConfig } from '../../infrastructure/providers/ttsProviderConfig'; // Import provider configs

import { TextInput, VoiceId } from '../../domain';

// Validation schema using domain objects
const TtsInputSchema = z.object({
  inputText: z.string().refine(
    (text) => TextInput.isValid(text),
    (text) => ({ message: TextInput.getValidationError(text) || 'Invalid text input' })
  ),
  voiceId: z.string().refine(
    (voiceId) => VoiceId.isValid(voiceId),
    (voiceId) => ({ message: VoiceId.getValidationError(voiceId) || 'Invalid voice selection' })
  ),
  provider: z.string({ required_error: "Please select a provider." }).min(1, "Please select a provider."), // Added provider
});

type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

// Prop type for initialization data
export interface TtsFormInitializationData {
  inputText: string;
  voiceId: string;
  provider?: string; // Added provider, optional for now
  key: number; // Used to force re-initialization if needed
  outputUrl?: string | null;
  dbId?: string | null;
}

export interface TtsInterfaceProps {
  formInitialValues?: TtsFormInitializationData;
  onGenerationComplete?: () => void;
  remountKey: string | number; // Add remountKey prop
}

export function TtsInterface({ formInitialValues, onGenerationComplete, remountKey }: TtsInterfaceProps) {
  const { toast } = useToast();

  // --- Form Setup ---
  const form = useForm<TtsInputFormValues>({
    resolver: zodResolver(TtsInputSchema),
    defaultValues: {
      inputText: formInitialValues?.inputText || '',
      voiceId: formInitialValues?.voiceId || '',
      provider: formInitialValues?.provider || Object.keys(ttsProvidersConfig)[0] || '', // Default provider
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
 
    loadTextFromAsset, 
    saveTextToAsset, 
    saveTextAsNewAsset, 
    saveAudioToDam, 
  } = useTtsDamIntegration({
      onTextLoaded: (text) => {
        form.setValue('inputText', text, { shouldValidate: true });
        resetTtsState();
      },
      assetManagement: new DamAssetManagementAdapter()
  });

  const activeAudioUrl = generatedAudioUrl || null;

  // Effect to handle form re-initialization from history
  useEffect(() => {
    if (formInitialValues) {
      resetTtsState(); // Always reset first to clear any ongoing generation/polling
      
      form.reset({
        inputText: formInitialValues.inputText,
        voiceId: formInitialValues.voiceId,
        provider: formInitialValues.provider || Object.keys(ttsProvidersConfig)[0] || '', // Set provider on reset
      });

      if (formInitialValues.outputUrl && formInitialValues.dbId) {
        // If there's an output URL and dbId from the reloaded item, load it.
        loadPrediction({
          audioUrl: formInitialValues.outputUrl,
          dbId: formInitialValues.dbId,
          status: formInitialValues.outputUrl ? 'succeeded' : null // Or a specific 'loaded_from_history' status
        });
      } else {
        // If no outputUrl, ensure everything is fully reset (resetTtsState already did most of this)
        // This branch might be redundant if resetTtsState is comprehensive enough
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
    formData.append('provider', values.provider); // Append provider
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
          key={remountKey}
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
          isLoading={isGenerating} // Simplified - React Query handles all loading states
          isSavingToDam={isAudioActionLoading} 
          isDeleting={isDeleting} 
          audioUrl={activeAudioUrl}
          predictionStatus={predictionStatus || null}
          errorMessage={ttsErrorMessage} 
          currentPredictionId={null}
          currentTtsPredictionDbId={ttsPredictionDbId} 
          onSaveToLibrary={handleSaveToLibrary} 
          onDeletePrediction={handleDeletePrediction}
        />

        <AssetSelectorModal
          open={isDamModalOpen}
          onOpenChange={setIsDamModalOpen}
          onAssetSelect={(assetSummary) => {
            // Convert to AssetReference for loadTextFromAsset
            const assetReference = {
              id: assetSummary.id,
              name: assetSummary.name,
              contentType: assetSummary.mimeType,
              size: assetSummary.size,
              url: assetSummary.publicUrl
            };
            loadTextFromAsset(assetReference);
          }}
        />
      </div>
    </TooltipProvider>
  );
} 