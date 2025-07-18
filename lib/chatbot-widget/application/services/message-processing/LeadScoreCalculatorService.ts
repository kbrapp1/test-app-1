/**
 * Lead Score Calculator Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate domain-based lead scores
 * - Handle score breakdown and logging
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on lead scoring only
 * - Follow DDD application service patterns
 */

import { AccumulatedEntities } from '../../../domain/value-objects/context/AccumulatedEntities';
import { DomainConstants } from '../../../domain/value-objects/ai-configuration/DomainConstants';
import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { LeadScoringEntities } from '../../../domain/types/ChatbotTypes';
import { SerializedAccumulatedEntities } from '../../../domain/types/AccumulatedEntityTypes';

export class LeadScoreCalculatorService {
  private readonly loggingService: IChatbotLoggingService;

  constructor() {
    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /**
   * Calculate domain-based lead score
   * 
   * AI INSTRUCTIONS:
   * - Convert accumulated entities to lead scoring format
   * - Use DomainConstants for consistent scoring
   * - Log detailed score breakdown for debugging
   */
  calculateDomainLeadScore(
    accumulatedEntities: AccumulatedEntities,
    sessionId: string,
    sharedLogFile: string
  ): number {
    const accumulatedEntitiesPlain = accumulatedEntities.toPlainObject();
    const leadScoreEntities = this.convertAccumulatedEntitiesToLeadScoringFormat(accumulatedEntitiesPlain);
    const calculatedLeadScore = DomainConstants.calculateLeadScore(leadScoreEntities);

    // Log comprehensive lead score calculation using centralized service
    if (sessionId) {
      const logger = this.loggingService.createSessionLogger(
        sessionId,
        sharedLogFile,
        {
          sessionId,
          operation: 'lead-score-calculation'
        }
      );
      
      this.logLeadScoreCalculation(leadScoreEntities, calculatedLeadScore, logger);
    }

    return calculatedLeadScore;
  }

  /** Convert accumulated entities to lead scoring format */
  private convertAccumulatedEntitiesToLeadScoringFormat(accumulatedEntities: SerializedAccumulatedEntities): LeadScoringEntities {
    const leadScoringEntities: LeadScoringEntities = {
      contactInfo: {
        email: undefined, // Email not directly available in SerializedAccumulatedEntities
        phone: accumulatedEntities.contactMethod?.value === 'phone' ? 'phone_provided' : undefined,
        name: accumulatedEntities.visitorName?.value as string | undefined
      },
      businessInfo: {
        company: accumulatedEntities.company?.value as string | undefined,
        industry: accumulatedEntities.industry?.value as string | undefined,
        size: accumulatedEntities.teamSize?.value as string | undefined
      },
      intentSignals: {
        urgency: accumulatedEntities.urgency?.value as 'low' | 'medium' | 'high' | undefined,
        budget: accumulatedEntities.budget?.value as 'low' | 'medium' | 'high' | undefined,
        timeline: accumulatedEntities.timeline?.value as 'medium' | 'immediate' | 'short' | 'long' | undefined
      },
      engagementMetrics: {
        messageCount: undefined, // Not directly available in SerializedAccumulatedEntities
        sessionDuration: undefined, // Not directly available in SerializedAccumulatedEntities
        responseTime: undefined // Not directly available in SerializedAccumulatedEntities
      },
      role: accumulatedEntities.role?.value as string | undefined
    };
    
    return leadScoringEntities;
  }

  /** Log detailed lead score calculation */
  private logLeadScoreCalculation(
    leadScoreEntities: LeadScoringEntities,
    calculatedLeadScore: number,
    logger: ISessionLogger
  ): void {
    try {
      // Calculate detailed score breakdown
      const scoreBreakdown: Record<string, number> = {};
      let totalFromStandardRules = 0;
      let roleAuthorityScore = 0;
      
      if (leadScoreEntities.role) {
        roleAuthorityScore = DomainConstants.getRoleAuthorityScore(leadScoreEntities.role);
        scoreBreakdown['role (authority-based)'] = roleAuthorityScore;
      }
      
      const standardRules = DomainConstants.getLeadScoringRules();
      Object.entries(leadScoreEntities).forEach(([key, value]) => {
        if (value && key !== 'role' && key in standardRules) {
          const points = standardRules[key as keyof typeof standardRules];
          scoreBreakdown[key] = points;
          totalFromStandardRules += points;
        }
      });
      
      const uncappedTotal = totalFromStandardRules + roleAuthorityScore;
      const isCapped = uncappedTotal > 100;
      
      // Log using centralized service with clean formatting
      logger.logRaw('🎯 =====================================');
      logger.logRaw('🎯 LEAD SCORE CALCULATION (DOMAIN-BASED)');
      logger.logRaw('🎯 =====================================');
      
      logger.logMessage('Input Entities for Scoring:', leadScoreEntities);
      logger.logRaw('');
      
      logger.logMessage('📊 Detailed Score Breakdown:');
      Object.entries(scoreBreakdown).forEach(([entity, points]) => {
        logger.logMessage(`   • ${entity}: ${points} points`);
      });
      
      logger.logRaw('');
      logger.logMessage('🧮 Calculation Summary:');
      logger.logMessage(`   • Standard Rules Total: ${totalFromStandardRules} points`);
      logger.logMessage(`   • Role Authority Score: ${roleAuthorityScore} points`);
      logger.logMessage(`   • Uncapped Total: ${uncappedTotal} points`);
      logger.logMessage(`   • Final Score: ${calculatedLeadScore} points ${isCapped ? '(capped at 100)' : ''}`);
      
      logger.logRaw('');
      logger.logMessage(`🏆 Qualification Status: ${calculatedLeadScore >= 60 ? 'QUALIFIED' : 'NOT QUALIFIED'} (threshold: 60)`);
      logger.logMessage('🔧 Source: DomainConstants.calculateLeadScore() + getRoleAuthorityScore()');
      logger.logRaw('🎯 =====================================');
      logger.logRaw('');
      
    } catch (error) {
      console.warn('Failed to write lead score calculation to log file:', error);
    }
  }
} 