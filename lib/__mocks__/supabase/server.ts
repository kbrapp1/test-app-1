import { vi } from 'vitest';
import type { User } from '@supabase/supabase-js';

// Default mock for user
const defaultUser = {
  id: 'mock-user-id',
  app_metadata: { role: 'admin' }
} as Partial<User>;

// Mock for getUser method
const mockGetUser = vi.fn().mockResolvedValue({
  data: {
    user: defaultUser
  },
  error: null
});

// Mock for getSession method
const mockGetSession = vi.fn().mockResolvedValue({
  data: {
    session: {
      user: defaultUser
    }
  },
  error: null
});

// Create a mock supabase client with working auth property
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession
  }
};

// Createclient mock that returns the mock client
export const createClient = vi.fn().mockReturnValue(mockSupabaseClient); 