import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT } from './route';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { queryData, insertData, QueryOptions } from '@/lib/supabase/db-queries';

// Mock the authentication middleware
vi.mock('@/lib/supabase/auth-middleware', () => {
  return {
    withAuth: (handler: any) => {
      return async (req: any) => {
        // For authentication test
        if (req.headers.get('x-test-auth') === 'fail') {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        
        // Otherwise call the handler with mocked user and client
        const mockUser = { id: 'test-user-id' } as User;
        return handler(req, mockUser, getMockSupabase());
      }
    }
  };
});

// Mock the database utilities from db-queries
vi.mock('@/lib/supabase/db-queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase/db-queries')>();
  return {
    ...actual, // Spread to keep other exports if any, though we explicitly mock queryData and insertData
    queryData: vi.fn(),
    insertData: vi.fn(),
    // If handleSupabaseError was used from here, mock it too. Assuming it's from db.ts or errors.ts
  };
});

// Create a reusable mock Supabase client
function getMockSupabase() {
  return {
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-user-id',
              username: 'testuser',
              full_name: 'Test User'
            },
            error: null
          }))
        }))
      })),
      upsert: vi.fn(() => ({
        data: { 
          id: 'test-user-id',
          username: 'testuser',
          full_name: 'Test User'
        },
        error: null
      }))
    }))
  };
}

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for queryData
    (queryData as Mock).mockImplementation(async (supabase: SupabaseClient, table: string, fields: string, options: QueryOptions) => {
      if (options?.matchValue === 'test-user-id' && table === 'profiles') {
        return Promise.resolve({
          data: [{
            id: 'test-user-id',
            username: 'testuser',
            full_name: 'Test User',
            avatar_url: 'https://example.com/avatar.jpg',
            website: 'https://example.com',
            bio: 'Test bio'
          }],
          error: null
        });
      } else if (options?.matchValue === 'missing-user' && table === 'profiles') {
        return Promise.resolve({ data: [], error: null });
      } else if (options?.matchValue === 'error-user' && table === 'profiles') {
        return Promise.resolve({ data: null, error: new Error('Database error') });
      }
      return Promise.resolve({ data: [], error: null });
    });

    // Default mock for insertData (used for PUT)
    (insertData as Mock).mockImplementation(async (supabase: SupabaseClient, table: string, data: Record<string, any>) => {
      if (table === 'profiles' && data.id === 'test-user-id') {
        return Promise.resolve({ data, error: null });
      }
      return Promise.resolve({ data: null, error: new Error('Insert failed') });
    });
  });

  describe('GET /api/profile', () => {
    it('should return user profile when authenticated', async () => {
      const request = new Request('https://example.com/api/profile') as unknown as NextRequest;
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toMatchObject({
        id: 'test-user-id',
        username: 'testuser',
        full_name: 'Test User'
      });
    });

    it('should return 401 when not authenticated', async () => {
      const headers = new Headers();
      headers.set('x-test-auth', 'fail');
      
      const request = new Request('https://example.com/api/profile', { headers }) as unknown as NextRequest;
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      
      expect(data).toMatchObject({
        error: 'Authentication required'
      });
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile when authenticated', async () => {
      const body = {
        username: 'newusername',
        full_name: 'New User Name'
      };
      
      const request = new Request('https://example.com/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }) as unknown as NextRequest;
      
      const response = await PUT(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toMatchObject({
        message: 'Profile updated successfully'
      });
    });

    it('should return 400 when no valid fields provided', async () => {
      const req = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid_field: 'test' })
      });

      const response = await PUT(req as NextRequest);
      expect(response.status).toBe(400);

      const data = await response.json();
      // Expect the standardized error response structure
      expect(data).toMatchObject({
        error: {
          message: 'No valid fields to update',
          code: 'VALIDATION_ERROR', // Comes from the ValidationError default
          statusCode: 400
        }
      });
    });

    it('should return 401 when not authenticated', async () => {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'x-test-auth': 'fail'
      });
      
      const body = {
        username: 'newusername'
      };
      
      const request = new Request('https://example.com/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      }) as unknown as NextRequest;
      
      const response = await PUT(request);
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data).toMatchObject({
        error: 'Authentication required'
      });
    });
  });
}); 