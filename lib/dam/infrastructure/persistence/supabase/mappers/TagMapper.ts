import { Tag } from '../../../../domain/entities/Tag';

// Raw data structure from Supabase 'tags' table
export interface RawTagDbRecord {
  id: string;
  name: string;
  user_id: string;
  created_at: string; // ISO date string
  organization_id: string;
  // Potentially fields from joins if the mapper handles that, e.g., asset_count
}

export class TagMapper {
  static toDomain(raw: RawTagDbRecord): Tag {
    return {
      id: raw.id,
      name: raw.name,
      userId: raw.user_id,
      organizationId: raw.organization_id,
      createdAt: new Date(raw.created_at),
    };
  }

  static toPersistence(tagData: Omit<Tag, 'id' | 'createdAt'>): Omit<RawTagDbRecord, 'id' | 'created_at'> {
    return {
      name: tagData.name,
      user_id: tagData.userId,
      organization_id: tagData.organizationId,
    };
  }
} 