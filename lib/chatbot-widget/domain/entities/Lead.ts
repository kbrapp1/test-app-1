export interface LeadProps {
  id: string;
  sessionId: string;
  organizationId: string;
  chatbotConfigId: string;
  contactInfo: ContactInfo;
  qualificationData: QualificationData;
  leadScore: number;
  qualificationStatus: QualificationStatus;
  source: LeadSource;
  conversationSummary: string;
  capturedAt: Date;
  followUpStatus: FollowUpStatus;
  assignedTo?: string;
  tags: string[];
  notes: LeadNote[];
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  jobTitle?: string;
  website?: string;
  linkedin?: string;
  address?: Address;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface QualificationData {
  budget?: string;
  timeline?: string;
  decisionMaker?: boolean;
  companySize?: string;
  industry?: string;
  currentSolution?: string;
  painPoints: string[];
  interests: string[];
  answeredQuestions: QualificationAnswer[];
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface QualificationAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
  answeredAt: Date;
  scoringWeight: number;
  scoreContribution: number;
}

export type QualificationStatus = 'not_qualified' | 'qualified' | 'highly_qualified' | 'disqualified';
export type FollowUpStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost' | 'nurturing';

export interface LeadSource {
  channel: 'chatbot_widget';
  campaign?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  pageUrl: string;
  pageTitle?: string;
}

export interface LeadNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  isInternal: boolean;
}

export class Lead {
  private constructor(private readonly props: LeadProps) {
    this.validateProps(props);
  }

