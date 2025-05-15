import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { TtsInterface, TtsInterfaceProps } from './tts-interface';

// Mock child components
vi.mock('./TtsInputCard', () => ({
  TtsInputCard: () => <div data-testid="input-card" />
}));
vi.mock('./TtsOutputCard', () => ({
  TtsOutputCard: () => <div data-testid="output-card" />
}));
// Mock hooks
const mockStartGeneration = vi.fn();
const mockResetTtsState = vi.fn();
const mockLoadPrediction = vi.fn();
vi.mock('@/hooks/useTtsGeneration', () => ({
  useTtsGeneration: () => ({
    isGenerating: false,
    predictionStatus: null,
    audioUrl: null,
    ttsErrorMessage: null,
    ttsPredictionDbId: null,
    startGeneration: mockStartGeneration,
    resetTtsState: mockResetTtsState,
    loadPrediction: mockLoadPrediction,
  })
}));
vi.mock('@/hooks/useTtsDamIntegration', () => ({
  useTtsDamIntegration: () => ({
    isDamModalOpen: false,
    setIsDamModalOpen: vi.fn(),
    isTextActionLoading: false,
    isAudioActionLoading: false,
    sourceAssetId: null,
    originalLoadedText: null,
    damErrorMessage: null,
    loadTextFromAsset: vi.fn(),
    saveTextToAsset: vi.fn(),
    saveTextAsNewAsset: vi.fn(),
    saveAudioToDam: vi.fn(),
  })
}));

describe('TtsInterface', () => {
  it('renders input and output cards', () => {
    render(<TtsInterface />);
    expect(screen.getByTestId('input-card')).toBeInTheDocument();
    expect(screen.getByTestId('output-card')).toBeInTheDocument();
  });

  it('accepts formInitialValues and calls loadPrediction effect', () => {
    const initialValues = { inputText: 'hi', voiceId: 'v1', provider: 'p', key: 1, outputUrl: 'url', dbId: 'db' };
    render(<TtsInterface formInitialValues={initialValues} />);
    expect(mockResetTtsState).toHaveBeenCalled();
    expect(mockLoadPrediction).toHaveBeenCalledWith({ audioUrl: 'url', dbId: 'db', status: 'succeeded' });
  });
}); 