import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { TtsInterface } from './tts-interface';
import * as ttsActions from '@/lib/actions/tts';
import * as damActions from '@/lib/actions/dam';
import * as uiHooks from "@/components/ui/use-toast"; // To mock useToast

// Mock the server actions
vi.mock('@/lib/actions/tts');
vi.mock('@/lib/actions/dam');
vi.mock('@/components/ui/use-toast');

describe('TtsInterface - Load from DAM Integration', () => {
  const mockToast = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    // Mock useToast
    vi.mocked(uiHooks.useToast).mockReturnValue({
        toast: mockToast,
        dismiss: vi.fn(),
        toasts: [],
    });

    // Default mocks for actions (can be overridden in tests)
    vi.mocked(ttsActions.getTtsVoices).mockResolvedValue({
      success: true,
      data: [{ id: 'voice1', name: 'Test Voice', gender: 'Male', accent: 'American' }],
    });
    vi.mocked(damActions.listTextAssets).mockResolvedValue({
      success: true,
      data: [
        { id: 'asset1', name: 'test1.txt', created_at: new Date().toISOString() },
        { id: 'asset2', name: 'document.md', created_at: new Date().toISOString() },
      ],
    });
    vi.mocked(damActions.getAssetContent).mockResolvedValue({
      success: true,
      content: 'This is the content of the asset.',
    });
     // Mock generate actions just in case, return non-success to prevent polling logic
    vi.mocked(ttsActions.startSpeechGeneration).mockResolvedValue({ success: false, error: 'Not tested' });
    vi.mocked(ttsActions.getSpeechGenerationResult).mockResolvedValue({
      success: false, 
      status: 'failed',
      audioUrl: null,
      error: 'Generic fetch error', 
      ttsPredictionDbId: null,
    });
  });

  test('clicking Load button opens AssetSelectorModal and fetches assets', async () => {
    const user = userEvent.setup();
    render(<TtsInterface />);

    // 1. Verify the Load button is present 
    const loadButton = screen.getByRole('button', { name: /load from library/i });
    expect(loadButton).toBeInTheDocument();

    // 2. Ensure the modal is not initially open (check by title)
    expect(screen.queryByRole('heading', { name: /select text asset/i })).not.toBeInTheDocument();
    // Verify listTextAssets hasn't been called yet
    expect(damActions.listTextAssets).not.toHaveBeenCalled();

    // 3. Click the Load button
    await user.click(loadButton);

    // 4. Verify the modal is now open (check by title)
    expect(await screen.findByRole('heading', { name: /select text asset/i })).toBeInTheDocument();

    // 5. Verify listTextAssets was called (modal fetches on open)
    expect(damActions.listTextAssets).toHaveBeenCalledTimes(1);
  });

  test('selecting an asset loads content into textarea', async () => {
    const user = userEvent.setup();
    const mockContent = 'This is the mocked asset content.';
    const selectedAssetName = 'test1.txt';
    const selectedAssetId = 'asset1';

    // Override getAssetContent mock for specific content
    vi.mocked(damActions.getAssetContent).mockResolvedValue({
      success: true,
      content: mockContent,
    });

    render(<TtsInterface />);

    const textarea = screen.getByPlaceholderText(/enter the text/i) as HTMLTextAreaElement;
    const loadButton = screen.getByRole('button', { name: /load from library/i });

    // 1. Click Load to open modal
    await user.click(loadButton);

    // 2. Wait for modal and find the select button for the specific asset
    const modalTitle = await screen.findByRole('heading', { name: /select text asset/i });
    // Find the list item by text, then the button within it
    const assetListItem = await within(modalTitle.closest('[role="dialog"]'!)!).findByText(selectedAssetName);
    const selectButton = within(assetListItem.closest('li')!).getByRole('button', { name: /select/i });

    // 3. Click the Select button
    await user.click(selectButton);

    // 4. Wait for the modal to close (check title is gone)
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /select text asset/i })).not.toBeInTheDocument();
    });

    // 5. Verify getAssetContent was called
    expect(damActions.getAssetContent).toHaveBeenCalledTimes(1);
    expect(damActions.getAssetContent).toHaveBeenCalledWith(selectedAssetId);

    // 6. Verify textarea is updated
    await waitFor(() => {
        expect(textarea.value).toBe(mockContent);
    });

    // 7. Verify success toast was shown (check message content)
    expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
            title: "Content Loaded",
            description: `Loaded text from ${selectedAssetName}`
        })
    );
  });

  // --- Add more tests here --- 
  // - Handles error when fetching asset list in modal
  // - Handles error when fetching asset content
}); 