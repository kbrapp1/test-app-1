import { type Folder as DomainFolder } from '@/lib/dam/domain/entities/Folder';

/**
 * Domain Service: Folder Data Operations
 * 
 * MIGRATED TO REACT QUERY:
 * - Removed custom deduplication service dependency
 * - Simplified to pure data transformation functions
 * - React Query handles caching and deduplication automatically
 * - Maintained domain entity conversion logic
 */
export class FolderDataService {
  /**
   * Fetches fresh folder data from the server
   * Note: React Query handles deduplication automatically
   */
  static async fetchRootFolders(): Promise<DomainFolder[]> {
    try {
      const { getRootFolders } = await import('@/lib/dam/application/actions/navigation.actions');
      
      const freshFolders = await getRootFolders();
      
      return this.convertTodomainFolders(freshFolders);
    } catch (error) {
      console.error('Error fetching root folders:', error);
      throw new Error('Failed to fetch folder data');
    }
  }

  /**
   * Fetches children for a specific folder
   * Note: React Query handles deduplication automatically
   */
  static async fetchFolderChildren(folderId: string): Promise<DomainFolder[]> {
    try {
      // Import the fetcher function that's passed to the store
      // This maintains the existing pattern but separates the concern
      const { FolderTreeFetcher } = await import('@/lib/dam/presentation/components/navigation/services/FolderTreeFetcher');
      
      return await FolderTreeFetcher.fetchChildFolders(folderId);
    } catch (error) {
      console.error(`Error fetching children for folder ${folderId}:`, error);
      throw new Error(`Failed to fetch children for folder`);
    }
  }

  /**
   * Converts plain folder objects to domain entities
   */
  private static convertTodomainFolders(plainFolders: any[]): DomainFolder[] {
    const { Folder: DomainFolder } = require('@/lib/dam/domain/entities/Folder');
    
    return plainFolders.map(plainFolder => {
      return new DomainFolder({
        id: plainFolder.id,
        name: plainFolder.name,
        userId: plainFolder.userId,
        createdAt: plainFolder.createdAt,
        updatedAt: plainFolder.updatedAt,
        parentFolderId: plainFolder.parentFolderId,
        organizationId: plainFolder.organizationId,
        has_children: plainFolder.has_children,
      });
    });
  }

  /**
   * Validates if folder data is not empty
   */
  static isValidFolderData(folders: DomainFolder[], currentFolders: DomainFolder[]): boolean {
    // Don't overwrite existing folders with empty array
    return !(folders.length === 0 && currentFolders.length > 0);
  }
} 