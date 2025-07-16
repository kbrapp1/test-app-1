import { Generation } from '../../../../domain/entities/Generation';
import { GenerationRowMapper, GenerationRow } from './GenerationRowMapper';

/**
 * Mapper: Extract private helper logic from StatusCheckingSupabaseRepository
 * Single Responsibility: Map raw database rows to domain entities and prepare update payloads
 * Infrastructure Layer - separate concerns away from repository implementation
 */
export function toDomainGeneration(row: GenerationRow): Generation | null {
  try {
    const completeRow = {
      ...row,
      estimated_cost_cents: row.estimated_cost_cents || row.cost_cents
    } as GenerationRow;

    return GenerationRowMapper.fromRow(completeRow);
  } catch {
    return null;
  }
}

export function toUpdateData(generation: Generation): Record<string, unknown> {
  const rowData = GenerationRowMapper.toRow(generation);
  const { id, organization_id, user_id, created_at, ...updateFields } = rowData;

  return {
    ...updateFields,
    updated_at: new Date().toISOString()
  };
} 