import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name?: string) => {
      if (name === 'sb-zzapbmpqkqeqsrqwttzd-auth-token') { // Adjust if your auth token cookie name is different
        return { name, value: 'mock-auth-token' };
      }
      return undefined;
    }),
    // Add other cookie methods if your code uses them (e.g., set, delete)
    has: vi.fn(() => true), 
    getAll: vi.fn(() => [{ name: 'sb-zzapbmpqkqeqsrqwttzd-auth-token', value: 'mock-auth-token'}]),
  })),
  headers: vi.fn(() => new Headers()), // Mock headers() if used by your code under test
}));

// Mock getActiveOrganizationId directly in the factory
vi.mock('@/lib/auth/server-action', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth/server-action')>();
  return {
    ...actual, 
    getActiveOrganizationId: vi.fn(() => Promise.resolve('mock-organization-id')), // Reverted to inline mock
  };
});

// Mock crypto.randomUUID properly using importOriginal
vi.mock('crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('crypto')>();
  return {
    __esModule: true,
    default: {
      ...actual,
      randomUUID: () => 'mock-uuid'
    }
  };
});

// Mock supabase client creation
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } }, error: null })) },
    storage: { from: vi.fn(() => ({ upload: vi.fn(), remove: vi.fn() })) },
    from: vi.fn()
  }))
}));

// Mock the database utilities
vi.mock('@/lib/supabase/db', () => ({
  uploadFile: vi.fn(),
  insertData: vi.fn(),
  removeFile: vi.fn()
}));

// Mock the authentication middleware
vi.mock('@/lib/supabase/auth-middleware', () => ({
  withAuth: (handler: any) => {
    return async (req: NextRequest) => {
      if (req.headers.get('x-test-auth') === 'fail') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const mockUser = { id: 'test-user-id' } as any;
      return handler(req, mockUser, null);
    };
  }
}));

import { POST } from './route';
import { User } from '@supabase/supabase-js';
import { uploadFile, insertData, removeFile } from '@/lib/supabase/db';

// Cast imported functions to mocks for TypeScript
const mockUploadFile = uploadFile as unknown as ReturnType<typeof vi.fn>;
const mockInsertData = insertData as unknown as ReturnType<typeof vi.fn>;
const mockRemoveFile = removeFile as unknown as ReturnType<typeof vi.fn>;

// Stub environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'mock-service-role-key');

// Begin test suite
describe('POST /api/dam/upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // No need to set mockGetActiveOrgIdFn here anymore
  });

  it('should return 400 if no files are provided', async () => {
    const formData = new FormData();
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST' });
    request.formData = vi.fn().mockResolvedValue(formData);
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe('No files provided.');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.statusCode).toBe(400);
  });

  it('should upload a single valid image file successfully', async () => {
    mockUploadFile.mockResolvedValue(Promise.resolve({ path: 'test-user-id/mock-uuid-test.jpg', error: null }));
    mockInsertData.mockResolvedValue(Promise.resolve({ data: { id: 'mock-asset-id' }, error: null }));
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST' });
    request.formData = vi.fn().mockResolvedValue({ getAll: (_: string) => [file] } as unknown as FormData);
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe('Upload successful');
    expect(data.data).toEqual([
      { name: 'test.jpg', storagePath: 'test-user-id/mock-uuid-test.jpg', size: file.size, type: file.type }
    ]);
  });

  it('should upload both image and non-image files', async () => {
    mockUploadFile
      .mockResolvedValueOnce(Promise.resolve({ path: 'test-user-id/mock-uuid-image.jpg', error: null }))
      .mockResolvedValueOnce(Promise.resolve({ path: 'test-user-id/mock-uuid-doc.pdf', error: null }));
    mockInsertData
      .mockResolvedValueOnce(Promise.resolve({ data: { id: 'mock-asset-id-image' }, error: null }))
      .mockResolvedValueOnce(Promise.resolve({ data: { id: 'mock-asset-id-pdf' }, error: null }));
    
    const imageFile = new File(['img'], 'image.jpg', { type: 'image/jpeg' });
    const docFile = new File(['doc'], 'doc.pdf', { type: 'application/pdf' });
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST' });
    request.formData = vi.fn().mockResolvedValue({ getAll: (_: string) => [imageFile, docFile] } as unknown as FormData);
    
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.message).toBe('Upload successful');
    expect(data.data).toEqual([
      { name: 'image.jpg', storagePath: 'test-user-id/mock-uuid-image.jpg', size: imageFile.size, type: imageFile.type },
      { name: 'doc.pdf', storagePath: 'test-user-id/mock-uuid-doc.pdf', size: docFile.size, type: docFile.type }
    ]);
    expect(mockUploadFile).toHaveBeenCalledTimes(2);
  });

  it('should return 500 if storage upload fails', async () => {
    mockUploadFile.mockResolvedValue(Promise.resolve({ path: null, error: new Error('Storage error') }));
    const file = new File(['err'], 'error.jpg', { type: 'image/jpeg' });
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST' });
    request.formData = vi.fn().mockResolvedValue({ getAll: (_: string) => [file] } as unknown as FormData);
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Storage Error (error.jpg): Storage error');
    expect(data.error.code).toBe('DATABASE_ERROR');
    expect(data.error.statusCode).toBe(500);
    expect(mockRemoveFile).toHaveBeenCalled();
  });

  it('should return 500 and attempt cleanup if database insert fails', async () => {
    mockUploadFile.mockResolvedValue(Promise.resolve({ path: 'test-user-id/mock-uuid-db-error.jpg', error: null }));
    mockInsertData.mockResolvedValue(Promise.resolve({ data: undefined, error: new Error('Database error') }));
    const file = new File(['db'], 'db-error.jpg', { type: 'image/jpeg' });
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST' });
    request.formData = vi.fn().mockResolvedValue({ getAll: (_: string) => [file] } as unknown as FormData);
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Database Error (db-error.jpg): Database error');
    expect(data.error.code).toBe('DATABASE_ERROR');
    expect(data.error.statusCode).toBe(500);
    expect(mockRemoveFile).toHaveBeenCalled();
  });

  it('should handle authentication failure', async () => {
    const headers = new Headers();
    headers.set('x-test-auth', 'fail');
    const formData = new FormData();
    const request = new Request('https://example.com/api/dam/upload', { method: 'POST', headers });
    request.formData = vi.fn().mockResolvedValue(formData);
    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });
}); 