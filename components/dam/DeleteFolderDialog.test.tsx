/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { DeleteFolderDialog } from './DeleteFolderDialog'; // Corrected component name
import '@testing-library/jest-dom';
import { useFolderStore } from '@/lib/store/folderStore';
import * as folderActions from '@/lib/actions/dam/folder.actions';
import { Folder } from '@/types/dam';
import { type Mock } from 'vitest'; // Import Mock type

// Mock an actual folder object for testing
const mockFolder: Folder = {
  id: 'folder123',
  name: 'Test Folder to Delete',
  user_id: 'user123',
  organization_id: 'org123',
  created_at: new Date().toISOString(),
  type: 'folder',
  parent_folder_id: null,
};

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ 
    push: mockRouterPush,
    refresh: mockRouterRefresh,
  }),
}));

// Mock sonner
var mockToastSuccess = vi.fn();
var mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (message: string) => mockToastSuccess(message),
    error: (message: string) => mockToastError(message),
  },
}));

// Mock useFolderStore
const mockRemoveFolder = vi.fn();
vi.mock('@/lib/store/folderStore', () => ({
  useFolderStore: vi.fn(() => ({ removeFolder: mockRemoveFolder })),
}));

// Mock server action deleteFolder
// This will be the actual function passed to useActionState in the component
var mockActualDeleteFolderAction = vi.fn();
vi.mock('@/lib/actions/dam/folder.actions', async (importOriginal) => {
  const actual = await importOriginal<typeof folderActions>();
  return {
    ...actual,
    deleteFolder: (prevState: any, formData: FormData) => mockActualDeleteFolderAction(prevState, formData),
  };
});

// Mock for React.useActionState
let currentMockState: any = { success: false, error: undefined, folderId: undefined, parentFolderId: undefined };
let currentMockIsPending = false;
const mockSubmitFormAction = vi.fn((payload: FormData) => {
  // This function simulates what useActionState's dispatch would do.
  // It should call the mockActualDeleteFolderAction and update currentMockState/currentMockIsPending.
});

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useActionState: vi.fn(<S, P>(
      action: (state: S, payload: P) => Promise<S>,
      initialState: S,
      permalink?: string
    ) => {
      // The first element is the state, the second is the dispatch function, the third is isPending
      return [currentMockState, mockSubmitFormAction, currentMockIsPending];
    }),
  };
});

