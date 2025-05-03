import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { NextRequest, NextResponse } from 'next/server';

// Setup mock functions
const mockAuthGetUser = vi.fn();
const mockFromSelect = vi.fn();
const mockFromInsert = vi.fn();
const mockFromDelete = vi.fn();
const mockEq = vi.fn();
const mockIs = vi.fn();
const mockOrder = vi.fn();
const mockGetPublicUrl = vi.fn();

// Mock query builder object that can chain methods
const createQueryChain = () => ({
  eq: mockEq,
  is: mockIs,
  order: mockOrder
});

// Mock Supabase client
vi.mock('@supabase/ssr', () => {
  return {
    createServerClient: vi.fn(() => ({
      auth: {
        getUser: mockAuthGetUser
      },
      from: vi.fn(() => ({
        select: mockFromSelect,
      })),
      storage: {
        from: vi.fn(() => ({
          getPublicUrl: mockGetPublicUrl
        }))
      }
    }))
  };
});

// Import after mocking
import { createServerClient } from '@supabase/ssr';

// Mock cookies() from next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(name => ({ value: `mock-cookie-${name}` }))
  }))
}));

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key');

describe('DAM API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock authenticated user
    mockAuthGetUser.mockResolvedValue({
      data: { user: { id: 'mock-user-id' } },
      error: null
    });
    
    // Setup mock database query chains with fluent interface
    mockFromSelect.mockReturnValue(createQueryChain());
    
    // For each method in the chain, make it return a query chain too
    mockEq.mockReturnValue(createQueryChain());
    mockIs.mockReturnValue(createQueryChain());
    
    // Setup mock for getPublicUrl
    mockGetPublicUrl.mockImplementation(path => ({ 
      data: { publicUrl: `https://example.com/${path}` } 
    }));
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should handle null folder ID (root folder)', async () => {
    // Setup mock folder query response
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'folder-1', name: 'Test Folder', parent_folder_id: null, user_id: 'mock-user-id', created_at: '2023-01-01T00:00:00Z' }
      ],
      error: null
    });
    
    // Setup mock assets query response
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'asset-1', name: 'test-image.png', storage_path: 'mock-user-id/test-image.png', mime_type: 'image/png', size: 1024, created_at: '2023-01-01T00:00:00Z', user_id: 'mock-user-id', folder_id: null }
      ],
      error: null
    });
    
    // Create request with URL including query parameter
    const request = new NextRequest('https://example.com/api/dam?folderId=', {
      method: 'GET'
    });
    
    // Call the handler
    const response = await GET(request);
    const responseData = await response.json();
    
    // Verify response
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    
    // Verify the data was fetched correctly
    expect(createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'mock-anon-key',
      expect.anything()
    );
    
    // Check that folders were queried correctly
    expect(mockFromSelect).toHaveBeenCalled();
    expect(mockIs).toHaveBeenCalledWith('parent_folder_id', null);
    expect(mockEq).toHaveBeenCalledWith('user_id', 'mock-user-id');
    
    // Verify response data structure
    expect(responseData).toHaveLength(2); // 1 folder + 1 asset
    expect(responseData).toContainEqual(expect.objectContaining({
      id: 'folder-1',
      name: 'Test Folder',
      type: 'folder'
    }));
    expect(responseData).toContainEqual(expect.objectContaining({
      id: 'asset-1',
      name: 'test-image.png',
      type: 'asset',
      publicUrl: expect.stringContaining('test-image.png')
    }));
  });
  
  it('should handle specific folder ID', async () => {
    // No folders are returned for a specific folder ID query
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null
    });
    
    // Setup mock assets query response for the specific folder
    mockOrder.mockResolvedValueOnce({
      data: [
        { id: 'asset-2', name: 'folder-image.png', storage_path: 'mock-user-id/folder-1/folder-image.png', mime_type: 'image/png', size: 2048, created_at: '2023-01-02T00:00:00Z', user_id: 'mock-user-id', folder_id: 'folder-1' }
      ],
      error: null
    });
    
    // Create request with URL including query parameter
    const request = new NextRequest('https://example.com/api/dam?folderId=folder-1', {
      method: 'GET'
    });
    
    // Call the handler
    const response = await GET(request);
    const responseData = await response.json();
    
    // Verify response
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    
    // Check that folders were queried correctly
    expect(mockFromSelect).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('parent_folder_id', 'folder-1');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'mock-user-id');
    
    // Verify response data structure
    expect(responseData).toHaveLength(1); // Only the asset
    expect(responseData[0]).toMatchObject({
      id: 'asset-2',
      name: 'folder-image.png',
      type: 'asset',
      folder_id: 'folder-1',
      publicUrl: expect.stringContaining('folder-image.png')
    });
  });
  
  it('should return empty array if no items found', async () => {
    // No folders are returned
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null
    });
    
    // No assets are returned
    mockOrder.mockResolvedValueOnce({
      data: [],
      error: null
    });
    
    // Create request with URL including query parameter for a non-existent folder
    const request = new NextRequest('https://example.com/api/dam?folderId=non-existent', {
      method: 'GET'
    });
    
    // Call the handler
    const response = await GET(request);
    const responseData = await response.json();
    
    // Verify response
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(responseData).toEqual([]);
  });
  
  it('should handle database query errors', async () => {
    // Mock an error in the first query (folders)
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' }
    });
    
    // Create request
    const request = new NextRequest('https://example.com/api/dam?folderId=', {
      method: 'GET'
    });
    
    // Call the handler
    const response = await GET(request);
    
    // Verify error response
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData).toMatchObject({
      error: expect.stringContaining('Database error')
    });
  });
  
  it('should handle unauthenticated users', async () => {
    // Mock no authenticated user
    mockAuthGetUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });
    
    // Create request
    const request = new NextRequest('https://example.com/api/dam?folderId=', {
      method: 'GET'
    });
    
    // Call the handler
    const response = await GET(request);
    
    // Verify error response
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    const responseData = await response.json();
    expect(responseData).toMatchObject({
      error: expect.stringContaining('Authentication error')
    });
  });
}); 