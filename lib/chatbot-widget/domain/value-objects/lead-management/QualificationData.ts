/**
 * Qualification Data Value Object
 * 
 * Domain Value Object: Immutable qualification information
 * Single Responsibility: Qualification data management and validation
 * Following DDD value object patterns
 */

export interface QualificationAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
  scoringWeight: number;
  scoreContribution: number;
}

export type EngagementLevel = 'low' | 'medium' | 'high';

export interface QualificationDataProps {
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
  companySize?: string;
  industry?: string;
  currentSolution?: string;
  painPoints: string[];
  interests: string[];
  answeredQuestions: QualificationAnswer[];
  engagementLevel: EngagementLevel;
}

export class QualificationData {
  private constructor(private readonly props: QualificationDataProps) {
    this.validateProps(props);
  }

  static create(props: QualificationDataProps): QualificationData {
    return new QualificationData(props);
  }

  static fromPersistence(props: QualificationDataProps): QualificationData {
    return new QualificationData(props);
  }

  static createEmpty(): QualificationData {
    return new QualificationData({
      painPoints: [],
      interests: [],
      answeredQuestions: [],
      engagementLevel: 'low',
    });
  }

  private validateProps(props: QualificationDataProps): void {
    if (!Array.isArray(props.painPoints)) {
      throw new Error('Pain points must be an array');
    }

    if (!Array.isArray(props.interests)) {
      throw new Error('Interests must be an array');
    }

    if (!Array.isArray(props.answeredQuestions)) {
      throw new Error('Answered questions must be an array');
    }

    const validEngagementLevels: EngagementLevel[] = ['low', 'medium', 'high'];
    if (!validEngagementLevels.includes(props.engagementLevel)) {
      throw new Error('Engagement level must be low, medium, or high');
    }

    // Validate each answered question
    props.answeredQuestions.forEach((answer, index) => {
      if (!answer.questionId?.trim()) {
        throw new Error(`Question ID is required for answer at index ${index}`);
      }
      if (!answer.question?.trim()) {
        throw new Error(`Question text is required for answer at index ${index}`);
      }
      if (answer.scoringWeight < 0) {
        throw new Error(`Scoring weight must be non-negative for answer at index ${index}`);
      }
    });
  }

  // Getters
  get budget(): string | undefined { return this.props.budget; }
  get timeline(): string | undefined { return this.props.timeline; }
  get decisionMaker(): boolean | undefined { return this.props.decisionMaker; }
  get companySize(): string | undefined { return this.props.companySize; }
  get industry(): string | undefined { return this.props.industry; }
  get currentSolution(): string | undefined { return this.props.currentSolution; }
  get painPoints(): string[] { return [...this.props.painPoints]; }
  get interests(): string[] { return [...this.props.interests]; }
  get answeredQuestions(): QualificationAnswer[] { return [...this.props.answeredQuestions]; }
  get engagementLevel(): EngagementLevel { return this.props.engagementLevel; }

  // Business methods
  updateBudget(budget: string): QualificationData {
    return QualificationData.create({
      ...this.props,
      budget,
    });
  }

  updateTimeline(timeline: string): QualificationData {
    return QualificationData.create({
      ...this.props,
      timeline,
    });
  }

  updateDecisionMaker(decisionMaker: boolean): QualificationData {
    return QualificationData.create({
      ...this.props,
      decisionMaker,
    });
  }

  updateCompanyInfo(companySize?: string, industry?: string, currentSolution?: string): QualificationData {
    return QualificationData.create({
      ...this.props,
      companySize,
      industry,
      currentSolution,
    });
  }

  addPainPoint(painPoint: string): QualificationData {
    if (this.props.painPoints.includes(painPoint)) {
      return this;
    }

    return QualificationData.create({
      ...this.props,
      painPoints: [...this.props.painPoints, painPoint],
    });
  }

  removePainPoint(painPoint: string): QualificationData {
    return QualificationData.create({
      ...this.props,
      painPoints: this.props.painPoints.filter(p => p !== painPoint),
    });
  }

