import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // For more realistic interactions
import { AssetThumbnail } from './AssetThumbnail';
import * as damActions from '@/lib/actions/dam'; // Import module to mock specific export
import { toast } from 'sonner';

// Import the original function signature for type assertion (optional but good practice)
import { deleteAsset } from '@/lib/actions/dam';

// Mock the deleteAsset server action
vi.mock('@/lib/actions/dam', async (importOriginal) => {
    const original = await importOriginal<typeof damActions>();
    return {
        ...original, // Keep other exports if any
        deleteAsset: vi.fn(), // Mock the specific function
    };
});

// Mock the toast function from sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        // Mock other methods if needed (info, warning, etc.)
    }
}));

// --- Test Data ---
const mockProps = {
    src: 'http://valid.url/image.png',
    alt: 'Test Image Alt',
    assetId: 'asset-id-123',
    storagePath: 'user/path/image.png',
};

// Use the imported deleteAsset for the mock type
const mockedDeleteAsset = damActions.deleteAsset as Mock;

describe('AssetThumbnail Component', () => {
    let user: ReturnType<typeof userEvent.setup>;

    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();

        // Default mock implementation for deleteAsset (success)
        mockedDeleteAsset.mockResolvedValue({ success: true });
    });

    it('renders the image correctly', () => {
        render(<AssetThumbnail {...mockProps} />);
        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', mockProps.src);
        expect(img).toHaveAttribute('alt', mockProps.alt);
    });

    it('renders fallback image on error', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const img = screen.getByRole('img');
        // Simulate image loading error
        fireEvent.error(img);
        // Check if the src attribute updates to the fallback
        await waitFor(() => {
            expect(img).toHaveAttribute('src', '/placeholder.png');
        });
    });

    it('shows delete button on hover (by checking presence)', () => {
        render(<AssetThumbnail {...mockProps} />);
        // Note: Simulating hover is complex in JSDOM. We test its presence.
        // The visibility is controlled by CSS (group-hover:opacity-100)
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        expect(deleteButton).toBeInTheDocument();
    });

    it('opens confirmation dialog when delete button is clicked', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });

        // Dialog should not be visible initially
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

        await userEvent.click(deleteButton);

        // Dialog should now be visible
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
    });

    it('closes dialog and does not call deleteAsset when Cancel is clicked', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);

        const cancelButton = await screen.findByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);

        // Wait for dialog to potentially close
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });

        expect(mockedDeleteAsset).not.toHaveBeenCalled();
    });

    it('calls deleteAsset with correct arguments and shows success toast on confirm', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);

        const confirmButton = await screen.findByRole('button', { name: /^delete$/i }); // Match exact 'Delete' text
        await userEvent.click(confirmButton);

        // Check if deleteAsset was called correctly
        await waitFor(() => {
            expect(mockedDeleteAsset).toHaveBeenCalledWith(mockProps.assetId, mockProps.storagePath);
            expect(mockedDeleteAsset).toHaveBeenCalledTimes(1);
        });

        // Check for success toast
        await waitFor(() => {
             expect(toast.success).toHaveBeenCalledWith(`Asset "${mockProps.alt}" deleted successfully.`);
        });

        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });

    it('shows error toast if deleteAsset returns an error', async () => {
        const errorMessage = 'Failed due to reasons.';
        mockedDeleteAsset.mockResolvedValueOnce({ success: false, error: errorMessage });

        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);

        const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
        await userEvent.click(confirmButton);

        // Check for error toast
        await waitFor(() => {
             expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });
        expect(mockedDeleteAsset).toHaveBeenCalledTimes(1);

        // Dialog should close
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });

    it('shows loading state on confirm button during deletion', async () => {
        let resolveDelete: (value: { success: boolean; error?: string }) => void;
        mockedDeleteAsset.mockImplementationOnce(() => new Promise(resolve => { resolveDelete = resolve; }));

        render(<AssetThumbnail {...mockProps} />);
        const user = userEvent.setup();
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await user.click(deleteButton);

        const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
        const cancelButton = screen.getByRole('button', { name: /cancel/i });

        user.click(confirmButton);

        await waitFor(() => {
            expect(mockedDeleteAsset).toHaveBeenCalledTimes(1);
        });

        // Check that buttons become disabled during the pending state
        expect(confirmButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();

        // Resolve the promise using act
        await act(async () => {
           resolveDelete({ success: true });
           await new Promise(r => setTimeout(r, 0)); // Keep delay just in case
        });

        // After resolving, the dialog should close, so we don't need to check
        // if the buttons are enabled again (they might be unmounted).
        // We can optionally wait for the dialog to disappear:
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });
}); 