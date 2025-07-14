import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavUser } from './nav-user';
import type { User } from '@supabase/supabase-js';
import { SidebarProvider } from '@/components/ui/sidebar';
import { PerformanceMonitorProvider } from '@/lib/monitoring/presentation/providers/performance-analysis/PerformanceMonitorProvider';

// Mock only what we need - the user profile hook
vi.mock('@/lib/auth', () => ({
  useUserProfile: vi.fn(),
}));

// Mock Supabase client 
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(),
    },
  }),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock sidebar hook
vi.mock('@/components/ui/sidebar', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  return {
    ...mod,
    useSidebar: () => ({ isMobile: false }),
  };
});

// Mock localStorage for the PerformanceMonitorProvider
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
});

import { useUserProfile } from '@/lib/auth';

describe('NavUser', () => {
  const renderNavUser = () => {
    return render(
      <PerformanceMonitorProvider>
        <SidebarProvider>
          <NavUser />
        </SidebarProvider>
      </PerformanceMonitorProvider>
    );
  };

  it('renders nothing when no user is present', () => {
    // Mock: No user logged in
    vi.mocked(useUserProfile).mockReturnValue({
      user: null,
      profile: null,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    renderNavUser();

    // Should render nothing (null return)
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders loading skeleton when loading', () => {
    // Mock: Loading state
    vi.mocked(useUserProfile).mockReturnValue({
      user: null,
      profile: null,
      isLoading: true,
      refreshProfile: vi.fn(),
    });

    renderNavUser();

    // Should show skeleton loading button
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('data-sidebar', 'menu-button');
  });

  it('renders user menu when user is authenticated', () => {
    // Mock: Authenticated user
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: { name: 'Test User' },
    };

    vi.mocked(useUserProfile).mockReturnValue({
      user: mockUser as unknown as User,
      profile: null,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    renderNavUser();

    // Should show user menu button with user info
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
}); 