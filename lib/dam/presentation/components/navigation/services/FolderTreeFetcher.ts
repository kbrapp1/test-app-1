import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

/**
 * FolderTreeFetcher Service
 * Follows Single Responsibility Principle - handles folder tree API calls and data transformation
 */
export class FolderTreeFetcher {
  /**
   * Fetch child folders from API
   */
  static async fetchChildFolders(parentId: string | null): Promise<DomainFolder[]> {
    const url = parentId 
      ? `/api/dam/folders/tree?parentId=${parentId}` 
      : '/api/dam/folders/tree';
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch child folders' }));
        throw new Error(errorData.message || 'Failed to fetch child folders');
      }
      
      const jsonData = await response.json();
      
      if (!Array.isArray(jsonData)) {
        console.error('API did not return an array for child folders:', jsonData);
        if (jsonData && typeof jsonData === 'object' && 'message' in jsonData) {
          throw new Error(jsonData.message || 'API returned an object instead of an array for child folders.');
        }
        throw new Error('API did not return an array for child folders.');
      }
      
      return jsonData as DomainFolder[];
    } catch (error) {
      console.error('Error fetching child folders:', error);
      throw error; // Re-throw to let the caller handle the error display
    }
  }
} 
