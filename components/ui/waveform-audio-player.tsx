'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Button } from './button';
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, Loader2Icon, Volume2Icon, VolumeXIcon } from 'lucide-react';

interface WaveformAudioPlayerProps {
  audioUrl: string;
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

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#A1A1AA',      // zinc-400
      progressColor: '#18181B', // zinc-900
      cursorColor: '#18181B',
      barWidth: 3,
      barRadius: 3,
      cursorWidth: 1,
      height: 64, // Reduced height by 20% (from 80)
      barGap: 3,
      url: audioUrl,
      normalize: true, // Normalize the waveform height
    });

    const ws = wavesurfer.current; // Local reference for cleanup

    // Event Listeners
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => {
      setIsPlaying(false);
      // Optionally seek to start on finish
      // ws.seekTo(0);
      // setCurrentTime(0);
    });
    ws.on('ready', (newDuration) => {
      setDuration(newDuration);
      setIsLoading(false);
    });
    ws.on('timeupdate', (newTime) => {
      setCurrentTime(newTime);
    });
     // Sometimes ready doesn't fire or duration is 0, use 'decode' as fallback
    ws.on('decode', (newDuration) => {
      if (duration === 0) {
        setDuration(newDuration);
      }
      // Ensure loading is false if ready didn't fire
      if (isLoading) {
         setIsLoading(false);
      }
    });
    ws.on('error', (err) => {
      console.error('WaveSurfer error:', err);
      setError(`Failed to load audio`); // Keep error simple
      setIsLoading(false);
    });
    
    // Cleanup function
    return () => {
      ws.destroy();
      wavesurfer.current = null;
    };
  }, [audioUrl]);

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