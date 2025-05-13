'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Download, Save, AlertCircleIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { saveAs } from 'file-saver';

interface TtsOutputCardProps {
  audioUrl: string | null;
  predictionStatus: string;
  isLoading: boolean;
  isPollingLoading: boolean;
  isSavingToDam: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  currentPredictionId: string | null;
  currentTtsPredictionDbId: string | null;
  onSaveToLibrary: () => void;
  onDeletePrediction: () => void;
}

export function TtsOutputCard({ 
  audioUrl, 
  predictionStatus, 
  isLoading,
  isPollingLoading,
  isSavingToDam,
  isDeleting,
  errorMessage,
  currentPredictionId,
  currentTtsPredictionDbId,
  onSaveToLibrary,
  onDeletePrediction
}: TtsOutputCardProps) {
  const { toast } = useToast();

  const handleDownloadClick = async () => {
    if (!audioUrl) return;
    try {
      // Use file-saver for more reliable downloads, especially for cross-origin URLs
      saveAs(audioUrl, `tts_output_${currentPredictionId || Date.now()}.mp3`);
      toast({
        title: "Download Started",
        description: "Your audio file is downloading.",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download the audio file.",
      });
    }
  };

  const handleCopyToClipboard = () => {
    if (!audioUrl) return;
    navigator.clipboard.writeText(audioUrl).then(() => {
      toast({ title: "Success", description: "Audio URL copied to clipboard!" });
    }).catch(err => {
      toast({ variant: "destructive", title: "Error", description: "Could not copy URL to clipboard." });
    });
  };

  const showLoadingState = isLoading || isPollingLoading;
  const hasAudio = !!audioUrl && (predictionStatus === 'succeeded' || predictionStatus === 'processing_succeeded_locally');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Results</CardTitle>
        <CardDescription>
          Generated audio output. You can play, download, or save it to your DAM.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[180px] flex items-center justify-center">
        {showLoadingState && predictionStatus !== 'failed' && (
          <div className="text-center">
            <p className="text-lg font-semibold animate-pulse">
              {predictionStatus === 'starting' && 'Starting generation...'}
              {predictionStatus === 'processing' && 'Processing audio...'}
              {isLoading && !currentPredictionId && 'Initializing...'}
              {isPollingLoading && currentPredictionId && 'Fetching results...'}
            </p>
            <p className="text-sm text-muted-foreground">Please wait.</p>
          </div>
        )}
        {!showLoadingState && errorMessage && (
          <Alert variant="destructive" className="w-full">
            <AlertCircleIcon className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        {!showLoadingState && !errorMessage && !hasAudio && (
          <div className="text-center text-muted-foreground">
            <p>Your generated audio will appear here.</p>
          </div>
        )}
        {!showLoadingState && !errorMessage && hasAudio && (
          <WaveformAudioPlayer audioUrl={audioUrl} />
        )}
      </CardContent>
      {hasAudio && !errorMessage && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-0 flex-wrap items-center">
          <Button 
            variant="outline" 
            onClick={handleCopyToClipboard} 
            disabled={showLoadingState || isSavingToDam || isDeleting}
          >
            <CopyIcon className="mr-2 h-4 w-4" /> Copy URL
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadClick} 
            disabled={showLoadingState || isSavingToDam || isDeleting}
          >
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button 
            onClick={onSaveToLibrary} 
            disabled={showLoadingState || isSavingToDam || isDeleting || !currentTtsPredictionDbId}
            title={!currentTtsPredictionDbId ? "Audio must be fully processed before saving" : "Save to Digital Asset Library"}
          >
            {isSavingToDam ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save to Library
              </>
            )}
          </Button>
          {currentTtsPredictionDbId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={showLoadingState || isSavingToDam || isDeleting}
                >
                  <Trash2Icon className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will delete the generated audio prediction. If the audio has been saved to the DAM, that saved asset will NOT be deleted by this action. This only deletes the TTS prediction record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDeletePrediction} disabled={isDeleting}>
                    {isDeleting ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                       </>
                    ) : "Delete Prediction"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardFooter>
      )}
    </Card>
  );
} 