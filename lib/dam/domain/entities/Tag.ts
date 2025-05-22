export interface Tag {
  id: string; // UUID
  name: string;
  userId: string; // UUID, creator of the tag
  organizationId: string; // UUID, organization the tag belongs to
  createdAt: Date; // Should be a Date object
  // updated_at is not typically needed for simple tags, but can be added if required.
  // assets?: Asset[]; // If you decide to load related assets directly
} 