import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewFolderDialog } from './new-folder-dialog';
import '@testing-library/jest-dom';
import { type Folder } from '@/types/dam';

// Mock server action: createFolder
var mockActualCreateFolderAction = vi.fn();
vi.mock('@/lib/actions/dam/folder.actions', () => ({
  createFolder: mockActualCreateFolderAction,
}));

// Mock store: useFolderStore
const mockAddFolder = vi.fn();
vi.mock('@/lib/store/folderStore', () => ({
  useFolderStore: () => ({
    addFolder: mockAddFolder,
  }),
}));

// Mock router: next/navigation
const mockRouterPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock sonner: toast
var mockToastSuccess: ReturnType<typeof vi.fn>;
var mockToastError: ReturnType<typeof vi.fn>;
vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args),
  },
}));

// Mock useActionState
let currentMockState: { success: boolean; error?: string; folder?: Folder; folderId?: string } = {
  success: false,
  error: undefined,
};
let currentMockIsPending = false;
const mockSubmitFormAction = vi.fn();

vi.mock('react', async (importOriginal) => {
  const actualReact = await importOriginal<typeof React>();
  return {
    ...actualReact,
    useActionState: vi.fn((actionFnBeingWrapped, initialState) => {
      // actionFnBeingWrapped is the server action (e.g., mockActualCreateFolderAction)
      // initialState is the initial state for the action
      // The second element of the returned array is the function that the form calls upon submission.
      return [currentMockState, mockSubmitFormAction, currentMockIsPending]; 
    }),
  };
});


