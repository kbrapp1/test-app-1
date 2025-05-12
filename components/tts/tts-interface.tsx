'use client';

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from '@/components/ui/use-toast';
import { startSpeechGeneration, getSpeechGenerationResult, getTtsVoices, saveTtsAudioToDam } from '@/lib/actions/tts';
import { getAssetContent, updateAssetText, saveAsNewTextAsset } from '@/lib/actions/dam';
import { Loader2, Download, Play, Check, ChevronsUpDown, Library, Save, SaveAll } from 'lucide-react';
import { AssetSelectorModal } from '@/components/dam/asset-selector-modal';
import type { Asset } from '@/types/dam';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the structure for a voice object (matches backend type)
interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British' | 'Other';
}

// Update validation schema to include voiceId
const TtsInputSchema = z.object({
  inputText: z.string()
    .min(1, 'Input text cannot be empty.')
    .max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  voiceId: z.string({ required_error: "Please select a voice." }).min(1, "Please select a voice."),
});

type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

export function TtsInterface() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [predictionStatus, setPredictionStatus] = useState<string>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
  const [voicePopoverOpen, setVoicePopoverOpen] = useState(false);
  const [isDamModalOpen, setIsDamModalOpen] = useState(false);
  const [ttsPredictionDbId, setTtsPredictionDbId] = useState<string | null>(null);
  const [outputAssetId, setOutputAssetId] = useState<string | null>(null);
  const [isSavingToDam, setIsSavingToDam] = useState(false);
  const [isLoadingText, setIsLoadingText] = useState(false);
  const [sourceAssetId, setSourceAssetId] = useState<string | null>(null);
  const [isSavingText, setIsSavingText] = useState(false);
  const [originalLoadedText, setOriginalLoadedText] = useState<string | null>(null);

  const form = useForm<TtsInputFormValues>({
    resolver: zodResolver(TtsInputSchema),
    defaultValues: {
      inputText: '',
      voiceId: '',
    },
  });
  
  const currentInputText = form.watch('inputText');

  useEffect(() => {
    async function fetchVoices() {
      try {
        const result = await getTtsVoices();
        if (result.success && result.data) {
          setAvailableVoices(result.data);
        } else {
          setErrorMessage(result.error || 'Failed to load voices.');
        }
      } catch (error) {
        setErrorMessage('An unexpected error occurred while fetching voices.');
        console.error(error);
      }
    }
    fetchVoices();
  }, [form]);

  useEffect(() => {
    if (!currentPredictionId || predictionStatus === 'succeeded' || predictionStatus === 'failed' || predictionStatus === 'canceled') {
      return;
    }

    setPredictionStatus('processing');
    setIsLoading(true);
    const intervalId = setInterval(async () => {
      try {
        const result = await getSpeechGenerationResult(currentPredictionId);

        if (!result.success) {
          setErrorMessage(result.error || 'Polling failed.');
          setCurrentPredictionId(null);
          setIsLoading(false);
          setPredictionStatus('failed');
          clearInterval(intervalId);
          return;
        }

        setPredictionStatus(result.status || 'failed');

        if (result.status === 'succeeded') {
          setAudioUrl(result.audioUrl ?? null);
          setTtsPredictionDbId(result.ttsPredictionDbId ?? null);
          setOutputAssetId(null);
          setCurrentPredictionId(null);
          setIsLoading(false);
          toast({ title: 'Speech generated successfully!' });
          clearInterval(intervalId);
        } else if (result.status === 'failed' || result.status === 'canceled') {
          setErrorMessage(result.error ? JSON.stringify(result.error) : 'Prediction failed or was canceled.');
          setTtsPredictionDbId(null);
          setOutputAssetId(null);
          setCurrentPredictionId(null);
          setIsLoading(false);
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setErrorMessage('An error occurred during polling.');
        setCurrentPredictionId(null);
        setIsLoading(false);
        setPredictionStatus('failed');
        setTtsPredictionDbId(null);
        setOutputAssetId(null);
        clearInterval(intervalId);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [currentPredictionId, predictionStatus, toast]);

  const onSubmit = (values: TtsInputFormValues) => {
    setAudioUrl(null);
    setErrorMessage(null);
    setCurrentPredictionId(null);
    setTtsPredictionDbId(null);
    setOutputAssetId(null);
    setPredictionStatus('starting');
    setIsLoading(true);

    startTransition(async () => {
      const formData = new FormData();
      formData.append('inputText', values.inputText);
      formData.append('voiceId', values.voiceId);

      const result = await startSpeechGeneration(formData);

      if (result.success && result.predictionId) {
        setCurrentPredictionId(result.predictionId);
      } else {
        setErrorMessage(result.error || 'Failed to start generation.');
        setIsLoading(false);
        setPredictionStatus('idle');
      }
    });
  };

  // Handler for when an asset is selected from the DAM modal
  const handleAssetSelect = async (asset: Asset) => {
    setIsDamModalOpen(false);
    setIsLoadingText(true);
    setErrorMessage(null);
    setSourceAssetId(null);
    setOriginalLoadedText(null);
    try {
      const result = await getAssetContent(asset.id);
      if (result.success && typeof result.content === 'string') {
        form.setValue('inputText', result.content, { shouldValidate: true });
        setSourceAssetId(asset.id);
        setOriginalLoadedText(result.content);
        toast({ title: 'Content Loaded', description: `Loaded content from ${asset.name || 'asset'}.` });
      } else {
        setErrorMessage(result.error || 'Failed to load asset content.');
        toast({ title: 'Error', description: result.error || 'Failed to load asset content.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching asset content:', error);
      setErrorMessage('An unexpected error occurred while loading content.');
      toast({ title: 'Error', description: 'An unexpected error occurred while loading content.', variant: 'destructive' });
    } finally {
      setIsLoadingText(false);
    }
  };

  // Handler for saving the updated text to the original asset
  const handleSaveText = async () => {
    const currentText = form.getValues('inputText');
    if (!sourceAssetId || isSavingText || currentText === originalLoadedText) return;
    
    setIsSavingText(true);
    
    try {
      const result = await updateAssetText(sourceAssetId, currentText);
      if (result.success) {
        setOriginalLoadedText(currentText);
        toast({ title: 'Success', description: 'Text asset updated successfully.' });
      } else {
        toast({ title: 'Save Failed', description: result.error || 'Could not update text asset.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating text asset:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred while saving.', variant: 'destructive' });
    } finally {
      setIsSavingText(false);
    }
  };

  // Handler for saving the current text as a new asset
  const handleSaveTextAs = async () => {
    const currentText = form.getValues('inputText');
    if (!currentText || isSavingText) return;

    const desiredName = prompt("Enter a name for the new text asset:");
    if (!desiredName) return;

    setIsSavingText(true);

    try {
      const result = await saveAsNewTextAsset(currentText, desiredName);
      if (result.success && result.data?.newAssetId) {
        setSourceAssetId(result.data.newAssetId);
        setOriginalLoadedText(currentText);
        toast({ title: 'Success', description: `Text saved as new asset: ${desiredName}.txt` });
      } else {
        toast({ title: 'Save As Failed', description: result.error || 'Could not save text as new asset.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving text as new asset:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred during Save As.', variant: 'destructive' });
    } finally {
      setIsSavingText(false);
    }
  };

  // Handler for saving the generated audio to DAM
  const handleSaveToDam = async () => {
    if (!audioUrl || !ttsPredictionDbId) {
      toast({ title: 'Error', description: 'No audio generated or prediction ID missing.', variant: 'destructive' });
      return;
    }
    if (outputAssetId) {
      toast({ title: 'Info', description: 'Audio already saved to library.' });
      return;
    }

    setIsSavingToDam(true);
    setErrorMessage(null);

    // Simple asset name for now
    const assetName = `Generated Speech - ${new Date().toISOString()}`; 

    try {
      const result = await saveTtsAudioToDam(audioUrl, assetName, ttsPredictionDbId);

      if (result.success && result.assetId) {
        setOutputAssetId(result.assetId);
        toast({ title: 'Success', description: 'Audio saved to DAM library.' });
      } else {
        setErrorMessage(result.error || 'Failed to save audio to DAM.');
        toast({ title: 'Save Failed', description: result.error || 'Could not save audio to DAM.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving to DAM:', error);
      setErrorMessage('An unexpected error occurred while saving.');
      toast({ title: 'Error', description: 'An unexpected error occurred while saving.', variant: 'destructive' });
    } finally {
      setIsSavingToDam(false);
    }
  };

  // Add this new function to handle downloads properly
  const handleDownload = async () => {
    if (!audioUrl || effectiveIsLoading || isSavingToDam) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Failed to fetch audio file');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `generated-speech-${new Date().toISOString().slice(0, 10)}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Download Failed', description: 'Could not download audio file.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveIsLoading = isLoading || isPending;
  const anyTextActionLoading = isSavingText || isLoadingText;
  const hasTextChanged = sourceAssetId && currentInputText !== originalLoadedText;

  return (
    <TooltipProvider>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input & Configuration</CardTitle>
            <CardDescription>Enter your text and select a voice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="inputText"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-1">
                        <FormLabel>Text to Convert</FormLabel>
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSaveText}
                                disabled={!sourceAssetId || isSavingText || effectiveIsLoading || isLoadingText || !hasTextChanged}
                                aria-label="Save changes to loaded text asset"
                              >
                                {isSavingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{!sourceAssetId ? "Load text first" : !hasTextChanged ? "No changes to save" : "Save Text"}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleSaveTextAs}
                                disabled={!currentInputText || isSavingText || effectiveIsLoading || isLoadingText}
                                aria-label="Save current text as new asset"
                              >
                                {isSavingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveAll className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{!currentInputText ? "Enter text first" : "Save Text As..."}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setIsDamModalOpen(true)}
                                disabled={effectiveIsLoading || isLoadingText || isSavingText}
                                aria-label="Load text from library"
                              >
                                {isLoadingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" /> }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Load from Library</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Enter the text you want to convert to speech..."
                          rows={8}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="voiceId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Voice</FormLabel>
                      <Popover open={voicePopoverOpen} onOpenChange={setVoicePopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={voicePopoverOpen}
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? availableVoices.find(
                                    (voice) => voice.id === field.value
                                  )?.name
                                : "Select a voice"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search voice..." />
                            <CommandList>
                              <CommandEmpty>No voice found.</CommandEmpty>
                              <CommandGroup>
                                {availableVoices.map((voice) => (
                                  <CommandItem
                                    value={voice.name}
                                    key={voice.id}
                                    onSelect={() => {
                                      form.setValue("voiceId", voice.id);
                                      setVoicePopoverOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        voice.id === field.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {voice.name} ({voice.gender}, {voice.accent})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={effectiveIsLoading} className="w-full">
                  {effectiveIsLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {effectiveIsLoading ? 'Generating...' : 'Generate Speech'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* DAM Asset Selector Modal */}
        <AssetSelectorModal
          open={isDamModalOpen}
          onOpenChange={setIsDamModalOpen}
          onAssetSelect={handleAssetSelect}
        />

        {/* Output Card */}
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>Listen to the generated speech.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {effectiveIsLoading && predictionStatus !== 'succeeded' && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Generating speech... ({predictionStatus})</span>
              </div>
            )}
            {errorMessage && (
              <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md">
                Error: {errorMessage}
              </div>
            )}
            {audioUrl && (
              <div className="space-y-2">
                <Label>Generated Audio:</Label>
                <audio controls src={audioUrl} className="w-full">
                  Your browser does not support the audio element.
                </audio>
                {/* Button Row: Apply flex, allow wrapping, and justify to the end */}
                <div className="flex flex-wrap justify-end gap-2 pt-2"> 
                  <Button 
                    onClick={handleDownload} 
                    variant="outline" 
                    disabled={effectiveIsLoading || isSavingToDam}
                    className="flex-grow sm:flex-grow-0" // Grow on small screens, not on larger
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleSaveToDam} 
                    variant="outline" 
                    disabled={isSavingToDam || effectiveIsLoading || !!outputAssetId}
                    className="flex-grow sm:flex-grow-0" // Grow on small screens, not on larger
                  >
                    {isSavingToDam ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {outputAssetId ? 'Saved to Library' : 'Save to Library'}
                  </Button>
                </div>
              </div>
            )}
            {!effectiveIsLoading && !audioUrl && !errorMessage && (
              <div className="text-center text-muted-foreground p-8">
                Generate speech to see the output here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
} 