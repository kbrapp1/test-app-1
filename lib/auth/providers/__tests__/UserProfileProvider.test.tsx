import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfileProvider, useUserProfile } from '../UserProfileProvider';

// Test component to consume the context
function TestConsumer() {
  const { user, profile, isLoading, refreshProfile } = useUserProfile();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="user-id">{user?.id || 'no-user'}</div>
      <div data-testid="profile-name">{profile?.full_name || 'no-profile'}</div>
      <button onClick={refreshProfile} data-testid="refresh-button">
        Refresh
      </button>
    </div>
  );
}

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

describe('UserProfileProvider', () => {
  const mockUser: User = {
    id: 'user-123',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: 'Test User' },
    identities: [],
    factors: [],
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    last_sign_in_at: new Date().toISOString(),
  };

  const mockProfile = {
    id: 'user-123',
    full_name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    created_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
  };

  const mockSession: Session = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
    expires_at: Date.now() + 3600 * 1000,
  };

  let authStateListener: ((event: string, session: Session | null) => void) | null = null;
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    authStateListener = null;

    // Setup default mocks
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateListener = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
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

  // Helper to trigger auth state changes
  const triggerAuthStateChange = (event: string, session: Session | null) => {
    if (authStateListener) {
      act(() => {
        authStateListener!(event, session);
      });
    }
  };

  describe('Initial Load', () => {
    it('should start with loading state', () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should load user and profile on initial session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
      });
    });

    it('should handle missing session gracefully', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should fetch profile only on SIGNED_IN with new user', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Clear mock calls from initial load
      vi.clearAllMocks();

      // Trigger sign-in event
      triggerAuthStateChange('SIGNED_IN', mockSession);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
      });

      // Should have fetched profile
      expect(mockQueryBuilder.single).toHaveBeenCalledOnce();
    });

    it('should NOT fetch profile on TOKEN_REFRESHED event', async () => {
      // Start with signed-in user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      });

      // Clear mock calls from initial load
      vi.clearAllMocks();

      // Trigger token refresh (simulates browser focus)
      triggerAuthStateChange('TOKEN_REFRESHED', mockSession);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      });

      // Should NOT have fetched profile again
      expect(mockQueryBuilder.single).not.toHaveBeenCalled();
    });

    it('should clear profile on SIGNED_OUT', async () => {
      // Start with signed-in user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      });

      // Trigger sign-out
      triggerAuthStateChange('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
      });
    });

    it('should handle same user ID without refetching profile', async () => {
      // Start with signed-in user
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      });

      // Clear mock calls from initial load
      vi.clearAllMocks();

      // Trigger SIGNED_IN with same user (shouldn't happen but let's be safe)
      triggerAuthStateChange('SIGNED_IN', mockSession);

      // Should NOT fetch profile again for same user
      expect(mockQueryBuilder.single).not.toHaveBeenCalled();
    });
  });

  describe('Browser Focus Scenarios', () => {
    it('should handle multiple rapid auth state changes gracefully', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Clear initial calls
      vi.clearAllMocks();

      // Simulate rapid browser focus/unfocus events
      triggerAuthStateChange('TOKEN_REFRESHED', mockSession);
      triggerAuthStateChange('TOKEN_REFRESHED', mockSession);
      triggerAuthStateChange('TOKEN_REFRESHED', mockSession);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
      });

      // Should not have fetched profile multiple times
      expect(mockQueryBuilder.single).not.toHaveBeenCalled();
    });

    it('should handle auth errors during browser focus', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Simulate auth error (expired session)
      triggerAuthStateChange('SIGNED_OUT', null);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });
  });

  describe('Profile Fetch Error Handling', () => {
    it('should handle profile fetch failures gracefully', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
      });
    });

    it('should handle profile fetch exceptions', async () => {
      mockQueryBuilder.single.mockRejectedValue(new Error('Network error'));

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-123');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('no-profile');
      });
    });
  });

  describe('refreshProfile Function', () => {
    it('should refresh profile when called manually', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
      });

      // Clear mock calls
      vi.clearAllMocks();

      // Update mock to return different profile
      mockQueryBuilder.single.mockResolvedValue({
        data: { ...mockProfile, full_name: 'Updated Name' },
        error: null,
      });

      // Trigger manual refresh
      act(() => {
        screen.getByTestId('refresh-button').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Updated Name');
      });

      expect(mockQueryBuilder.single).toHaveBeenCalledOnce();
    });

    it('should handle refresh when no user is signed in', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Clear mock calls
      vi.clearAllMocks();

      // Try to refresh when no user
      act(() => {
        screen.getByTestId('refresh-button').click();
      });

      // Should not attempt to fetch profile
      expect(mockQueryBuilder.single).not.toHaveBeenCalled();
    });
  });

  describe('Memory Leaks and Cleanup', () => {
    it('should unsubscribe auth listener on unmount', () => {
      const { unmount } = render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });

    it('should ignore auth state changes after unmount', async () => {
      const { unmount } = render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      unmount();

      // Clear mocks
      vi.clearAllMocks();

      // Trigger auth change after unmount (shouldn't cause errors)
      if (authStateListener) {
        authStateListener('SIGNED_IN', mockSession);
      }

      // Should not have attempted to fetch profile
      expect(mockQueryBuilder.single).not.toHaveBeenCalled();
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent profile fetches correctly', async () => {
      render(
        <UserProfileProvider>
          <TestConsumer />
        </UserProfileProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Clear initial calls
      vi.clearAllMocks();

      // Trigger rapid sign-ins (simulate race condition)
      const newUser = { ...mockUser, id: 'user-456' };
      const newSession = { ...mockSession, user: newUser };

      triggerAuthStateChange('SIGNED_IN', newSession);
      triggerAuthStateChange('SIGNED_IN', newSession);

      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user-456');
      });

      // Should only fetch profile once for the new user
      expect(mockQueryBuilder.single).toHaveBeenCalledTimes(1);
    });
  });
}); 