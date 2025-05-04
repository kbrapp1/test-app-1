import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { File } from 'buffer';

// Mock crypto.randomUUID to be deterministic
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

// Mock the DB utilities
vi.mock('@/lib/supabase/db', () => ({
  uploadFile: vi.fn(),
  insertData: vi.fn(),
  removeFile: vi.fn(),
}));

// Mock the authentication middleware
vi.mock('@/lib/supabase/auth-middleware', () => ({
  withAuth: (handler: any) => {
    return async (req: NextRequest) => {
      if (req.headers.get('x-test-auth') === 'fail') {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const mockUser = { id: 'test-user-id' };
      // pass a dummy supabase client, utilities are mocked
      return handler(req, mockUser, {});
    };
  }
}));

import { POST } from './route';
import { uploadFile, insertData, removeFile } from '@/lib/supabase/db';

const mockUploadFile = uploadFile as unknown as ReturnType<typeof vi.fn>;
const mockInsertData = insertData as unknown as ReturnType<typeof vi.fn>;
const mockRemoveFile = removeFile as unknown as ReturnType<typeof vi.fn>;

// Begin test suite
describe('POST /api/team/upload', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return 400 if form parsing fails (generic error)', async () => {
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    // simulate formData() throwing an error
    (request as any).formData = vi.fn().mockRejectedValue(new Error('oops'));

    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe('Invalid form data provided.');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.statusCode).toBe(400);
  });

  it('should return 400 if validation fails for missing fields', async () => {
    const fakeForm = { get: (key: string) => key === 'name' ? '' : undefined };
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    (request as any).formData = vi.fn().mockResolvedValue(fakeForm as unknown as FormData);

    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe('Invalid input');
    expect(data.error.code).toBe('VALIDATION_ERROR');
    expect(data.error.statusCode).toBe(400);
  });

  it('should upload and insert team member successfully', async () => {
    // prepare two valid File instances
    const primaryFile = new File(['a'], 'primary.png', { type: 'image/png' });
    const secondaryFile = new File(['b'], 'secondary.jpg', { type: 'image/jpeg' });
    const fakeForm = {
      get: (key: string) => {
        switch (key) {
          case 'name': return 'Alice';
          case 'title': return 'Engineer';
          case 'primaryImage': return primaryFile;
          case 'secondaryImage': return secondaryFile;
          default: return undefined;
        }
      }
    };
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    (request as any).formData = vi.fn().mockResolvedValue(fakeForm as unknown as FormData);

    // stub uploadFile for primary and secondary
    mockUploadFile.mockResolvedValueOnce({ path: 'public/mock-uuid-primary.png', error: null });
    mockUploadFile.mockResolvedValueOnce({ path: 'public/mock-uuid-secondary.jpg', error: null });
    // stub insertData
    const returnedMember = { id: 'member-1', name: 'Alice', title: 'Engineer' };
    mockInsertData.mockResolvedValue({ data: returnedMember, error: null });

    const response = await POST(request as any);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual(returnedMember);
  });

  it('should return 500 if primary image upload fails', async () => {
    const primaryFile = new File(['a'], 'primary.png', { type: 'image/png' });
    const secondaryFile = new File(['b'], 'secondary.jpg', { type: 'image/jpeg' });
    const fakeForm = {
      get: (key: string) => {
        switch (key) {
          case 'name': return 'Alice';
          case 'title': return 'Engineer';
          case 'primaryImage': return primaryFile;
          case 'secondaryImage': return secondaryFile;
          default: return undefined;
        }
      }
    };
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    (request as any).formData = vi.fn().mockResolvedValue(fakeForm as unknown as FormData);

    mockUploadFile.mockResolvedValue({ path: null, error: new Error('fail upload') });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Primary image upload failed: fail upload');
    expect(data.error.code).toBe('DATABASE_ERROR');
    expect(data.error.statusCode).toBe(500);
    expect(mockRemoveFile).not.toHaveBeenCalled();
  });

  it('should return 500 and cleanup if secondary image upload fails', async () => {
    const primaryFile = new File(['a'], 'primary.png', { type: 'image/png' });
    const secondaryFile = new File(['b'], 'secondary.jpg', { type: 'image/jpeg' });
    const fakeForm = {
      get: (key: string) => {
        switch (key) {
          case 'name': return 'Alice';
          case 'title': return 'Engineer';
          case 'primaryImage': return primaryFile;
          case 'secondaryImage': return secondaryFile;
          default: return undefined;
        }
      }
    };
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    (request as any).formData = vi.fn().mockResolvedValue(fakeForm as unknown as FormData);

    mockUploadFile.mockResolvedValueOnce({ path: 'public/mock-uuid-primary.png', error: null });
    mockUploadFile.mockResolvedValueOnce({ path: null, error: new Error('second fail') });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Secondary image upload failed: second fail');
    expect(data.error.code).toBe('DATABASE_ERROR');
    expect(data.error.statusCode).toBe(500);
    expect(mockRemoveFile).toHaveBeenCalledWith({}, 'team-images', 'public/mock-uuid-primary.png');
  });

  it('should return 500 and cleanup if database insert fails', async () => {
    const primaryFile = new File(['a'], 'primary.png', { type: 'image/png' });
    const secondaryFile = new File(['b'], 'secondary.jpg', { type: 'image/jpeg' });
    const fakeForm = {
      get: (key: string) => {
        switch (key) {
          case 'name': return 'Alice';
          case 'title': return 'Engineer';
          case 'primaryImage': return primaryFile;
          case 'secondaryImage': return secondaryFile;
          default: return undefined;
        }
      }
    };
    const request = new Request('https://example.com/api/team/upload', { method: 'POST' });
    (request as any).formData = vi.fn().mockResolvedValue(fakeForm as unknown as FormData);

    mockUploadFile.mockResolvedValueOnce({ path: 'public/mock-uuid-primary.png', error: null });
    mockUploadFile.mockResolvedValueOnce({ path: 'public/mock-uuid-secondary.jpg', error: null });
    mockInsertData.mockResolvedValue({ data: undefined, error: new Error('insert error') });

    const response = await POST(request as any);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.message).toBe('Database insert failed: insert error');
    expect(data.error.code).toBe('DATABASE_ERROR');
    expect(data.error.statusCode).toBe(500);
    expect(mockRemoveFile).toHaveBeenCalledTimes(2);
  });

  it('should handle authentication failure', async () => {
    const request = new Request('https://example.com/api/team/upload', { method: 'POST', headers: new Headers({ 'x-test-auth': 'fail' }) });
    (request as any).formData = vi.fn().mockResolvedValue({} as FormData);

    const response = await POST(request as unknown as NextRequest);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Authentication required');
  });
}); 