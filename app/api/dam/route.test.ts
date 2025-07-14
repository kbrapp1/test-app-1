import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import type { User, SupabaseClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

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

// Mock getActiveOrganizationId to control auth behavior
vi.mock('@/lib/auth/presentation/actions/serverActions', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/supabase/auth-middleware', () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) => handler,
}));

vi.mock('@/lib/middleware/error', () => ({
  withErrorHandling: (handler: (...args: unknown[]) => unknown) => {
    return async (...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (error: unknown) {
        const { NextResponse } = await import('next/server');
        
        const errorObj = error as { name?: string; message?: string; statusCode?: number; constructor: { name: string } };
        
        // Handle ValidationError (400)
        if (errorObj.name === 'ValidationError' || errorObj.constructor.name === 'ValidationError') {
          return NextResponse.json(
            { error: errorObj.message },
            { status: 400 }
          );
        }
        
        // Handle DatabaseError (500)
        if (errorObj.name === 'DatabaseError' || errorObj.constructor.name === 'DatabaseError') {
          return NextResponse.json(
            { error: errorObj.message },
            { status: 500 }
          );
        }
        
        // Handle other AppErrors
        if (errorObj.statusCode) {
          return NextResponse.json(
            { error: errorObj.message },
            { status: errorObj.statusCode }
          );
        }
        
        // Handle unknown errors
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  },
}));

// Mock DAM feature flag service
vi.mock('@/lib/dam/application/services/DamFeatureFlagService', () => ({
  isDamFeatureEnabled: vi.fn().mockResolvedValue(true),
}));

// Mock the use case with tag color data
vi.mock('@/lib/dam/application/use-cases/search', () => ({
  GetDamDataUseCase: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockResolvedValue({
      assets: [
        {
          id: 'asset-1',
          name: 'test-image.jpg',
          createdAt: new Date('2025-01-01'),
          mimeType: 'image/jpeg',
          publicUrl: 'https://example.com/test-image.jpg',
          size: 1024000,
          userId: 'user-1',
          userFullName: 'Test User',
          tags: [
            {
              id: 'tag-1',
              name: 'Important',
              colorName: 'red', // Domain entity uses colorName property
            },
            {
              id: 'tag-2', 
              name: 'Design',
              colorName: 'blue',
            }
          ],
          folderName: 'Test Folder',
        }
      ],
      folders: [],
    }),
  })),
}));

vi.mock('@/lib/dam/infrastructure/persistence/supabase/SupabaseAssetRepository');
vi.mock('@/lib/dam/infrastructure/persistence/supabase/SupabaseFolderRepository');

import { getActiveOrganizationId } from '@/lib/auth/presentation/actions/serverActions';
import { GET } from './route';

describe('DAM API Route', () => {
  const mockUser: User = { id: 'user-123', email: 'test@example.com' } as User;
  const mockSupabase = {} as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
    (getActiveOrganizationId as Mock).mockResolvedValue('test-org-123');
  });

  it('should return basic data correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/dam');
    const response = await GET(request, mockUser, mockSupabase);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
  });

  it('should include tag colors in asset responses', async () => {
    const request = new NextRequest('http://localhost:3000/api/dam');
    const response = await GET(request, mockUser, mockSupabase);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Find the asset in the response
    const asset = data.data.find((item: { type: string; id: string }) => item.type === 'asset' && item.id === 'asset-1');
    expect(asset).toBeDefined();
    
    // Check that tags include color property
    expect(asset.tags).toHaveLength(2);
    expect(asset.tags[0]).toMatchObject({
      id: 'tag-1',
      name: 'Important',
      color: 'red'
    });
    expect(asset.tags[1]).toMatchObject({
      id: 'tag-2',
      name: 'Design', 
      color: 'blue'
    });
  });

  it('returns 400 error for negative limit', async () => {
    const request = new NextRequest('http://localhost:3000/api/dam?limit=-1');
    const response = await GET(request, mockUser, mockSupabase);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid limit parameter');
  });

  it('returns 500 error when no active organization is found', async () => {
    // Simulate missing organization
    (getActiveOrganizationId as Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/dam');
    const response = await GET(request, mockUser, mockSupabase);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Active organization not found');
  });

  // TODO: Add tests for searchTerm, global filters, and folder contents by mocking fetchSearchResults, fetchFolderContents, transformAndEnrichData, and applyQuickSearchLimits.
}); 