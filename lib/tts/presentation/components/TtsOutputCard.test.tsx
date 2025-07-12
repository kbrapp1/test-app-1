import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const defaultProps = {
    audioUrl: null,
    predictionStatus: null,
    isLoading: false,
    isSavingToDam: false,
    isDeleting: false,
    errorMessage: null,
    currentPredictionId: null,
    currentTtsPredictionDbId: null,
    onSaveToLibrary: vi.fn(),
    onDeletePrediction: vi.fn(),
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper });
  };

  it('shows placeholder when no audio and not loading or error', () => {
    renderWithProviders(<TtsOutputCard {...defaultProps} />);
    expect(screen.getByText(/Your generated audio will appear here\./)).toBeInTheDocument();
  });

  it('shows loading message when isLoading true', () => {
    renderWithProviders(<TtsOutputCard {...defaultProps} isLoading={true} predictionStatus="starting" />);
    expect(screen.getByText(/Starting generation/)).toBeInTheDocument();
  });

  it('shows error alert when errorMessage present', () => {
    renderWithProviders(<TtsOutputCard {...defaultProps} errorMessage="Failed to generate" />);
    expect(screen.getByText(/Generation Failed/)).toBeInTheDocument();
    expect(screen.getByText(/Failed to generate/)).toBeInTheDocument();
  });

  it('renders waveform when audioUrl and succeeded status', () => {
    renderWithProviders(
      <TtsOutputCard
        {...defaultProps}
        audioUrl="http://audio"
        predictionStatus="succeeded"
      />
    );
    expect(screen.getByTestId('waveform')).toHaveTextContent('http://audio');
  });
}); 