  static create(
    sessionId: string,
    organizationId: string,
    chatbotConfigId: string,
    contactInfo: ContactInfo,
    qualificationData: QualificationData,
    source: LeadSource,
    conversationSummary: string
  ): Lead {
    const now = new Date();
    const leadScore = Lead.calculateLeadScore(qualificationData);
    const qualificationStatus = Lead.determineQualificationStatus(leadScore, qualificationData);
    
    return new Lead({
      id: crypto.randomUUID(),
      sessionId,
      organizationId,
      chatbotConfigId,
      contactInfo,
      qualificationData,
      leadScore,
      qualificationStatus,
      source,
      conversationSummary,
      capturedAt: now,
      followUpStatus: 'new',
      tags: [],
      notes: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: LeadProps): Lead {
    return new Lead(props);
  }

  private static calculateLeadScore(qualificationData: QualificationData): number {
    let score = 0;
    let maxScore = 0;

    // Score from answered questions
    qualificationData.answeredQuestions.forEach(answer => {
      maxScore += answer.scoringWeight;
      score += answer.scoreContribution;
    });

    // Engagement level boost
    const engagementBoost = {
      low: 0,
      medium: 10,
      high: 20,
    }[qualificationData.engagementLevel];

    // Budget qualification bonus
    const budgetBonus = qualificationData.budget ? 15 : 0;

    // Timeline urgency bonus
    const timelineBonus = qualificationData.timeline ? 10 : 0;

    // Decision maker bonus
    const decisionMakerBonus = qualificationData.decisionMaker ? 20 : 0;

    // Calculate base score percentage
    const baseScore = maxScore > 0 ? (score / maxScore) * 60 : 0;
    
    // Add bonuses
    const totalScore = baseScore + engagementBoost + budgetBonus + timelineBonus + decisionMakerBonus;
    
    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  private static determineQualificationStatus(score: number, qualificationData: QualificationData): QualificationStatus {
    // Automatic disqualification criteria
    if (qualificationData.budget === 'no_budget' || 
        qualificationData.timeline === 'no_timeline' ||
        qualificationData.decisionMaker === false) {
      return 'disqualified';
    }

    // Score-based qualification
    if (score >= 80) {
      return 'highly_qualified';
    } else if (score >= 60) {
      return 'qualified';
    } else {
      return 'not_qualified';
    }
  }

  private validateProps(props: LeadProps): void {
    if (!props.sessionId?.trim()) {
      throw new Error('Session ID is required');
    }
    if (!props.organizationId?.trim()) {
      throw new Error('Organization ID is required');
    }
    if (!props.chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required');
    }
    if (!props.contactInfo.email && !props.contactInfo.phone) {
      throw new Error('At least email or phone is required');
    }
    if (props.leadScore < 0 || props.leadScore > 100) {
      throw new Error('Lead score must be between 0 and 100');
    }
  }

  // Getters
  get id(): string { return this.props.id; }
  get sessionId(): string { return this.props.sessionId; }
  get organizationId(): string { return this.props.organizationId; }
  get chatbotConfigId(): string { return this.props.chatbotConfigId; }
  get contactInfo(): ContactInfo { return this.props.contactInfo; }
  get qualificationData(): QualificationData { return this.props.qualificationData; }
  get leadScore(): number { return this.props.leadScore; }
  get qualificationStatus(): QualificationStatus { return this.props.qualificationStatus; }
  get source(): LeadSource { return this.props.source; }
  get conversationSummary(): string { return this.props.conversationSummary; }
  get capturedAt(): Date { return this.props.capturedAt; }
  get followUpStatus(): FollowUpStatus { return this.props.followUpStatus; }
  get assignedTo(): string | undefined { return this.props.assignedTo; }
  get tags(): string[] { return this.props.tags; }
  get notes(): LeadNote[] { return this.props.notes; }
  get lastContactedAt(): Date | undefined { return this.props.lastContactedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  updateContactInfo(contactInfo: Partial<ContactInfo>): Lead {
    const updatedInfo = {
      ...this.props.contactInfo,
      ...contactInfo,
    };

    // Validate that we still have at least email or phone
    if (!updatedInfo.email && !updatedInfo.phone) {
      throw new Error('At least email or phone is required');
    }

    return new Lead({
      ...this.props,
      contactInfo: updatedInfo,
      updatedAt: new Date(),
    });
  }

  updateQualificationData(data: Partial<QualificationData>): Lead {
    const updatedData = {
      ...this.props.qualificationData,
      ...data,
    };

    const newScore = Lead.calculateLeadScore(updatedData);
    const newStatus = Lead.determineQualificationStatus(newScore, updatedData);

    return new Lead({
      ...this.props,
      qualificationData: updatedData,
      leadScore: newScore,
      qualificationStatus: newStatus,
      updatedAt: new Date(),
    });
  }

  updateFollowUpStatus(status: FollowUpStatus): Lead {
    return new Lead({
      ...this.props,
      followUpStatus: status,
      lastContactedAt: status === 'contacted' ? new Date() : this.props.lastContactedAt,
      updatedAt: new Date(),
    });
  }

  assignTo(userId: string): Lead {
    return new Lead({
      ...this.props,
      assignedTo: userId,
      updatedAt: new Date(),
    });
  }

  unassign(): Lead {
    return new Lead({
      ...this.props,
      assignedTo: undefined,
      updatedAt: new Date(),
    });
  }

  addTag(tag: string): Lead {
    if (this.props.tags.includes(tag)) {
      return this;
    }

    return new Lead({
      ...this.props,
      tags: [...this.props.tags, tag],
      updatedAt: new Date(),
    });
  }

  removeTag(tag: string): Lead {
    return new Lead({
      ...this.props,
      tags: this.props.tags.filter(t => t !== tag),
      updatedAt: new Date(),
    });
  }

  addNote(content: string, authorId: string, authorName: string, isInternal: boolean = true): Lead {
    const note: LeadNote = {
      id: crypto.randomUUID(),
      content,
      authorId,
      authorName,
      createdAt: new Date(),
      isInternal,
    };

    return new Lead({
      ...this.props,
      notes: [...this.props.notes, note],
      updatedAt: new Date(),
    });
  }

  updateConversationSummary(summary: string): Lead {
    return new Lead({
      ...this.props,
      conversationSummary: summary,
      updatedAt: new Date(),
    });
  }

  markAsContacted(): Lead {
    return this.updateFollowUpStatus('contacted');
  }

  markAsConverted(): Lead {
    return this.updateFollowUpStatus('converted');
  }

  markAsLost(): Lead {
    return this.updateFollowUpStatus('lost');
  }

  markAsNurturing(): Lead {
    return this.updateFollowUpStatus('nurturing');
  }

  // Query methods
  isQualified(): boolean {
    return this.props.qualificationStatus === 'qualified' || 
           this.props.qualificationStatus === 'highly_qualified';
  }

  isHighlyQualified(): boolean {
    return this.props.qualificationStatus === 'highly_qualified';
  }

  isDisqualified(): boolean {
    return this.props.qualificationStatus === 'disqualified';
  }

  hasEmail(): boolean {
    return !!this.props.contactInfo.email;
  }

  hasPhone(): boolean {
    return !!this.props.contactInfo.phone;
  }

  hasCompanyInfo(): boolean {
    return !!(this.props.contactInfo.company || this.props.contactInfo.jobTitle);
  }

  isNew(): boolean {
    return this.props.followUpStatus === 'new';
  }

  isConverted(): boolean {
    return this.props.followUpStatus === 'converted';
  }

  isAssigned(): boolean {
    return !!this.props.assignedTo;
  }

  hasRecentActivity(daysThreshold: number = 7): boolean {
    const now = new Date().getTime();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
    
    if (this.props.lastContactedAt) {
      return (now - this.props.lastContactedAt.getTime()) <= thresholdMs;
    }
    
    return (now - this.props.createdAt.getTime()) <= thresholdMs;
  }

  getDisplayName(): string {
    if (this.props.contactInfo.name) {
      return this.props.contactInfo.name;
    }
    
    if (this.props.contactInfo.firstName && this.props.contactInfo.lastName) {
      return `${this.props.contactInfo.firstName} ${this.props.contactInfo.lastName}`;
    }
    
    if (this.props.contactInfo.firstName) {
      return this.props.contactInfo.firstName;
    }
    
    return this.props.contactInfo.email || this.props.contactInfo.phone || 'Unknown';
  }

  getScoreGrade(): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (this.props.leadScore >= 90) return 'A';
    if (this.props.leadScore >= 80) return 'B';
    if (this.props.leadScore >= 70) return 'C';
    if (this.props.leadScore >= 60) return 'D';
    return 'F';
  }

  getDaysSinceCreated(): number {
    const now = new Date().getTime();
    const createdTime = this.props.createdAt.getTime();
    return Math.floor((now - createdTime) / (24 * 60 * 60 * 1000));
  }

  // Export methods
  toSummary(): object {
    return {
      id: this.props.id,
      displayName: this.getDisplayName(),
      email: this.props.contactInfo.email,
      company: this.props.contactInfo.company,
      leadScore: this.props.leadScore,
      scoreGrade: this.getScoreGrade(),
      qualificationStatus: this.props.qualificationStatus,
      followUpStatus: this.props.followUpStatus,
      isAssigned: this.isAssigned(),
      assignedTo: this.props.assignedTo,
      daysSinceCreated: this.getDaysSinceCreated(),
      capturedAt: this.props.capturedAt,
      tags: this.props.tags,
    };
  }

  toExportData(): object {
    return {
      id: this.props.id,
      name: this.getDisplayName(),
      email: this.props.contactInfo.email,
      phone: this.props.contactInfo.phone,
      company: this.props.contactInfo.company,
      jobTitle: this.props.contactInfo.jobTitle,
      leadScore: this.props.leadScore,
      qualificationStatus: this.props.qualificationStatus,
      followUpStatus: this.props.followUpStatus,
      assignedTo: this.props.assignedTo,
      capturedAt: this.props.capturedAt,
      conversationSummary: this.props.conversationSummary,
      source: this.props.source,
      tags: this.props.tags.join(', '),
      notes: this.props.notes.filter(n => !n.isInternal).map(n => n.content).join(' | '),
    };
  }

  toPlainObject(): LeadProps {
    return { ...this.props };
  }
} 