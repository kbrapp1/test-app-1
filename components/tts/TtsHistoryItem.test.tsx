import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TtsHistoryItem, TtsHistoryItemProps } from './TtsHistoryItem';
import type { Database } from '@/types/supabase';

type TtsPredictionRow = Database['public']['Tables']['TtsPrediction']['Row'];

const mockItemBase: TtsPredictionRow = {
  id: 'test-id-1',
  createdAt: new Date().toISOString(),
  inputText: 'This is a very long test input text for the history item, designed to be over fifty characters.',
  voiceId: 'test-voice',
  status: 'succeeded',
  outputUrl: 'http://example.com/audio.mp3',
  prediction_provider: 'replicate',
  outputAssetId: null,
  errorMessage: null,
  is_output_url_problematic: false,
  output_url_last_error: null,
  userId: 'user-test-id',
  updatedAt: new Date().toISOString(),
  organization_id: 'org-test-id',
  replicatePredictionId: '',
  sourceAssetId: '',
};

const mockOnReplay = vi.fn();
const mockOnReloadInput = vi.fn();
const mockOnViewInDam = vi.fn();
const mockOnDelete = vi.fn();
const mockOnSaveToDam = vi.fn();
const mockOnSaveAsToDam = vi.fn();

const defaultProps: TtsHistoryItemProps = {
  item: mockItemBase,
  onReplay: mockOnReplay,
  onReloadInput: mockOnReloadInput,
  onViewInDam: mockOnViewInDam,
  onDelete: mockOnDelete,
  onSaveToDam: mockOnSaveToDam,
  onSaveAsToDam: mockOnSaveAsToDam,
  isLikelyExpired: false,
  hasActualPlaybackError: false,
  actualPlaybackErrorMessage: null,
  headlessPlayerCurrentlyPlayingUrl: null,
  isHeadlessPlayerPlaying: false,
  isHeadlessPlayerLoading: false,
  headlessPlayerError: null,
  isProblematicFromDb: false,
  dbProblematicMessage: null,
};

const renderTtsHistoryItem = (props?: Partial<TtsHistoryItemProps>) => {
  // Ensure item is merged correctly if provided in partial props
  const finalProps = {
    ...defaultProps,
    ...props,
    item: { ...defaultProps.item, ...props?.item },
  };
  return render(<TtsHistoryItem {...finalProps} />);
};


