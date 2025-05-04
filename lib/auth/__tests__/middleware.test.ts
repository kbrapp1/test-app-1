import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../middleware';
import { UserRole, Permission } from '../roles';
import { AuthorizationError } from '@/lib/errors/base';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/logging');
vi.mock('@/lib/errors/base', () => ({
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
    }
  }
}));

// Directly mock the checkAuth function
vi.mock('@/lib/supabase/db', () => ({
  checkAuth: vi.fn().mockResolvedValue({
    authenticated: true,
    user: {
      id: 'mock-user-id',
      app_metadata: { role: 'admin' }
    }
  })
}));

// Import the mock after the vi.mock calls
import { checkAuth } from '@/lib/supabase/db';

describe('Auth Middleware', () => {
  const mockRequest = new NextRequest('https://example.com/api/test');
  let mockHandler: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    
    // Reset default behavior in beforeEach to ensure clean state for each test
    (checkAuth as any).mockResolvedValue({
      authenticated: true,
      user: { 
        id: 'mock-user-id',
        app_metadata: { role: 'admin' }
      }
    });
  });

  it('calls the handler with the user when authentication succeeds', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'admin' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler);
    await handler(mockRequest);
    
    // Check that the handler was called with the request and user (params may vary)
    expect(mockHandler).toHaveBeenCalled();
    const firstCall = mockHandler.mock.calls[0];
    expect(firstCall[0]).toBe(mockRequest); // First arg should be the request
    expect(firstCall[1]).toEqual(mockUser); // Second arg should be the user
  });

  it('returns 401 when authentication fails', async () => {
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: false, 
      user: null
    });
    
    const handler = withAuth(mockHandler);
    const response = await handler(mockRequest);
    
    expect(response.status).toBe(401);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('checks for required role when specified', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'viewer' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { requiredRole: UserRole.ADMIN });
    const response = await handler(mockRequest);
    
    expect(response.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('allows access when user has the required role', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'admin' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { requiredRole: UserRole.ADMIN });
    await handler(mockRequest);
    
    expect(mockHandler).toHaveBeenCalled();
  });

  it('checks for required permission when specified', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'viewer' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { requiredPermission: Permission.DELETE_USER });
    const response = await handler(mockRequest);
    
    expect(response.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('allows access when user has the required permission', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'admin' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { requiredPermission: Permission.DELETE_USER });
    await handler(mockRequest);
    
    expect(mockHandler).toHaveBeenCalled();
  });

  it('handles multiple required permissions with anyPermission=true', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'viewer' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { 
      requiredPermissions: [Permission.DELETE_USER, Permission.VIEW_ASSET],
      anyPermission: true
    });
    await handler(mockRequest);
    
    expect(mockHandler).toHaveBeenCalled();
  });

  it('requires all permissions when anyPermission=false', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: 'editor' },
    };
    
    // Override for this specific test
    (checkAuth as any).mockResolvedValueOnce({
      authenticated: true, 
      user: mockUser
    });
    
    const handler = withAuth(mockHandler, { 
      requiredPermissions: [Permission.DELETE_USER, Permission.UPDATE_ASSET],
      anyPermission: false
    });
    const response = await handler(mockRequest);
    
    expect(response.status).toBe(403);
    expect(mockHandler).not.toHaveBeenCalled();
  });
}); 