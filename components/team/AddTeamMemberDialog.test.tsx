import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
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
const mockPermissions = {
  canCreate: true,
  canUpdate: true,
  canDelete: true,
  isLoading: false,
};

vi.mock('@/lib/shared/access-control/hooks/usePermissions', () => ({
  useTeamMemberPermissions: () => mockPermissions,
}));

// Mock Supabase client creation to prevent initialization errors
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      refreshSession: vi.fn(),
    },
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

// Mock organization service to prevent Supabase client creation
vi.mock('@/lib/auth/services/organization-service', () => ({
  OrganizationService: vi.fn(() => ({
    getOrganizations: vi.fn(),
    switchOrganization: vi.fn(),
  })),
}));

// Mock the useUser hook to prevent Supabase client creation
vi.mock('@/lib/hooks/useUser', () => ({
  useUser: vi.fn(() => ({
    user: null,
    isLoading: false,
    hasPermission: vi.fn(() => false),
    hasAnyPermission: vi.fn(() => false),
    hasAllPermissions: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
    role: undefined,
    permissions: [],
  })),
}));

// Mock the providers to prevent complex initialization
vi.mock('@/lib/auth', () => ({
  UserProfileProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/lib/organization/application/providers/OrganizationProvider', () => ({
  OrganizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      {children}
    </TooltipProvider>
  );
}

describe('AddTeamMemberDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset permissions to default state
    mockPermissions.canCreate = true;
    mockPermissions.canUpdate = true;
    mockPermissions.canDelete = true;
    mockPermissions.isLoading = false;
  });

  it('hides component entirely for non-admin users', async () => {
    // Set permissions for non-admin (cannot create)
    mockPermissions.canCreate = false;

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