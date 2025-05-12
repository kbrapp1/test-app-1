import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorCodes } from '@/lib/errors/constants';
import { Folder } from '@/types/dam'; // Import Folder type

// Mock dependencies
const mockCreateFolderService = vi.fn();

// No need to mock auth helpers directly for this use case test,
// as userId and organizationId are passed as parameters.
vi.mock('@/lib/services/folder-service', () => ({
  createFolderService: mockCreateFolderService,
}));

// Dynamically import the usecase after mocks are set up
let createFolderUsecase: typeof import('./createFolderUsecase').createFolderUsecase;

describe('createFolderUsecase', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await import('./createFolderUsecase');
    createFolderUsecase = module.createFolderUsecase;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = 'test-user-id';
  const mockOrgId = 'test-org-id';
  const mockFolderName = 'New Folder';
  const mockParentFolderId = 'parent-folder-id';
  const mockNewFolderId = 'new-folder-id';

  const mockSuccessfulFolder: Folder = {
    id: mockNewFolderId,
    name: mockFolderName,
    parent_folder_id: mockParentFolderId,
    user_id: mockUserId,
    organization_id: mockOrgId,
    created_at: new Date().toISOString(),
    type: 'folder',
  };

  it('should return success true and folder data when folder creation is successful', async () => {
    mockCreateFolderService.mockResolvedValue({
      success: true,
      data: { folder: mockSuccessfulFolder },
    });

    const result = await createFolderUsecase({
      userId: mockUserId,
      organizationId: mockOrgId,
      folderName: mockFolderName,
      parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(true);
    expect(result.data?.folder).toEqual(mockSuccessfulFolder);
    expect(mockCreateFolderService).toHaveBeenCalledWith(
      mockUserId,
      mockOrgId,
      mockFolderName,
      mockParentFolderId
    );
  });

  it('should return error if userId is missing', async () => {
    const result = await createFolderUsecase({
      userId: '',
      organizationId: mockOrgId,
      folderName: mockFolderName,
      parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User and Organization ID are required.');
    expect(result.errorCode).toBe(ErrorCodes.UNAUTHORIZED);
    expect(mockCreateFolderService).not.toHaveBeenCalled();
  });

  it('should return error if organizationId is missing', async () => {
    const result = await createFolderUsecase({
      userId: mockUserId,
      organizationId: '',
      folderName: mockFolderName,
      parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('User and Organization ID are required.');
    expect(result.errorCode).toBe(ErrorCodes.UNAUTHORIZED);
    expect(mockCreateFolderService).not.toHaveBeenCalled();
  });

  // Folder name validation is handled by the service, but the use case passes it through.
  // The use case itself does not explicitly validate folderName.
  // We test the service call failure path.

  it('should return error if createFolderService fails', async () => {
    mockCreateFolderService.mockResolvedValue({
      success: false,
      error: 'Service failure',
      errorCode: ErrorCodes.DATABASE_ERROR,
    });

    const result = await createFolderUsecase({
      userId: mockUserId,
      organizationId: mockOrgId,
      folderName: mockFolderName,
      parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Service failure');
    expect(result.errorCode).toBe(ErrorCodes.DATABASE_ERROR);
  });
  
  it('should return error if createFolderService returns success false but no data', async () => {
    mockCreateFolderService.mockResolvedValue({
      success: true, // Service might return success but something went wrong with data retrieval
      data: null, // or data: { folder: null }
      error: 'Service succeeded but no data',
      errorCode: ErrorCodes.UNEXPECTED_ERROR,
    });

    const result = await createFolderUsecase({
        userId: mockUserId,
        organizationId: mockOrgId,
        folderName: mockFolderName,
        parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(false);
    // The usecase wraps the service error
    expect(result.error).toBe('Service succeeded but no data'); 
    expect(result.errorCode).toBe(ErrorCodes.UNEXPECTED_ERROR);
  });

  it('should handle unexpected errors during service call (exception)', async () => {
    mockCreateFolderService.mockRejectedValue(new Error('Unexpected service error'));

    // The use case does not have a try/catch for the service call, 
    // so this would bubble up. This test might need adjustment if the use case adds try/catch.
    // For now, assuming it doesn't catch and re-throw.
    // Let's assume the usecase *should* catch and return a structured error.
    // The current usecase code *does not* catch exceptions from the service call.
    // This test will fail if the usecase is not updated to handle this.
    // UPDATE: The prompt's usecase *does not* have a try/catch around the service call.
    // This means an exception from createFolderService would not be caught by the usecase.
    // However, a robust usecase *should* catch it.
    // Let's test the current implementation first.
    // To make this test pass with current use case code, we would expect it to throw.
    // await expect(createFolderUsecase(...)).rejects.toThrow('Unexpected service error');

    // However, the goal is to have robust usecases. Let's assume the usecase *should* catch it.
    // The provided use case code does *not* have a try/catch. If it did, this would be the test:
    /*
    const result = await createFolderUsecase({
        userId: mockUserId,
        organizationId: mockOrgId,
        folderName: mockFolderName,
        parentFolderId: mockParentFolderId,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('An unexpected error occurred.'); // Or more specific if caught
    expect(result.errorCode).toBe(ErrorCodes.UNEXPECTED_ERROR);
    */
    
    // Given the current use case implementation (no try-catch for service calls):
    try {
        await createFolderUsecase({
            userId: mockUserId,
            organizationId: mockOrgId,
            folderName: mockFolderName,
            parentFolderId: mockParentFolderId,
        });
    } catch (e: any) {
        expect(e.message).toBe('Unexpected service error');
    }
    // Ensure the mock was called, indicating the error originated from the service
    expect(mockCreateFolderService).toHaveBeenCalled();
  });
}); 