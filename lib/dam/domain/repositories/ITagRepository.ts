import { Tag } from '../entities/Tag';

export interface ITagRepository {
  findById(id: string): Promise<Tag | null>;
  findByOrganizationId(organizationId: string, includeOrphaned?: boolean): Promise<Tag[]>;
  findByNameAndOrganization(name: string, organizationId: string): Promise<Tag | null>;
  save(tagData: Omit<Tag, 'id' | 'createdAt'>): Promise<Tag>;
} 