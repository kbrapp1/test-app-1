'use client';

import React, { useRef, useCallback } from 'react';
import { Button } from './button';
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Loader2Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { useWaveSurfer } from './useWaveSurfer';

interface WaveformAudioPlayerProps {
  audioUrl: string | null;
  isLikelyExpired?: boolean;
  onPlaybackError?: (errorMessage: string) => void;
}

// Helper function to format time (MM:SS)
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function WaveformAudioPlayer({ audioUrl, isLikelyExpired, onPlaybackError }: WaveformAudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    handlePlayPause,
    handleSeek,
  } = useWaveSurfer({
    waveformRef,
    audioUrl,
    isLikelyExpired,
    onPlaybackErrorProp: onPlaybackError,
  });

  const sliderValue = duration > 0 ? [(currentTime / duration) * 100] : [0];

  return (
    <div className="flex flex-col items-center w-full pt-4 pb-0 rounded-md border bg-background">
      <div ref={waveformRef} className="w-full h-[64px] px-4 mb-4" />

      {(error || (isLikelyExpired && !isLoading)) && (
        <p className="text-sm text-destructive w-full text-center px-4 py-2 mb-4">
          {isLikelyExpired && !error ? "Audio link has likely expired and cannot be played." : `Error: ${error}`}
        </p>
      )}

      {!error && !isLikelyExpired && (
        <div className="flex items-center gap-4 w-full px-4 py-1 bg-muted border-t">
          <Button 
            onClick={handlePlayPause} 
            variant="ghost"
            size="icon" 
            disabled={isLoading || !!error || isLikelyExpired || (!audioUrl && !isLikelyExpired)}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex-shrink-0"
          >
            {isLoading && audioUrl ? (
              <Loader2Icon className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>

          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-[45px] text-right">
            {formatTime(currentTime)}
          </span>

          <Slider
            value={sliderValue}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading || !!error || duration <= 0 || isLikelyExpired || !audioUrl}
            className="flex-grow mx-2 cursor-pointer"
            aria-label="Audio Seek Bar"
          />
 
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-[45px]">
            {formatTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
} 