import { Tag } from '../../../../domain/entities/Tag';
import { CreateTagData, UpdateTagData } from '../../../../domain/repositories/ITagRepository';

// Raw data structure from Supabase 'tags' table
export interface RawTagDbRecord {
  id: string;
  name: string;
  user_id: string;
  created_at: string; // ISO date string
  organization_id: string;
  updated_at?: string | null; // ISO date string or null
  // Potentially fields from joins if the mapper handles that, e.g., asset_count
}

export class TagMapper {
  static toDomain(raw: RawTagDbRecord): Tag {
    // Use Tag constructor to create a proper class instance
    return new Tag({
      id: raw.id,
      name: raw.name,
      userId: raw.user_id,
      organizationId: raw.organization_id,
      createdAt: new Date(raw.created_at),
      updatedAt: raw.updated_at ? new Date(raw.updated_at) : undefined,
    });
  }

  // For creating a new tag
  static toCreatePersistence(tagData: CreateTagData): Omit<RawTagDbRecord, 'id' | 'created_at' | 'updated_at'> {
    return {
      name: tagData.name,
      user_id: tagData.userId,
      organization_id: tagData.organizationId,
    };
  }

  // For updating an existing tag (handles partial data)
  static toUpdatePersistence(tagData: UpdateTagData): Partial<Pick<RawTagDbRecord, 'name'>> {
    const persistenceRecord: Partial<Pick<RawTagDbRecord, 'name'>> = {};
    if (tagData.name !== undefined) {
      persistenceRecord.name = tagData.name;
    }
    // Add other updatable fields here if any
    return persistenceRecord;
  }

  // Old toPersistence, replaced by toCreatePersistence and toUpdatePersistence
  // static toPersistence(tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Omit<RawTagDbRecord, 'id' | 'created_at' | 'updatedAt'> {
  //   return {
  //     name: tagData.name,
  //     user_id: tagData.userId,
  //     organization_id: tagData.organizationId,
  //   };
  // }
} 
