import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAuthAction, getSessionUser } from '../server-action';
import { UserRole, Permission } from '../roles';
import { AuthorizationError } from '@/lib/errors/base';
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
    it('calls the action with the original arguments', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction);
      await wrappedAction();
      
      expect(mockAction).toHaveBeenCalled();
      // The original function is called with the same arguments passed to the wrapped function
      expect(mockAction.mock.calls[0]).toEqual([]);
    });

    it('throws AuthorizationError when no session exists', async () => {
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: null },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction);
      
      await expect(wrappedAction()).rejects.toThrow('Authentication required');
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('checks for required role when specified', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'viewer' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction, { 
        requiredRole: UserRole.ADMIN 
      });
      
      await expect(wrappedAction()).rejects.toThrow(`Requires role: ${UserRole.ADMIN}`);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('allows access when user has the required role', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction, { 
        requiredRole: UserRole.ADMIN 
      });
      
      await wrappedAction();
      expect(mockAction).toHaveBeenCalled();
    });

    it('checks for required permission when specified', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'viewer' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction, { 
        requiredPermission: Permission.DELETE_USER 
      });
      
      await expect(wrappedAction()).rejects.toThrow(`Requires permission: ${Permission.DELETE_USER}`);
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('handles multiple required permissions with anyPermission=true', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'viewer' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction, { 
        requiredPermissions: [Permission.DELETE_USER, Permission.VIEW_ASSET],
        anyPermission: true
      });
      
      await wrappedAction();
      expect(mockAction).toHaveBeenCalled();
    });

    it('passes arguments to the action function', async () => {
      const mockUser = { 
        id: 'user-1',
        app_metadata: { role: 'admin' },
      };
      
      mockGetUser.mockResolvedValueOnce({ 
        data: { user: mockUser },
        error: null
      });
      
      const wrappedAction = withAuthAction(mockAction);
      await wrappedAction('arg1', 'arg2');
      
      expect(mockAction).toHaveBeenCalled();
      // The original arguments are passed through
      expect(mockAction.mock.calls[0]).toEqual(['arg1', 'arg2']);
    });
  });
}); 