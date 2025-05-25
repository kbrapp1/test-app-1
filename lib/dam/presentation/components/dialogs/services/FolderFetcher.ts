import { toast } from 'sonner';
import { Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

/**
 * FolderFetcher Service
 * Follows Single Responsibility Principle - handles folder API calls and data transformation
 */
export class FolderFetcher {
  /**
   * Fetch folders from API and transform to domain entities
   */
  static async fetchFolders(parentId: string | null): Promise<DomainFolder[]> {
    const url = parentId 
      ? `/api/dam/folders/tree?parentId=${parentId}` 
      : '/api/dam/folders/tree';
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch folders' }));
        throw new Error(errorData.message || 'Failed to fetch folders');
      }
      
      const jsonData = await response.json();
      
      if (!Array.isArray(jsonData)) {
        console.error('API did not return an array for folders:', jsonData);
        if (jsonData && typeof jsonData === 'object' && 'message' in jsonData) {
          throw new Error(jsonData.message || 'API returned an object instead of an array and it contained a message property.');
        }
        throw new Error('API did not return an array for folders.');
      }
      
      return this.transformToFolderEntities(jsonData);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error((error as Error).message || 'An unexpected error occurred.');
      return [];
    }
  }

  /**
   * Transform plain objects to domain folder entities
   */
  private static transformToFolderEntities(plainFolders: Array<{
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
    parentFolderId?: string | null;
    organizationId: string;
    has_children?: boolean;
  }>): DomainFolder[] {
    return plainFolders.map(pf => 
      new DomainFolder({
        id: pf.id,
        name: pf.name,
        userId: pf.userId,
        createdAt: new Date(pf.createdAt),
        updatedAt: pf.updatedAt ? new Date(pf.updatedAt) : undefined,
        parentFolderId: pf.parentFolderId,
        organizationId: pf.organizationId,
        has_children: pf.has_children,
      })
    );
  }
} 
