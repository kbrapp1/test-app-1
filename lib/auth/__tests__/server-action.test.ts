import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSessionUser } from '../server-action';
import { withAuthAction } from '..';
import { UserRole, Permission } from '../roles';
import { AuthorizationError } from '../../errors/base';
import type { User } from '@supabase/supabase-js';

// Default mock user
const defaultUser = {
  id: 'mock-user-id',
  app_metadata: { role: 'admin' }
} as Partial<User>;

// Setup mock getUser function
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: defaultUser },
  error: null
});

// Mock dependencies with explicit mocks
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser
    }
  }))
}));

vi.mock('@/lib/shared/infrastructure/GlobalAuthenticationService', () => ({
  GlobalAuthenticationService: {
    getInstance: vi.fn().mockReturnValue({
      getAuthenticatedUser: vi.fn().mockResolvedValue({
        isValid: true,
        user: defaultUser
      })
    })
  }
}));

vi.mock('@/lib/logging');
vi.mock('@/lib/errors/base', () => ({
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
    }
  }
}));

describe('Server Action Auth Utilities', () => {
  let mockAction: any;
  let mockGlobalAuth: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockAction = vi.fn().mockResolvedValue({ success: true });
    
    // Reset the getUser mock to default behavior
    mockGetUser.mockResolvedValue({
      data: { 
        user: defaultUser
      },
      error: null
    });
    
    // Set up GlobalAuthenticationService mock
    mockGlobalAuth = {
      getAuthenticatedUser: vi.fn().mockResolvedValue({
        isValid: true,
        user: defaultUser
      })
    };
    
    // Mock the GlobalAuthenticationService
    vi.doMock('@/lib/shared/infrastructure/GlobalAuthenticationService', () => ({
      GlobalAuthenticationService: {
        getInstance: vi.fn().mockReturnValue(mockGlobalAuth)
      }
    }));
  });

  describe('getSessionUser', () => {
    it('returns user from session', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const result = await getSessionUser();
      expect(result.user).toEqual(mockUser);
    });

    it('returns null when no session exists', async () => {
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: null },
        error: null
      });
      
      const result = await getSessionUser();
      expect(result.user).toBeNull();
    });

    it('handles errors gracefully', async () => {
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: null },
        error: new Error('Failed to get session')
      });
      
      const result = await getSessionUser();
      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('withAuthAction', () => {
    it('calls the action with the authenticated user', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const result = await withAuthAction(mockAction);
      
      expect(result.success).toBe(true);
      expect(mockAction).toHaveBeenCalled();
      // The function is called with the authenticated user
      expect(mockAction.mock.calls[0]).toEqual([mockUser]);
    });

    it('returns error when no session exists', async () => {
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: false,
        user: null
      });
      
      const result = await withAuthAction(mockAction);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('successfully executes action with authenticated user', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'viewer' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const result = await withAuthAction(mockAction);
      
      expect(result.success).toBe(true);
      expect(mockAction).toHaveBeenCalledWith(mockUser);
    });

    it('handles action execution errors', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const errorAction = vi.fn().mockRejectedValue(new Error('Action failed'));
      const result = await withAuthAction(errorAction);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Action failed');
    });

    it('returns user data in successful result', async () => {
      const mockUser = { 
        id: 'user-1',
        email: 'test@example.com',
        app_metadata: { role: 'viewer' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const result = await withAuthAction(mockAction);
      
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('executes action with return value', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'viewer' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const actionWithReturnValue = vi.fn().mockResolvedValue({ result: 'success' });
      const result = await withAuthAction(actionWithReturnValue);
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
      expect(actionWithReturnValue).toHaveBeenCalledWith(mockUser);
    });

    it('calls action with authenticated user only', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGlobalAuth.getAuthenticatedUser.mockResolvedValueOnce({
        isValid: true,
        user: mockUser
      });
      
      const result = await withAuthAction(mockAction);
      
      expect(mockAction).toHaveBeenCalled();
      expect(mockAction.mock.calls[0]).toEqual([mockUser]);
      expect(result.success).toBe(true);
    });
  });
}); 