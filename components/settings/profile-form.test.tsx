import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ProfileForm } from './profile-form';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      updateUser: vi.fn(),
    },
  })),
}));

// Mock useToast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: mockToast })),
}));

// Mock user data
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Initial Name',
  },
};

// --- Test Suite ---

describe('ProfileForm', () => {
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Set up specific mock implementations for this suite
    mockGetUser = vi.fn();
    mockUpdateUser = vi.fn();
    (createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: {
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
      },
    });
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue({ toast: mockToast });

    // Default successful user fetch
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  it('renders the form with initial user data', async () => {
    render(<ProfileForm />);

    // Wait for user data to load and form to reset
    await waitFor(() => {
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.email)).toBeDisabled();
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUser.user_metadata.name)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Update Profile/i })).toBeInTheDocument();
  });

  it('shows validation error if name is empty', async () => {
    const user = userEvent.setup();
    render(<ProfileForm />);

    // Wait for form to be ready
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUser.user_metadata.name)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/i);
    const submitButton = screen.getByRole('button', { name: /Update Profile/i });

    // Clear name and submit
    await user.clear(nameInput);
    await user.click(submitButton);

    // Check for validation message
    expect(await screen.findByText(/Name cannot be empty/i)).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('calls updateUser and shows success toast on successful submission', async () => {
    const user = userEvent.setup();
    const newName = 'Updated Name';
    render(<ProfileForm />);

    // Mock the getUser call inside onSubmit
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null }); 
    // Mock successful update
    mockUpdateUser.mockResolvedValue({ error: null });

    // Wait for form to be ready
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUser.user_metadata.name)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/i);
    const submitButton = screen.getByRole('button', { name: /Update Profile/i });

    // Change name and submit
    // Ensure input is cleared reliably before typing
    await user.clear(nameInput);
    fireEvent.change(nameInput, { target: { value: '' } }); // Explicitly set value to empty
    await user.type(nameInput, newName);
    await user.click(submitButton);

    // Check if updateUser was called correctly
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { name: newName },
      });
    });

    // Check for success toast
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Profile updated",
    }));
  });

  it('shows error toast if updateUser fails', async () => {
    const user = userEvent.setup();
    const newName = 'Another Name';
    const errorMessage = 'Failed to update profile';
    render(<ProfileForm />);

    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: errorMessage } });

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUser.user_metadata.name)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/Name/i);
    const submitButton = screen.getByRole('button', { name: /Update Profile/i });

    // Add focus before clearing and typing
    nameInput.focus();
    await user.clear(nameInput);
    await user.type(nameInput, newName);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { name: newName },
      });
    });

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      variant: "destructive",
      title: "Error updating profile",
      description: errorMessage,
    }));
  });
}); 