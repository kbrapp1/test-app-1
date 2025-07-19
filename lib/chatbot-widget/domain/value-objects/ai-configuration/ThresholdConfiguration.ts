/**
 * Threshold Configuration Value Object
 * 
 * Encapsulates all threshold and configuration constants
 * following DDD principles for the chatbot domain.
 */

export const DEFAULT_THRESHOLDS = {
  intentConfidence: 0.7,
  stageTransition: 0.75,
  personaInference: 0.6,
  leadQualification: 70,
  responseTime: 2000,
  contextWindow: 12000,
  maxConversationTurns: 20,
  inactivityTimeout: 300
} as const;

export type ThresholdType = keyof typeof DEFAULT_THRESHOLDS;

/**
 * Threshold Configuration Value Object
 * Provides structured access to system thresholds and validation
 */
export class ThresholdConfiguration {
  
  static getDefaultThresholds(): typeof DEFAULT_THRESHOLDS {
    return DEFAULT_THRESHOLDS;
  }

  static getIntentConfidenceThreshold(): number {
    return DEFAULT_THRESHOLDS.intentConfidence;
  }

  static getStageTransitionThreshold(): number {
    return DEFAULT_THRESHOLDS.stageTransition;
  }

  static getPersonaInferenceThreshold(): number {
    return DEFAULT_THRESHOLDS.personaInference;
  }

  static getLeadQualificationThreshold(): number {
    return DEFAULT_THRESHOLDS.leadQualification;
  }

  static getResponseTimeThreshold(): number {
    return DEFAULT_THRESHOLDS.responseTime;
  }

  static getContextWindowSize(): number {
    return DEFAULT_THRESHOLDS.contextWindow;
  }

  static getMaxConversationTurns(): number {
    return DEFAULT_THRESHOLDS.maxConversationTurns;
  }

  static getInactivityTimeout(): number {
    return DEFAULT_THRESHOLDS.inactivityTimeout;
  }

  static getThreshold(type: ThresholdType): number {
    return DEFAULT_THRESHOLDS[type];
  }

  static isValidThreshold(type: string): type is ThresholdType {
    return type in DEFAULT_THRESHOLDS;
  }

  static validateThresholds(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate confidence thresholds are in valid ranges
    const confidenceThresholds = ['intentConfidence', 'stageTransition', 'personaInference'] as const;
    confidenceThresholds.forEach((key) => {
      const value = DEFAULT_THRESHOLDS[key];
      if (value < 0 || value > 1) {
        errors.push(`${key} threshold ${value} is outside valid range [0, 1]`);
      }
    });

    // Validate lead qualification threshold
    if (DEFAULT_THRESHOLDS.leadQualification < 0 || DEFAULT_THRESHOLDS.leadQualification > 100) {
      errors.push(`leadQualification threshold ${DEFAULT_THRESHOLDS.leadQualification} is outside valid range [0, 100]`);
    }

    // Validate positive time values
    const timeThresholds = ['responseTime', 'contextWindow', 'maxConversationTurns', 'inactivityTimeout'] as const;
    timeThresholds.forEach((key) => {
      const value = DEFAULT_THRESHOLDS[key];
      if (value <= 0) {
        errors.push(`${key} threshold ${value} must be positive`);
      }
    });

    // Validate reasonable ranges for time values
    if (DEFAULT_THRESHOLDS.responseTime > 10000) {
      errors.push(`responseTime threshold ${DEFAULT_THRESHOLDS.responseTime}ms may be too high for user experience`);
    }

    if (DEFAULT_THRESHOLDS.contextWindow > 50000) {
      errors.push(`contextWindow threshold ${DEFAULT_THRESHOLDS.contextWindow} may be too large for performance`);
    }

    if (DEFAULT_THRESHOLDS.maxConversationTurns > 100) {
      errors.push(`maxConversationTurns threshold ${DEFAULT_THRESHOLDS.maxConversationTurns} may be too high`);
    }

    if (DEFAULT_THRESHOLDS.inactivityTimeout > 3600) {
      errors.push(`inactivityTimeout threshold ${DEFAULT_THRESHOLDS.inactivityTimeout}s may be too long`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static getPerformanceThresholds() {
    return {
      responseTime: DEFAULT_THRESHOLDS.responseTime,
      contextWindow: DEFAULT_THRESHOLDS.contextWindow,
      maxConversationTurns: DEFAULT_THRESHOLDS.maxConversationTurns,
      inactivityTimeout: DEFAULT_THRESHOLDS.inactivityTimeout
    };
  }

  static getConfidenceThresholds() {
    return {
      intentConfidence: DEFAULT_THRESHOLDS.intentConfidence,
      stageTransition: DEFAULT_THRESHOLDS.stageTransition,
      personaInference: DEFAULT_THRESHOLDS.personaInference
    };
  }

  static getQualificationThresholds() {
    return {
      leadQualification: DEFAULT_THRESHOLDS.leadQualification
    };
  }

  static isHighConfidence(confidence: number): boolean {
    return confidence >= DEFAULT_THRESHOLDS.intentConfidence;
  }

  static isQualifiedLead(score: number): boolean {
    return score >= DEFAULT_THRESHOLDS.leadQualification;
  }

  static isWithinResponseTime(timeMs: number): boolean {
    return timeMs <= DEFAULT_THRESHOLDS.responseTime;
  }

  static isConversationTooLong(turns: number): boolean {
    return turns >= DEFAULT_THRESHOLDS.maxConversationTurns;
  }
}