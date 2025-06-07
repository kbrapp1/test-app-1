import { OptimizationGap } from '../../value-objects/OptimizationGap';
import { PerformanceMetrics } from '../../entities/PerformanceMetrics';
import { PerformanceTrackingState } from '../../../application/dto/PerformanceTrackingDTO';
import { OptimizationPriorityAssessmentService, OptimizationPriority } from './OptimizationPriorityAssessmentService';
import { BusinessImpactCalculatorService } from '../business-impact/BusinessImpactCalculatorService';
import { OptimizationFixGeneratorService } from './OptimizationFixGeneratorService';
import { WebVitalsImpactAssessorService } from '../performance-analysis/WebVitalsImpactAssessorService';
import { SpecificCauseAnalyzerService, SpecificCauseAnalysis } from '../business-impact/SpecificCauseAnalyzerService';

/**
 * Domain Service: Frontend Optimization Analysis Orchestrator
 * Responsibility: Orchestrate optimization analysis using specialized services
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Coordinate analysis workflow and provide unified interface
 */
export class FrontendOptimizationAnalysisService {
  
  constructor(
    private readonly priorityAssessment = new OptimizationPriorityAssessmentService(),
    private readonly businessImpactCalculator = new BusinessImpactCalculatorService(),
    private readonly fixGenerator = new OptimizationFixGeneratorService(),
    private readonly webVitalsAssessor = new WebVitalsImpactAssessorService(),
    private readonly causeAnalyzer = new SpecificCauseAnalyzerService()
  ) {}
  
  /**
   * Business Rule: Analyze optimization gaps for production recommendations
   * Orchestrates multiple specialized services to provide comprehensive analysis
   */
  analyzeOptimizationGap(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics,
    index: number
  ): FrontendIssueAnalysis {
    const priority = this.priorityAssessment.assessPriority(issue, trackingState, metrics);
    const timeToFix = this.businessImpactCalculator.estimateTimeToFix(issue, priority);
    const businessImpact = this.businessImpactCalculator.calculateBusinessImpact(issue, priority);
    const webVitalImpact = this.webVitalsAssessor.assessWebVitalImpact(issue, trackingState);
    const suggestedFix = this.fixGenerator.generateSpecificFix(issue.type, trackingState.pageContext);
    
    return {
      issue: issue.title,
      suggestedFix,
      priority,
      timeToFix,
      businessImpact,
      webVitalImpact: webVitalImpact || undefined
    };
  }

  /**
   * Static method for backward compatibility with report generation
   */
  static analyzeIssueForProduction(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics,
    index: number
  ): FrontendIssueAnalysis {
    const service = new FrontendOptimizationAnalysisService();
    return service.analyzeOptimizationGap(issue, trackingState, metrics, index);
  }

  /**
   * Static method for backward compatibility with business impact calculation
   */
  static calculateBusinessImpact(
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics
  ): string {
    const calculator = new BusinessImpactCalculatorService();
    return calculator.calculateOverallBusinessImpact(trackingState, metrics);
  }

  /**
   * Static method for backward compatibility with specific cause analysis
   */
  static analyzeSpecificCause(
    issue: OptimizationGap, 
    trackingState: PerformanceTrackingState, 
    metrics: PerformanceMetrics,
    index: number
  ): SpecificCauseAnalysis {
    const analyzer = new SpecificCauseAnalyzerService();
    return analyzer.analyzeSpecificCause(issue, trackingState, metrics, index);
  }
}

/**
 * Value Object: Frontend issue analysis result
 */
export interface FrontendIssueAnalysis {
  readonly component?: string;
  readonly hook?: string;
  readonly file?: string;
  readonly issue: string;
  readonly suggestedFix: string;
  readonly reactQueryKey?: string;
  readonly priority: OptimizationPriority;
  readonly timeToFix: string;
  readonly businessImpact: string;
  readonly codeExample?: string;
  readonly webVitalImpact?: string;
}

// Re-export types for backward compatibility
export type { OptimizationPriority } from './OptimizationPriorityAssessmentService';
export type { SpecificCauseAnalysis } from '../business-impact/SpecificCauseAnalyzerService'; 