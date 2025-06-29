/**
 * Chat Session Mapper
 * 
 * Maps between ChatSession domain entities and DTOs.
 * Following DDD principle: Application layer handles transformations
 * between domain entities and external contracts (DTOs).
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed leadScore mapping - using API-only approach
 * - Lead scores are now handled externally, not in domain entities
 * - Keep under 200 lines following @golden-rule patterns
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import {
  ChatSessionDto,
  CreateChatSessionDto,
  UpdateChatSessionDto,
  SessionContextDto,
  LeadQualificationStateDto,
} from '../dto/ChatSessionDto';

export class ChatSessionMapper {
  /**
   * Convert domain entity to DTO
   */
  static toDto(entity: ChatSession): ChatSessionDto {
    const props = entity.toPlainObject();
    
    return {
      id: props.id,
      chatbotConfigId: props.chatbotConfigId,
      visitorId: props.visitorId,
      sessionToken: props.sessionToken,
      contextData: this.contextDataToDto(props.contextData),
      leadQualificationState: this.qualificationStateToDto(props.leadQualificationState),
      status: this.mapDomainStatusToDto(props.status),
      startedAt: props.startedAt.toISOString(),
      lastActivityAt: props.lastActivityAt.toISOString(),
      endedAt: props.endedAt?.toISOString(),
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
      referrerUrl: props.referrerUrl,
      currentUrl: props.currentUrl,
    };
  }

  /**
   * Convert DTO to domain entity
   */
  static toDomain(dto: ChatSessionDto): ChatSession {
    return ChatSession.fromPersistence({
      id: dto.id,
      chatbotConfigId: dto.chatbotConfigId,
      visitorId: dto.visitorId,
      sessionToken: dto.sessionToken,
      contextData: this.contextDataFromDto(dto.contextData),
      leadQualificationState: this.qualificationStateFromDto(dto.leadQualificationState),
      status: this.mapDtoStatusToDomain(dto.status),
      startedAt: new Date(dto.startedAt),
      lastActivityAt: new Date(dto.lastActivityAt),
      endedAt: dto.endedAt ? new Date(dto.endedAt) : undefined,
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
      referrerUrl: dto.referrerUrl,
      currentUrl: dto.currentUrl,
    });
  }

  /**
   * Convert create DTO to domain entity
   * AI INSTRUCTIONS: Use enhanced conversationSummary format following @golden-rule patterns
   */
  static createDtoToDomain(dto: CreateChatSessionDto & { status?: string }): ChatSession {
    // SessionContext properties with enhanced conversationSummary format
    const initialContext = {
      previousVisits: 0,
      pageViews: [],
      conversationSummary: {
        fullSummary: 'New conversation started',
        phaseSummaries: [],
        criticalMoments: []
      },
      topics: [],
      interests: [],
      engagementScore: 0,
    };
    
    const session = ChatSession.create(
      dto.chatbotConfigId,
      dto.visitorId,
      initialContext
    );
    
    // Update with additional properties if needed
    return session;
  }

  private static mapDomainStatusToDto(status: string): any {
    // Map domain SessionStatus to DTO ChatSessionStatus
    switch (status) {
      case 'idle':
      case 'active':
        return 'active';
      case 'ended':
      case 'completed':
        return 'completed';
      case 'abandoned':
        return 'abandoned';
      default:
        return 'active';
    }
  }

  private static mapDtoStatusToDomain(status: string): any {
    // Map DTO ChatSessionStatus to domain SessionStatus
    switch (status) {
      case 'escalated':
        return 'active'; // Escalated sessions remain active in domain
      case 'active':
        return 'active';
      case 'completed':
        return 'completed';
      case 'abandoned':
        return 'abandoned';
      default:
        return 'active';
    }
  }

  private static contextDataToDto(contextData: any): SessionContextDto {
    return {
      previousVisits: contextData?.previousVisits || 0,
      pageViews: contextData?.pageViews || [],
      conversationSummary: contextData?.conversationSummary?.fullSummary || 'New conversation started',
      topics: contextData?.topics || [],
      interests: contextData?.interests || [],
      engagementScore: contextData?.engagementScore || 0,
    };
  }

  private static contextDataFromDto(dto: SessionContextDto): any {
    // Convert DTO conversationSummary (string) to enhanced format
    const conversationSummary = {
      fullSummary: dto.conversationSummary || 'New conversation started',
      phaseSummaries: [],
      criticalMoments: []
    };

    return {
      previousVisits: dto.previousVisits,
      pageViews: dto.pageViews,
      conversationSummary,
      topics: dto.topics,
      interests: dto.interests,
      engagementScore: dto.engagementScore,
      // MODERN: Legacy fields removed, entity data is in accumulated entities
      accumulatedEntities: {
        decisionMakers: [],
        painPoints: [],
        integrationNeeds: [],
        evaluationCriteria: []
      }
    };
  }

  private static qualificationStateToDto(qualificationState: any): LeadQualificationStateDto {
    return {
      currentStep: qualificationState?.currentStep || 0,
      totalSteps: qualificationState?.totalSteps || 0,
      answeredQuestions: qualificationState?.answeredQuestions || [],
      qualificationStatus: qualificationState?.qualificationStatus || 'not_started',
      isQualified: qualificationState?.isQualified || false,
      engagementLevel: qualificationState?.engagementLevel || 'low',
    };
  }

  private static qualificationStateFromDto(dto: LeadQualificationStateDto): any {
    return {
      currentStep: dto.currentStep,
      totalSteps: dto.totalSteps,
      answeredQuestions: dto.answeredQuestions,
      qualificationStatus: dto.qualificationStatus,
      isQualified: dto.isQualified,
      engagementLevel: dto.engagementLevel,
    };
  }
} 