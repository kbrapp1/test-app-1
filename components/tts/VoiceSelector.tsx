import React, { useState, useEffect, useRef } from 'react';
import { UseFormReturn, ControllerRenderProps, UseFormSetValue } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FormControl } from '@/components/ui/form'; // Import FormControl
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from 'lucide-react';
import { getTtsVoices } from '@/lib/actions/tts';
import { z } from 'zod';
import { REPLICATE_MODELS } from '@/lib/config/ttsProviderConfig'; // <-- Import REPLICATE_MODELS
import { Input } from "@/components/ui/input"; // Import Input for the search field

// Define the structure for a voice object
interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Other';
  accent: 'American' | 'British' | 'Other';
}

// Updated schema to match the one in TtsInputCard
const TtsInputSchema = z.object({
  inputText: z.string(),
  voiceId: z.string(),
  provider: z.string(), // Added provider to match the form's full schema
});
type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

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
  const prevProviderRef = useRef<string | undefined>(undefined); // Ref to store the previous provider
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
        
        console.log(`VoiceSelector: Fetching voices for provider: ${selectedProvider}, model: ${modelIdToPass || 'N/A'}`);
        const result = await getTtsVoices(selectedProvider, modelIdToPass);
        if (result.success && result.data) {
          // Sort voices alphabetically by name before setting them
          const sortedVoices = [...result.data].sort((a, b) => a.name.localeCompare(b.name));
          setAvailableVoices(sortedVoices);
          if (sortedVoices.length === 0 && !result.error) {
            setVoiceLoadingError(`No voices available for provider: ${selectedProvider}`);
          } else if (result.error) {
            let errorMessage = 'Unknown error';
            if (typeof result.error === 'string') {
              errorMessage = result.error;
            } else if (result.error && typeof (result.error as any).message === 'string') {
              errorMessage = (result.error as any).message;
            }
            setVoiceLoadingError(errorMessage);
          }
        } else {
          let errorMessage = `Failed to load voices for ${selectedProvider}.`;
          if (result.error) {
            if (typeof result.error === 'string') {
              errorMessage = result.error;
            } else if (typeof (result.error as any).message === 'string') {
              errorMessage = (result.error as any).message;
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

  const filteredVoices = availableVoices.filter(voice => 
    voice.name.toLowerCase().includes(voiceSearchTerm.toLowerCase())
  );

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
              ? availableVoices.find((voice) => voice.id === field.value)?.name ?? "Select a voice"
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
            {!voiceLoadingError && filteredVoices.length === 0 && voiceSearchTerm && <CommandEmpty>No voices match "{voiceSearchTerm}".</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length > 0 && filteredVoices.length === 0 && !voiceSearchTerm && <CommandEmpty>No voices available.</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length === 0 && !voiceSearchTerm && <CommandEmpty>Loading voices...</CommandEmpty>}
            {filteredVoices.length > 0 && (
              <CommandGroup>
                {filteredVoices.map((voice) => (
                  <CommandItem
                    value={voice.name}
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
                    {voice.name} ({voice.gender}, {voice.accent})
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