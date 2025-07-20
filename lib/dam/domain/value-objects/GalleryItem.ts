/**
 * Domain Value Object for Gallery Items
 * 
 * Represents items that can be displayed in a gallery view
 * (both folders and assets with their essential display properties)
 */

export type GalleryItemDto = 
  | { 
      type: 'folder'; 
      id: string; 
      name: string; 
      createdAt: Date; 
    } 
  | { 
      type: 'asset'; 
      id: string; 
      name: string; 
      createdAt: Date; 
      mimeType: string; 
      publicUrl?: string; 
      size: number; 
      userId: string; 
      userFullName?: string | null; 
      tags?: { id: string; name: string; color: string; }[]; 
      folderName?: string | null; 
    };