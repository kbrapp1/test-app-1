import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../infrastructure/middleware/AuthMiddleware';
import { UserRole } from '../domain/value-objects/UserRole';
import { Permission } from '../domain/value-objects/Permission';
import { AuthorizationError } from '@/lib/errors/base';
import { checkAuth } from '@/lib/supabase/db-auth';

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

// Mock dependencies
vi.mock('@/lib/logging');
vi.mock('@/lib/errors/base', () => ({
  AuthorizationError: class AuthorizationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthorizationError';
    }
  }
}));

// Directly mock the checkAuth function from its new path
vi.mock('@/lib/supabase/db-auth', () => ({
  checkAuth: vi.fn(), // Just mock the function initially
}));

describe('Auth Middleware', () => {
  const mockRequest = new NextRequest('https://example.com/api/test');
  let mockHandler: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    
    // Reset default behavior in beforeEach using type assertion
    (checkAuth as Mock).mockResolvedValue({
      authenticated: true,
      user: {
        id: 'mock-user-id',
        app_metadata: { role: UserRole.ADMIN } // Use enum for consistency
      }
    });
  });

  it('calls the handler with the user when authentication succeeds', async () => {
    const mockUser = { 
      id: 'user-1',
      app_metadata: { role: UserRole.ADMIN },
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.VIEWER },
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.ADMIN },
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.VIEWER },
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.ADMIN }, // Admin has DELETE_USER permission
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.VIEWER }, // Viewer has VIEW_ASSET
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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
      app_metadata: { role: UserRole.EDITOR }, // Editor has UPDATE_ASSET but not DELETE_USER
    };
    
    // Override for this specific test
    (checkAuth as Mock).mockResolvedValueOnce({
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