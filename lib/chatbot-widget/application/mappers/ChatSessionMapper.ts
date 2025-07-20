// Chat Session Mapper
// Maps between ChatSession domain entities and DTOs
//
// AI INSTRUCTIONS:
// - UPDATED: Removed leadScore mapping - using API-only approach
// - Lead scores are now handled externally, not in domain entities

import { ChatSession } from '../../domain/entities/ChatSession';
import {
  ChatSessionDto,
  CreateChatSessionDto,
  SessionContextDto,
  LeadQualificationStateDto,
} from '../dto/ChatSessionDto';

export class ChatSessionMapper {
  /** Convert domain entity to DTO */
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

  /** Convert DTO to domain entity */
  static toDomain(dto: ChatSessionDto): ChatSession {
    return ChatSession.fromPersistence({
      id: dto.id,
      chatbotConfigId: dto.chatbotConfigId,
      visitorId: dto.visitorId,
      sessionToken: dto.sessionToken,
      contextData: this.contextDataFromDto(dto.contextData) as import('../../domain/value-objects/session-management/ChatSessionTypes').SessionContext,
      leadQualificationState: this.qualificationStateFromDto(dto.leadQualificationState) as import('../../domain/value-objects/session-management/ChatSessionTypes').LeadQualificationState,
      status: this.mapDtoStatusToDomain(dto.status) as import('../../domain/value-objects/session-management/ChatSessionTypes').SessionStatus,
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

  private static mapDomainStatusToDto(status: string): import('../dto/ChatSessionDto').ChatSessionStatus {
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

  private static mapDtoStatusToDomain(status: string): string {
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

  private static contextDataToDto(contextData: unknown): import('../dto/ChatSessionDto').SessionContextDto {
    const data = contextData as {
      previousVisits?: number;
      pageViews?: string[];
      conversationSummary?: { fullSummary?: string };
      topics?: string[];
      interests?: string[];
      engagementScore?: number;
    };
    
    return {
      previousVisits: data?.previousVisits || 0,
      pageViews: data?.pageViews || [],
      conversationSummary: data?.conversationSummary?.fullSummary || 'New conversation started',
      topics: data?.topics || [],
      interests: data?.interests || [],
      engagementScore: data?.engagementScore || 0,
    };
  }

  private static contextDataFromDto(dto: SessionContextDto): unknown {
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

  private static qualificationStateToDto(qualificationState: unknown): import('../dto/ChatSessionDto').LeadQualificationStateDto {
    const state = qualificationState as {
      currentStep?: number;
      totalSteps?: number;
      answeredQuestions?: unknown[];
      qualificationStatus?: string;
      isQualified?: boolean;
      engagementLevel?: string;
    };
    
    return {
      currentStep: state?.currentStep || 0,
      totalSteps: state?.totalSteps || 0,
      answeredQuestions: (state?.answeredQuestions as import('../dto/ChatSessionDto').AnsweredQuestionDto[]) || [],
      qualificationStatus: (state?.qualificationStatus as import('../dto/ChatSessionDto').QualificationStatus) || 'not_started',
      isQualified: state?.isQualified || false,
      engagementLevel: (state?.engagementLevel as import('../dto/ChatSessionDto').EngagementLevel) || 'low',
    };
  }

  private static qualificationStateFromDto(dto: LeadQualificationStateDto): unknown {
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