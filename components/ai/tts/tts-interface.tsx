import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { startSpeechGeneration, getSpeechGenerationResult, getTtsVoices } from "@/lib/actions/tts";
import { getAssetContent, listTextAssets } from '@/lib/actions/dam'; // <-- Import getAssetContent
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Loader2, LibraryIcon, SaveIcon } from "lucide-react"; // <-- Add LibraryIcon and SaveIcon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from "@/components/ui/command"
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast"; // <-- Import useToast
import { AssetSelectorModal } from "@/components/dam/asset-selector-modal"; // <-- Import the modal
import { Label } from '@/components/ui/label'; // Add Label import
import { saveTtsAudioToDam } from '@/lib/actions/tts'; // Import the save action
import { Input } from '@/components/ui/input'; // Import Input
import { Asset } from '@/types/dam'; // Import the correct Asset type from the correct path
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ... (keep existing Voice type and TtsInputSchema)

type Voice = {
    id: string;
    name: string;
    // Add other relevant fields like gender, accent if provided by getTtsVoices
};

const TtsInputSchema = z.object({
    inputText: z.string().min(1, "Text cannot be empty.").max(5000, "Text cannot exceed 5000 characters."), // Example max length
    voiceId: z.string({ required_error: "Please select a voice."}).min(1, "Please select a voice."),
});

type TtsInput = z.infer<typeof TtsInputSchema>;

type PredictionStatus = 'idle' | 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';

// Type for storing prediction result details
interface PredictionResult {
  status: string | null;
  audioUrl: string | null;
  error: string | null;
  ttsPredictionDbId?: string | null; // Add DB ID
}

type StartPredictionResult = {
    success: boolean;
    predictionId?: string;
    error?: string;
    errors?: Record<string, string[]>; // For validation errors
};

type AssetContentResult = {
    success: boolean;
    content?: string;
    error?: string;
};

