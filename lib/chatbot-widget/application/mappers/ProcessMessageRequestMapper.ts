/**
 * Process Message Request Mapper
 * 
 * AI INSTRUCTIONS:
 * - Application layer mapper for ProcessMessageRequest
 * - Single responsibility: request transformation
 * - Preserves organization security patterns
 * - Delegates to domain services for validation
 */

import { ProcessChatMessageRequest } from '../dto/ProcessChatMessageRequest';
import { ProcessMessageRequestDto, MessageMetadataDto } from '../dto/WorkflowBoundaryTypes';
import { MappingResult } from '../../domain/value-objects/mapping/MappingResult';

export class ProcessMessageRequestMapper {
  /**
   * Convert ProcessChatMessageRequest to ProcessMessageRequestDto with security preservation
   */
  public static toProcessMessageRequest(request: ProcessChatMessageRequest): MappingResult<ProcessMessageRequestDto> {
    try {
      // Preserve organization security - this is critical
      if (!request.organizationId) {
        return MappingResult.failure('organizationId is required for security');
      }

      if (!request.sessionId) {
        return MappingResult.failure('sessionId is required');
      }

      if (!request.userMessage) {
        return MappingResult.failure('userMessage is required');
      }

      const mapped: ProcessMessageRequestDto = {
        userMessage: request.userMessage,
        sessionId: request.sessionId,
        organizationId: request.organizationId, // Security: Preserve organization isolation
        metadata: request.metadata ? this.mapMessageMetadata(request.metadata) : undefined
      };

      return MappingResult.success(mapped);
    } catch (error) {
      return MappingResult.failure(
        error instanceof Error ? error.message : 'Failed to map ProcessMessageRequest'
      );
    }
  }

  /**
   * Convert metadata with proper date handling and validation
   */
  private static mapMessageMetadata(
    metadata: NonNullable<ProcessChatMessageRequest['metadata']>
  ): MessageMetadataDto {
    return {
      userId: metadata.userId, // Preserve user context for security
      timestamp: metadata.timestamp ? new Date(metadata.timestamp) : undefined,
      clientInfo: metadata.clientInfo
    };
  }

  /**
   * Validate required fields for security compliance
   */
  public static validateRequest(request: ProcessChatMessageRequest): MappingResult<void> {
    const errors: string[] = [];

    if (!request.organizationId) {
      errors.push('organizationId is required for multi-tenant security');
    }

    if (!request.sessionId) {
      errors.push('sessionId is required for session tracking');
    }

    if (!request.userMessage) {
      errors.push('userMessage is required for processing');
    }

    if (request.userMessage && typeof request.userMessage !== 'string') {
      errors.push('userMessage must be a valid string');
    }

    if (request.organizationId && typeof request.organizationId !== 'string') {
      errors.push('organizationId must be a valid string');
    }

    if (request.sessionId && typeof request.sessionId !== 'string') {
      errors.push('sessionId must be a valid string');
    }

    if (errors.length > 0) {
      return MappingResult.failure(`Validation failed: ${errors.join(', ')}`);
    }

    return MappingResult.success(undefined);
  }

  /**
   * Extract organization ID safely for security checks
   */
  public static extractOrganizationId(request: ProcessChatMessageRequest): MappingResult<string> {
    if (!request.organizationId || typeof request.organizationId !== 'string') {
      return MappingResult.failure('Valid organizationId is required');
    }

    return MappingResult.success(request.organizationId);
  }

  /**
   * Extract session ID safely for session management
   */
  public static extractSessionId(request: ProcessChatMessageRequest): MappingResult<string> {
    if (!request.sessionId || typeof request.sessionId !== 'string') {
      return MappingResult.failure('Valid sessionId is required');
    }

    return MappingResult.success(request.sessionId);
  }
}