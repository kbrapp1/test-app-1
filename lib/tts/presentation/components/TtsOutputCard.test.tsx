import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TtsOutputCard } from './TtsOutputCard';

// Mock WaveformAudioPlayer
vi.mock('@/components/ui/waveform-audio-player', () => ({
  WaveformAudioPlayer: ({ audioUrl }: { audioUrl: string }) => <div data-testid="waveform">{audioUrl}</div>
}));
// Mock useToast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));
// Mock file-saver
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

describe('TtsOutputCard', () => {
  const defaultProps = {
    audioUrl: null,
    predictionStatus: null,
    isLoading: false,
    isPollingLoading: false,
    isSavingToDam: false,
    isDeleting: false,
    errorMessage: null,
    currentPredictionId: null,
    currentTtsPredictionDbId: null,
    onSaveToLibrary: vi.fn(),
    onDeletePrediction: vi.fn(),
  };

  it('shows placeholder when no audio and not loading or error', () => {
    render(<TtsOutputCard {...defaultProps} />);
    expect(screen.getByText(/Your generated audio will appear here\./)).toBeInTheDocument();
  });

  it('shows loading message when isLoading true', () => {
    render(<TtsOutputCard {...defaultProps} isLoading={true} predictionStatus="starting" />);
    expect(screen.getByText(/Starting generation/)).toBeInTheDocument();
  });

  it('shows error alert when errorMessage present', () => {
    render(<TtsOutputCard {...defaultProps} errorMessage="Failed to generate" />);
    expect(screen.getByText(/Generation Failed/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });

  it('renders waveform when audioUrl and succeeded status', () => {
    render(
      <TtsOutputCard
        {...defaultProps}
        audioUrl="http://audio"
        predictionStatus="succeeded"
      />
    );
    expect(screen.getByTestId('waveform')).toHaveTextContent('http://audio');
  });
}); 