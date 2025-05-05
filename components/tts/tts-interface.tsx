'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
import { startSpeechGeneration, getSpeechGenerationResult, getTtsVoices } from '@/lib/actions/tts';
import { Loader2, Download, Play, Check, ChevronsUpDown } from 'lucide-react';

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

  const form = useForm<TtsInputFormValues>({
    resolver: zodResolver(TtsInputSchema),
    defaultValues: {
      inputText: '',
      voiceId: '',
    },
  });

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
          setAudioUrl(result.outputUrl ?? null);
          setCurrentPredictionId(null);
          setIsLoading(false);
          toast({ title: 'Speech generated successfully!' });
          clearInterval(intervalId);
        } else if (result.status === 'failed' || result.status === 'canceled') {
          setErrorMessage(result.error ? JSON.stringify(result.error) : 'Prediction failed or was canceled.');
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
        clearInterval(intervalId);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [currentPredictionId, predictionStatus, toast]);

  const onSubmit = (values: TtsInputFormValues) => {
    setAudioUrl(null);
    setErrorMessage(null);
    setCurrentPredictionId(null);
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

  const effectiveIsLoading = isLoading || isPending;

  return (
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
                    <FormLabel>Text to Convert</FormLabel>
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

      <Card>
        <CardHeader>
          <CardTitle>Result</CardTitle>
          <CardDescription>Generated audio will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[200px] flex-col items-center justify-center">
          {effectiveIsLoading && (
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{predictionStatus === 'starting' ? 'Initializing...' : 'Generating audio...'}</p>
            </div>
          )}
          {errorMessage && (
             <div className="text-center text-destructive">
                <p>Error: {errorMessage}</p>
             </div>
          )}
           {!effectiveIsLoading && !errorMessage && !audioUrl && predictionStatus === 'idle' && (
            <p className="text-muted-foreground">Enter text and select a voice to generate speech.</p>
           )}
           {!effectiveIsLoading && !errorMessage && audioUrl && (
            <div className="w-full space-y-4">
                <audio controls src={audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
                <Button variant="outline" size="sm" onClick={() => window.open(audioUrl, '_blank')} >
                   <Download className="mr-2 h-4 w-4" />
                   Download Audio
                 </Button>
            </div>
           )}
           {!effectiveIsLoading && !errorMessage && !audioUrl && (predictionStatus === 'failed' || predictionStatus === 'canceled') && (
             <p className="text-center text-muted-foreground">Generation failed or was canceled.</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
} 