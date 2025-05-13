import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AssetSelectorModal } from './asset-selector-modal';
import * as damTextAssetActions from '@/lib/actions/dam/text-asset.actions'; // To mock listTextAssets
import { listTextAssets } from '@/lib/actions/dam/text-asset.actions';
import { Asset } from '@/types/dam';
import { MockedFunction } from 'vitest';

// Mock the action
vi.mock('@/lib/actions/dam/text-asset.actions', () => ({ // Mock new path
  listTextAssets: vi.fn(),
}));

// Use the imported and typed mock for listTextAssets
const mockedListTextAssets = listTextAssets as MockedFunction<typeof listTextAssets>;

describe('AssetSelectorModal', () => {
  const mockOnAssetSelect = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    // Provide a default successful mock implementation for listTextAssets
    vi.mocked(damTextAssetActions.listTextAssets).mockResolvedValue({
      success: true,
      data: [
        { id: 'asset1', name: 'test1.txt', created_at: new Date().toISOString() },
        { id: 'asset2', name: 'document.md', created_at: new Date().toISOString() },
      ],
    });
  });

  test('displays loading skeleton initially when open', async () => {
    // Mock listTextAssets to simulate loading state
    const mockPromise = new Promise(() => {}); // Promise that never resolves
    vi.mocked(damTextAssetActions.listTextAssets).mockReturnValue(mockPromise as any);

    render(
      <AssetSelectorModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAssetSelect={mockOnAssetSelect} 
      />
    );

    // Check for the Dialog Title first to ensure the modal structure is present
    expect(screen.getByRole('heading', { name: /select text asset/i })).toBeInTheDocument();

    // Check for skeleton elements (adjust query based on actual implementation)
    // Assuming Skeleton components have role="status" and aria-label="Loading..." or similar
    // Or target by test-id if added to Skeleton
    const skeletons = await screen.findAllByTestId('skeleton-item');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(skeletons).toHaveLength(3); // Check for the specific number rendered

    // Ensure the actual asset list isn't shown yet
    expect(screen.queryByText(/test1.txt/i)).not.toBeInTheDocument();
  });

  test('displays assets after successful fetch', async () => {
    render(
      <AssetSelectorModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAssetSelect={mockOnAssetSelect} 
      />
    );

    // Use waitFor to explicitly wait for the text to appear, 
    // ensuring promises resolve and React updates state.
    await waitFor(async () => {
      // Inside waitFor, use findByText to ensure it retries until timeout
      expect(await screen.findByText('test1.txt')).toBeInTheDocument();
    });

    // After waitFor confirms the update, check for other elements
    expect(screen.getByText('document.md')).toBeInTheDocument(); 
    const selectButtons = screen.getAllByRole('button', { name: /select/i });
    expect(selectButtons).toHaveLength(2);
    expect(screen.queryAllByTestId('skeleton-item')).toHaveLength(0);
  });

  test('displays empty state when no assets are found', async () => {
    // Mock listTextAssets to return empty array
    vi.mocked(damTextAssetActions.listTextAssets).mockResolvedValue({ success: true, data: [] });

    render(
      <AssetSelectorModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAssetSelect={mockOnAssetSelect} 
      />
    );

    // Wait for the empty state message
    expect(await screen.findByText(/no text assets found/i)).toBeInTheDocument();
    // Check for the specific sub-message too
    expect(screen.getByText(/supported types: \.txt, \.md/i)).toBeInTheDocument();

    // Ensure asset list items are not rendered (check for the <ul> or absence of <li>)
    expect(screen.queryByRole('list')).not.toBeInTheDocument(); 

    // Ensure loading skeleton is gone
    expect(screen.queryAllByTestId('skeleton-item')).toHaveLength(0);
  });

  test('displays error message on fetch failure', async () => {
    const errorMessage = 'Failed to load assets from server.';
    // Mock listTextAssets to return an error
    vi.mocked(damTextAssetActions.listTextAssets).mockResolvedValue({ success: false, error: errorMessage });

    render(
      <AssetSelectorModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAssetSelect={mockOnAssetSelect} 
      />
    );

    // Wait for the error alert
    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    // Check that the specific error message is within the alert
    expect(within(errorAlert).getByText(errorMessage)).toBeInTheDocument();

    // Ensure asset list and empty state are not shown
    expect(screen.queryByRole('list')).not.toBeInTheDocument(); 
    expect(screen.queryByText(/no text assets found/i)).not.toBeInTheDocument();
    expect(screen.queryAllByTestId('skeleton-item')).toHaveLength(0);
  });

  test('calls onAssetSelect with correct ID and name when an asset is selected', async () => {
    const user = userEvent.setup();
    // Use the default mock setup in beforeEach which provides assets
    render(
      <AssetSelectorModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        onAssetSelect={mockOnAssetSelect} 
      />
    );

    // Find the select button for the first asset ('test1.txt')
    // We need to be careful selecting the correct button if multiple exist.
    // One way is to find the list item containing the text and then find the button within it.
    const listItem = await screen.findByText('test1.txt');
    // Find the button within the list item's container (assuming li is the container)
    const selectButton = within(listItem.closest('li')!).getByRole('button', { name: /select/i });

    // Click the button
    await user.click(selectButton);

    // Assert onAssetSelect was called correctly
    expect(mockOnAssetSelect).toHaveBeenCalledTimes(1);
    // Expect the callback to receive the full asset object
    expect(mockOnAssetSelect).toHaveBeenCalledWith(expect.objectContaining({ 
      id: 'asset1', 
      name: 'test1.txt' 
    }));

    // Assert modal close was requested
    expect(mockOnOpenChange).toHaveBeenCalledTimes(1);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  // Add more tests here:
  // - Displays empty state when no assets found
  // - Displays error message on fetch failure
  // - Calls onAssetSelect with correct ID when an asset is selected
  // - Closes modal when an asset is selected
  // - Closes modal via onOpenChange
  // - Resets fetch state when closed and reopened
}); 