export function TtsInterface() {
    const { toast } = useToast();
    const [voices, setVoices] = useState<Voice[]>([]);
    // Consolidated state for prediction results
    const [predictionResult, setPredictionResult] = useState<PredictionResult>({
        status: null, 
        audioUrl: null, 
        error: null, 
        ttsPredictionDbId: null 
    });
    // State for the Asset Selector Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    // State for the asset name input when saving
    const [assetName, setAssetName] = useState(''); 
    
    // Transitions for different async states
    const [isGenerating, startGenerationTransition] = useTransition(); // Form submit -> Start Polling
    const [isPolling, startPollingTransition] = useTransition();      // Status check calls
    const [isSaving, startSaveTransition] = useTransition();         // Saving audio to DAM

    // Refs for polling control and Replicate ID
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const replicatePredictionIdRef = useRef<string | null>(null);

    const form = useForm<TtsInput>({
        resolver: zodResolver(TtsInputSchema),
        defaultValues: {
            inputText: "",
            voiceId: "",
        },
    });

    // Fetch voices on component mount
    useEffect(() => {
        async function fetchVoices() {
            const result = await getTtsVoices();
            if (result.success && result.data) {
                setVoices(result.data);
                if (result.data.length > 0) {
                    form.setValue('voiceId', result.data[0].id);
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not fetch voices.' });
            }
        }
        fetchVoices();
    }, [toast, form]);

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    // Function to stop polling
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log('Polling stopped.');
        }
    }, []);

    // Function to check prediction status
    const checkStatus = useCallback((predictionId: string) => {
        startPollingTransition(async () => {
            try {
                console.log(`Polling status for ${predictionId}...`);
                const result = await getSpeechGenerationResult(predictionId);
                const status = result.status;

                // Check if polling should have stopped *before* updating state
                if (!pollingIntervalRef.current && status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
                    console.log('Polling stopped prematurely, discarding intermediate status update.');
                    return; 
                }

                // Update the single result state object
                setPredictionResult({ 
                    status: status, 
                    audioUrl: result.audioUrl, 
                    error: result.error, 
                    ttsPredictionDbId: result.ttsPredictionDbId 
                });

                if (result.success && result.audioUrl) {
                    // Success!
                    stopPolling();
                    toast({ title: 'Speech Generated!', description: 'Audio is ready.' });
                } else if (!result.success || status === 'failed' || status === 'canceled') {
                    // Permanent error or failed/canceled state
                    stopPolling();
                    toast({ 
                        variant: 'destructive', 
                        title: status ? `Generation ${status}` : 'Generation Failed', 
                        description: result.error || 'Polling failed or job ended unsuccessfully.' 
                    });
                } 
                // If still processing, the state is updated, and the interval continues

            } catch (error: any) {
                console.error('Error in checkStatus:', error);
                stopPolling();
                setPredictionResult({ 
                    status: 'failed', 
                    audioUrl: null, 
                    error: error?.message || 'An error occurred while checking status.', 
                    ttsPredictionDbId: null
                });
                toast({ variant: 'destructive', title: 'Polling Error', description: error?.message || 'Could not get status.' });
            }
        });
    }, [stopPolling, toast, startPollingTransition]); // Include polling transition hook

    // Handle form submission to start generation
    const onSubmit = (data: TtsInput) => {
        console.log("Form submitted:", data);
        stopPolling(); // Clear any previous polling
        // Reset state for a new generation attempt
        setPredictionResult({ status: 'starting', audioUrl: null, error: null, ttsPredictionDbId: null }); 
        setAssetName(''); 
        replicatePredictionIdRef.current = null;

        startGenerationTransition(async () => {
            const formData = new FormData();
            formData.append('inputText', data.inputText);
            formData.append('voiceId', data.voiceId);

            const result = await startSpeechGeneration(formData);

            if (result.success && result.predictionId) {
                toast({ title: 'Generation Started', description: `Checking status...` });
                replicatePredictionIdRef.current = result.predictionId;
                setPredictionResult(prev => ({ ...prev, status: 'processing' })); 
                // Initial check immediately, then start interval
                checkStatus(result.predictionId);
                pollingIntervalRef.current = setInterval(() => {
                    if (replicatePredictionIdRef.current) {
                        checkStatus(replicatePredictionIdRef.current);
                    }
                }, 3000); // Poll every 3 seconds
            } else {
                const errorMsg = result.error || 'Failed to start generation.';
                toast({ variant: 'destructive', title: 'Error', description: errorMsg });
                setPredictionResult({ status: 'failed', audioUrl: null, error: errorMsg, ttsPredictionDbId: null });
            }
        });
    };
    
    // Handle loading text from DAM asset
    const handleAssetSelect = async (asset: Asset) => {
        console.log('Asset selected:', asset.id, asset.name);
        setIsModalOpen(false); // Close modal
        try {
            const result = await getAssetContent(asset.id);
            if (result.success && result.content) {
                form.setValue('inputText', result.content, { shouldValidate: true });
                toast({ title: 'Content Loaded', description: `Loaded text from ${asset.name}` });
            } else {
                toast({ variant: 'destructive', title: 'Error Loading Content', description: result.error || 'Could not load asset content.' });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch asset content.' });
        }
    };

    // Handle saving the generated audio to the DAM
    const handleSaveToLibrary = () => {
        // Read directly from the predictionResult state
        const currentAudioUrl = predictionResult.audioUrl;
        const currentDbId = predictionResult.ttsPredictionDbId;
        const currentAssetName = assetName.trim();

        if (!currentAudioUrl || !currentDbId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Audio data or Prediction ID missing.' });
            return;
        }
        if (!currentAssetName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a name for the asset.' });
            return;
        }

        startSaveTransition(async () => {
            toast({ title: 'Saving audio to library...' });
            const result = await saveTtsAudioToDam(currentAudioUrl, currentAssetName, currentDbId);

            if (result.success && result.assetId) {
                toast({ title: 'Success!', description: `Audio saved as asset ${result.assetId}.` });
                setAssetName(''); // Clear input on success
                // Reset prediction status to hide save section after successful save
                setPredictionResult(prev => ({ ...prev, status: 'idle', audioUrl: null, ttsPredictionDbId: null })); 
            } else {
                toast({ variant: 'destructive', title: 'Save Failed', description: result.error || 'Could not save audio to DAM.' });
            }
        });
    };

    // --- Render Logic ---
    let resultsSection = null;
    // Define loading based on generation or active polling 
    const isLoading = isGenerating || (isPolling && (predictionResult.status === 'processing' || predictionResult.status === 'starting')); 

    // Show loading indicator
    if (isLoading) {
        resultsSection = (
            <div className="mt-6 flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{`Status: ${predictionResult.status}...`}</span>
            </div>
        );
    }
    // Show error message (only if not loading)
    else if (predictionResult.status === 'failed' && predictionResult.error) { 
        resultsSection = (
            <div className="mt-6 text-red-600">
                <p><strong>Error:</strong> {predictionResult.error}</p>
            </div>
        );
    }
    // Show audio player and save section if generation succeeded (and not loading)
    else if (predictionResult.status === 'succeeded' && predictionResult.audioUrl) { 
        resultsSection = (
            <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Result</h3>
                <audio controls src={predictionResult.audioUrl} className="w-full">
                    Your browser does not support the audio element.
                </audio>
                {/* Asset Name Input and Save Button */}
                <div className="flex items-end space-x-2 pt-2">
                    <div className="flex-grow space-y-1">
                        <Label htmlFor="assetName">Save as:</Label>
                        <Input 
                            id="assetName"
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            placeholder="Enter asset name..."
                            disabled={isSaving} // Disable input while saving
                        />
                    </div>
                    <Button 
                        onClick={handleSaveToLibrary}
                        disabled={isSaving || !assetName.trim()} // Disable button while saving or if name is empty
                        size="sm" // Consistent size
                    >
                        {isSaving ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            <SaveIcon className="mr-2 h-4 w-4" /> 
                        )}
                        Save to Library
                    </Button>
                </div>
            </div>
        );
    }

    // Main component render
    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    {/* Input Text Area */}
                    <FormField
                        control={form.control}
                        name="inputText"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Text to Convert</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter the text you want to convert to speech..."
                                        className="resize-y min-h-[150px]"
                                        {...field}
                                        disabled={isGenerating || isPolling} // Disable form fields while processing
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="flex flex-col sm:flex-row sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                        {/* Voice Selection */}
                        <FormField
                            control={form.control}
                            name="voiceId"
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormLabel>Voice</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isGenerating || isPolling}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a voice" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {voices.map((voice) => (
                                                <SelectItem key={voice.id} value={voice.id}>
                                                    {voice.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         {/* Load from Library Button */}
                        <div className="flex-shrink-0">
                            <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setIsModalOpen(true)} 
                                disabled={isGenerating || isPolling} // Disable while generating/polling
                            >
                                <LibraryIcon className="mr-2 h-4 w-4" />
                                Load from Library
                            </Button>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button type="submit" disabled={isGenerating || isPolling}>
                        {(isGenerating || isPolling) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Speech
                    </Button>
                </form>
            </Form>

            {/* Results Section */}
            {resultsSection}
            
            {/* Asset Selector Modal */}
            <AssetSelectorModal 
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onAssetSelect={handleAssetSelect}
            />
        </div>
    );
} 