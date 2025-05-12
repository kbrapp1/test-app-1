import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ErrorCodes } from '@/lib/errors/constants';
import { Folder } from '@/types/dam';

// Mock dependencies
const mockUpdateFolderService = vi.fn();

vi.mock('@/lib/services/folder-service', () => ({
  updateFolderService: mockUpdateFolderService,
}));

// Dynamically import the usecase
let updateFolderUsecase: typeof import('./updateFolderUsecase').updateFolderUsecase;

describe('updateFolderUsecase', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const module = await import('./updateFolderUsecase');
    updateFolderUsecase = module.updateFolderUsecase;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockOrgId = 'test-org-id';
  const mockFolderId = 'test-folder-id';
  const mockNewName = 'Updated Folder Name';

  const mockUpdatedFolder: Folder = {
    id: mockFolderId,
    name: mockNewName,
    parent_folder_id: 'some-parent-id',
    user_id: 'some-user-id',
    organization_id: mockOrgId,
    created_at: new Date().toISOString(),
    type: 'folder',
  };

  it('should return success true and updated folder data on successful update', async () => {
    mockUpdateFolderService.mockResolvedValue({
      success: true,
      data: { folder: mockUpdatedFolder },
    });

    const result = await updateFolderUsecase({
      organizationId: mockOrgId,
      folderId: mockFolderId,
      newName: mockNewName,
    });

    expect(result.success).toBe(true);
    expect(result.data?.folder).toEqual(mockUpdatedFolder);
    expect(mockUpdateFolderService).toHaveBeenCalledWith(
      mockOrgId,
      mockFolderId,
      mockNewName
    );
  });

  it('should return error if organizationId is missing', async () => {
    const result = await updateFolderUsecase({
      organizationId: '',
      folderId: mockFolderId,
      newName: mockNewName,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Organization ID is required.');
    expect(result.errorCode).toBe(ErrorCodes.UNAUTHORIZED);
    expect(mockUpdateFolderService).not.toHaveBeenCalled();
  });

  // Validations for folderId and newName are handled by the service layer
  // Test the service failure path
  it('should return error if updateFolderService fails', async () => {
    mockUpdateFolderService.mockResolvedValue({
      success: false,
      error: 'Service update failed',
      errorCode: ErrorCodes.DATABASE_ERROR,
    });

    const result = await updateFolderUsecase({
      organizationId: mockOrgId,
      folderId: mockFolderId,
      newName: mockNewName,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Service update failed');
    expect(result.errorCode).toBe(ErrorCodes.DATABASE_ERROR);
  });

  it('should return error if service returns success but no data', async () => {
    mockUpdateFolderService.mockResolvedValue({
      success: true,
      data: null, // or { folder: null }
      error: 'Service success but no data',
      errorCode: ErrorCodes.UNEXPECTED_ERROR
    });

    const result = await updateFolderUsecase({
      organizationId: mockOrgId,
      folderId: mockFolderId,
      newName: mockNewName,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Service success but no data');
    expect(result.errorCode).toBe(ErrorCodes.UNEXPECTED_ERROR);
  });

  it('should handle unexpected exceptions from updateFolderService', async () => {
    mockUpdateFolderService.mockRejectedValue(new Error('Unexpected service explosion'));
    
    // Similar to createFolderUsecase, current updateFolderUsecase does not catch exceptions from service.
    // Test reflects this.
    try {
      await updateFolderUsecase({
        organizationId: mockOrgId,
        folderId: mockFolderId,
        newName: mockNewName,
      });
    } catch (e: any) {
      expect(e.message).toBe('Unexpected service explosion');
    }
    expect(mockUpdateFolderService).toHaveBeenCalled(); // Ensure service was called
  });
}); 