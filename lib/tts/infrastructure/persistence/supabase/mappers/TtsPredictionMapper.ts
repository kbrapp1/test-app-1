import { TtsPrediction } from '../../../../domain/entities/TtsPrediction';
import { TextInput } from '../../../../domain/value-objects/TextInput';
import { PredictionStatus } from '../../../../domain/value-objects/PredictionStatus';
import { VoiceId } from '../../../../domain/value-objects/VoiceId';
import { Database } from '@/types/supabase';

type DatabaseRow = Database['public']['Tables']['TtsPrediction']['Row'];
type DatabaseInsert = Database['public']['Tables']['TtsPrediction']['Insert'];
type DatabaseUpdate = Database['public']['Tables']['TtsPrediction']['Update'];

/**
 * Infrastructure mapper for converting between TtsPrediction domain entities
 * and Supabase database rows. This maintains the separation between domain
 * models and persistence concerns.
 */
export class TtsPredictionMapper {
  
  /**
   * Convert database row to domain entity
   */
  static toDomain(row: DatabaseRow): TtsPrediction {
    return new TtsPrediction({
      id: row.id,
      replicatePredictionId: row.replicatePredictionId,
      externalProviderId: row.replicatePredictionId, // Using replicate ID as external ID for now
      textInput: new TextInput(row.inputText || ''),
      status: new PredictionStatus(row.status),
      outputUrl: row.outputUrl,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      userId: row.userId,
      organizationId: row.organization_id,
      sourceAssetId: row.sourceAssetId,
      outputAssetId: row.outputAssetId,
      voiceId: row.voiceId ? new VoiceId(row.voiceId) : null,
      errorMessage: row.errorMessage,
      predictionProvider: row.prediction_provider,
      isOutputUrlProblematic: row.is_output_url_problematic || false,
      outputUrlLastError: row.output_url_last_error,
      outputStoragePath: (row as any).output_storage_path || null,
      outputContentType: (row as any).output_content_type || null,
      outputFileSize: (row as any).output_file_size || null,
    });
  }
  
  /**
   * Convert domain entity to database insert format
   */
  static toInsert(entity: TtsPrediction): DatabaseInsert {
    return {
      id: entity.id,
      replicatePredictionId: entity.replicatePredictionId,
      inputText: entity.textInput.value,
      voiceId: entity.voiceId?.value || null,
      status: entity.status.value,
      outputUrl: entity.outputUrl,
      userId: entity.userId,
      organization_id: entity.organizationId,
      sourceAssetId: entity.sourceAssetId,
      outputAssetId: entity.outputAssetId,
      errorMessage: entity.errorMessage,
      prediction_provider: entity.predictionProvider,
      is_output_url_problematic: entity.isOutputUrlProblematic,
      output_url_last_error: entity.outputUrlLastError,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
      // Storage metadata fields (use type assertion since they're not in generated types yet)
      ...(entity.outputStoragePath && { output_storage_path: entity.outputStoragePath }),
      ...(entity.outputContentType && { output_content_type: entity.outputContentType }),
      ...(entity.outputFileSize !== null && { output_file_size: entity.outputFileSize }),
    } as DatabaseInsert;
  }
  
  /**
   * Convert domain entity to database update format
   */
  static toUpdate(entity: TtsPrediction): DatabaseUpdate {
    return {
      inputText: entity.textInput.value,
      voiceId: entity.voiceId?.value || null,
      status: entity.status.value,
      outputUrl: entity.outputUrl,
      outputAssetId: entity.outputAssetId,
      errorMessage: entity.errorMessage,
      prediction_provider: entity.predictionProvider,
      is_output_url_problematic: entity.isOutputUrlProblematic,
      output_url_last_error: entity.outputUrlLastError,
      updatedAt: entity.updatedAt.toISOString(),
      // Storage metadata fields (use type assertion since they're not in generated types yet)
      ...(entity.outputStoragePath && { output_storage_path: entity.outputStoragePath }),
      ...(entity.outputContentType && { output_content_type: entity.outputContentType }),
      ...(entity.outputFileSize !== null && { output_file_size: entity.outputFileSize }),
    } as DatabaseUpdate;
  }
  
  /**
   * Convert multiple database rows to domain entities
   */
  static toDomainList(rows: DatabaseRow[]): TtsPrediction[] {
    return rows.map(row => this.toDomain(row));
  }
  
  /**
   * Map search and pagination options to Supabase query format
   */
  static mapFindOptions(options: {
    limit?: number;
    offset?: number;
    page?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'status' | 'inputText' | 'voiceId';
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
  }): {
    limit?: number;
    offset?: number;
    sortColumn: string;
    sortOrder: 'asc' | 'desc';
    searchQuery?: string;
  } {
    // Map domain sort fields to database column names
    const sortColumnMap = {
      'createdAt': 'createdAt',
      'updatedAt': 'updatedAt',
      'status': 'status',
      'inputText': 'inputText',
      'voiceId': 'voiceId'
    };
    
    // Calculate offset from page if provided
    let calculatedOffset = options.offset;
    if (options.page && options.limit) {
      calculatedOffset = (options.page - 1) * options.limit;
    }
    
    return {
      limit: options.limit,
      offset: calculatedOffset,
      sortColumn: sortColumnMap[options.sortBy || 'createdAt'],
      sortOrder: options.sortOrder || 'desc',
      searchQuery: options.searchQuery
    };
  }
  
  /**
   * Map domain count filters to database query conditions
   */
  static mapCountFilters(filters: {
    status?: string;
    searchQuery?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): {
    status?: string;
    searchQuery?: string;
    dateFrom?: string;
    dateTo?: string;
  } {
    return {
      status: filters.status,
      searchQuery: filters.searchQuery,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString()
    };
  }
} 