import React, { useState, useEffect } from 'react';
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

// Define the structure for a voice object
interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British' | 'Other';
}

// Minimal schema for typing props, or import from shared location
const TtsInputSchema = z.object({
  inputText: z.string(),
  voiceId: z.string(),
});
type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

interface VoiceSelectorProps {
  // Pass the specific field render prop from the FormField
  field: ControllerRenderProps<TtsInputFormValues, 'voiceId'>;
  // Pass the setValue function from the form instance
  setValue: UseFormSetValue<TtsInputFormValues>; 
  isDisabled?: boolean;
}

export function VoiceSelector({ field, setValue, isDisabled }: VoiceSelectorProps) {
  const [availableVoices, setAvailableVoices] = useState<TtsVoice[]>([]);
  const [voiceLoadingError, setVoiceLoadingError] = useState<string | null>(null);
  const [voicePopoverOpen, setVoicePopoverOpen] = useState(false);

  useEffect(() => {
    async function fetchVoices() {
      setVoiceLoadingError(null);
      try {
        const result = await getTtsVoices();
        if (result.success && result.data) {
          setAvailableVoices(result.data);
        } else {
          setVoiceLoadingError(result.error || 'Failed to load voices.');
        }
      } catch (error) {
        setVoiceLoadingError('An unexpected error occurred while fetching voices.');
        console.error('Voice fetch error:', error);
      }
    }
    fetchVoices();
  }, []);

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
          <CommandInput placeholder="Search voice..." />
          <CommandList>
            {voiceLoadingError && <CommandEmpty>{voiceLoadingError}</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length === 0 && <CommandEmpty>Loading voices...</CommandEmpty>}
            {!voiceLoadingError && availableVoices.length > 0 && (
              <CommandGroup>
                {availableVoices.map((voice) => (
                  <CommandItem
                    value={voice.name}
                    key={voice.id}
                    onSelect={() => {
                      // Use the passed setValue function
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