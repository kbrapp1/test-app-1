/**
 * Note Mapper - Application Layer
 * 
 * AI INSTRUCTIONS:
 * - Maps between domain aggregates and DTOs
 * - Single responsibility: Data transformation only
 * - No business logic - pure mapping functions
 * - Follows DAM blueprint mapper pattern
 * - Follow @golden-rule patterns exactly
 */

import { NoteAggregate } from '../../domain/aggregates/NoteAggregate';

// DTO interfaces for presentation layer
export interface NoteDto {
  id: string;
  user_id: string;
  organization_id: string;
  title: string | null;
  content: string | null;
  color_class: string;
  position: number;
  created_at: string;
  updated_at: string | null;
}

export interface CreateNoteDto {
  title?: string | null;
  content?: string | null;
  colorClass?: string;
  position?: number;
}

export interface UpdateNoteDto {
  id: string;
  title?: string | null;
  content?: string | null;
  colorClass?: string;
  position?: number;
}

export class NoteMapper {
  /**
   * Convert domain aggregate to DTO for presentation layer
   */
  static toDto(aggregate: NoteAggregate): NoteDto {
    return {
      id: aggregate.id.value,
      user_id: aggregate.userId,
      organization_id: aggregate.organizationId,
      title: aggregate.title,
      content: aggregate.content,
      color_class: aggregate.colorClass,
      position: aggregate.position,
      created_at: aggregate.createdAt.toISOString(),
      updated_at: aggregate.updatedAt?.toISOString() || null
    };
  }

  /**
   * Convert multiple domain aggregates to DTOs
   */
  static toDtos(aggregates: NoteAggregate[]): NoteDto[] {
    return aggregates.map(aggregate => this.toDto(aggregate));
  }

  /**
   * Map create DTO to command for use case
   */
  static toCreateCommand(
    dto: CreateNoteDto,
    userId: string,
    organizationId: string
  ) {
    return {
      title: dto.title || null,
      content: dto.content || null,
      userId,
      organizationId,
      position: dto.position,
      colorClass: dto.colorClass
    };
  }

  /**
   * Map update DTO to command for use case
   */
  static toUpdateCommand(
    dto: UpdateNoteDto,
    userId: string,
    organizationId: string
  ) {
    return {
      id: dto.id,
      title: dto.title,
      content: dto.content,
      position: dto.position,
      colorClass: dto.colorClass,
      userId,
      organizationId
    };
  }
}