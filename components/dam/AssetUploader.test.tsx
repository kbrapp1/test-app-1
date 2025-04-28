import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { useDropzone } from 'react-dropzone'; // Import the hook itself
import { AssetUploader } from './AssetUploader';
import { toast } from 'sonner'; // Import the mocked toast object
import { createClient } from '@/lib/supabase/client'; // Import the actual function to get its type

// --- Mocking Setup ---

// Mock DataTransfer for jsdom environment
class MockDataTransfer {
    items = {
        add: vi.fn(),
        length: 0,
        [Symbol.iterator]: vi.fn(),
    };
    files = [];
    setData = vi.fn();
    getData = vi.fn();
    clearData = vi.fn();
    setDragImage = vi.fn();
}
global.DataTransfer = MockDataTransfer as any;

// Mock the Supabase browser client
const mockGetUser = vi.fn();
const mockSupabaseClient = {
    auth: {
        getUser: mockGetUser,
    },
    // Add other methods if needed, e.g., storage
    storage: {
        from: vi.fn(() => ({
            // Mock storage methods if used directly by AssetUploader
        })),
    },
};
vi.mock('@/lib/supabase/client', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock the sonner toast function (define mocks inside factory)
vi.mock('sonner', () => {
    const mockSuccess = vi.fn();
    const mockError = vi.fn();
    // Return the object structure that the actual library exports
    return {
        toast: {
            success: mockSuccess,
            error: mockError,
            // Add other methods if your code uses them (e.g., message, info, warning)
        },
    };
});

// Mock global fetch
global.fetch = vi.fn();

// Mock react-dropzone
vi.mock('react-dropzone', async (importOriginal) => {
  // Import the original module to potentially use parts of it
  const actual = await importOriginal<typeof import('react-dropzone')>();
  // Return the mock implementation
  return {
    ...actual, // Keep original exports if needed
    useDropzone: vi.fn(), // Define the mock function directly here
  };
});

// Helper to create a File object
function createFile(name: string, size: number, type: string): File {
    // Ensure size is at least 1 for blob creation if size is 0
    const actualSize = Math.max(size, 1);
    const content = 'x'.repeat(actualSize);
    const file = new File([content], name, { type });
    // Manually set the size property if the intended size was 0
    if (size === 0) {
        Object.defineProperty(file, 'size', {
            value: 0,
            writable: false,
        });
    }
    return file;
}

// --- Test Suite ---

describe('AssetUploader Component', () => {
    const mockUser = { id: 'user-test-123', email: 'test@example.com' };
    let lastOnDropCallback: ((acceptedFiles: File[], fileRejections: any[], event: Event) => void) | null = null;

    beforeEach(() => {
        vi.clearAllMocks();
        lastOnDropCallback = null; // Reset callback catcher

        // Default Supabase mock implementation
        mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

        // Default react-dropzone mock implementation - use the imported hook
        const mockOpenFn = vi.fn();
        (useDropzone as Mock).mockImplementation(({ onDrop }) => {
            // Store the latest onDrop callback provided by the component
            // Wrap the actual onDrop with a spy before storing it
            lastOnDropCallback = onDrop ? vi.fn(onDrop) : null;

            // Simulate file selection via input triggering onDrop
            // Define a type for the props that might be passed
            type InputPropsArgs = {
                onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
                [key: string]: any; // Allow other properties
            };
            const inputProps = (props: InputPropsArgs = {}) => ({
                ...props,
                type: 'file',
                'data-testid': 'dropzone-input',
                multiple: true,
                accept: 'image/*',
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    const files = Array.from(event.target.files || []);
                    // Call the stored onDrop callback when input changes
                    if (lastOnDropCallback) {
                        // TODO: Implement rejection logic if needed based on ACCEPTED_IMAGE_TYPES
                        // Pass the native event which is type Event
                        lastOnDropCallback(files, [], event.nativeEvent);
                    }
                    // Call original onChange if provided
                    if (props.onChange) {
                        props.onChange(event);
                    }
                }
            });

            return {
                getRootProps: vi.fn((props = {}) => ({ ...props, 'data-testid': 'dropzone-root' })),
                getInputProps: inputProps, // Use our enhanced inputProps
                isDragActive: false,
                isDragAccept: false,
                isDragReject: false,
                open: mockOpenFn, // Use the specific mock for open
            };
        });

        // Default fetch mock
        (fetch as Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, message: 'Upload successful', data: [{ name: 'test.png' }] }),
        });

        // Clear sonner mocks
        (toast.success as Mock).mockClear();
        (toast.error as Mock).mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should render the dropzone and buttons', async () => {
        render(<AssetUploader />);
        // Match exact text including HTML entity
        expect(screen.getByText("Drag &apos;n&apos; drop some files here, or click the button below")).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Select Files/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upload Files/i })).toBeInTheDocument();
        await waitFor(() => {
            expect(mockGetUser).toHaveBeenCalledTimes(1); // User fetch happens on mount
        });
        expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();
    });

    it('should fetch user on mount and enable upload button after file selection', async () => {
        const user = userEvent.setup();
        render(<AssetUploader />);
        expect(mockGetUser).toHaveBeenCalledTimes(1);

        await waitFor(() => {
             expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();
        });

        // Simulate selecting a file using the input
        const fileInput = screen.getByTestId('dropzone-input');
        const testFile = createFile('select.png', 100, 'image/png');
        await user.upload(fileInput, testFile); // This will trigger the mocked onChange -> onDrop

        // Wait for the component to update based on the file selection
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled();
        });
         // Optionally, check if file name is displayed
        await waitFor(() => {
            // File size calculation might be slightly different due to create file helper, adjust if needed
             expect(screen.getByText(/select.png - 0.10 KB/i)).toBeInTheDocument();
        });
    });

    it('should display selected file names and sizes', async () => {
        const user = userEvent.setup();
        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled()); // Ensure user fetch completes

        const fileInput = screen.getByTestId('dropzone-input');
        const file1 = createFile('image1.jpg', 1024 * 5, 'image/jpeg'); // 5 KB
        // Test with a slightly larger file size for MB calculation if needed
        const file2 = createFile('image2.png', 1024 * 100, 'image/png'); // 100 KB

        await user.upload(fileInput, [file1, file2]);

        await waitFor(() => {
            expect(screen.getByText(/image1\.jpg - 5\.00 KB/i)).toBeInTheDocument();
             // Adjusted expected size display based on common formatting
            expect(screen.getByText(/image2\.png - 100\.00 KB/i)).toBeInTheDocument();
        });
    });

    it('should call fetch with FormData on submit with valid files and user', async () => {
        const user = userEvent.setup();
        render(<AssetUploader />);

        // Wait for user to load
        await waitFor(() => {
            expect(mockGetUser).toHaveBeenCalled();
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();
        });

        // Simulate file selection
        const fileInput = screen.getByTestId('dropzone-input');
        const testFile = createFile('test.jpg', 1024, 'image/jpeg');
        await user.upload(fileInput, testFile);

         // Wait for file state to update and button to enable
        await waitFor(() => {
            expect(screen.getByText(/test.jpg - 1.00 KB/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled();
        });

        // Trigger submit
        await user.click(screen.getByRole('button', { name: /Upload Files/i }));

        // Verify fetch was called
        await waitFor(() => {
            expect(fetch).toHaveBeenCalledTimes(1);
            expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/dam\/upload/), expect.anything());

            // Check FormData content
            const fetchOptions = (fetch as Mock).mock.calls[0][1];
            expect(fetchOptions.method).toBe('POST');
            const formData = fetchOptions.body as FormData;
            expect(formData.get('userId')).toBe(mockUser.id);
            const files = formData.getAll('files');
            expect(files.length).toBe(1);
            expect(files[0]).toBeInstanceOf(File);
            expect((files[0] as File).name).toBe('test.jpg');
            // Size might be slightly off due to mock file creation, check within a range or use the exact mock size
            expect((files[0] as File).size).toBe(1024);
        });

        // Verify success toast
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledTimes(1);
            expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Upload Successful'), expect.any(Object));
        });

         // Check if files are cleared after successful upload
        await waitFor(() => {
            expect(screen.queryByText(/test.jpg - 1.00 KB/i)).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();
        });
    });

    it('should show loading state on upload button during submission', async () => {
        const user = userEvent.setup();
        // Make fetch take time
        let resolveFetch: (value: unknown) => void;
        const fetchPromise = new Promise(resolve => { resolveFetch = resolve; });
        (fetch as Mock).mockImplementationOnce(() => fetchPromise);

        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled()); // Allow user fetch

        const fileInput = screen.getByTestId('dropzone-input');
        const testFile = createFile('loading.png', 500, 'image/png');
        await user.upload(fileInput, testFile);
        await waitFor(() => expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled());

        const submitButton = screen.getByRole('button', { name: /Upload Files/i });
        await user.click(submitButton);

        // Check for loading state immediately after click
        await waitFor(() => { // Use waitFor as state update might not be synchronous
             expect(submitButton).toHaveTextContent(/Uploading.../i);
             expect(submitButton).toBeDisabled();
        });

        // Resolve the fetch mock
        resolveFetch!({ // Use non-null assertion as it's guaranteed to be assigned
             ok: true,
             json: async () => ({ success: true, message: 'Loaded', data: [] }),
         });

        // Wait for fetch mock to resolve and subsequent state updates
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled(); // Check success toast was called
        });

        // Check button state after completion
         await waitFor(() => {
            expect(submitButton).toHaveTextContent(/Upload Files/i);
            expect(submitButton).toBeDisabled(); // Still disabled because files state should clear
         });
    });

    it('should display error toast if fetch fails', async () => {
        const user = userEvent.setup();
        const errorMessage = 'Network Error';
        (fetch as Mock).mockRejectedValueOnce(new Error(errorMessage));

        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled()); // Allow user fetch

        const fileInput = screen.getByTestId('dropzone-input');
        const testFile = createFile('fail.gif', 500, 'image/gif');
        await user.upload(fileInput, testFile);
        await waitFor(() => expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled());

        const submitButton = screen.getByRole('button', { name: /Upload Files/i });
        await user.click(submitButton);

        // Verify error toast using imported mock
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith('Upload Failed', expect.objectContaining({
                description: errorMessage
            }));
        });
         // Check button is re-enabled and not loading after error
        await waitFor(() => {
            expect(submitButton).toHaveTextContent(/Upload Files/i);
            expect(submitButton).toBeEnabled(); // Re-enabled after error
        });

        // Check that component error state is updated (optional, based on component implementation)
        await waitFor(() => {
            expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
        });
    });

    it('should display error toast if API returns error', async () => {
        const user = userEvent.setup();
        const apiErrorMessage = 'Invalid file type';
        (fetch as Mock).mockResolvedValueOnce({
            ok: false, // Simulate API error response
            status: 400, // Bad Request
            json: async () => ({ success: false, message: apiErrorMessage, error: apiErrorMessage }), // Simulate error structure
        });

        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled()); // Allow user fetch

        const fileInput = screen.getByTestId('dropzone-input');
        const testFile = createFile('api-fail.png', 500, 'image/png');
        await user.upload(fileInput, testFile);
        await waitFor(() => expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled());

        const submitButton = screen.getByRole('button', { name: /Upload Files/i });
        await user.click(submitButton);

        // Verify error toast
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledTimes(1);
            expect(toast.error).toHaveBeenCalledWith('Upload Failed', expect.objectContaining({
                description: apiErrorMessage,
            }));
        });

         // Check button is re-enabled and not loading after API error
        await waitFor(() => {
             expect(submitButton).toHaveTextContent(/Upload Files/i);
             expect(submitButton).toBeEnabled(); // Re-enabled after API error
         });
         // Check that component error state is updated
        await waitFor(() => {
            expect(screen.getByText(`Error: ${apiErrorMessage}`)).toBeInTheDocument();
        });
    });

    it('should disable upload button if user session fails to load', async () => {
        // Override the default getUser mock for this specific test
        mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error', name: 'AuthApiError', status: 401 } });

        render(<AssetUploader />);

        // Wait for the component to attempt user fetch and handle the error
        await waitFor(() => {
            expect(mockGetUser).toHaveBeenCalledTimes(1);
        });

        // Verify the upload button remains disabled because there's no user
        expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();

        // Try selecting a file - button should still be disabled
        const user = userEvent.setup();
        const fileInput = screen.getByTestId('dropzone-input');
        // Use an accepted file type even though it shouldn't matter
        const testFile = createFile('no-user.png', 100, 'image/png');
        await user.upload(fileInput, testFile);

        await waitFor(() => {
            // Even after file selection, the button remains disabled
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeDisabled();
        });
    });

    it('should open file dialog when "Select Files" button is clicked', async () => {
        const user = userEvent.setup();
        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled());

        const selectButton = screen.getByRole('button', { name: /Select Files/i });
        await user.click(selectButton);

        // Check if the mock open function was called
        // Need to access the mock function returned by the last useDropzone mock call
        const { open: mockedOpenFromHook } = (useDropzone as Mock).mock.results[0].value;
        expect(mockedOpenFromHook).toHaveBeenCalledTimes(1);
    });

    it('should handle drop event correctly', async () => {
        // This test requires manually triggering the dropzone's internal logic
        render(<AssetUploader />);
        await waitFor(() => expect(mockGetUser).toHaveBeenCalled());

        const file1 = createFile('drop1.gif', 300, 'image/gif');
        const file2 = createFile('drop2.webp', 400, 'image/webp');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file1 as any); // Use basic mock
        dataTransfer.items.add(file2 as any);
        // Assign files directly to the files property for jsdom simulation
        Object.defineProperty(dataTransfer, 'files', {
            value: [file1, file2],
            writable: false,
        });

        // Simulate dropping files onto the root element
        const dropzoneRoot = screen.getByTestId('dropzone-root');
        fireEvent.drop(dropzoneRoot, { dataTransfer });

        // Manually trigger the captured onDrop callback since fireEvent.drop might not trigger it via the hook mock
        if (lastOnDropCallback) {
            // Create a basic mock event object
            const mockEvent = new Event('drop') as any; // Cast to allow adding properties
            mockEvent.dataTransfer = dataTransfer;
            lastOnDropCallback([file1, file2], [], mockEvent);
        } else {
            throw new Error('onDrop callback was not captured by the mock');
        }

        // Check if the files are reflected in the component's UI
        await waitFor(() => {
            // Adjust expected KB values based on actual component rendering
            expect(screen.getByText(/drop1\.gif - 0\.29 KB/i)).toBeInTheDocument();
            expect(screen.getByText(/drop2\.webp - 0\.39 KB/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Upload Files/i })).toBeEnabled();
        });
    });
}); 