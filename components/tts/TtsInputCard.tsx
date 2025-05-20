import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from "@/lib/utils";
import { Loader2, Library, Save, SaveAll } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { z } from 'zod';
import { VoiceSelector } from './VoiceSelector';
import { ttsProvidersConfig, ProviderConfig } from '@/lib/config/ttsProviderConfig';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Define the structure for a voice object
interface TtsVoice {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  accent: 'American' | 'British' | 'Other';
}

// Assuming TtsInputSchema is defined elsewhere or passed implicitly via UseFormReturn type
// Re-define a simplified version for prop typing if needed, or import the original
const TtsInputSchema = z.object({
  inputText: z.string()
    .min(1, 'Input text cannot be empty.')
    .max(5000, 'Input text exceeds maximum length of 5000 characters.'),
  voiceId: z.string({ required_error: "Please select a voice." }).min(1, "Please select a voice."),
  provider: z.string({ required_error: "Please select a provider." }).min(1, "Please select a provider."),
});
type TtsInputFormValues = z.infer<typeof TtsInputSchema>;

interface TtsInputCardProps {
  form: UseFormReturn<TtsInputFormValues>;
  onSubmit: (values: TtsInputFormValues) => void;
  isProcessing: boolean; // Combined loading state
  isGenerating: boolean; // Specific state for generate button
  isTextActionLoading: boolean;
  sourceAssetId: string | null;
  originalLoadedText: string | null;
  currentInputText: string;
  handleSaveText: () => void;
  handleSaveTextAs: () => void;
  onLoadFromLibraryClick: () => void; // To open the DAM modal
}

export function TtsInputCard({ 
  form, 
  onSubmit, 
  isProcessing, 
  isGenerating,
  isTextActionLoading,
  sourceAssetId,
  originalLoadedText,
  currentInputText,
  handleSaveText,
  handleSaveTextAs,
  onLoadFromLibraryClick
}: TtsInputCardProps) {
  
  const hasTextChanged = sourceAssetId && currentInputText !== originalLoadedText;
  const selectedProvider = form.watch('provider'); // Watch the provider field

  return (
    <Card>
      <CardHeader>
        <CardTitle>Input & Configuration</CardTitle>
        <CardDescription>Enter text, select voice, or load from library.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Input Text Area */}
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
                            disabled={!sourceAssetId || isProcessing || !hasTextChanged}
                            aria-label="Save changes to loaded text asset"
                          >
                            {isTextActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                            disabled={!currentInputText || isProcessing}
                            aria-label="Save current text as new asset"
                          >
                            {isTextActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveAll className="h-4 w-4" />}
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
                            onClick={onLoadFromLibraryClick}
                            disabled={isProcessing}
                            aria-label="Load text from library"
                          >
                            {isTextActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Library className="h-4 w-4" /> }
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
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Voice Selection using the new component */}
            <FormField
              control={form.control}
              name="voiceId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Voice</FormLabel>
                  <VoiceSelector 
                    key={selectedProvider || 'no-provider'}
                    field={field} 
                    setValue={form.setValue}
                    isDisabled={isProcessing} 
                    selectedProvider={selectedProvider} // Pass the selected provider
                  />
                  {/* Add Input for manual voice ID if ElevenLabs is selected */}
                  {selectedProvider === 'elevenlabs' && (
                    <div className="mt-2">
                      <FormLabel htmlFor="manualVoiceId" className="text-xs text-muted-foreground">Manual ElevenLabs Voice ID (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          id="manualVoiceId"
                          placeholder="Enter custom ElevenLabs Voice ID"
                          {...field} // Spread field props here to connect to form.voiceId
                          disabled={isProcessing}
                          className="mt-1"
                        />
                      </FormControl>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Provider Selection */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Provider</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // When provider changes manually, clear the voiceId
                      form.setValue('voiceId', '', { shouldValidate: true }); 
                    }}
                    value={field.value}
                    disabled={isProcessing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a TTS provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ttsProvidersConfig).map(([providerKey, providerConfig]: [string, ProviderConfig]) => (
                        <SelectItem key={providerKey} value={providerKey}>
                          {providerConfig.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Submit Button */}
            <Button type="submit" disabled={isProcessing} className="w-full">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isGenerating ? 'Generating...' : 'Generate Speech'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 