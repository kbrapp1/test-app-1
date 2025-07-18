import React, { useState, useEffect } from 'react';
import { ControllerRenderProps, UseFormSetValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from '@/components/ui/form'; // Import FormControl
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from 'lucide-react';
import { getTtsVoices } from '../actions/tts';
import { REPLICATE_MODELS } from '../../infrastructure/providers/ttsProviderConfig'; // <-- Import REPLICATE_MODELS
import { Input } from "@/components/ui/input"; // Import Input for the search field

import { VoiceId, type TtsVoice } from '../../domain';

// Updated schema to match the one in TtsInputCard
type TtsInputFormValues = {
  inputText: string;
  voiceId: string;
  provider: string;
};

interface VoiceSelectorProps {
  field: ControllerRenderProps<TtsInputFormValues, 'voiceId'>;
  setValue: UseFormSetValue<TtsInputFormValues>; 
  isDisabled?: boolean;
  selectedProvider?: string; // New prop for the currently selected provider
}

export function VoiceSelector({ field, setValue, isDisabled, selectedProvider }: VoiceSelectorProps) {
  const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
  const [voiceLoadingError, setVoiceLoadingError] = useState<string | null>(null);
  const [voicePopoverOpen, setVoicePopoverOpen] = useState(false);
  const [voiceSearchTerm, setVoiceSearchTerm] = useState(""); // State for voice search

  useEffect(() => {
    async function fetchVoices() {
      setVoiceLoadingError(null);
      setAvailableVoices([]);
      setVoiceSearchTerm(""); // Reset search term when provider changes
      if (!selectedProvider) {
        setVoiceLoadingError('Please select a TTS provider first to see available voices.');
        return;
      }
      try {
        let modelIdToPass: string | undefined = undefined;
        if (selectedProvider === 'replicate') {
          // Assuming Kokoro is the default/only Replicate model for now
          // In a more advanced setup, you might have a model selector for Replicate
          modelIdToPass = REPLICATE_MODELS.KOKORO_82M;
        }
        
    
        const result = await getTtsVoices(selectedProvider, modelIdToPass);
        if (result.success && result.voices) {
          // Use VoiceId domain logic for sorting
          const sortedVoices = VoiceId.sortVoices(result.voices as TtsVoice[]);
          setAvailableVoices(sortedVoices);
          if (sortedVoices.length === 0 && !result.error) {
            setVoiceLoadingError(`No voices available for provider: ${selectedProvider}`);
          } else if (result.error) {
            let errorMessage = 'Unknown error';
            if (typeof result.error === 'string') {
              errorMessage = result.error;
            } else if (result.error && typeof result.error === 'object' && result.error !== null && 'message' in result.error && typeof (result.error as { message: string }).message === 'string') {
              errorMessage = (result.error as { message: string }).message;
            }
            setVoiceLoadingError(errorMessage);
          }
        } else {
          let errorMessage = `Failed to load voices for ${selectedProvider}.`;
          if (result.error) {
            if (typeof result.error === 'string') {
              errorMessage = result.error;
            } else if (typeof result.error === 'object' && result.error !== null && 'message' in result.error && typeof (result.error as { message: string }).message === 'string') {
              errorMessage = (result.error as { message: string }).message;
            }
          }
          setVoiceLoadingError(errorMessage);
        }
      } catch (error) {
        let errorMessage = 'An unexpected error occurred while fetching voices.';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        setVoiceLoadingError(errorMessage);
        console.error('Voice fetch error:', error);
      }
    }
    fetchVoices();
  }, [selectedProvider]); // Depend on selectedProvider to refetch

  // Use VoiceId domain logic for filtering
  const filteredVoices = VoiceId.filterVoices(availableVoices, {
    searchTerm: voiceSearchTerm
  });

  return (
    <Popover open={voicePopoverOpen} onOpenChange={setVoicePopoverOpen}>
      <PopoverTrigger asChild>
        {/* Use FormControl here as expected by FormField */}
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={voicePopoverOpen}
            disabled={isDisabled}
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? (() => {
                  const voice = availableVoices.find((voice) => voice.id === field.value);
                  return voice ? VoiceId.fromVoice(voice).forDisplay : "Select a voice";
                })()
              : "Select a voice"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <div className="p-2">
            <Input
              placeholder="Search voice..."
              value={voiceSearchTerm}
              onChange={(e) => setVoiceSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <CommandList>
            {voiceLoadingError && <CommandEmpty>{voiceLoadingError}</CommandEmpty>}
            {!voiceLoadingError && filteredVoices.length === 0 && voiceSearchTerm && <CommandEmpty>No voices match &quot;{voiceSearchTerm}&quot;.</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length > 0 && filteredVoices.length === 0 && !voiceSearchTerm && <CommandEmpty>No voices available.</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length === 0 && !voiceSearchTerm && <CommandEmpty>Loading voices...</CommandEmpty>}
            {filteredVoices.length > 0 && (
              <CommandGroup>
                {filteredVoices.map((voice) => (
                  <CommandItem
                    value={voice.id}
                    key={voice.id}
                    onSelect={() => {
                      setValue("voiceId", voice.id, { shouldValidate: true });
                      setVoicePopoverOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        voice.id === field.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {VoiceId.fromVoice(voice).forDisplay}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 