describe('DeleteFolderDialog', () => {
  let mockOnClose: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn();

    // Reset mocks for useActionState for each test
    currentMockState = { success: false, error: undefined, folderId: undefined, parentFolderId: undefined };
    currentMockIsPending = false;
    mockActualDeleteFolderAction.mockImplementation(async (prevState, formData) => {
      // Default to a success response for the action itself
      const folderId = formData.get('folderId') as string;
      return { success: true, folderId: folderId, parentFolderId: mockFolder.parent_folder_id };
    });
    mockSubmitFormAction.mockImplementation(async (formData: FormData) => {
      currentMockIsPending = true;
      // Simulate the call to the actual action
      const result = await mockActualDeleteFolderAction(currentMockState, formData);
      currentMockState = result;
      currentMockIsPending = false;
      // Re-render or state update simulation will be handled in tests
    });

    // Reset toast mocks with fresh vi.fn() for each test
    mockToastSuccess = vi.fn();
    mockToastError = vi.fn();

    // Ensure useFolderStore mock is reset if necessary
    (useFolderStore as unknown as Mock).mockReturnValue({ removeFolder: mockRemoveFolder });
  });

  it('should render null if isOpen is false', () => {
    render(
      <DeleteFolderDialog
        isOpen={false}
        onClose={mockOnClose}
        folderId={mockFolder.id}
        folderName={mockFolder.name}
      />
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should render the dialog if isOpen is true', () => {
    render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Delete Folder')).toBeInTheDocument();
    expect(screen.getByText(`Are you sure you want to delete the folder "${mockFolder.name}"? This action cannot be undone.`)).toBeInTheDocument();
  });

  it('should call onClose when the cancel button is clicked', () => {
    render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when the close (x) button is clicked', () => {
    render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    // Assuming the close button is within the dialog and has a common aria-label or role
    // For ShadCN/Radix, it might be a button with an X icon.
    // If it's just a DialogClose trigger, we test clicking it.
    // Let's assume it's a button with aria-label "Close"
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call deleteFolder action with folderId and handle pending state', async () => {
    currentMockIsPending = false; // Initial pending state before action
    const { rerender } = render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    expect(deleteButton).not.toBeDisabled();
    expect(deleteButton).toHaveTextContent('Delete');

    mockSubmitFormAction.mockImplementationOnce(async (formData: FormData) => {
      currentMockIsPending = true;
      rerender(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />); // Trigger re-render for pending state
      // The actual call to mockActualDeleteFolderAction and state update is deferred in this test part
    });

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Check that the mockSubmitFormAction was called, which kicks off the process
    expect(mockSubmitFormAction).toHaveBeenCalledTimes(1);
    const submittedFormData = mockSubmitFormAction.mock.calls[0][0] as FormData;
    expect(submittedFormData.get('folderId')).toBe(mockFolder.id);

    // Check pending state UI (button disabled and text changes)
    // This rerender should pick up the new currentMockIsPending value due to the setup in mockSubmitFormAction
    expect(screen.getByRole('button', { name: /Deleting.../i })).toBeDisabled();

    // Now simulate completion of the action for cleanup, if necessary
    currentMockIsPending = false;
    currentMockState = { success: true, folderId: mockFolder.id, parentFolderId: mockFolder.parent_folder_id };
    rerender(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
  });

  it('should handle successful folder deletion', async () => {
    // Set up the mock action to return success
    mockActualDeleteFolderAction.mockImplementation(async (prevState, formData) => {
      return { success: true, folderId: mockFolder.id, parentFolderId: mockFolder.parent_folder_id };
    });
    
    // Redefine mockSubmitFormAction for this specific test to simulate full flow
    mockSubmitFormAction.mockImplementation(async (formData: FormData) => {
      currentMockIsPending = true;
      // In a real scenario, useActionState would re-render. We simulate this.
      const result = await mockActualDeleteFolderAction(currentMockState, formData);
      currentMockState = result;
      currentMockIsPending = false;
    });

    const { rerender } = render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    const deleteButton = screen.getByRole('button', { name: /Delete/i });

    await act(async () => {
      fireEvent.click(deleteButton);
      // Simulate the state update propagation that useActionState handles
      // by waiting for our mockSubmitFormAction to resolve and then re-rendering.
      await mockSubmitFormAction.mock.results[0].value; // Wait for the promise from mockSubmitFormAction
      rerender(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    });

    // Wait for effects to run
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith(`Folder "${mockFolder.name}" deleted successfully.`);
    });
    expect(mockRemoveFolder).toHaveBeenCalledWith(mockFolder.id);
    expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle failed folder deletion', async () => {
    const errorMessage = 'Failed to delete folder.';
    // Set up the mock action to return an error
    mockActualDeleteFolderAction.mockImplementation(async (prevState, formData) => {
      return { success: false, error: errorMessage };
    });

    // Redefine mockSubmitFormAction for this specific test
    mockSubmitFormAction.mockImplementation(async (formData: FormData) => {
      currentMockIsPending = true;
      const result = await mockActualDeleteFolderAction(currentMockState, formData);
      currentMockState = result;
      currentMockIsPending = false;
    });

    const { rerender } = render(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    const deleteButton = screen.getByRole('button', { name: /Delete/i });

    await act(async () => {
      fireEvent.click(deleteButton);
      await mockSubmitFormAction.mock.results[0].value; 
      rerender(<DeleteFolderDialog isOpen={true} onClose={mockOnClose} folderId={mockFolder.id} folderName={mockFolder.name} />);
    });

    await waitFor(() => {
      // The component prepends "Error: " to the toast message
      expect(mockToastError).toHaveBeenCalledWith(`Error: ${errorMessage}`);
    });
    expect(mockRemoveFolder).not.toHaveBeenCalled();
    expect(mockRouterRefresh).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled(); // Dialog should remain open on error
    expect(screen.getByRole('button', { name: /Delete/i })).not.toBeDisabled(); // Button should be re-enabled
  });
}); 