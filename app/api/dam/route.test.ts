import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock getActiveOrganizationId to control auth behavior
vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Mock dependencies
vi.mock('@/lib/supabase/auth-middleware', () => ({
  withAuth: (handler: any) => handler,
}));

vi.mock('@/lib/middleware/error', () => ({
  withErrorHandling: (handler: any) => handler,
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

import { getActiveOrganizationId } from '@/lib/auth/server-action';
import { GET, getHandler } from './route';

describe('DAM API Route', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockSupabase = {};

  beforeEach(() => {
    vi.clearAllMocks();
    (getActiveOrganizationId as Mock).mockResolvedValue('test-org-123');
  });

  it('should return basic data correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/dam');
    const response = await GET(request, mockUser as any, mockSupabase as any);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.data).toBeDefined();
  });

  it('should include tag colors in asset responses', async () => {
    const request = new NextRequest('http://localhost:3000/api/dam');
    const response = await GET(request, mockUser as any, mockSupabase as any);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Find the asset in the response
    const asset = data.data.find((item: any) => item.type === 'asset' && item.id === 'asset-1');
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

  it('throws a ValidationError for negative limit', async () => {
    const req = { url: 'http://localhost/api/dam?limit=-1' } as any;
    await expect(getHandler(req, {} as any, {} as any)).rejects.toThrow('Invalid limit parameter. Limit must be a non-negative number.');
  });

  it('throws a DatabaseError when no active organization is found', async () => {
    // Simulate missing organization
    (getActiveOrganizationId as Mock).mockResolvedValue(null);

    const req = { url: 'http://localhost/api/dam' } as any;
    await expect(getHandler(req, {} as any, {} as any)).rejects.toThrow();
  });

  // TODO: Add tests for searchTerm, global filters, and folder contents by mocking fetchSearchResults, fetchFolderContents, transformAndEnrichData, and applyQuickSearchLimits.
}); 