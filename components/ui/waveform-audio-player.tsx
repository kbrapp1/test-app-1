'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from './button';
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Loader2Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';

interface WaveformAudioPlayerProps {
  audioUrl: string | null;
}

// Helper function to format time (MM:SS)
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function WaveformAudioPlayer({ audioUrl }: WaveformAudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  // Add volume state later if needed
  // const [volume, setVolume] = useState(1);
  // const [isMuted, setIsMuted] = useState(false);

  const handlePlayPause = useCallback(() => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (wavesurfer.current && duration > 0) {
      const newTime = (value[0] / 100) * duration;
      wavesurfer.current.seekTo(value[0] / 100);
      // wavesurfer.current.setTime(newTime); // setTime might be more direct depending on version
      setCurrentTime(newTime); // Optimistically update state
    }
  }, [duration]);

  useEffect(() => {
    if (!waveformRef.current) return;

    // If audioUrl is null, destroy any existing instance and clear states
    if (!audioUrl) {
      if (wavesurfer.current) {
        console.log('[WaveformPlayer] audioUrl is null. Destroying existing instance.');
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
      setIsLoading(false);
      setIsPlaying(false);
      setError(null);
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    console.log('[WaveformPlayer] Effect run. Initializing for URL:', audioUrl);
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Function to contain WaveSurfer initialization logic
    const initializeWaveSurfer = (url: string) => {
      if (!waveformRef.current) {
        // This check might be redundant if the top-level check in useEffect is sufficient,
        // but good for safety if initializeWaveSurfer could be called from elsewhere.
        console.warn('[WaveformPlayer] initializeWaveSurfer called but waveformRef.current is null.');
        return;
      }

      let newWaveSurferInstance: WaveSurfer | null = null;
      try {
        console.log('[WaveformPlayer] Attempting to create WaveSurfer instance for URL:', url);
        newWaveSurferInstance = WaveSurfer.create({
          container: waveformRef.current, // waveformRef.current is now checked
          waveColor: '#A1A1AA',      // zinc-400
          progressColor: '#18181B', // zinc-900
          cursorColor: '#18181B',
          barWidth: 3,
          barRadius: 3,
          cursorWidth: 1,
          height: 64,
          barGap: 3,
          url: url, // Use the passed url
          normalize: true,
        });
      } catch (initError: any) {
        console.error("[WaveformPlayer] Error during WaveSurfer.create:", initError);
        setError(`Failed to initialize player: ${initError.message || 'Unknown error'}`);
        setIsLoading(false);
        wavesurfer.current = null;
        return;
      }

      wavesurfer.current = newWaveSurferInstance;
      const currentInstance = wavesurfer.current;

      // Event Listeners (attach to currentInstance)
      currentInstance.on('play', () => {
        if (wavesurfer.current !== currentInstance) {
          console.log('[WaveformPlayer] Stale instance "play" event ignored. URL:', currentInstance.options.url);
          return;
        }
        console.log('[WaveformPlayer] Event: play - URL:', currentInstance.options.url);
        setIsPlaying(true);
      });
      currentInstance.on('pause', () => {
        if (wavesurfer.current !== currentInstance) {
          console.log('[WaveformPlayer] Stale instance "pause" event ignored. URL:', currentInstance.options.url);
          return;
        }
        console.log('[WaveformPlayer] Event: pause - URL:', currentInstance.options.url);
        setIsPlaying(false);
      });
      currentInstance.on('finish', () => {
        if (wavesurfer.current !== currentInstance) {
          console.log('[WaveformPlayer] Stale instance "finish" event ignored. URL:', currentInstance.options.url);
          return;
        }
        console.log('[WaveformPlayer] Event: finish - URL:', currentInstance.options.url);
        setIsPlaying(false);
        setCurrentTime(0);
        currentInstance.seekTo(0);
      });
      currentInstance.on('ready', (newDuration) => {
        if (wavesurfer.current !== currentInstance) {
          console.log('[WaveformPlayer] Stale instance "ready" event ignored. URL:', currentInstance.options.url);
          return;
        }
        console.log('[WaveformPlayer] Event: ready - URL:', currentInstance.options.url, 'Duration:', newDuration);
        setDuration(newDuration);
        setIsLoading(false);
      });
      currentInstance.on('timeupdate', (newTime) => {
        if (wavesurfer.current !== currentInstance) {
          return;
        }
        setCurrentTime(newTime);
      });
      currentInstance.on('decode', (newDuration) => {
        if (wavesurfer.current !== currentInstance) {
          console.log('[WaveformPlayer] Stale instance "decode" event ignored. URL:', currentInstance.options.url);
          return;
        }
        console.log('[WaveformPlayer] Event: decode - URL:', currentInstance.options.url, 'Duration:', newDuration);
        if (duration === 0) {
          setDuration(newDuration);
        }
        if (isLoading) {
          setIsLoading(false);
        }
      });
      currentInstance.on('error', (err) => {
        if (wavesurfer.current !== currentInstance && wavesurfer.current !== null) {
          console.warn('[WaveformPlayer] Stale instance WaveSurfer error event ignored:', err, 'URL associated with event:', currentInstance.options.url);
          return;
        }
        console.warn('[WaveformPlayer] WaveSurfer error event (handled, displaying in UI):', err, 'URL:', currentInstance.options.url);

        let errorMessage = 'Unknown error occurred.';
        if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof (err as any).message === 'string') {
          errorMessage = (err as any).message;
        }

        if (errorMessage.toLowerCase().includes('fetch') ||
            errorMessage.toLowerCase().includes('http') ||
            errorMessage.toLowerCase().includes('networkerror')) {
          setError(`Failed to load audio: Network error (${errorMessage}). Please check the URL and your connection.`);
        } else if (errorMessage.toLowerCase().includes('decode') || errorMessage.toLowerCase().includes('format')) {
          setError(`Failed to load audio: Unsupported audio format or corrupt file (${errorMessage}).`);
        } else {
          setError(`Failed to load audio: ${errorMessage}.`);
        }

        setIsLoading(false);
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
      });
    };

    // Directly initialize WaveSurfer without pre-flight check
    initializeWaveSurfer(audioUrl);

    // Cleanup function
    return () => {
      console.log('[WaveformPlayer] Cleanup: audioUrl changed or component unmounted.');
      if (wavesurfer.current) {
        console.log('[WaveformPlayer] Destroying WaveSurfer instance for URL (in cleanup):', wavesurfer.current.options.url);
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl]);

  // If no audioUrl, render nothing or a placeholder for the player area
  // This is mostly handled by TtsOutputCard's conditional rendering, but good to be safe.
  if (!audioUrl && !isLoading) { // Added !isLoading to prevent flicker if it was loading then url became null
      // return <div className="flex flex-col items-center w-full pt-4 pb-0 rounded-md border bg-background h-[140px] justify-center text-muted-foreground"><p>No audio loaded.</p></div>;
      // Let the parent component (TtsOutputCard) handle the placeholder logic for consistency.
      // This component will just not render its waveform part.
  }

  const sliderValue = duration > 0 ? [(currentTime / duration) * 100] : [0];

  return (
    <div className="flex flex-col items-center w-full pt-4 pb-0 rounded-md border bg-background">
      {/* Waveform container: Keep horizontal padding */}
      <div ref={waveformRef} className="w-full h-[64px] px-4 mb-4" />

      {/* Error Display: Keep horizontal padding */}
      {error && !isLoading && (
        <p className="text-sm text-destructive w-full text-center px-4 py-2 mb-4">Error: {error}</p>
      )}

      {/* Controls Container: Keep horizontal padding */}
      {!error && (
        <div className="flex items-center gap-4 w-full px-4 py-1 bg-muted border-t">
          {/* Play/Pause Button */}
          <Button 
            onClick={handlePlayPause} 
            variant="ghost" // Changed variant
            size="icon" 
            disabled={isLoading || !!error}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <Loader2Icon className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon className="h-5 w-5" />
            )}
          </Button>

          {/* Time Display (Current) */}
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-[45px] text-right">
            {formatTime(currentTime)}
          </span>

          {/* Seek Slider */} 
          <Slider
            value={sliderValue}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading || !!error || duration <= 0}
            className="flex-grow mx-2 cursor-pointer"
            aria-label="Audio Seek Bar"
          />

          {/* Time Display (Duration) */} 
          <span className="text-xs text-muted-foreground font-mono flex-shrink-0 w-[45px]">
            {formatTime(duration)}
          </span>

          {/* Volume Control (Future) */}
          {/* 
          <Button variant="ghost" size="icon">
            <Volume2Icon className="h-5 w-5" />
          </Button>
          <Slider defaultValue={[100]} max={100} step={1} className="w-[80px]" />
          */}
        </div>
      )}
    </div>
  );
} 