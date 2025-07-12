import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileForm } from './profile-form';

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
const mockEq = vi.fn(() => ({ 
  // Return a promise that resolves to success by default
  then: (resolve: any) => resolve({ data: {}, error: null })
}));
mockUpdate.mockReturnValue({ eq: mockEq });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({ update: mockUpdate }),
  }),
}));

import { useUserProfile } from '@/lib/auth';

describe('ProfileForm', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' },
  };

  const mockProfile = {
    id: 'user-123',
    full_name: 'Test User',
    email: 'test@example.com',
    is_super_admin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock: authenticated user with profile
    vi.mocked(useUserProfile).mockReturnValue({
      user: mockUser as any,
      profile: mockProfile as any,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    // Reset Supabase mocks
    mockEq.mockImplementation(() => 
      Promise.resolve({ data: {}, error: null })
    );
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
    mockEq.mockImplementation(() => 
      Promise.resolve({ data: null, error: { message: 'Database error' } })
    );

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