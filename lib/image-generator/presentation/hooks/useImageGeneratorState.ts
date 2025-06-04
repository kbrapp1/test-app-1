import { useState, useCallback, useEffect } from 'react';

// Storage key for persisting image generator state
const STORAGE_KEY = 'image-generator-state';

interface PersistedState {
  prompt: string;
  aspectRatio: string;
  style: string;
  mood: string;
  safetyTolerance: number;
  currentGeneratedImage: string | null;
  styleValues: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  };
  timestamp: number; // To handle stale data
}

// Helper to get persisted state from sessionStorage
const getPersistedState = (): Partial<PersistedState> | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as PersistedState;
    
    // Check if data is not too old (24 hours)
    const isStale = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    if (isStale) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    // Invalid JSON, clear it
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

// Helper to save state to sessionStorage
const savePersistedState = (state: Omit<PersistedState, 'timestamp'>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const dataToSave: PersistedState = {
      ...state,
      timestamp: Date.now()
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {
    // Storage full or disabled, ignore silently
  }
};



/**
 * useImageGeneratorState Hook
 * Single Responsibility: Coordinate form state management for image generation
 * Presentation Layer - State coordination only, no business logic
 * Now includes sessionStorage persistence for page refresh and navigation scenarios
 */
export const useImageGeneratorState = () => {
  // Initialize state from persisted data or defaults
  const persistedState = getPersistedState();
  
  // Form state management with persistence
  const [prompt, setPromptInternal] = useState(persistedState?.prompt || '');
  const [aspectRatio, setAspectRatioInternal] = useState(persistedState?.aspectRatio || '1:1');
  const [style, setStyleInternal] = useState(persistedState?.style || 'none');
  const [mood, setMoodInternal] = useState(persistedState?.mood || 'none');
  const [safetyTolerance, setSafetyToleranceInternal] = useState(persistedState?.safetyTolerance || 2);
  const [currentGeneratedImage, setCurrentGeneratedImageInternal] = useState<string | null>(
    persistedState?.currentGeneratedImage || null
  );
  
  // Style values state for prompt enhancement with persistence
  const [styleValues, setStyleValuesInternal] = useState({
    vibe: persistedState?.styleValues?.vibe || 'none',
    lighting: persistedState?.styleValues?.lighting || 'none',
    shotType: persistedState?.styleValues?.shotType || 'none',
    colorTheme: persistedState?.styleValues?.colorTheme || 'none'
  });

  // Wrapper functions that save to sessionStorage on change
  const setPrompt = useCallback((value: string) => {
    setPromptInternal(value);
  }, []);

  const setAspectRatio = useCallback((value: string) => {
    setAspectRatioInternal(value);
  }, []);

  const setStyle = useCallback((value: string) => {
    setStyleInternal(value);
  }, []);

  const setMood = useCallback((value: string) => {
    setMoodInternal(value);
  }, []);

  const setSafetyTolerance = useCallback((value: number) => {
    setSafetyToleranceInternal(value);
  }, []);

  const setCurrentGeneratedImage = useCallback((value: string | null) => {
    setCurrentGeneratedImageInternal(value);
  }, []);

  // Style change handler with persistence
  const handleStylesChange = useCallback((styles: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => {
    setStyleValuesInternal(styles);
  }, []);

  // Effect to persist state changes to sessionStorage
  useEffect(() => {
    const stateToSave = {
      prompt,
      aspectRatio,
      style,
      mood,
      safetyTolerance,
      currentGeneratedImage,
      styleValues
    };
    
    savePersistedState(stateToSave);
  }, [prompt, aspectRatio, style, mood, safetyTolerance, currentGeneratedImage, styleValues]);

  return {
    // State values
    prompt,
    aspectRatio,
    style,
    mood,
    safetyTolerance,
    currentGeneratedImage,
    styleValues,
    
    // State setters
    setPrompt,
    setAspectRatio,
    setStyle,
    setMood,
    setSafetyTolerance,
    setCurrentGeneratedImage,
    
    // Handlers
    handleStylesChange,
  };
}; 