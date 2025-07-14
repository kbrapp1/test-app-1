import { Tag } from './Tag';

/**
 * Interface for tag database row data
 */
interface TagDatabaseRow {
  id: string;
  name: string;
  user_id?: string;
  userId?: string;
  organization_id?: string;
  organizationId?: string;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Factory for creating Tag instances from different data sources
 * Follows DDD Factory pattern - encapsulates complex object creation
 */
export class TagFactory {
  /**
   * Creates a Tag instance from database data
   */
  static fromDatabaseRow(row: TagDatabaseRow): Tag {
    return new Tag({
      id: row.id,
      name: row.name,
      userId: row.user_id || row.userId || '',
      organizationId: row.organization_id || row.organizationId || '',
      createdAt: new Date(row.created_at || row.createdAt || new Date()),
      updatedAt: row.updated_at || row.updatedAt ? new Date(row.updated_at || row.updatedAt || new Date()) : undefined
    });
  }

  /**
   * Creates a new Tag with validated input
   */
  static create(data: {
    id: string;
    name: string;
    userId: string;
    organizationId: string;
    createdAt?: Date;
  }): Tag {
    return new Tag({
      id: data.id,
      name: data.name,
      userId: data.userId,
      organizationId: data.organizationId,
      createdAt: data.createdAt || new Date()
    });
  }
} 
