/**
 * Lead Lifecycle Manager
 * 
 * Domain Service: Handles lead lifecycle and state transitions
 * Single Responsibility: Lead status management and workflow transitions
 * Following DDD domain service patterns
 */

export type FollowUpStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost' | 'nurturing';

export interface LeadLifecycleState {
  followUpStatus: FollowUpStatus;
  assignedTo?: string;
  lastContactedAt?: Date;
  updatedAt: Date;
}

export class LeadLifecycleManager {
  static updateFollowUpStatus(
    currentState: LeadLifecycleState,
    newStatus: FollowUpStatus
  ): LeadLifecycleState {
    const now = new Date();
    
    return {
      ...currentState,
      followUpStatus: newStatus,
      lastContactedAt: newStatus === 'contacted' ? now : currentState.lastContactedAt,
      updatedAt: now,
    };
  }

  static assignLead(
    currentState: LeadLifecycleState,
    userId: string
  ): LeadLifecycleState {
    return {
      ...currentState,
      assignedTo: userId,
      updatedAt: new Date(),
    };
  }

  static unassignLead(currentState: LeadLifecycleState): LeadLifecycleState {
    return {
      ...currentState,
      assignedTo: undefined,
      updatedAt: new Date(),
    };
  }

  static markAsContacted(currentState: LeadLifecycleState): LeadLifecycleState {
    return this.updateFollowUpStatus(currentState, 'contacted');
  }

  static markAsConverted(currentState: LeadLifecycleState): LeadLifecycleState {
    return this.updateFollowUpStatus(currentState, 'converted');
  }

  static markAsLost(currentState: LeadLifecycleState): LeadLifecycleState {
    return this.updateFollowUpStatus(currentState, 'lost');
  }

  static markAsNurturing(currentState: LeadLifecycleState): LeadLifecycleState {
    return this.updateFollowUpStatus(currentState, 'nurturing');
  }

  static markAsInProgress(currentState: LeadLifecycleState): LeadLifecycleState {
    return this.updateFollowUpStatus(currentState, 'in_progress');
  }

  // Query methods
  static isNew(status: FollowUpStatus): boolean {
    return status === 'new';
  }

  static isConverted(status: FollowUpStatus): boolean {
    return status === 'converted';
  }

  static isAssigned(assignedTo?: string): boolean {
    return !!assignedTo;
  }

  static hasRecentActivity(
    lastContactedAt?: Date,
    createdAt?: Date,
    daysThreshold: number = 7
  ): boolean {
    const now = new Date().getTime();
    const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
    
    if (lastContactedAt) {
      return (now - lastContactedAt.getTime()) <= thresholdMs;
    }
    
    if (createdAt) {
      return (now - createdAt.getTime()) <= thresholdMs;
    }
    
    return false;
  }

  static getDaysSinceCreated(createdAt: Date): number {
    const now = new Date().getTime();
    const createdTime = createdAt.getTime();
    return Math.floor((now - createdTime) / (24 * 60 * 60 * 1000));
  }

  // Validation methods
  static validateStatusTransition(
    currentStatus: FollowUpStatus,
    newStatus: FollowUpStatus
  ): boolean {
    // Define valid status transitions
    const validTransitions: Record<FollowUpStatus, FollowUpStatus[]> = {
      'new': ['contacted', 'in_progress', 'lost'],
      'contacted': ['in_progress', 'converted', 'lost', 'nurturing'],
      'in_progress': ['converted', 'lost', 'nurturing'],
      'converted': [], // Terminal state
      'lost': ['nurturing'], // Can be revived
      'nurturing': ['contacted', 'in_progress', 'lost'],
    };

    return validTransitions[currentStatus].includes(newStatus);
  }

  static getNextValidStatuses(currentStatus: FollowUpStatus): FollowUpStatus[] {
    const validTransitions: Record<FollowUpStatus, FollowUpStatus[]> = {
      'new': ['contacted', 'in_progress', 'lost'],
      'contacted': ['in_progress', 'converted', 'lost', 'nurturing'],
      'in_progress': ['converted', 'lost', 'nurturing'],
      'converted': [],
      'lost': ['nurturing'],
      'nurturing': ['contacted', 'in_progress', 'lost'],
    };

    return validTransitions[currentStatus] || [];
  }

  static getStatusDescription(status: FollowUpStatus): string {
    const descriptions: Record<FollowUpStatus, string> = {
      'new': 'New lead that has not been contacted yet',
      'contacted': 'Lead has been contacted by sales team',
      'in_progress': 'Lead is actively being worked on',
      'converted': 'Lead has been successfully converted to customer',
      'lost': 'Lead has been lost or declined',
      'nurturing': 'Lead is being nurtured for future opportunities',
    };

    return descriptions[status];
  }

  static getStatusPriority(status: FollowUpStatus): number {
    const priorities: Record<FollowUpStatus, number> = {
      'new': 1, // Highest priority
      'contacted': 2,
      'in_progress': 3,
      'nurturing': 4,
      'lost': 5,
      'converted': 6, // Lowest priority (completed)
    };

    return priorities[status];
  }
} 