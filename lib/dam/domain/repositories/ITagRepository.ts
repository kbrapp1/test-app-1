import { Tag } from '../entities/Tag';
import { TagColorName } from '../value-objects/TagColor';

// Define interfaces for repository input data
export interface CreateTagData {
  name: string;
  color?: TagColorName;
  userId: string;
  organizationId: string;
}

export interface UpdateTagData {
  name?: string;
  color?: TagColorName;
}

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findByOrganizationId(organizationId: string, includeOrphaned?: boolean): Promise<Tag[]>;
  findByNameAndOrganization(name: string, organizationId: string): Promise<Tag | null>;
  save(tagData: CreateTagData): Promise<Tag>;
  update(tagId: string, data: UpdateTagData): Promise<Tag | null>;
  delete(tagId: string): Promise<boolean>;
  // Commented out duplicate delete removed
} 
