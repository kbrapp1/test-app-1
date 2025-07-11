'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Save, AlertCircleIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TtsOutputCardProps {
  audioUrl: string | null;
  predictionStatus: string | null;
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
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    setPlaybackError(null);
  }, [audioUrl]);

  const handleDownloadClick = async () => {
    if (!audioUrl) return;
    try {
      saveAs(audioUrl, `tts_output_${currentTtsPredictionDbId || currentPredictionId || Date.now()}.mp3`);
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
    }).catch(() => {
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
              {(isLoading && (!predictionStatus || predictionStatus === 'starting')) && 'Initializing...'}
              {isPollingLoading && currentPredictionId && predictionStatus !== 'starting' && 'Fetching results...'}
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
          <WaveformAudioPlayer 
            audioUrl={audioUrl} 
            onPlaybackError={setPlaybackError}
          />
        )}
      </CardContent>
      {hasAudio && !errorMessage && (
        <CardFooter className="flex flex-row justify-end gap-2 pt-0 -mt-4 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyToClipboard} 
                  disabled={showLoadingState || isSavingToDam || isDeleting || !!playbackError}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy URL</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleDownloadClick} 
                  disabled={showLoadingState || isSavingToDam || isDeleting || !!playbackError}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon"
                  onClick={onSaveToLibrary} 
                  disabled={showLoadingState || isSavingToDam || isDeleting || !currentTtsPredictionDbId || !!playbackError}
                >
                  {isSavingToDam ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSavingToDam ? "Saving..." : "Save to Library"}</p>
              </TooltipContent>
            </Tooltip>

            {currentTtsPredictionDbId && (
              <AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        disabled={showLoadingState || isSavingToDam || isDeleting || !!playbackError}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2Icon className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete</p>
                  </TooltipContent>
                </Tooltip>
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
                      {isDeleting ? "Deleting..." : "Delete Prediction"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </TooltipProvider>
        </CardFooter>
      )}
    </Card>
  );
} 