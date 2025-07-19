/**
 * Knowledge Value Objects Barrel Exports
 */

export { KnowledgeStatsResult, type KnowledgeStatsData } from './KnowledgeStatsResult';
export { HealthCheckResult, type HealthCheckData } from './HealthCheckResult';
export { KnowledgeQuery, type KnowledgeQueryData } from './KnowledgeQuery';

// Content quality value objects
export { ContentQualityScore, type ContentQualityScoreProps } from './ContentQualityScore';
export { 
  ContentMetrics, 
  type ContentMetricsProps,
  type ContentCompletenessMetrics,
  type ContentFreshnessMetrics,
  type ContentReadabilityMetrics,
  type ContentDuplicationMetrics,
  type ContentStructureMetrics,
  type ContentGapMetrics
} from './ContentMetrics';