describe('TtsHistoryItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic item information', () => {
    renderTtsHistoryItem();
    expect(screen.getByText('This is a very long test input text for the histor...')).toBeInTheDocument();
    expect(screen.getByText('Voice: test-voice')).toBeInTheDocument();
    expect(screen.getByText('succeeded')).toBeInTheDocument();
    expect(screen.getByText(new Date(mockItemBase.createdAt!).toLocaleString())).toBeInTheDocument();
  });

  it('calls onReloadInput when reload button is clicked and is always enabled', () => {
    renderTtsHistoryItem({ isLikelyExpired: true }); 
    const reloadButton = screen.getByTestId('tts-history-item-reload');
    expect(reloadButton).toBeEnabled();
    expect(reloadButton).toHaveAttribute('aria-label', 'Audio link likely expired.'); // Check dynamic aria-label
    fireEvent.click(reloadButton);
    expect(mockOnReloadInput).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });

  it('Reload Input button has default aria-label when link is usable', () => {
    renderTtsHistoryItem(); 
    const reloadButton = screen.getByTestId('tts-history-item-reload');
    expect(reloadButton).toBeEnabled(); 
    expect(reloadButton).toHaveAttribute('aria-label', 'Reload Input');
    fireEvent.click(reloadButton);
    expect(mockOnReloadInput).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });

  it('displays "Audio link likely expired." when isLikelyExpired is true and not saved', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputAssetId: null }, isLikelyExpired: true });
    expect(screen.getByText('Audio link likely expired.')).toBeInTheDocument();
  });

  it('displays "Audio link flagged as problematic." when isProblematicFromDb is true and not saved', () => {
    renderTtsHistoryItem({ 
      item: { ...mockItemBase, outputAssetId: null }, 
      isProblematicFromDb: true, 
      dbProblematicMessage: 'DB says bad link' 
    });
    expect(screen.getByText('DB says bad link')).toBeInTheDocument();
  });
  
  it('displays custom playback error message when hasActualPlaybackError is true', () => {
    renderTtsHistoryItem({ 
      item: { ...mockItemBase, outputAssetId: null }, 
      hasActualPlaybackError: true, 
      actualPlaybackErrorMessage: 'Playback failed!' 
    });
    expect(screen.getByText('Playback failed!')).toBeInTheDocument();
  });

  it('play button is disabled and has correct aria-label if no audioUrl', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputUrl: null } });
    const playButton = screen.getByTestId('tts-history-item-play');
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveAttribute('aria-label', "Output not available.");
  });

  it('play button is disabled and has error aria-label if link is effectively unusable', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputAssetId: null }, isLikelyExpired: true });
    const playButton = screen.getByTestId('tts-history-item-play');
    expect(playButton).toBeDisabled();
    expect(playButton).toHaveAttribute('aria-label', "Audio link likely expired.");
  });

  it('calls onReplay when play button is clicked and enabled', () => {
    renderTtsHistoryItem();
    const playButton = screen.getByTestId('tts-history-item-play');
    expect(playButton).toBeEnabled();
    expect(playButton).toHaveAttribute('aria-label', "Play");
    fireEvent.click(playButton);
    expect(mockOnReloadInput).not.toHaveBeenCalled(); 
    expect(mockOnReplay).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });
  
  it('Save to DAM button is disabled and has correct aria-label if item is already saved', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputAssetId: 'dam-id-123' } });
    const saveButton = screen.getByTestId('tts-history-item-save');
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-label', "Item is saved to DAM. Use 'Save As' to create a new copy.");
  });

  it('Save to DAM button is disabled and has error aria-label if link is effectively unusable and not saved', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputAssetId: null }, isLikelyExpired: true });
    const saveButton = screen.getByTestId('tts-history-item-save');
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-label', "Audio link likely expired.");
  });

  it('calls onSaveToDam when Save to DAM button is clicked and enabled', async () => {
    mockOnSaveToDam.mockResolvedValueOnce(true);
    renderTtsHistoryItem({ item: { ...mockItemBase, outputUrl: 'http://valid.url/audio.mp3', outputAssetId: null } });
    const saveButton = screen.getByTestId('tts-history-item-save');
    expect(saveButton).toBeEnabled();
    expect(saveButton).toHaveAttribute('aria-label', "Save to DAM");
    
    await act(async () => {
      fireEvent.click(saveButton);
      // Ensure the promise from mockOnSaveToDam resolves and subsequent state updates are processed
      await mockOnSaveToDam.mock.results[0].value; 
    });
    
    expect(mockOnSaveToDam).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });

  it('Save As DAM button is disabled and has error aria-label if link is effectively unusable', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputAssetId: null }, isLikelyExpired: true });
    const saveAsButton = screen.getByTestId('tts-history-item-save-as');
    expect(saveAsButton).toBeDisabled();
    expect(saveAsButton).toHaveAttribute('aria-label', "Audio link likely expired.");
  });

  it('calls onSaveAsToDam when Save As DAM button is clicked and enabled', async () => {
    mockOnSaveAsToDam.mockResolvedValueOnce(true);
    renderTtsHistoryItem({ item: { ...mockItemBase, outputUrl: 'http://valid.url/audio.mp3' } }); 
    const saveAsButton = screen.getByTestId('tts-history-item-save-as');
    expect(saveAsButton).toBeEnabled();
    expect(saveAsButton).toHaveAttribute('aria-label', "Save as a new asset in DAM");
    
    await act(async () => {
      fireEvent.click(saveAsButton);
      // Ensure the promise from mockOnSaveAsToDam resolves and subsequent state updates are processed
      await mockOnSaveAsToDam.mock.results[0].value;
    });
    
    expect(mockOnSaveAsToDam).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });

  it('calls onDelete when delete button is clicked', () => {
    renderTtsHistoryItem();
    const deleteButton = screen.getByTestId('tts-history-item-delete');
    expect(deleteButton).toBeEnabled(); 
    expect(deleteButton).toHaveAttribute('aria-label', "Delete item");
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith(expect.objectContaining({ id: mockItemBase.id }));
  });

  it('Save to DAM button has "Output not available." aria-label and is disabled if outputUrl is null', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputUrl: null } });
    const saveButton = screen.getByTestId('tts-history-item-save');
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveAttribute('aria-label', "Output not available.");
  });

  it('Save As DAM button has "Output not available." aria-label and is disabled if outputUrl is null', () => {
    renderTtsHistoryItem({ item: { ...mockItemBase, outputUrl: null } });
    const saveAsButton = screen.getByTestId('tts-history-item-save-as');
    expect(saveAsButton).toBeDisabled();
    expect(saveAsButton).toHaveAttribute('aria-label', "Output not available.");
  });
}); 