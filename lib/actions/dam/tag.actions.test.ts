/// <reference types="vitest/globals" />
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import { createTag, listTagsForOrganization, Tag, ActionResult } from './tag.actions';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth/server-action', () => ({
  getActiveOrganizationId: vi.fn(),
}));

// Import mocked functions to type them and spy on
import { createClient } from '@/lib/supabase/server';
import { getActiveOrganizationId } from '@/lib/auth/server-action';

// Define types for our mock results for clarity
type MockSupabaseResult<T> = { data: T | null; error: any | null };

let mockSingleResult: MockSupabaseResult<Tag>;
let mockOrderResult: MockSupabaseResult<Tag[]>;
let mockUserResult: MockSupabaseResult<{ user: { id: string } | null }>;

// Define an interface for the query builder to type `this` and its methods
interface MockQueryBuilderType {
  insert: Mock< (data?: Partial<Tag>) => MockQueryBuilderType >;
  select: Mock< (columns?: string) => MockQueryBuilderType >;
  eq:     Mock< (column: string, value: any) => MockQueryBuilderType >;
  single: Mock< () => Promise<MockSupabaseResult<Tag>> >;
  order:  Mock< (column: string, options?: { ascending: boolean }) => Promise<MockSupabaseResult<Tag[]>> >;
}

const mockSupabaseQueryBuilder: MockQueryBuilderType = {
  insert: vi.fn(function(this: MockQueryBuilderType) { return this; }),
  select: vi.fn(function(this: MockQueryBuilderType) { return this; }),
  eq:     vi.fn(function(this: MockQueryBuilderType) { return this; }),
  single: vi.fn(() => Promise.resolve(mockSingleResult)),
  order:  vi.fn(() => Promise.resolve(mockOrderResult)),
};

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(() => Promise.resolve(mockUserResult)),
  },
  from: vi.fn((_tableName: string) => mockSupabaseQueryBuilder),
};

describe('Tag Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (createClient as Mock).mockReturnValue(mockSupabaseClient);

    // Default successful mock results
    mockUserResult = { data: { user: { id: 'user-test-id' } }, error: null };
    (getActiveOrganizationId as Mock).mockResolvedValue('org-test-id');
    mockSingleResult = { data: null, error: null }; 
    mockOrderResult = { data: [], error: null };

    // Clear mocks and reset implementations for chainable methods
    mockSupabaseQueryBuilder.insert.mockClear().mockImplementation(function(this: MockQueryBuilderType) { return this; });
    mockSupabaseQueryBuilder.select.mockClear().mockImplementation(function(this: MockQueryBuilderType) { return this; });
    mockSupabaseQueryBuilder.eq.mockClear().mockImplementation(function(this: MockQueryBuilderType) { return this; });
    mockSupabaseQueryBuilder.single.mockClear().mockImplementation(() => Promise.resolve(mockSingleResult));
    mockSupabaseQueryBuilder.order.mockClear().mockImplementation(() => Promise.resolve(mockOrderResult));
    mockSupabaseClient.auth.getUser.mockClear().mockImplementation(() => Promise.resolve(mockUserResult));
    mockSupabaseClient.from.mockClear().mockImplementation((_tableName: string) => mockSupabaseQueryBuilder);
  });

  describe('createTag', () => {
    let formData: FormData;

    beforeEach(() => {
      formData = new FormData();
      formData.append('name', 'New Tag Name');
    });

    it('should create a tag successfully', async () => {
      const mockNewTagData: Tag = { id: 'tag-123', name: 'New Tag Name', user_id: 'user-test-id', created_at: new Date().toISOString(), organization_id: 'org-test-id' };
      mockSingleResult = { data: mockNewTagData, error: null }; // Set specific result for this test

      const result = await createTag(formData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockNewTagData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tags');
      expect(mockSupabaseQueryBuilder.insert).toHaveBeenCalledWith({
        name: 'New Tag Name',
        user_id: 'user-test-id',
        organization_id: 'org-test-id',
      });
      expect(mockSupabaseQueryBuilder.select).toHaveBeenCalledTimes(1); // or .toHaveBeenCalledWith() if specific select args
      expect(mockSupabaseQueryBuilder.single).toHaveBeenCalledTimes(1);
    });

    it('should return error if tag name is empty', async () => {
      formData.set('name', ' '); 
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Tag name cannot be empty.');
    });

    it('should return error if user is not authenticated', async () => {
      mockUserResult = { data: { user: null }, error: { message: 'Auth error' } }; // Set specific result
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('User not authenticated.');
    });

    it('should return error if active organization ID is not found', async () => {
      (getActiveOrganizationId as Mock).mockResolvedValueOnce(null);
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Could not determine active organization. Please ensure you are part of an active organization.');
    });

    it('should return error for unique constraint violation (duplicate tag name)', async () => {
      mockSingleResult = { data: null, error: { code: '23505', message: 'duplicate key' } }; // Set specific result
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('A tag with this name already exists in your organization.');
    });

    it('should return error for a generic database error during insert', async () => {
      mockSingleResult = { data: null, error: { message: 'DB insert failed' } }; // Set specific result
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      // The actual error message includes the original error, so we check for inclusion
      expect(result.error).toBe('Failed to create tag. DB insert failed');
    });
    
    it('should return error if insert returns no data', async () => {
      mockSingleResult = { data: null, error: null }; // Set specific result
      const result = await createTag(formData);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create tag, no data returned.');
    });
  });

  describe('listTagsForOrganization', () => {
    const mockOrgId = 'org-list-id';
    const mockTagsData: Tag[] = [
      { id: 'tag-1', name: 'Alpha Tag', user_id: 'user-1', created_at: 'date1', organization_id: mockOrgId },
      { id: 'tag-2', name: 'Beta Tag', user_id: 'user-2', created_at: 'date2', organization_id: mockOrgId },
    ];

    it('should list tags successfully for a given organization', async () => {
      mockOrderResult = { data: mockTagsData, error: null }; // Set specific result
      const result = await listTagsForOrganization(mockOrgId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTagsData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tags');
      expect(mockSupabaseQueryBuilder.select).toHaveBeenCalledWith('*, asset_tags!inner(tag_id)');
      expect(mockSupabaseQueryBuilder.eq).toHaveBeenCalledWith('organization_id', mockOrgId);
      expect(mockSupabaseQueryBuilder.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('should return an empty array if no tags are found', async () => {
      mockOrderResult = { data: [], error: null }; // Set specific result
      const result = await listTagsForOrganization(mockOrgId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
    
    it('should return success with empty array if data is null from db', async () => {
      mockOrderResult = { data: null, error: null }; // Set specific result
      const result = await listTagsForOrganization(mockOrgId);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]); // Action transforms null to []
    });

    it('should return error if organization ID is not provided', async () => {
      const result = await listTagsForOrganization('');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Organization ID is required.');
    });

    it('should return error for a database error during select', async () => {
      mockOrderResult = { data: null, error: { message: 'DB select failed' } }; // Set specific result
      const result = await listTagsForOrganization(mockOrgId);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to list tags. DB select failed');
    });
  });
}); 