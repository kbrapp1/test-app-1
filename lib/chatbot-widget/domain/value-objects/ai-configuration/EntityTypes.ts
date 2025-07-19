/**
 * Entity Types Value Object
 * 
 * Encapsulates entity type definitions and categorization logic
 * following DDD principles for the chatbot domain.
 */

export const CORE_BUSINESS_ENTITIES = [
  'budget',
  'timeline', 
  'company',
  'industry',
  'teamSize',
  'location',
  'urgency',
  'contactMethod',
  'preferredTime',
  'timezone',
  'availability',
  'role'
] as const;

export const ADVANCED_ENTITIES = [
  'eventType',
  'productName',
  'featureName',
  'integrationNeeds',
  'issueType',
  'severity',
  'affectedFeature',
  'currentSolution',
  'painPoints',
  'decisionMakers'
] as const;

export const ALL_ENTITY_TYPES = [...CORE_BUSINESS_ENTITIES, ...ADVANCED_ENTITIES] as const;
export type EntityType = typeof ALL_ENTITY_TYPES[number];

export const URGENCY_LEVELS = ['low', 'medium', 'high'] as const;
export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const CONTACT_METHODS = ['email', 'phone', 'meeting'] as const;
export const EVENT_TYPES = ['demo', 'consultation', 'onboarding', 'support_call', 'sales_call'] as const;
export const ISSUE_TYPES = ['technical', 'billing', 'feature_request', 'bug_report', 'general'] as const;

export type UrgencyLevel = typeof URGENCY_LEVELS[number];
export type SeverityLevel = typeof SEVERITY_LEVELS[number];
export type ContactMethod = typeof CONTACT_METHODS[number];
export type EventType = typeof EVENT_TYPES[number];
export type IssueType = typeof ISSUE_TYPES[number];

export type EntityCategory = 'core_business' | 'advanced';

/**
 * Entity Types Value Object
 * Provides structured access to entity types and their categories
 */
export class EntityTypes {
  
  static getAllEntityTypes(): readonly EntityType[] {
    return ALL_ENTITY_TYPES;
  }

  static getCoreBusinessEntities(): readonly string[] {
    return CORE_BUSINESS_ENTITIES;
  }

  static getAdvancedEntities(): readonly string[] {
    return ADVANCED_ENTITIES;
  }

  static isValidEntityType(entity: string): entity is EntityType {
    return ALL_ENTITY_TYPES.includes(entity as EntityType);
  }

  static getEntityCategory(entity: EntityType): EntityCategory {
    return (CORE_BUSINESS_ENTITIES as readonly string[]).includes(entity) ? 'core_business' : 'advanced';
  }

  static getUrgencyLevels(): readonly UrgencyLevel[] {
    return URGENCY_LEVELS;
  }

  static getSeverityLevels(): readonly SeverityLevel[] {
    return SEVERITY_LEVELS;
  }

  static getContactMethods(): readonly ContactMethod[] {
    return CONTACT_METHODS;
  }

  static getEventTypes(): readonly EventType[] {
    return EVENT_TYPES;
  }

  static getIssueTypes(): readonly IssueType[] {
    return ISSUE_TYPES;
  }

  static isValidUrgencyLevel(level: string): level is UrgencyLevel {
    return URGENCY_LEVELS.includes(level as UrgencyLevel);
  }

  static isValidSeverityLevel(level: string): level is SeverityLevel {
    return SEVERITY_LEVELS.includes(level as SeverityLevel);
  }

  static isValidContactMethod(method: string): method is ContactMethod {
    return CONTACT_METHODS.includes(method as ContactMethod);
  }

  static isValidEventType(type: string): type is EventType {
    return EVENT_TYPES.includes(type as EventType);
  }

  static isValidIssueType(type: string): type is IssueType {
    return ISSUE_TYPES.includes(type as IssueType);
  }
}