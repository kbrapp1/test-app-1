import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFolder } from './actions'; // Assuming test file is in the same directory
import { revalidatePath } from 'next/cache'; // Added import

// --- Mocking Next.js and Supabase dependencies ---

// Mock @supabase/ssr
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => mockSupabaseClient), // Chainable
  insert: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
};
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  // createServerActionClient: vi.fn(() => mockSupabaseClient), // Keep if needed elsewhere, but we use createServerClient now
}));

// Mock next/headers
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(), // Needed for server actions
};
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// -- Test Suite ---

describe('DAM Server Actions - createFolder', () => {

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a folder for an authenticated user', async () => {
    // Arrange: Mock successful user auth and db insert
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'test-user-id' } }, error: null });
    const expectedFolder = { id: 'new-folder-id', name: 'Test Folder', user_id: 'test-user-id' };
    mockSupabaseClient.single.mockResolvedValueOnce({ data: expectedFolder, error: null });

    const formData = new FormData();
    formData.append('name', '  Test Folder  '); // Include whitespace to test trimming
    const prevState = { success: false }; // Initial state for useActionState

    // Act
    const result = await createFolder(prevState, formData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual(expectedFolder);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('folders');
    expect(mockSupabaseClient.insert).toHaveBeenCalledWith([{ 
      name: 'Test Folder', 
      user_id: 'test-user-id', 
      parent_folder_id: null 
    }]);
    expect(mockSupabaseClient.select).toHaveBeenCalled();
    expect(mockSupabaseClient.single).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith('/dam');
  });

  it('should return an error if folder name is empty', async () => {
    // Arrange: Mock successful user auth
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'test-user-id' } }, error: null });
    
    const formData = new FormData();
    formData.append('name', '   '); // Empty name
    const prevState = { success: false };

    // Act
    const result = await createFolder(prevState, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Folder name cannot be empty');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return an error if user is not authenticated', async () => {
    // Arrange: Mock failed user auth
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'Auth error' } });

    const formData = new FormData();
    formData.append('name', 'Test Folder');
    const prevState = { success: false };

    // Act
    const result = await createFolder(prevState, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not authenticated');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it('should return an error if Supabase insert fails', async () => {
    // Arrange: Mock successful user auth but failed db insert
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'test-user-id' } }, error: null });
    const dbError = { message: 'Database insert failed' };
    mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: dbError });

    const formData = new FormData();
    formData.append('name', 'Test Folder');
    const prevState = { success: false };

    // Act
    const result = await createFolder(prevState, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(dbError.message);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('folders');
    expect(mockSupabaseClient.insert).toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

}); 