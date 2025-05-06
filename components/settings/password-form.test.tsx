import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { PasswordForm } from './password-form';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockToast })),
}));

// Mock user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User' },
};

// --- Test Suite ---
describe('PasswordForm', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockSignIn: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    mockGetUser = vi.fn();
    mockSignIn = vi.fn();
    mockUpdateUser = vi.fn();

    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        signInWithPassword: mockSignIn,
        updateUser: mockUpdateUser,
      },
    });
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({ toast: mockToast });

    // Default: successful user fetch
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('renders loading state then form fields', async () => {
    render(<PasswordForm />);

    // Initially shows loading
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait for form fields
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });

    // Submit button should be disabled initially
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeDisabled();
  });

  it('shows validation error if currentPassword is empty', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill only the new and confirm password fields with valid values
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'validPass123');
    // Submit the form via native submit to trigger validation
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect validation error for currentPassword
    expect(await screen.findByText(/Current password is required\./i)).toBeInTheDocument();
    // Supabase methods should not be called
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows validation error if newPassword is too short', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill current password and short new passwords
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'currentPass1');
    await user.type(newPassInput, 'short');
    await user.type(confirmPassInput, 'short');
    // Submit the form
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect validation error for newPassword length
    expect(await screen.findByText(/New password must be at least 8 characters long\./i)).toBeInTheDocument();
    // Supabase methods should not be called
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows validation error if confirmPassword is empty', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill current and new password fields only
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    await user.type(currentPassInput, 'currentPass1');
    await user.type(newPassInput, 'validPass123');
    // Leave confirmPassword empty and submit
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect validation error for confirmPassword
    expect(await screen.findByText(/Please confirm your new password\./i)).toBeInTheDocument();
    // Supabase methods should not be called
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows validation error if newPassword and confirmPassword do not match', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill current and password fields with mismatched values
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'currentPass1');
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'differentPass456');
    // Submit the form
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect validation error for password mismatch
    expect(await screen.findByText(/New passwords do not match\./i)).toBeInTheDocument();
    // Supabase methods should not be called
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows error toast and form error on invalid current password', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill valid matching new passwords
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'wrongPass');
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'validPass123');
    // Mock signInWithPassword failure
    const errorMessage = 'Invalid login credentials';
    mockSignIn.mockResolvedValue({ error: { message: errorMessage } });
    // Submit the form
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect error toast for incorrect password
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Incorrect Password',
        description: 'The current password entered is incorrect.',
      }));
    });
    // Expect manual form error on currentPassword
    expect(screen.getByText(/Incorrect current password/i)).toBeInTheDocument();
    // Ensure updateUser is not called
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('shows verification failed toast on sign-in service error', async () => {
    const user = userEvent.setup();
    // Render form and wait for fields
    const { container } = render(<PasswordForm />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    });
    // Fill valid matching new passwords
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'somePass');
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'validPass123');
    // Mock signInWithPassword server error (non-credentials)
    const errorMessage = 'Server is down';
    mockSignIn.mockResolvedValue({ error: { message: errorMessage } });
    // Submit the form
    const formElem = container.querySelector('form');
    expect(formElem).not.toBeNull();
    fireEvent.submit(formElem!);
    // Expect verification failed toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Verification Failed',
          description: `An error occurred: ${errorMessage}`,
        })
      );
    });
    // Ensure updateUser is not called
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('calls signInWithPassword and updateUser, shows success toast, and resets form on successful update', async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);
    // Wait for form ready
    await waitFor(() => expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument());
    // Fill valid fields
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'currentPass1');
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'validPass123');
    // Mock successful sign-in and update
    mockSignIn.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    // Submit via button click
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    await user.click(submitButton);
    // Assert calls and success toast
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: mockUser.email, password: 'currentPass1' });
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'validPass123' });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Password Updated',
        description: 'Your password changed successfully.',
      }));
    });
    // Form inputs reset
    expect((screen.getByLabelText(/Current Password/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/^New Password$/i) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Confirm New Password/i) as HTMLInputElement).value).toBe('');
  });

  it('shows error toast if updateUser fails after successful sign-in', async () => {
    const user = userEvent.setup();
    render(<PasswordForm />);
    await waitFor(() => expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument());
    const currentPassInput = screen.getByLabelText(/Current Password/i);
    const newPassInput = screen.getByLabelText(/^New Password$/i);
    const confirmPassInput = screen.getByLabelText(/Confirm New Password/i);
    await user.type(currentPassInput, 'currentPass1');
    await user.type(newPassInput, 'validPass123');
    await user.type(confirmPassInput, 'validPass123');
    // Mock successful sign-in and failed update
    mockSignIn.mockResolvedValue({ error: null });
    const updateErrorMsg = 'Update failed';
    mockUpdateUser.mockResolvedValue({ error: { message: updateErrorMsg } });
    // Submit
    const submitButton = screen.getByRole('button', { name: /Update Password/i });
    await user.click(submitButton);
    // Assert update call and error toast
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'validPass123' });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: 'destructive',
        title: 'Password Update Failed',
        description: updateErrorMsg,
      }));
    });
  });
}); 