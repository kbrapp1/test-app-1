/**
 * Conversation Objectives Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: manage conversation objectives
 * - Immutable value object with pure operations
 * - Keep under 250 lines per @golden-rule
 * - Validate inputs using domain business rules
 */

import { ConversationFlowViolationError } from '../../errors/ChatbotWidgetDomainErrors';

/**
 * Manages conversation objectives and achievement tracking
 * 
 * AI INSTRUCTIONS:
 * - Track primary/secondary objectives immutably
 * - Handle achievement and blocking operations
 * - Keep operations pure and focused
 */
export class ConversationObjectives {
  private constructor(
    public readonly primary?: string,
    public readonly secondary: readonly string[] = [],
    public readonly achieved: readonly string[] = [],
    public readonly blocked: readonly string[] = []
  ) {}

  static create(objectives?: Partial<ConversationObjectives>): ConversationObjectives {
    return new ConversationObjectives(
      objectives?.primary,
      objectives?.secondary || [],
      objectives?.achieved || [],
      objectives?.blocked || []
    );
  }

  update(updates: Partial<ConversationObjectives>): ConversationObjectives {
    return new ConversationObjectives(
      updates.primary ?? this.primary,
      updates.secondary ?? this.secondary,
      updates.achieved ?? this.achieved,
      updates.blocked ?? this.blocked
    );
  }

  achieveObjective(objective: string): ConversationObjectives {
    if (this.achieved.includes(objective)) {
      return this; // Already achieved
    }

    // Remove from secondary or blocked if present
    const newSecondary = this.secondary.filter(obj => obj !== objective);
    const newBlocked = this.blocked.filter(obj => obj !== objective);
    const newAchieved = [...this.achieved, objective];

    return new ConversationObjectives(
      this.primary,
      newSecondary,
      newAchieved,
      newBlocked
    );
  }

  blockObjective(objective: string, reason?: string): ConversationObjectives {
    if (this.blocked.includes(objective)) {
      return this; // Already blocked
    }

    if (!objective.trim()) {
      throw new ConversationFlowViolationError(
        'Objective cannot be empty',
        { objective, reason }
      );
    }

    const newBlocked = [...this.blocked, objective];
    
    return new ConversationObjectives(
      this.primary,
      this.secondary,
      this.achieved,
      newBlocked
    );
  }

  addSecondaryObjective(objective: string): ConversationObjectives {
    if (this.secondary.includes(objective) || this.achieved.includes(objective)) {
      return this; // Already exists
    }

    return new ConversationObjectives(
      this.primary,
      [...this.secondary, objective],
      this.achieved,
      this.blocked
    );
  }

  getCompletionRate(): number {
    const achievedCount = this.achieved.length;
    const totalCount = this.achieved.length + this.secondary.length + 
                      (this.primary ? 1 : 0);
    
    return totalCount > 0 ? achievedCount / totalCount : 0;
  }
}