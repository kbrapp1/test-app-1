import { Tag } from './Tag';

export interface Asset {
  id: string; // uuid
  userId: string; // uuid
  name: string;
  storagePath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt?: Date;
  folderId?: string | null; // uuid
  organizationId: string; // uuid
  tags?: Tag[]; // Added tags property
  publicUrl?: string; // Added for direct access to public URL
  // Potentially add methods later, e.g., rename(newName: string)
} 