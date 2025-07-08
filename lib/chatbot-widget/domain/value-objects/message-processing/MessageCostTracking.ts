/**
 * Message Cost Tracking Value Object
 * 
 * AI INSTRUCTIONS:
 * - Value object for precise AI token cost calculation and tracking with decimal cent precision
 * - Handles prompt/completion token cost breakdown with model rate calculations
 * - Manages cost aggregation, efficiency ratios, and formatted display methods
 * - Validates cost integrity and provides business logic for cost analysis
 * - Immutable value object with precision handling for financial accuracy
 */

export interface MessageCostTrackingProps {
  costCents: number;
  costBreakdown?: CostBreakdown;
  modelRate?: number;
}

export interface CostBreakdown {
  promptTokensCents: number;    // Precise decimal cents (e.g., 0.0822)
  completionTokensCents: number; // Precise decimal cents (e.g., 0.033)
  totalCents: number;           // Precise total (e.g., 0.1152)
  displayCents: number;         // Rounded for display (e.g., 0.12)
  modelRate?: number;
}

export class MessageCostTracking {
  private constructor(private readonly props: MessageCostTrackingProps) {
    this.validateProps(props);
  }

  static create(props: MessageCostTrackingProps): MessageCostTracking {
    return new MessageCostTracking(props);
  }

  static createFromTokens(
    promptTokens: number,
    completionTokens: number,
    modelRate: number
  ): MessageCostTracking {
    const promptTokensCents = promptTokens * modelRate;
    const completionTokensCents = completionTokens * modelRate;
    const totalCents = promptTokensCents + completionTokensCents;
    const displayCents = Math.round(totalCents * 100) / 100; // Round to 2 decimal places

    const costBreakdown: CostBreakdown = {
      promptTokensCents,
      completionTokensCents,
      totalCents,
      displayCents,
      modelRate,
    };

    return new MessageCostTracking({
      costCents: totalCents,
      costBreakdown,
      modelRate,
    });
  }

  static createZeroCost(): MessageCostTracking {
    return new MessageCostTracking({
      costCents: 0,
      costBreakdown: {
        promptTokensCents: 0,
        completionTokensCents: 0,
        totalCents: 0,
        displayCents: 0,
      },
    });
  }

  private validateProps(props: MessageCostTrackingProps): void {
    if (props.costCents < 0) {
      throw new Error('Cost cannot be negative');
    }

    if (props.costBreakdown) {
      const breakdown = props.costBreakdown;
      if (breakdown.promptTokensCents < 0 || breakdown.completionTokensCents < 0) {
        throw new Error('Token costs cannot be negative');
      }
      
      const calculatedTotal = breakdown.promptTokensCents + breakdown.completionTokensCents;
      const tolerance = 0.0001; // Allow for floating point precision issues
      
      if (Math.abs(breakdown.totalCents - calculatedTotal) > tolerance) {
        throw new Error('Cost breakdown total does not match individual token costs');
      }
    }
  }

  // Getters
  get costCents(): number { return this.props.costCents; }
  get costBreakdown(): CostBreakdown | undefined { return this.props.costBreakdown; }
  get modelRate(): number | undefined { return this.props.modelRate; }

  // Business methods
  getDisplayCost(): number {
    return this.props.costBreakdown?.displayCents || this.props.costCents;
  }

  getFormattedCost(): string {
    const displayCost = this.getDisplayCost();
    return `$${displayCost.toFixed(4)}`;
  }

  isSignificantCost(threshold: number = 0.01): boolean {
    return this.props.costCents >= threshold;
  }

  addCost(other: MessageCostTracking): MessageCostTracking {
    const newCostCents = this.props.costCents + other.props.costCents;
    
    // If both have breakdowns, combine them
    if (this.props.costBreakdown && other.props.costBreakdown) {
      const newBreakdown: CostBreakdown = {
        promptTokensCents: this.props.costBreakdown.promptTokensCents + other.props.costBreakdown.promptTokensCents,
        completionTokensCents: this.props.costBreakdown.completionTokensCents + other.props.costBreakdown.completionTokensCents,
        totalCents: newCostCents,
        displayCents: Math.round(newCostCents * 100) / 100,
        modelRate: this.props.modelRate, // Keep the first model rate
      };

      return new MessageCostTracking({
        costCents: newCostCents,
        costBreakdown: newBreakdown,
        modelRate: this.props.modelRate,
      });
    }

    return new MessageCostTracking({
      costCents: newCostCents,
    });
  }

  hasBreakdown(): boolean {
    return !!this.props.costBreakdown;
  }

  getEfficiencyRatio(): number | null {
    if (!this.props.costBreakdown) return null;
    
    const { promptTokensCents, completionTokensCents } = this.props.costBreakdown;
    const total = promptTokensCents + completionTokensCents;
    
    if (total === 0) return null;
    
    return completionTokensCents / total; // Higher ratio means more cost in completion (output)
  }

  equals(other: MessageCostTracking): boolean {
    const tolerance = 0.0001;
    return Math.abs(this.props.costCents - other.props.costCents) < tolerance;
  }

  toPlainObject(): MessageCostTrackingProps {
    return { ...this.props };
  }
} 