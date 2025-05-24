import { Folder } from '../../domain/entities';
import { IFolderRepository } from '../../domain/repositories';

/**
 * NavigateToFolderUseCase - Domain-Driven Folder Navigation
 * 
 * This use case handles folder navigation with business rules:
 * - Validates folder access permissions
 * - Builds navigation breadcrumb trail
 * - Handles root folder navigation
 * - Ensures folder exists and is accessible
 */

export interface NavigateToFolderRequest {
  folderId: string | null; // null means root folder
  organizationId: string;
}

export interface FolderNavigationDto {
  currentFolder: {
    id: string | null;
    name: string;
    path: string;
  };
  breadcrumbs: Array<{
    id: string | null;
    name: string;
    isClickable: boolean;
  }>;
  parentFolderId: string | null | undefined;
  canNavigateUp: boolean;
}

export class NavigateToFolderUseCase {
  constructor(private folderRepository: IFolderRepository) {}

  async execute(request: NavigateToFolderRequest): Promise<FolderNavigationDto> {
    const { folderId, organizationId } = request;

    // Handle root folder navigation
    if (!folderId) {
      return {
        currentFolder: {
          id: null,
          name: 'Root',
          path: '/',
        },
        breadcrumbs: [
          {
            id: null,
            name: 'Root',
            isClickable: false, // Current folder is not clickable
          },
        ],
        parentFolderId: null,
        canNavigateUp: false,
      };
    }

    // Get the target folder
    const folder = await this.folderRepository.findById(folderId, organizationId);
    if (!folder) {
      throw new Error(`Folder with ID ${folderId} not found`);
    }

    // Build breadcrumb trail
    const breadcrumbs = await this.buildBreadcrumbTrail(folder, organizationId);

    return {
      currentFolder: {
        id: folder.id,
        name: folder.name,
        path: await this.buildFolderPath(folder, organizationId),
      },
      breadcrumbs,
      parentFolderId: folder.parentFolderId,
      canNavigateUp: folder.parentFolderId !== null && folder.parentFolderId !== undefined,
    };
  }

  private async buildBreadcrumbTrail(currentFolder: Folder, organizationId: string): Promise<Array<{
    id: string | null;
    name: string;
    isClickable: boolean;
  }>> {
    const breadcrumbs: Array<{
      id: string | null;
      name: string;
      isClickable: boolean;
    }> = [];

    // Start with root
    breadcrumbs.push({
      id: null,
      name: 'Root',
      isClickable: true,
    });

    // Build path from root to current folder
    const pathFolders = await this.getFolderPath(currentFolder, organizationId);
    
    for (const folder of pathFolders) {
      const isCurrentFolder = folder.id === currentFolder.id;
      breadcrumbs.push({
        id: folder.id,
        name: folder.name,
        isClickable: !isCurrentFolder,
      });
    }

    return breadcrumbs;
  }

  private async getFolderPath(folder: Folder, organizationId: string): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentFolder: Folder | null = folder;

    while (currentFolder) {
      path.unshift(currentFolder);
      
      if (currentFolder.parentFolderId) {
        currentFolder = await this.folderRepository.findById(currentFolder.parentFolderId, organizationId);
      } else {
        break;
      }
    }

    return path;
  }

  private async buildFolderPath(folder: Folder, organizationId: string): Promise<string> {
    const pathFolders = await this.getFolderPath(folder, organizationId);
    const pathNames = pathFolders.map(f => f.name);
    return '/' + pathNames.join('/');
  }
}

export default NavigateToFolderUseCase; 