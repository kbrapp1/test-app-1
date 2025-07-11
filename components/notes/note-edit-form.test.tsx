import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NoteEditForm } from "./note-edit-form";
import type { Note } from "@/types/notes";

// --- Mocks ---
const mockEditAction = vi.fn();
const mockOnCancel = vi.fn();
const mockOnSaveSuccess = vi.fn();

// Mock the server action
vi.mock("@/lib/actions/notes", () => ({
  editNoteAction: vi.fn(),
}));

// Mock the toast hook from the correct path
const mockToastFn = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToastFn }),
}));

// --- Test Setup ---
const mockInitialNote: Note = {
    id: 'edit-note-456',
    title: 'Initial Title',
    content: 'Initial Content',
    color_class: 'bg-blue-200',
    updated_at: new Date().toISOString(),
    position: 1,
    organization_id: 'test-org-123',
};

const defaultProps = {
    initialNote: mockInitialNote,
    editAction: mockEditAction,
    onCancel: mockOnCancel,
    onSaveSuccess: mockOnSaveSuccess,
    currentInputBg: 'bg-blue-100',
    currentBorder: 'border-blue-300',
    currentFocusRing: 'focus:ring-blue-400',
    currentTextColor: 'text-blue-900',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset action mock to resolve successfully by default
  mockEditAction.mockResolvedValue({ success: true, message: 'Updated from test' });
  mockToastFn.mockClear();
});

// --- Tests ---
describe('NoteEditForm', () => {
    it('renders with initial values and focuses title input', () => {
        render(<NoteEditForm {...defaultProps} />);

        const titleInput = screen.getByPlaceholderText(/title/i);
        const contentTextarea = screen.getByPlaceholderText(/note content.../i);

        expect(titleInput).toHaveValue(mockInitialNote.title);
        expect(contentTextarea).toHaveValue(mockInitialNote.content);
        expect(titleInput).toHaveFocus(); // Check initial focus

        expect(screen.getByRole('button', { name: /save note/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();
    });

    it('updates input values when typing', async () => {
        const user = userEvent.setup();
        render(<NoteEditForm {...defaultProps} />);

        const titleInput = screen.getByPlaceholderText(/title/i);
        const contentTextarea = screen.getByPlaceholderText(/note content.../i);

        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');
        await user.clear(contentTextarea);
        await user.type(contentTextarea, 'Updated Content');

        expect(titleInput).toHaveValue('Updated Title');
        expect(contentTextarea).toHaveValue('Updated Content');
    });

    it('calls onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<NoteEditForm {...defaultProps} />);

        await user.click(screen.getByRole('button', { name: /cancel edit/i }));

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockEditAction).not.toHaveBeenCalled(); // Ensure save wasn't called
    });

    it('calls editAction with updated data on save', async () => {
        const user = userEvent.setup();
        render(<NoteEditForm {...defaultProps} />);
        const updatedTitle = 'Saved Title';
        const updatedContent = 'Saved Content';

        // Edit fields
        await user.clear(screen.getByPlaceholderText(/title/i));
        await user.type(screen.getByPlaceholderText(/title/i), updatedTitle);
        await user.clear(screen.getByPlaceholderText(/note content.../i));
        await user.type(screen.getByPlaceholderText(/note content.../i), updatedContent);

        // Submit form
        const saveButton = screen.getByRole('button', { name: /save note/i });
        await act(async () => {
            await user.click(saveButton);
        });

        expect(mockEditAction).toHaveBeenCalledTimes(1);
        const formData = mockEditAction.mock.calls[0][1] as FormData; // Action called via form, FormData is arg 1
        expect(formData.get('note_id')).toBe(mockInitialNote.id);
        expect(formData.get('title')).toBe(updatedTitle);
        expect(formData.get('content')).toBe(updatedContent);
        expect(formData.get('color_class')).toBe(mockInitialNote.color_class); // Ensure hidden color is passed
    });

    it('shows success toast and calls onSaveSuccess on successful edit', async () => {
        const user = userEvent.setup();
        const successMessage = 'Note successfully saved!';
        mockEditAction.mockResolvedValueOnce({ success: true, message: successMessage });
        render(<NoteEditForm {...defaultProps} />);

        await user.click(screen.getByRole('button', { name: /save note/i }));

        await waitFor(() => {
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Success',
                description: successMessage,
                variant: 'default',
            }));
            expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1);
        });
    });

    it('shows error toast on failed edit and does not call onSaveSuccess', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Failed to update note.';
        mockEditAction.mockResolvedValueOnce({ success: false, message: errorMessage });
        render(<NoteEditForm {...defaultProps} />);

        await user.click(screen.getByRole('button', { name: /save note/i }));

        await waitFor(() => {
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            }));
            expect(mockOnSaveSuccess).not.toHaveBeenCalled();
        });
    });
}); 