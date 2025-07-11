import { NextRequest } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { queryDataSystem, insertDataSystem } from '@/lib/supabase/db-queries';
import { GET, PUT } from './route';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Mock the database query functions
vi.mock('@/lib/supabase/db-queries', () => ({
  queryDataSystem: vi.fn(),
  insertDataSystem: vi.fn()
}));

// Mock the auth middleware
vi.mock('@/lib/supabase/auth-middleware', () => ({
  withAuth: (handler: (...args: unknown[]) => unknown) => handler
}));

// Mock the error middleware
vi.mock('@/lib/middleware/error', () => ({
  withErrorHandling: (handler: (...args: unknown[]) => unknown) => handler
}));

const mockQueryDataSystem = queryDataSystem as Mock;
const mockInsertDataSystem = insertDataSystem as Mock;

describe('Profile API Route', () => {
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2023-01-01T00:00:00.000Z'
  };

  const mockSupabase = {
    auth: {
      getUser: vi.fn()
    }
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/profile', () => {
    it('should return user profile successfully', async () => {
      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        website: 'https://example.com',
        bio: 'Test bio'
      };

      mockQueryDataSystem.mockResolvedValue({
        data: [mockProfile],
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request, mockUser, mockSupabase);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProfile);
      expect(mockQueryDataSystem).toHaveBeenCalledWith(
        mockSupabase,
        'profiles',
        'id, username, full_name, avatar_url, website, bio',
        {
          matchColumn: 'id',
          matchValue: 'user-123'
        }
      );
    });

    it('should return 404 when profile not found', async () => {
      mockQueryDataSystem.mockResolvedValue({
        data: [],
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/profile');
      
      await expect(GET(request, mockUser, mockSupabase)).rejects.toThrow('Profile not found');
    });

    it('should handle database errors', async () => {
      mockQueryDataSystem.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/profile');
      
      await expect(GET(request, mockUser, mockSupabase)).rejects.toThrow('Database connection failed');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'newusername',
        full_name: 'New Name',
        bio: 'Updated bio'
      };

      mockInsertDataSystem.mockResolvedValue({
        data: { id: 'user-123', ...updateData },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, mockUser, mockSupabase);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Profile updated successfully');
      expect(mockInsertDataSystem).toHaveBeenCalledWith(
        mockSupabase,
        'profiles',
        expect.objectContaining({
          id: 'user-123',
          username: 'newusername',
          full_name: 'New Name',
          bio: 'Updated bio',
          updated_at: expect.any(String)
        })
      );
    });

    it('should reject invalid fields', async () => {
      const invalidData = {
        username: 'validusername',
        invalid_field: 'should be ignored',
        another_invalid: 'also ignored'
      };

      mockInsertDataSystem.mockResolvedValue({
        data: { id: 'user-123', username: 'validusername' },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify(invalidData)
      });

      await PUT(request, mockUser, mockSupabase);

      expect(mockInsertDataSystem).toHaveBeenCalledWith(
        mockSupabase,
        'profiles',
        expect.objectContaining({
          id: 'user-123',
          username: 'validusername',
          updated_at: expect.any(String)
        })
      );

      // Should not include invalid fields
      expect(mockInsertDataSystem).toHaveBeenCalledWith(
        mockSupabase,
        'profiles',
        expect.not.objectContaining({
          invalid_field: expect.anything(),
          another_invalid: expect.anything()
        })
      );
    });

    it('should return validation error for empty updates', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({})
      });

      await expect(PUT(request, mockUser, mockSupabase)).rejects.toThrow('No valid fields to update');
    });

    it('should handle database errors during update', async () => {
      mockInsertDataSystem.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      });

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: 'testuser' })
      });

      await expect(PUT(request, mockUser, mockSupabase)).rejects.toThrow('Update failed');
    });
  });
}); 