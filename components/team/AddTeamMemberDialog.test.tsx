import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { UserProfileProvider } from '@/lib/auth/providers/UserProfileProvider';
import { OrganizationProvider } from '@/lib/organization/application/providers/OrganizationProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock the permissions hook
let mockPermissions = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  isLoading: false,
};

vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useTeamMemberPermissions: () => mockPermissions,
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(),
};

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <UserProfileProvider>
        <OrganizationProvider>
          {children}
        </OrganizationProvider>
      </UserProfileProvider>
    </TooltipProvider>
  );
}

describe('AddTeamMemberDialog', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
    user_metadata: { name: 'Admin User' },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    identities: [],
    factors: [],
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    last_sign_in_at: new Date().toISOString(),
  };

  const mockProfile = {
    id: 'user-123',
    full_name: 'Admin User',
    email: 'admin@example.com',
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    is_super_admin: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks - ensure we have a user session
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      // Immediately call the callback with signed in state to avoid loading
      setTimeout(() => callback('SIGNED_IN', { user: mockUser }), 0);
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    });

    mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.single.mockResolvedValue({
      data: mockProfile,
      error: null,
    });
  });

  beforeEach(() => {
    // Reset permissions to default state
    mockPermissions.canCreate = true;
    mockPermissions.canUpdate = true;
    mockPermissions.canDelete = true;
    mockPermissions.isLoading = false;
  });

  it('hides component entirely for non-admin users', async () => {
    // Set permissions for non-admin (cannot create)
    mockPermissions.canCreate = false;
    
    // Mock non-admin profile
    mockQueryBuilder.single.mockResolvedValue({
      data: { ...mockProfile, is_super_admin: false },
      error: null,
    });

    render(
      <TestWrapper>
        <AddTeamMemberDialog />
      </TestWrapper>
    );

    // Component should not render at all for users without CREATE permission
    await waitFor(() => {
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('shows enabled button and dialog for admin users', async () => {
    // Set permissions for admin (can create)
    mockPermissions.canCreate = true;
    
    // Mock admin profile  
    mockQueryBuilder.single.mockResolvedValue({
      data: { ...mockProfile, is_super_admin: true },
      error: null,
    });

    render(
      <TestWrapper>
        <AddTeamMemberDialog />
      </TestWrapper>
    );

    // Wait for component to mount and load user data
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add team member/i })).toBeInTheDocument();
    });

    // Should render enabled button for admin
    const button = screen.getByRole('button', { name: /add team member/i });
    expect(button).not.toBeDisabled();
  });

  it('shows disabled button while loading', async () => {
    // Set permissions to loading state
    mockPermissions.isLoading = true;
    mockPermissions.canCreate = false; // Doesn't matter when loading
    
    // Mock loading state by delaying the session
    mockSupabaseClient.auth.getSession.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: { session: null }, error: null }), 100)
      )
    );

    render(
      <TestWrapper>
        <AddTeamMemberDialog />
      </TestWrapper>
    );

    // Component should render a disabled button while loading
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add team member/i })).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button', { name: /add team member/i });
    expect(button).toBeDisabled();
  });
}); 