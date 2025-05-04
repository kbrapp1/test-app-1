import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT } from './route';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { User } from '@supabase/supabase-js';

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

// Mock the database utilities
vi.mock('@/lib/supabase/db', () => {
  return {
    queryData: vi.fn((supabase, table, fields, options) => {
      if (options?.matchValue === 'test-user-id') {
        return {
          data: [{
            id: 'test-user-id',
            username: 'testuser',
            full_name: 'Test User',
            avatar_url: 'https://example.com/avatar.jpg',
            website: 'https://example.com',
            bio: 'Test bio'
          }],
          error: null
        };
      } else if (options?.matchValue === 'missing-user') {
        return { data: [], error: null };
      } else if (options?.matchValue === 'error-user') {
        return { data: null, error: new Error('Database error') };
      }
      return { data: [], error: null };
    }),
    insertData: vi.fn((supabase, table, data) => {
      if (data.id === 'test-user-id') {
        return { data, error: null };
      } else if (data.id === 'error-user') {
        return { data: null, error: new Error('Database error') };
      }
      return { data, error: null };
    }),
    handleSupabaseError: vi.fn(error => NextResponse.json({ error: error.message }, { status: 500 }))
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