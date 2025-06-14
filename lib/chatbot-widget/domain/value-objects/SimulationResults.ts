export interface PerformanceMetrics {
  readonly averageResponseTime: number;
  readonly totalDuration: number;
  readonly messagesPerMinute: number;
  readonly errorCount: number;
}

export interface QualityAssessment {
  readonly relevanceScore: number; // 0-100
  readonly accuracyScore: number; // 0-100
  readonly userSatisfactionScore: number; // 0-100
  readonly knowledgeBaseUtilization: number; // 0-100
}

export interface GoalAchievement {
  readonly goalId: string;
  readonly achieved: boolean;
  readonly notes?: string;
}

export interface SimulationResultsProps {
  readonly completedSuccessfully: boolean;
  readonly totalMessages: number;
  readonly leadCaptured: boolean;
  readonly goalsAchieved: GoalAchievement[];
  readonly performanceMetrics: PerformanceMetrics;
  readonly qualityAssessment: QualityAssessment;
}

export class SimulationResults {
  private constructor(private readonly props: SimulationResultsProps) {
    this.validateProps(props);
  }

  static create(props: SimulationResultsProps): SimulationResults {
    return new SimulationResults(props);
  }

  static createFailure(
    totalMessages: number,
    performanceMetrics: PerformanceMetrics,
    qualityAssessment: QualityAssessment
  ): SimulationResults {
    return new SimulationResults({
      completedSuccessfully: false,
      totalMessages,
      leadCaptured: false,
      goalsAchieved: [],
      performanceMetrics,
      qualityAssessment,
    });
  }

  static createSuccess(
    totalMessages: number,
    leadCaptured: boolean,
    goalsAchieved: GoalAchievement[],
    performanceMetrics: PerformanceMetrics,
    qualityAssessment: QualityAssessment
  ): SimulationResults {
    return new SimulationResults({
      completedSuccessfully: true,
      totalMessages,
      leadCaptured,
      goalsAchieved,
      performanceMetrics,
      qualityAssessment,
    });
  }

  private validateProps(props: SimulationResultsProps): void {
    if (props.totalMessages < 0) {
      throw new Error('Total messages cannot be negative');
    }

    if (props.performanceMetrics.averageResponseTime < 0) {
      throw new Error('Average response time cannot be negative');
    }

    if (props.performanceMetrics.totalDuration < 0) {
      throw new Error('Total duration cannot be negative');
    }

    if (props.performanceMetrics.errorCount < 0) {
      throw new Error('Error count cannot be negative');
    }

    this.validateQualityScores(props.qualityAssessment);
  }

  private validateQualityScores(assessment: QualityAssessment): void {
    const scores = [
      assessment.relevanceScore,
      assessment.accuracyScore,
      assessment.userSatisfactionScore,
      assessment.knowledgeBaseUtilization,
    ];

    for (const score of scores) {
      if (score < 0 || score > 100) {
        throw new Error('Quality scores must be between 0 and 100');
      }
    }
  }

  // Getters
  get completedSuccessfully(): boolean { return this.props.completedSuccessfully; }
  get totalMessages(): number { return this.props.totalMessages; }
  get leadCaptured(): boolean { return this.props.leadCaptured; }
  get goalsAchieved(): GoalAchievement[] { return this.props.goalsAchieved; }
  get performanceMetrics(): PerformanceMetrics { return this.props.performanceMetrics; }
  get qualityAssessment(): QualityAssessment { return this.props.qualityAssessment; }

  // Business methods
  isSuccessful(): boolean {
    return this.props.completedSuccessfully;
  }

  hasAchievedGoals(): boolean {
    return this.props.goalsAchieved.length > 0 && 
           this.props.goalsAchieved.every(goal => goal.achieved);
  }

  getAchievedGoalsCount(): number {
    return this.props.goalsAchieved.filter(goal => goal.achieved).length;
  }

  getTotalGoalsCount(): number {
    return this.props.goalsAchieved.length;
  }

  getGoalAchievementRate(): number {
    if (this.props.goalsAchieved.length === 0) return 0;
    return (this.getAchievedGoalsCount() / this.getTotalGoalsCount()) * 100;
  }

  hasHighQuality(): boolean {
    const assessment = this.props.qualityAssessment;
    const averageScore = (
      assessment.relevanceScore +
      assessment.accuracyScore +
      assessment.userSatisfactionScore +
      assessment.knowledgeBaseUtilization
    ) / 4;
    
    return averageScore >= 75;
  }

  getOverallQualityScore(): number {
    const assessment = this.props.qualityAssessment;
    return (
      assessment.relevanceScore +
      assessment.accuracyScore +
      assessment.userSatisfactionScore +
      assessment.knowledgeBaseUtilization
    ) / 4;
  }

  hasPerformanceIssues(): boolean {
    const metrics = this.props.performanceMetrics;
    return metrics.averageResponseTime > 5000 || // > 5 seconds
           metrics.errorCount > 0 ||
           metrics.messagesPerMinute < 1; // Very slow conversation
  }

  getPerformanceCategory(): 'excellent' | 'good' | 'fair' | 'poor' {
    const metrics = this.props.performanceMetrics;
    
    if (metrics.errorCount > 0) return 'poor';
    if (metrics.averageResponseTime > 10000) return 'poor'; // > 10s
    if (metrics.averageResponseTime > 5000) return 'fair'; // > 5s
    if (metrics.averageResponseTime > 2000) return 'good'; // > 2s
    return 'excellent';
  }

  getSummary(): string {
    const success = this.props.completedSuccessfully ? 'Success' : 'Failed';
    const messages = `${this.props.totalMessages} messages`;
    const lead = this.props.leadCaptured ? 'Lead captured' : 'No lead';
    const quality = `${Math.round(this.getOverallQualityScore())}% quality`;
    
    return `${success}: ${messages}, ${lead}, ${quality}`;
  }

  toPlainObject(): SimulationResultsProps {
    return { ...this.props };
  }
} 