describe('NewFolderDialog', () => {
  beforeEach(() => {
    // Assign fresh mock functions for sonner here
    mockToastSuccess = vi.fn();
    mockToastError = vi.fn();
    
    vi.clearAllMocks(); // This will clear the newly assigned vi.fn() for toast, and others

    // Reset state for each test to ensure independence
    currentMockState = { success: false, error: undefined };
    currentMockIsPending = false;
    
    // Default mock implementation for the form submission action (can be overridden per test)
    mockSubmitFormAction.mockImplementation(async (formData: FormData) => {
      // This default implementation does nothing. 
      // Tests that expect state changes from the action need to provide a specific mock implementation.
    });
  });

  it('should render as a text button by default', () => {
    render(<NewFolderDialog currentFolderId="parent1" />);
    expect(screen.getByRole('button', { name: /New Folder/i })).toBeInTheDocument();
  });

  it('should render as an icon button when asIcon is true', () => {
    render(<NewFolderDialog currentFolderId="parent1" asIcon />);
    expect(screen.getByRole('button', { name: /New Folder/i })).toBeInTheDocument(); 
  });

  it('opens the dialog when trigger button is clicked', async () => {
    const user = userEvent.setup();
    render(<NewFolderDialog currentFolderId="parent1" />);
    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByText('Create New Folder')).toBeVisible();
  });

  it('closes the dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<NewFolderDialog currentFolderId="parent1" />);
    await user.click(screen.getByRole('button', { name: /New Folder/i })); 
    expect(screen.getByRole('dialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Cancel/i }));
    await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('includes parentFolderId in form data if currentFolderId is provided', async () => {
    const user = userEvent.setup();
    const parentFolderId = 'test-parent-id';
    render(<NewFolderDialog currentFolderId={parentFolderId} />);
    await user.click(screen.getByRole('button', { name: /New Folder/i })); 
    const input = screen.getByLabelText(/Name/i);
    await user.type(input, 'My New Folder');
    const createButton = screen.getByRole('button', { name: /Create Folder/i });
    // When createButton is clicked, the form's action (mockSubmitFormAction) is called.
    await user.click(createButton); 
    await waitFor(() => {
        // mockSubmitFormAction is the dispatch function returned by our mocked useActionState
        expect(mockSubmitFormAction).toHaveBeenCalled(); 
        const submittedFormData = mockSubmitFormAction.mock.calls[0][0] as FormData;
        expect(submittedFormData.get('name')).toBe('My New Folder');
        expect(submittedFormData.get('parentFolderId')).toBe(parentFolderId);
    });
  });

  it('does not include parentFolderId if currentFolderId is null', async () => {
    const user = userEvent.setup();
    render(<NewFolderDialog currentFolderId={null} />); 
    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.type(screen.getByLabelText(/Name/i), 'Root Level Folder');
    await user.click(screen.getByRole('button', { name: /Create Folder/i }));
    await waitFor(() => {
        expect(mockSubmitFormAction).toHaveBeenCalled();
        const submittedFormData = mockSubmitFormAction.mock.calls[0][0] as FormData;
        expect(submittedFormData.get('name')).toBe('Root Level Folder');
        expect(submittedFormData.get('parentFolderId')).toBeNull();
    });
  });

  it('handles successful folder creation', async () => {
    const user = userEvent.setup();
    const newFolderName = 'Successful Folder';
    const newFolderId = 'new-folder-123';
    const parentId = 'parent-abc';
    const mockNewFolderData: Folder = { 
      id: newFolderId, name: newFolderName, user_id: 'user-id', 
      organization_id: 'org-id', parent_folder_id: parentId, 
      created_at: new Date().toISOString(), type: 'folder',
    };

    mockSubmitFormAction.mockImplementationOnce(async (formData: FormData) => {
      // Simulate action: update global mock state variables
      currentMockIsPending = true;
      // Simulate async work for the action
      await new Promise(resolve => setTimeout(resolve, 0)); 
      currentMockState = { success: true, folder: mockNewFolderData, folderId: newFolderId, error: undefined };
      currentMockIsPending = false;
    });

    // Get rerender from the initial render call
    const { rerender } = render(<NewFolderDialog currentFolderId={parentId} />);    
    await user.click(screen.getByRole('button', { name: /New Folder/i })); // Open dialog
    await user.type(screen.getByLabelText(/Name/i), newFolderName);
    await user.click(screen.getByRole('button', { name: /Create Folder/i })); // Calls mockSubmitFormAction
    
    // After action, rerender the component. It will now use the updated global mock states.
    rerender(<NewFolderDialog currentFolderId={parentId} />);
    
    await waitFor(() => expect(mockToastSuccess).toHaveBeenCalledWith('Folder created successfully!'));
    await waitFor(() => expect(mockAddFolder).toHaveBeenCalledWith(mockNewFolderData));
    await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith(`/dam?folderId=${newFolderId}`));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('handles failed folder creation', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error on create';
    const { rerender } = render(<NewFolderDialog currentFolderId="parent-xyz" />);    
    await user.click(screen.getByRole('button', { name: /New Folder/i }));
    await user.type(screen.getByLabelText(/Name/i), 'Problematic Folder');

    mockSubmitFormAction.mockImplementationOnce(async (formData: FormData) => {
      currentMockIsPending = true;
      await new Promise(resolve => setTimeout(resolve, 0));
      currentMockState = { success: false, error: errorMessage, folder: undefined, folderId: undefined };
      currentMockIsPending = false;
    });

    await user.click(screen.getByRole('button', { name: /Create Folder/i }));
    rerender(<NewFolderDialog currentFolderId="parent-xyz" />);

    await waitFor(() => expect(mockToastError).toHaveBeenCalledWith(`Error: ${errorMessage}`));
    expect(screen.getByRole('dialog')).toBeVisible(); 
  });

  it('shows pending state correctly and submit button is disabled', async () => {
    const user = userEvent.setup();
    // For this test, we set the pending state *before* the crucial interaction.
    currentMockIsPending = true; // Set hook to be in pending state initially for this render

    const { rerender } = render(<NewFolderDialog currentFolderId="parent-123" />);    
    await user.click(screen.getByRole('button', { name: /New Folder/i })); // Open dialog
    await user.type(screen.getByLabelText(/Name/i), 'Pending Folder Test');
    
    // At this point, the component has rendered once with isPending = true from the mocked hook.
    // The button text and disabled state should reflect this.
    const submittingButton = screen.getByRole('button', { name: /Creating.../i });
    expect(submittingButton).toBeInTheDocument();
    expect(submittingButton).toBeDisabled();
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    expect(cancelButton).toBeDisabled();

    // Clean up global state for other tests
    currentMockIsPending = false;
  });

}); 