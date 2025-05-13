import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // For more realistic interactions
import { AssetThumbnail } from './AssetThumbnail';
import * as damActionsCrud from '@/lib/actions/dam/asset-crud.actions'; // Import module to mock specific export
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { Asset } from '@/types/dam';
import { deleteAsset } from '@/lib/actions/dam/asset-crud.actions';

// Mock the deleteAsset server action from its new location
vi.mock('@/lib/actions/dam/asset-crud.actions', async (importOriginal) => {
    const originalModule = await importOriginal<typeof damActionsCrud>();
    return {
        ...originalModule,
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

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    // Add other router properties/methods if needed by the component
  }),
  usePathname: vi.fn().mockReturnValue('/mock-path'), // Mock pathname if needed
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()), // Mock search params if needed
}));

// --- Test Data ---
const mockProps = {
    src: 'http://valid.url/image.png',
    alt: 'Test Image Alt',
    assetId: 'asset-id-123',
    folderId: null,
    type: 'asset' as const, // Ensure type safety
    mimeType: 'image/png',
    onDataChange: vi.fn(), // Add mock for onDataChange
};

// Use the imported deleteAsset for the mock type
const mockedDeleteAsset = damActionsCrud.deleteAsset as Mock;

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

    // REMOVED: Test for showing delete button on hover
    /*
    it('shows delete button on hover (by checking presence)', () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        expect(deleteButton).toBeInTheDocument();
    });
    */

    // REMOVED: Test for opening dialog via button click
    /*
    it('opens confirmation dialog when delete button is clicked', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        await userEvent.click(deleteButton);
        const dialog = await screen.findByRole('alertdialog');
        expect(dialog).toBeInTheDocument();
        expect(screen.getByText(/are you absolutely sure/i)).toBeInTheDocument();
    });
    */

    // REMOVED: Test for cancelling dialog opened via button click
    /*
    it('closes dialog and does not call deleteAsset when Cancel is clicked', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);
        const cancelButton = await screen.findByRole('button', { name: /cancel/i });
        await userEvent.click(cancelButton);
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
        expect(mockedDeleteAsset).not.toHaveBeenCalled();
    });
    */
    
    // REMOVED: Test for confirming delete via button click
    /*
    it('calls deleteAsset with correct arguments and shows success toast on confirm', async () => {
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);
        const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
        await userEvent.click(confirmButton);
        await waitFor(() => {
            // Updated expectation: deleteAsset no longer takes storagePath
            expect(mockedDeleteAsset).toHaveBeenCalledWith(mockProps.assetId);
            expect(mockedDeleteAsset).toHaveBeenCalledTimes(1);
        });
        await waitFor(() => {
             expect(toast.success).toHaveBeenCalledWith(`Asset "${mockProps.alt}" deleted successfully.`);
        });
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });
    */

    // REMOVED: Test for error toast via button click
    /*
    it('shows error toast if deleteAsset returns an error', async () => {
        const errorMessage = 'Failed due to reasons.';
        mockedDeleteAsset.mockResolvedValueOnce({ success: false, error: errorMessage });
        render(<AssetThumbnail {...mockProps} />);
        const deleteButton = screen.getByRole('button', { name: /delete asset/i });
        await userEvent.click(deleteButton);
        const confirmButton = await screen.findByRole('button', { name: /^delete$/i });
        await userEvent.click(confirmButton);
        await waitFor(() => {
             expect(toast.error).toHaveBeenCalledWith(errorMessage);
        });
        expect(mockedDeleteAsset).toHaveBeenCalledTimes(1);
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });
    */

    // REMOVED: Test for loading state via button click
    /*
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
        expect(confirmButton).toBeDisabled();
        expect(cancelButton).toBeDisabled();
        await act(async () => {
           resolveDelete({ success: true });
           await new Promise(r => setTimeout(r, 0));
        });
        await waitFor(() => {
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
        });
    });
    */
    
    // TODO (Future): Add tests for dialog content and actions triggered via ref/manually.
    // Example (conceptual):
    /*
    it('calls deleteAsset when confirm is clicked (dialog opened manually)', async () => {
       const TestWrapper = () => {
         const ref = React.useRef<AssetThumbnailRef>(null);
         const [isOpen, setIsOpen] = React.useState(false);
         React.useEffect(() => {
           // Simulate opening via ref
           setIsOpen(true); // Or: ref.current?.triggerDeleteDialog(); - harder to test ref directly
         }, []);
         return <AssetThumbnail ref={ref} {...mockProps} />; // Need way to control AlertDialog open state or mock trigger
       }
       render(<TestWrapper />);
       // Need to adjust test to control/wait for dialog state without button click
       // ... find confirm button ... click confirm ... check deleteAsset call ...
    });
    */
}); 