  addInterest(interest: string): QualificationData {
    if (this.props.interests.includes(interest)) {
      return this;
    }

    return QualificationData.create({
      ...this.props,
      interests: [...this.props.interests, interest],
    });
  }

  removeInterest(interest: string): QualificationData {
    return QualificationData.create({
      ...this.props,
      interests: this.props.interests.filter(i => i !== interest),
    });
  }

  addAnsweredQuestion(answer: Omit<QualificationAnswer, 'answeredAt'>): QualificationData {
    const newAnswer: QualificationAnswer = {
      ...answer,
      answeredAt: new Date(),
    };

    // Remove existing answer for the same question if it exists
    const filteredQuestions = this.props.answeredQuestions.filter(
      q => q.questionId !== answer.questionId
    );

    return QualificationData.create({
      ...this.props,
      answeredQuestions: [...filteredQuestions, newAnswer],
    });
  }

  updateEngagementLevel(level: EngagementLevel): QualificationData {
    return QualificationData.create({
      ...this.props,
      engagementLevel: level,
    });
  }

  // Query methods
  hasBudgetInformation(): boolean {
    return !!this.props.budget && this.props.budget !== 'no_budget';
  }

  hasTimelineInformation(): boolean {
    return !!this.props.timeline && this.props.timeline !== 'no_timeline';
  }

  isDecisionMaker(): boolean {
    return this.props.decisionMaker === true;
  }

  hasCompanyInformation(): boolean {
    return !!(this.props.companySize || this.props.industry);
  }

  getAnswerCount(): number {
    return this.props.answeredQuestions.length;
  }

  getTotalScoringWeight(): number {
    return this.props.answeredQuestions.reduce(
      (total, answer) => total + answer.scoringWeight,
      0
    );
  }

  getTotalScoreContribution(): number {
    return this.props.answeredQuestions.reduce(
      (total, answer) => total + answer.scoreContribution,
      0
    );
  }

  getEngagementScore(): number {
    const scores = {
      low: 0,
      medium: 10,
      high: 20,
    };
    return scores[this.props.engagementLevel];
  }

  hasDisqualifyingFactors(): boolean {
    return this.props.budget === 'no_budget' || 
           this.props.timeline === 'no_timeline' ||
           this.props.decisionMaker === false;
  }

  getCompletionPercentage(): number {
    const fields = [
      this.props.budget,
      this.props.timeline,
      this.props.decisionMaker,
      this.props.companySize,
      this.props.industry,
    ];
    
    const completedFields = fields.filter(field => field !== undefined && field !== null).length;
    const hasAnswers = this.props.answeredQuestions.length > 0;
    const hasPainPoints = this.props.painPoints.length > 0;
    
    const totalPossibleFields = fields.length + (hasAnswers ? 1 : 0) + (hasPainPoints ? 1 : 0);
    const completedFieldsCount = completedFields + (hasAnswers ? 1 : 0) + (hasPainPoints ? 1 : 0);
    
    return totalPossibleFields > 0 ? Math.round((completedFieldsCount / totalPossibleFields) * 100) : 0;
  }

  // Export methods
  toPlainObject(): QualificationDataProps {
    return {
      ...this.props,
      painPoints: [...this.props.painPoints],
      interests: [...this.props.interests],
      answeredQuestions: [...this.props.answeredQuestions],
    };
  }

  toSummary(): object {
    return {
      hasBudget: this.hasBudgetInformation(),
      hasTimeline: this.hasTimelineInformation(),
      isDecisionMaker: this.isDecisionMaker(),
      hasCompanyInfo: this.hasCompanyInformation(),
      engagementLevel: this.props.engagementLevel,
      answerCount: this.getAnswerCount(),
      completionPercentage: this.getCompletionPercentage(),
      hasDisqualifyingFactors: this.hasDisqualifyingFactors(),
    };
  }
} 