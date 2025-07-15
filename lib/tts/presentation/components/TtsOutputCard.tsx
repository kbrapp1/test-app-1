'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Save, AlertCircleIcon, CopyIcon, Trash2Icon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { WaveformAudioPlayer } from "@/components/ui/waveform-audio-player";
import { saveAs } from 'file-saver';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TtsOutputCardProps {
  audioUrl: string | null;
  predictionStatus: string | null;
  isLoading: boolean; // Single loading state - React Query handles this
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
  isLoading, // Simplified - React Query handles polling vs initial loading
  isSavingToDam,
  isDeleting,
  errorMessage,
  currentPredictionId,
  currentTtsPredictionDbId,
  onSaveToLibrary,
  onDeletePrediction
}: TtsOutputCardProps) {
  const { toast } = useToast();
  const [_playbackError, setPlaybackErrorState] = useState<string | null>(null);

  const setPlaybackError = useCallback((error: string | null) => {
    setPlaybackErrorState(error);
  }, []);

  useEffect(() => {
    setPlaybackError(null);
  }, [audioUrl, setPlaybackError]);

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

  const showLoadingState = isLoading; // Simplified
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
              {isLoading && currentPredictionId && predictionStatus !== 'starting' && 'Fetching results...'}
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
      <CardFooter className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownloadClick}
                disabled={!hasAudio || isDeleting}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download Audio</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyToClipboard}
                disabled={!hasAudio || isDeleting}
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy URL</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSaveToLibrary}
                disabled={!hasAudio || isSavingToDam || isDeleting}
              >
                {isSavingToDam ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save to DAM</p>
            </TooltipContent>
          </Tooltip>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!hasAudio || isDeleting || isSavingToDam}
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2Icon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Prediction</p>
                </TooltipContent>
              </Tooltip>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the prediction.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDeletePrediction}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
} 