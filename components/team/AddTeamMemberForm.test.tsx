import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTeamMemberForm } from './AddTeamMemberForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import React from 'react';
// Import constants from the shared schema file
import { MAX_FILE_SIZE } from '@/lib/schemas/team';

// --- Mocks ---
// Mock the toast hook
const mockToastFn = vi.fn();
vi.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToastFn }),
}));

// Mock next/navigation
const mockRouterRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRouterRefresh,
    push: vi.fn(), // Add other router methods if your component uses them
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    isFallback: false,
    basePath: '',
    locale: undefined,
    locales: [],
    defaultLocale: 'en',
    isReady: true,
    isPreview: false,
    isLocaleDomain: false,
    // Add any other properties/methods your component might expect from router
  }),
  usePathname: () => '/', // Mock usePathname if used directly or indirectly
  useSearchParams: () => new URLSearchParams(), // Mock useSearchParams if used
}));

// Mock fetch - override MSW for this component test
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next/image
vi.mock('next/image', () => ({
    default: (props: { src: string; alt: string; width?: number; height?: number; priority?: boolean; className?: string }) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={props.src} alt={props.alt || ""} className={props.className} />;
    },
}));
// --- End Mocks ---

// Helper to create a File object
const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File([new Array(size).join('a')], name, { type });
    return file;
};

// Helper function to render the form within the Dialog context
const renderFormInDialog = (props = {}) => {
    return render(
        <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Test Dialog</DialogTitle>
                    <DialogDescription>Test dialog description.</DialogDescription>
                 </DialogHeader>
                <AddTeamMemberForm {...props} />
            </DialogContent>
        </Dialog>
    );
};

describe('AddTeamMemberForm', () => {
    const onSuccessMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockRouterRefresh.mockClear();
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        });
        mockToastFn.mockClear();
    });

    it('renders all form fields', () => {
        renderFormInDialog();
        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Primary Image/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Secondary \(Hover\) Image/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Add Member/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('shows validation errors for required fields', async () => {
        renderFormInDialog();
        const submitButton = screen.getByRole('button', { name: /Add Member/i });
        
        await userEvent.click(submitButton);

        // Expect the specific "Image is required." message from superRefine
        await waitFor(() => {
             expect(screen.getByText('Name is required')).toBeInTheDocument();
             expect(screen.getByText('Title is required')).toBeInTheDocument();
             expect(screen.getAllByText('Image is required.')).toHaveLength(2); 
        }, { timeout: 2000 }); 

        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('shows validation error for invalid file type', async () => {
        renderFormInDialog();
        // Fill required text fields so zod validation passes name/title
        await userEvent.type(screen.getByLabelText(/Name/i), 'Test Name');
        await userEvent.type(screen.getByLabelText(/Title/i), 'Test Title');
        // File inputs
        const primaryImageInput = screen.getByLabelText(/Primary Image/i) as HTMLInputElement;
        const secondaryImageInput = screen.getByLabelText(/Secondary \(Hover\) Image/i) as HTMLInputElement;
        const invalidFile = createMockFile('test.txt', 1024, 'text/plain');
        const validFile = createMockFile('valid.png', 1024, 'image/png');
        
        // Remove accept attribute to allow invalid types in the test
        primaryImageInput.removeAttribute('accept');
        
        // Upload files
        await userEvent.upload(primaryImageInput, invalidFile);
        await userEvent.upload(secondaryImageInput, validFile);
        
        // Submit form
        await userEvent.click(screen.getByRole('button', { name: /Add Member/i }));

        // Use a more flexible way to check for validation error text
        await waitFor(() => {
            // Look for any text that contains "Invalid file type" anywhere in the document
            const errorElements = screen.getAllByText((content) => 
                content.includes('Invalid file type'), { exact: false }
            );
            expect(errorElements.length).toBeGreaterThan(0);
        }, { timeout: 2000 });
    });

    it('shows validation error for file size exceeding limit', async () => {
        renderFormInDialog();
        const primaryImageInput = screen.getByLabelText(/Primary Image/i);
        const submitButton = screen.getByRole('button', { name: /Add Member/i });
        const largeFile = createMockFile('large.jpg', 11 * 1024 * 1024, 'image/jpeg'); // 11MB
        
        await userEvent.upload(primaryImageInput, largeFile);
        await userEvent.click(submitButton);

        // Expect the specific size error message from superRefine
        await waitFor(() => {
             const expectedMsg = `File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
             expect(screen.getByText(expectedMsg)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('successfully submits form and shows feedback to user', async () => {
        const user = userEvent.setup();
        renderFormInDialog({ onSuccess: onSuccessMock });

        const nameInput = screen.getByLabelText(/Name/i);
        const titleInput = screen.getByLabelText(/Title/i);
        const primaryImageInput = screen.getByLabelText(/Primary Image/i);
        const secondaryImageInput = screen.getByLabelText(/Secondary \(Hover\) Image/i);
        const submitButton = screen.getByRole('button', { name: /Add Member/i });

        const primaryFile = createMockFile('primary.jpg', 1024, 'image/jpeg');
        const secondaryFile = createMockFile('secondary.png', 1024, 'image/png');

        // Fill out the form with valid data
        await user.type(nameInput, 'Test Name');
        await user.type(titleInput, 'Test Title');
        await user.upload(primaryImageInput, primaryFile);
        await user.upload(secondaryImageInput, secondaryFile);

        // Verify form has the expected values before submission
        expect(nameInput).toHaveValue('Test Name');
        expect(titleInput).toHaveValue('Test Title');
        expect((primaryImageInput as HTMLInputElement).files?.[0]?.name).toBe('primary.jpg');
        expect((secondaryImageInput as HTMLInputElement).files?.[0]?.name).toBe('secondary.png');

        // Submit the form
        await user.click(submitButton);

        // Test user-visible behavior after successful submission
        await waitFor(() => {
            // ✅ BEHAVIOR: Success toast is shown to user
            expect(mockToastFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Success' }));
            
            // ✅ BEHAVIOR: onSuccess callback is triggered
            expect(onSuccessMock).toHaveBeenCalledTimes(1);
            
            // ✅ BEHAVIOR: Page is refreshed to show new data
            expect(mockRouterRefresh).toHaveBeenCalledTimes(1);
        });

        // ✅ BEHAVIOR: Form is reset after successful submission
        await waitFor(() => {
            expect(nameInput).toHaveValue('');
            expect(titleInput).toHaveValue('');
        });
    });

    // Remove or skip the preview test as the preview logic was removed
    // it('displays image previews when files are selected', async () => {
    //     renderFormInDialog();
    //     const primaryImageInput = screen.getByLabelText(/Primary Image/i);
    //     const secondaryImageInput = screen.getByLabelText(/Secondary \(Hover\) Image/i);

    //     const primaryFile = createMockFile('primary.jpg', 1024, 'image/jpeg');
    //     const secondaryFile = createMockFile('secondary.png', 1024, 'image/png');

    //     // Initially no previews
    //     expect(screen.queryByAltText('Primary image preview')).not.toBeInTheDocument();
    //     expect(screen.queryByAltText('Secondary image preview')).not.toBeInTheDocument();

    //     await userEvent.upload(primaryImageInput, primaryFile);
    //     await userEvent.upload(secondaryImageInput, secondaryFile);

    //     // Check if previews appear (uses data URL, so src check is tricky, alt text is sufficient)
    //     expect(await screen.findByAltText('Primary image preview')).toBeInTheDocument();
    //     expect(await screen.findByAltText('Secondary image preview')).toBeInTheDocument();
    // });
}); 