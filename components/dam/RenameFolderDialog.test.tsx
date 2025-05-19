/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RenameFolderDialog } from './RenameFolderDialog';
import type { Folder } from '@/types/dam';

// --- Mocks ---

// Spy for useFormStatus, to be controlled by tests
const actualMockUseFormStatusSpy = vi.fn();

vi.mock('react-dom', async (importOriginal) => {
  const original = await importOriginal<typeof import('react-dom')>();
  return {
    ...original,
    useFormStatus: (...args: any[]) => actualMockUseFormStatusSpy(...args),
  };
});

// Mock server action updateFolder
const mockUpdateFolderAction = vi.fn();
vi.mock('@/lib/actions/dam/folder.actions', () => ({
  updateFolder: vi.fn((initialState, formData) => mockUpdateFolderAction(initialState, formData)),
}));

// Spies for sonner toast
const actualMockToastSuccessSpy = vi.fn();
const actualMockToastErrorSpy = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => actualMockToastSuccessSpy(...args),
    error: (...args: any[]) => actualMockToastErrorSpy(...args),
  },
}));

// Mock useFolderStore
const mockUpdateFolderNodeInStore = vi.fn();
vi.mock('@/lib/store/folderStore', () => ({
  useFolderStore: vi.fn(() => ({
    updateFolderNodeInStore: mockUpdateFolderNodeInStore,
  })),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  folderId: 'folder-123',
  currentName: 'Original Name',
};

const mockUpdatedFolder: Folder = {
  id: defaultProps.folderId,
  name: 'New Valid Name',
  parent_folder_id: null,
  user_id: 'user-abc',
  organization_id: 'org-xyz',
  created_at: new Date().toISOString(),
  type: 'folder',
  ownerName: 'Test User',
};

const renderDialog = (props: Partial<typeof defaultProps> = {}) => {
  const user = userEvent.setup();
  const fullProps = { ...defaultProps, ...props };
  const renderResult = render(<RenameFolderDialog {...fullProps} />);
  return { user, ...renderResult, rerender: (newProps: Partial<typeof defaultProps> = {}) => {
      renderResult.rerender(<RenameFolderDialog {...{ ...fullProps, ...newProps}} />);
    }
  };
};

describe('RenameFolderDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actualMockUseFormStatusSpy.mockReturnValue({ pending: false, data: null, method: null, action: null });
    // actualMockToastSuccessSpy and actualMockToastErrorSpy are cleared by vi.clearAllMocks()
  });

  it('should not render when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render the dialog with correct title and initial values when isOpen is true', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Rename Folder')).toBeInTheDocument();
    expect(screen.getByLabelText('New Name')).toHaveValue(defaultProps.currentName);
    expect(screen.getByText(/The current name is "Original Name"/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rename' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('should update input value on change', async () => {
    const { user } = renderDialog();
    const input = screen.getByLabelText('New Name');
    await user.clear(input);
    await user.type(input, 'New Folder Name');
    expect(input).toHaveValue('New Folder Name');
  });

  it('should call onClose when Cancel button is clicked', async () => {
    const { user } = renderDialog();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
  
  it('should call onClose when the dialog is closed via X button or overlay (simulated by onOpenChange)', async () => {
    renderDialog();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton); 
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should reset the input field to the new currentName when dialog is re-opened', async () => {
    const { user, rerender } = renderDialog({ isOpen: true, currentName: "Initial Name" });
    let input = screen.getByLabelText('New Name') as HTMLInputElement;
    expect(input.value).toBe("Initial Name");

    // User types something
    await user.clear(input);
    await user.type(input, "User Edited Name");
    expect(input.value).toBe("User Edited Name");

    // Close the dialog
    rerender({ isOpen: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Re-open the dialog with a potentially different currentName
    rerender({ isOpen: true, currentName: "Updated Prop Name" });
    
    // Input should now be reset to "Updated Prop Name"
    input = screen.getByLabelText('New Name') as HTMLInputElement; // Re-query
    expect(input.value).toBe("Updated Prop Name");
  });


  describe('Form Submission with useActionState', () => {
    it('should call updateFolder action with correct data and show success toast on successful submission', async () => {
      mockUpdateFolderAction.mockResolvedValueOnce({ success: true, folder: mockUpdatedFolder });
      const { user } = renderDialog();
      
      const input = screen.getByLabelText('New Name');
      await user.clear(input);
      await user.type(input, mockUpdatedFolder.name);

      const renameButton = screen.getByRole('button', { name: 'Rename' });
      await user.click(renameButton);

      await waitFor(() => {
        expect(mockUpdateFolderAction).toHaveBeenCalledTimes(1);
        const callArgs = mockUpdateFolderAction.mock.calls[0];
        const formData = callArgs[1] as FormData; // Second argument to updateFolder (initialState, formData)
        // The component's dispatchAction appends folderId and newName to the formData
        // So, newName on formData comes from the input field's state `name`,
        // which is set by user.type(input, mockUpdatedFolder.name)
        expect(formData.get('folderId')).toBe(defaultProps.folderId);
        expect(formData.get('newName')).toBe(mockUpdatedFolder.name);
      });
      
      await waitFor(() => {
        expect(actualMockToastSuccessSpy).toHaveBeenCalledWith(
          `Folder "${defaultProps.currentName}" has been successfully renamed to "${mockUpdatedFolder.name}".`
        );
      });
      await waitFor(() => {
        expect(mockUpdateFolderNodeInStore).toHaveBeenCalledWith(mockUpdatedFolder);
      });
      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should show pending state on submit button during submission', async () => {
      const { user } = renderDialog();
      const renameButton = screen.getByRole('button', { name: 'Rename' });
    
      // This promise will resolve when the mocked action completes.
      let actionResolver: (value: any) => void;
      const actionPromise = new Promise(resolve => { actionResolver = resolve; });
    
      mockUpdateFolderAction.mockImplementationOnce(async () => {
        actualMockUseFormStatusSpy.mockReturnValue({ pending: true, data: null, method: null, action: null });
        // Simulate async work. The component should re-render due to pending state change.
        await new Promise(r => setTimeout(r, 50)); 
        const result = { success: true, folder: mockUpdatedFolder };
        actionResolver(result); // Signal that the action has logically completed for the test.
        actualMockUseFormStatusSpy.mockReturnValue({ pending: false, data: null, method: null, action: null });
        return result;
      });
    
      // Click the button to trigger the form submission. Don't await this directly if we want to check intermediate state.
      user.click(renameButton);
    
      // Check for pending state: useFormStatus should have updated the SubmitButton
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Renaming...' })).toBeDisabled();
      });
    
      // Wait for the mocked action to fully complete its simulated work and for related state updates.
      await actionPromise; 
      
      // Check for non-pending state after completion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Rename' })).not.toBeDisabled();
      });
    });

    it('should call updateFolder action and show error toast on failed submission', async () => {
      const errorMessage = 'Failed to rename folder.';
      mockUpdateFolderAction.mockResolvedValueOnce({ success: false, error: errorMessage });
      
      const { user } = renderDialog();
      const input = screen.getByLabelText('New Name');
      await user.type(input, 'Attempted Name');
      const renameButton = screen.getByRole('button', { name: 'Rename' });
      
      await user.click(renameButton);

      await waitFor(() => {
        expect(actualMockToastErrorSpy).toHaveBeenCalledWith(errorMessage);
      });
      expect(mockUpdateFolderNodeInStore).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
}); 