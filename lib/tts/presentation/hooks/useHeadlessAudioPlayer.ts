'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseHeadlessAudioPlayerReturn {
  playAudio: (url: string) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentlyPlayingUrl: string | null;
}

export function useHeadlessAudioPlayer(): UseHeadlessAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentlyPlayingUrl, setCurrentlyPlayingUrl] = useState<string | null>(null);

  const clearState = useCallback((options?: { isEnded?: boolean }) => {
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
    if (options?.isEnded) {
        setCurrentlyPlayingUrl(null); // Also clear URL if it's an ended state
    }
    // If not ended (e.g. manual stop or new play), don't clear currentlyPlayingUrl here;
    // stopAudio or playAudio will handle it explicitly.
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Remove event listeners before setting src to empty or nulling ref
      // to prevent them firing during cleanup.
      const el = audioRef.current;
      el.oncanplaythrough = null;
      el.onplaying = null;
      el.onpause = null;
      el.onended = null;
      el.onerror = null;
      // audioRef.current.src = ''; // This can sometimes cause issues, better to just null the ref after removing listeners
    }
    clearState(); // Clears isPlaying, isLoading, error. Does not clear URL here.
    setCurrentlyPlayingUrl(null); // Explicitly clear the URL on stop
    // If we were to reuse the element, we might do audioRef.current = null here or handle it in playAudio
  }, [clearState]);


  const playAudio = useCallback((url: string) => {
    if (!url) {
      console.error("HeadlessPlayer: No URL provided.");
      setError("No URL provided.");
      return;
    }

    // If currently playing something else, stop it first.
    // Or if it's the same URL and already playing, what to do? For now, let's assume restart.
    if (audioRef.current && (isPlaying || isLoading || currentlyPlayingUrl !== url)) {
      // A full stop might be too much if just changing URL.
      // Let's just pause and reset if it's a different URL or if we want to restart.
      audioRef.current.pause();
      // Detach old listeners before reassigning or creating a new audio element
        if(audioRef.current) {
            audioRef.current.oncanplaythrough = null;
            audioRef.current.onplaying = null;
            audioRef.current.onpause = null;
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
        }
    }
    
    clearState();
    setIsLoading(true);
    setCurrentlyPlayingUrl(url);
    setError(null);

    if (!audioRef.current || audioRef.current.src !== url) {
        // If no audio element or the source is different, create a new one
        audioRef.current = new Audio(url);
    }
    // else reuse the existing element if src is the same (e.g. for resume after stop)

    const currentAudioElement = audioRef.current;

    currentAudioElement.oncanplaythrough = () => {
      setIsLoading(false);
      // Autoplay if it was intended, already handled by .play() call below
    };
    currentAudioElement.onplaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null); // Clear error on successful play
    };
    currentAudioElement.onpause = () => {
      // This event fires on pause() and also when audio ends naturally before 'ended' sometimes.
      // Only set isPlaying to false if it's not because it's about to end.
      // The 'ended' event is more definitive for playback completion.
      if (currentAudioElement.currentTime !== currentAudioElement.duration) {
        setIsPlaying(false);
      }
    };
    currentAudioElement.onended = () => {
      clearState({ isEnded: true });
    };
    currentAudioElement.onerror = (e) => {
      const mediaError = currentAudioElement.error;
      // console.warn("HeadlessPlayer Error Event:", e, "Element Error State:", mediaError); // REMOVED console.warn
      
      let errorMessage = "An unknown playback error occurred.";

      if (mediaError) {
        if (mediaError.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          errorMessage = "Audio not found or link expired. The format might also be unsupported.";
        } else {
          switch (mediaError.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = 'Playback aborted by the user or script.';
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = 'A network error caused the audio download to fail.';
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = 'The audio playback was aborted due to a corruption problem or because the audio used features your browser did not support.';
              break;
            // MEDIA_ERR_SRC_NOT_SUPPORTED is handled above
            default:
              errorMessage = `An unknown error occurred (Code: ${mediaError.code}).`;
          }
        }
        if (mediaError.message && mediaError.code !== MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) { 
          // Append browser message if not already covered by the specific SRC_NOT_SUPPORTED message
          errorMessage += ` (${mediaError.message})`;
        }
      } else if (typeof e === 'string') {
        errorMessage = e; 
      } else if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' && e.message) {
        errorMessage = e.message; 
      }

      setError(errorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentlyPlayingUrl(null); 
    };

    currentAudioElement.load();
    currentAudioElement.play().catch(err => {
      const playError = err instanceof Error ? err : null;
      let specificPlayErrorMessage = "Playback could not be started.";

      if (playError && (playError.name === 'NotSupportedError' || playError.message.includes('no supported source') || playError.message.includes('Format error'))) {
        specificPlayErrorMessage = "Audio not found or link expired. Please ensure the source is valid.";
      } else if (playError) {
        specificPlayErrorMessage = "Playback could not be started: " + playError.message;
      } else if (typeof err === 'string') {
        specificPlayErrorMessage = "Playback could not be started: " + err;
      }
      
      // console.warn("HeadlessPlayer: Playback initiation problem.", specificPlayErrorMessage, err); // REMOVED console.warn
      setError(specificPlayErrorMessage);
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentlyPlayingUrl(url); 
    });

  }, [clearState, isPlaying, isLoading, currentlyPlayingUrl]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      // isPlaying will be set to false by the 'onpause' event handler
    }
  }, [isPlaying]);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && !isPlaying && currentlyPlayingUrl) {
      // setIsLoading(true); // Optionally set loading for resume
      audioRef.current.play().catch(err => {
        const resumeErrorMessage = (err instanceof Error && err.message) ? err.message : "Resume failed.";
        // console.warn("HeadlessPlayer: Resume problem.", resumeErrorMessage, err); // REMOVED console.warn
        setError("Resume failed. " + resumeErrorMessage);
        setIsLoading(false);
      });
    }
  }, [isPlaying, currentlyPlayingUrl]);
  
  // Effect for cleanup on unmount
  useEffect(() => {
    const player = audioRef.current;
    return () => {
      if (player) {
        player.pause();
        player.oncanplaythrough = null;
        player.onplaying = null;
        player.onpause = null;
        player.onended = null;
        player.onerror = null;
        // player.src = ''; // Avoid lingering requests
        audioRef.current = null; // Release the reference
      }
    };
  }, []);

  return { playAudio, pauseAudio, resumeAudio, stopAudio, isPlaying, isLoading, error, currentlyPlayingUrl };
} 