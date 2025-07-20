/**
 * Critical Error Logger
 * 
 * Domain service specialized for logging critical system errors requiring immediate attention.
 * Handles system-wide failures, security incidents, and business-critical error scenarios.
 */

import { ISessionLogger } from '../../interfaces/IChatbotLoggingService';
import { ErrorContext } from '../../../value-objects/ErrorContext';
import { ErrorImpact } from '../../../value-objects/ErrorImpact';

export class CriticalErrorLogger {
  
  /**
   * Log critical system errors that require immediate attention
   */
  static logCriticalError(
    logger: ISessionLogger,
    error: Error,
    context: ErrorContext,
    impact: ErrorImpact
  ): void {
    logger.logMessage('🚨 CRITICAL ERROR DETECTED:');
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    logger.logMessage(`  Scope: ${impact.scope}`);
    logger.logMessage(`  Severity: ${impact.severity}`);
    logger.logMessage(`  User Facing: ${impact.userFacing ? 'Yes' : 'No'}`);
    logger.logMessage(`  Requires Attention: ${impact.requiresImmediateAttention() ? 'Yes' : 'No'}`);
    
    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }
    
    if (context.sessionId) {
      logger.logMessage(`  Session: ${context.sessionId}`);
    }
    
    // Log additional context from ErrorContext
    const contextData = context.toLogData();
    Object.entries(contextData).forEach(([key, value]) => {
      if (key !== 'operation' && value !== undefined) {
        logger.logMessage(`  ${key}: ${String(value)}`);
      }
    });
    
    logger.logError(error);
    
