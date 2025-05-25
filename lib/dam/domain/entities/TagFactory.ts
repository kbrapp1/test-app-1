import { Tag } from './Tag';

/**
 * Factory for creating Tag instances from different data sources
 * Follows DDD Factory pattern - encapsulates complex object creation
 */
export class TagFactory {
  /**
   * Creates a Tag instance from database data
   */
  static fromDatabaseRow(row: any): Tag {
    return new Tag({
      id: row.id,
      name: row.name,
      userId: row.user_id || row.userId,
      organizationId: row.organization_id || row.organizationId,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: row.updated_at || row.updatedAt ? new Date(row.updated_at || row.updatedAt) : undefined
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
