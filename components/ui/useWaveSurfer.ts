'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveSurferProps {
  waveformRef: React.RefObject<HTMLDivElement | null>;
  audioUrl: string | null;
  isLikelyExpired?: boolean;
  onPlaybackErrorProp?: (errorMessage: string) => void; // Renamed from onPlaybackError to avoid confusion
}

export function useWaveSurfer({
  waveformRef,
  audioUrl,
  isLikelyExpired,
  onPlaybackErrorProp,
}: UseWaveSurferProps) {
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    if (isLikelyExpired) {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
      setError("Audio link has likely expired and cannot be played.");
      setIsLoading(false);
      setIsPlaying(false);
      setDuration(0);
      setCurrentTime(0);
      return;
    }

    if (!audioUrl) {
      if (wavesurfer.current) {
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

    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const initializeWaveSurfer = (url: string) => {
      if (!waveformRef.current) return;

      let newWaveSurferInstance: WaveSurfer | null = null;
      try {
        newWaveSurferInstance = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#A1A1AA',      // zinc-400
          progressColor: '#18181B', // zinc-900
          cursorColor: '#18181B',
          barWidth: 3,
          barRadius: 3,
          cursorWidth: 1,
          height: 64,
          barGap: 3,
          url: url,
          normalize: true,
        });
      } catch (initError: unknown) {
        const errorMessage = initError instanceof Error ? initError.message : 'Unknown error';
        setError(`Failed to initialize player: ${errorMessage}`);
        setIsLoading(false);
        wavesurfer.current = null;
        return;
      }

      wavesurfer.current = newWaveSurferInstance;
      const currentInstance = wavesurfer.current;

      currentInstance.on('play', () => {
        if (wavesurfer.current !== currentInstance) return;
        setIsPlaying(true);
      });
      currentInstance.on('pause', () => {
        if (wavesurfer.current !== currentInstance) return;
        setIsPlaying(false);
      });
      currentInstance.on('finish', () => {
        if (wavesurfer.current !== currentInstance) return;
        setIsPlaying(false);
        setCurrentTime(0);
        currentInstance.seekTo(0);
      });
      currentInstance.on('ready', (newDuration) => {
        if (wavesurfer.current !== currentInstance) return;
        setDuration(newDuration);
        setIsLoading(false);
      });
      currentInstance.on('timeupdate', (newTime) => {
        if (wavesurfer.current !== currentInstance) return;
        setCurrentTime(newTime);
      });
      currentInstance.on('decode', (newDuration) => {
        if (wavesurfer.current !== currentInstance) return;
        if (newDuration > 0) setDuration(newDuration);
        setIsLoading(false);
      });
      currentInstance.on('error', (err) => {
        if (wavesurfer.current !== currentInstance && wavesurfer.current !== null) return;

        let displayError = '';
        let isExpiredLinkError = false;

        if (typeof err === 'object' && err !== null) {
          const mediaError = err as { code?: number; message?: string };
          if (
            mediaError.code === 4 &&
            typeof mediaError.message === 'string' &&
            (mediaError.message.toLowerCase().includes('media_element_error') ||
             mediaError.message.toLowerCase().includes('format error') ||
             mediaError.message.toLowerCase().includes('src_not_supported'))
          ) {
            displayError = "Media link expired. Please create another generation.";
            isExpiredLinkError = true;
          }
        }

        if (!isExpiredLinkError) {
           // console.warn('[WaveSurferHook] WaveSurfer error event:', err, 'URL:', currentInstance.options.url);
        }

        if (!displayError) {
          let errorMessage = 'Unknown error occurred.';
          if (typeof err === 'string') {
            errorMessage = err;
          } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
            errorMessage = err.message;
          }

          if (typeof err === 'object' && err && 'message' in err && typeof err.message === 'string' &&
              err.message.includes('Failed to fetch') &&
              err.message.includes('404') &&
              currentInstance.options.url?.includes('replicate.delivery')) {
            displayError = "Media link expired. Please create another generation.";
          }
          else if (errorMessage.toLowerCase().includes('fetch') ||
            errorMessage.toLowerCase().includes('http') ||
            errorMessage.toLowerCase().includes('networkerror')) {
            displayError = `Failed to load audio: Network error (${errorMessage}). Please check the URL and your connection.`;
          } 
          else if (errorMessage.toLowerCase().includes('decode') || 
                   errorMessage.toLowerCase().includes('format')) {
            displayError = `Failed to load audio: Unsupported audio format or corrupt file (${errorMessage}).`;
          } 
          else {
            displayError = `Failed to load audio: ${errorMessage}.`;
          }
        }

        setError(displayError);
        setIsLoading(false);
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);

        if (onPlaybackErrorProp) {
          onPlaybackErrorProp(displayError);
        }
      });
    };

    initializeWaveSurfer(audioUrl);

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [audioUrl, isLikelyExpired, waveformRef, onPlaybackErrorProp]);

  const handlePlayPause = useCallback(() => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (wavesurfer.current && duration > 0) {
      wavesurfer.current.seekTo(value[0] / 100);
      // setCurrentTime is updated by the 'timeupdate' event
    }
  }, [duration]);

  return {
    isPlaying,
    isLoading,
    error,
    duration,
    currentTime,
    handlePlayPause,
    handleSeek,
  };
} 