    // Log structured metrics for alerting using ErrorImpact
    const impactData = impact.toLogData();
    logger.logMetrics('critical-error', {
      duration: 0,
      customMetrics: {
        severityLevel: impact.getSeverityLevel(),
        scopeLevel: impact.getScopeLevel(),
        userFacing: impact.userFacing ? 1 : 0,
        requiresAttention: impact.requiresImmediateAttention() ? 1 : 0,
        highPriority: impact.isHighPriority() ? 1 : 0,
        errorTypeHash: error.constructor.name.length,
        ...CriticalErrorLogger.extractNumericMetrics(impactData)
      }
    });
  }

  /**
   * Log security-related critical errors
   */
  static logSecurityCriticalError(
    logger: ISessionLogger,
    error: Error,
    context: ErrorContext,
    securityContext: {
      incidentType: 'unauthorized_access' | 'data_breach' | 'injection_attempt' | 'privilege_escalation';
      sourceIP?: string;
      userAgent?: string;
      affectedResources: string[];
      containmentStatus: 'contained' | 'active' | 'unknown';
    }
  ): void {
    const impact = ErrorImpact.createSystemImpact('critical', true);
    
    logger.logMessage('🔒 SECURITY CRITICAL ERROR:');
    logger.logMessage(`  Incident Type: ${securityContext.incidentType}`);
    logger.logMessage(`  Containment Status: ${securityContext.containmentStatus}`);
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    
    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }

    if (securityContext.sourceIP) {
      logger.logMessage(`  Source IP: ${securityContext.sourceIP}`);
    }

    if (securityContext.userAgent) {
      logger.logMessage(`  User Agent: ${securityContext.userAgent}`);
    }

    logger.logMessage(`  Affected Resources: ${securityContext.affectedResources.length}`);
    securityContext.affectedResources.forEach((resource, index) => {
      logger.logMessage(`    ${index + 1}. ${resource}`);
    });
    
    logger.logError(error);
    
    // Log security incident metrics
    logger.logMetrics('security-critical-error', {
      duration: 0,
      customMetrics: {
        severityLevel: impact.getSeverityLevel(),
        scopeLevel: impact.getScopeLevel(),
        affectedResourceCount: securityContext.affectedResources.length,
        isContained: securityContext.containmentStatus === 'contained' ? 1 : 0,
        isActiveIncident: securityContext.containmentStatus === 'active' ? 1 : 0,
        incidentTypeHash: securityContext.incidentType.length
      }
    });
  }

  /**
   * Log data integrity critical errors
   */
  static logDataIntegrityCriticalError(
    logger: ISessionLogger,
    error: Error,
    context: ErrorContext,
    dataContext: {
      corruptedDataType: 'vector_embeddings' | 'user_data' | 'configuration' | 'metadata';
      affectedRecords: number;
      recoverableRecords?: number;
      dataLossEstimate?: number;
      backupAvailable: boolean;
      checksumVerified: boolean;
    }
  ): void {
    const severity = dataContext.backupAvailable ? 'high' : 'critical';
    const impact = ErrorImpact.createOrganizationImpact(severity, false);
    
    logger.logMessage('📊 DATA INTEGRITY CRITICAL ERROR:');
    logger.logMessage(`  Data Type: ${dataContext.corruptedDataType}`);
    logger.logMessage(`  Affected Records: ${dataContext.affectedRecords}`);
    logger.logMessage(`  Backup Available: ${dataContext.backupAvailable ? 'Yes' : 'No'}`);
    logger.logMessage(`  Checksum Verified: ${dataContext.checksumVerified ? 'Yes' : 'No'}`);
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    
    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }

    if (dataContext.recoverableRecords !== undefined) {
      logger.logMessage(`  Recoverable Records: ${dataContext.recoverableRecords}`);
      const lossRate = ((dataContext.affectedRecords - dataContext.recoverableRecords) / dataContext.affectedRecords * 100).toFixed(2);
      logger.logMessage(`  Data Loss Rate: ${lossRate}%`);
    }

    if (dataContext.dataLossEstimate !== undefined) {
      logger.logMessage(`  Estimated Data Loss: ${dataContext.dataLossEstimate} bytes`);
    }
    
    logger.logError(error);
    
    // Log data integrity metrics
    logger.logMetrics('data-integrity-critical-error', {
      duration: 0,
      customMetrics: {
        affectedRecords: dataContext.affectedRecords,
        recoverableRecords: dataContext.recoverableRecords || 0,
        dataLossEstimate: dataContext.dataLossEstimate || 0,
        hasBackup: dataContext.backupAvailable ? 1 : 0,
        checksumValid: dataContext.checksumVerified ? 1 : 0,
        severityLevel: impact.getSeverityLevel(),
        dataTypeHash: dataContext.corruptedDataType.length
      }
    });
  }

  /**
   * Log business continuity critical errors
   */
  static logBusinessContinuityCriticalError(
    logger: ISessionLogger,
    error: Error,
    context: ErrorContext,
    businessContext: {
      serviceDown: string[];
      estimatedDowntimeMinutes?: number;
      affectedUsers: number;
      revenueImpact?: number;
      escalationLevel: 'team' | 'management' | 'executive' | 'external';
      slaBreached: boolean;
    }
  ): void {
    const impact = ErrorImpact.createSystemImpact('critical', true);
    
    logger.logMessage('🏢 BUSINESS CONTINUITY CRITICAL ERROR:');
    logger.logMessage(`  Services Down: ${businessContext.serviceDown.length}`);
    businessContext.serviceDown.forEach((service, index) => {
      logger.logMessage(`    ${index + 1}. ${service}`);
    });
    
    logger.logMessage(`  Affected Users: ${businessContext.affectedUsers}`);
    logger.logMessage(`  SLA Breached: ${businessContext.slaBreached ? 'Yes' : 'No'}`);
    logger.logMessage(`  Escalation Level: ${businessContext.escalationLevel}`);
    logger.logMessage(`  Error: ${error.message}`);
    logger.logMessage(`  Operation: ${context.operation}`);
    
    if (context.organizationId) {
      logger.logMessage(`  Organization: ${context.organizationId}`);
    }

    if (businessContext.estimatedDowntimeMinutes) {
      logger.logMessage(`  Estimated Downtime: ${businessContext.estimatedDowntimeMinutes} minutes`);
    }

    if (businessContext.revenueImpact) {
      logger.logMessage(`  Revenue Impact: $${businessContext.revenueImpact.toFixed(2)}`);
    }
    
    logger.logError(error);
    
    // Log business continuity metrics
    logger.logMetrics('business-continuity-critical-error', {
      duration: 0,
      customMetrics: {
        servicesDown: businessContext.serviceDown.length,
        affectedUsers: businessContext.affectedUsers,
        estimatedDowntime: businessContext.estimatedDowntimeMinutes || 0,
        revenueImpact: businessContext.revenueImpact || 0,
        slaBreached: businessContext.slaBreached ? 1 : 0,
        escalationLevelValue: CriticalErrorLogger.getEscalationLevelValue(businessContext.escalationLevel),
        severityLevel: impact.getSeverityLevel()
      }
    });
  }

  private static extractNumericMetrics(data: Record<string, unknown>): Record<string, number> {
    const numericMetrics: Record<string, number> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'number') {
        numericMetrics[key] = value;
      } else if (typeof value === 'boolean') {
        numericMetrics[key] = value ? 1 : 0;
      }
    });
    
    return numericMetrics;
  }

  private static getEscalationLevelValue(level: string): number {
    const levels = { team: 1, management: 2, executive: 3, external: 4 };
    return levels[level as keyof typeof levels] || 1;
  }
}