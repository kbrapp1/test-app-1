import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileForm } from './profile-form';
import type { User } from '@supabase/supabase-js';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock UserProfileProvider to return controlled data
vi.mock('@/lib/auth', () => ({
  useUserProfile: vi.fn(),
}));

// Mock OrganizationProvider to avoid complex dependencies
vi.mock('@/lib/organization/application/providers/OrganizationProvider', () => ({
  useOrganization: () => ({
    currentContext: null,
    activeOrganizationId: 'org-123',
    accessibleOrganizations: [
      { organization_id: 'org-123', organization_name: 'Test Org', role_name: 'Member' }
    ],
    isLoading: false,
  }),
}));

// Mock OrganizationSwitcher to avoid complex dependencies
vi.mock('@/lib/organization/presentation/components/OrganizationSwitcher', () => ({
  OrganizationSwitcher: () => <div data-testid="organization-switcher">Organization Switcher</div>,
}));

// Mock Supabase client for form submission
const mockUpdate = vi.fn();
const mockEq = vi.fn();
mockUpdate.mockReturnValue({ eq: mockEq });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ update: mockUpdate }),
  }),
}));

import { useUserProfile } from '@/lib/auth';

describe('ProfileForm', () => {
  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  };

  const mockProfile = {
    id: 'user-123',
    full_name: 'Test User',
    email: 'test@example.com',
    is_super_admin: false,
    avatar_url: null,
    created_at: '2023-01-01T00:00:00.000Z',
    last_sign_in_at: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock: authenticated user with profile
    vi.mocked(useUserProfile).mockReturnValue({
      user: mockUser as User,
      profile: mockProfile,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    // Reset Supabase mocks
    mockEq.mockResolvedValue({ data: {}, error: null });
  });

  it('renders profile form with user data', async () => {
    render(<ProfileForm />);

    // Should show profile information
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    
    // Should show form field
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
  });

  it('shows loading state when user data is loading', () => {
    // Mock: Loading state
    vi.mocked(useUserProfile).mockReturnValue({
      user: null,
      profile: null,
      isLoading: true,
      refreshProfile: vi.fn(),
    });

    render(<ProfileForm />);

    // Should show loading message
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('validates required name field', async () => {
    render(<ProfileForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Clear the name field and submit
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/name cannot be empty/i)).toBeInTheDocument();
    });
  });

  it('submits form successfully', async () => {
    render(<ProfileForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Update name and submit
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(submitButton);

    // Should show success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Profile updated',
        description: 'Your name has been successfully updated.',
      });
    });
  });

  it('handles form submission error', async () => {
    // Mock Supabase error
    mockEq.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });

    render(<ProfileForm />);

    const nameInput = screen.getByLabelText(/full name/i);
    const submitButton = screen.getByRole('button', { name: /update profile/i });

    // Update name and submit
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    fireEvent.click(submitButton);

    // Should show error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Error updating profile',
        description: 'Database error',
      });
    });
  });
}); 