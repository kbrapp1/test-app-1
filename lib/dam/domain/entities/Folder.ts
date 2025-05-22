export interface Folder {
  id: string; // uuid
  name: string;
  userId: string; // uuid
  createdAt: Date;
  updatedAt?: Date;
  parentFolderId?: string | null; // uuid
  organizationId: string; // uuid
  has_children?: boolean; // Indicates if the folder has children, useful for UI
  // Consider adding children?: Asset[] | Folder[]; or methods like addChild(item: Asset | Folder)
} 