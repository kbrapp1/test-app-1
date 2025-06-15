/**
 * Qualification Processor
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process qualification answers from requests
 * - Handle qualification answer validation and session updates
 * - Coordinate with domain entities for qualification state management
 * - Use domain-specific errors for business rule violations
 * - Stay under 200-250 lines
 * - Follow @golden-rule patterns exactly
 */

import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';

export interface QualificationAnswer {
  questionId: string;
  answer: string | string[];
}

export interface QualificationProcessingResult {
  updatedSession: ChatSession;
  processedAnswers: number;
  skippedAnswers: number;
  validationErrors: string[];
}

export class QualificationProcessor {
  /**
   * Process all qualification answers for a session
   */
  static processAnswers(
    session: ChatSession,
    answers: QualificationAnswer[],
    config: ChatbotConfig
  ): QualificationProcessingResult {
    if (!answers || answers.length === 0) {
      return {
        updatedSession: session,
        processedAnswers: 0,
        skippedAnswers: 0,
        validationErrors: []
      };
    }

    let updatedSession = session;
    let processedCount = 0;
    let skippedCount = 0;
    const validationErrors: string[] = [];

    for (const answer of answers) {
      try {
        const result = this.processAnswer(updatedSession, answer, config);
        
        if (result.processed) {
          updatedSession = result.session;
          processedCount++;
        } else {
          skippedCount++;
          if (result.error) {
            validationErrors.push(result.error);
          }
        }
      } catch (error) {
        skippedCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        validationErrors.push(`Error processing answer for question ${answer.questionId}: ${errorMessage}`);
      }
    }

    return {
      updatedSession,
      processedAnswers: processedCount,
      skippedAnswers: skippedCount,
      validationErrors
    };
  }

  /**
   * Process a single qualification answer
   */
  private static processAnswer(
    session: ChatSession,
    answer: QualificationAnswer,
    config: ChatbotConfig
  ): { processed: boolean; session: ChatSession; error?: string } {
    // Find the question configuration
    const questionConfig = config.leadQualificationQuestions.find(q => q.id === answer.questionId);
    
    if (!questionConfig) {
      return {
        processed: false,
        session,
        error: `Question configuration not found for ID: ${answer.questionId}`
      };
    }

    // Validate answer format
    const validationResult = this.validateAnswer(answer, questionConfig);
    if (!validationResult.valid) {
      return {
        processed: false,
        session,
        error: validationResult.error
      };
    }

    try {
      // Add the answer to session's qualification state
      const updatedSession = session.answerQualificationQuestion(
        answer.questionId,
        questionConfig.question,
        answer.answer,
        questionConfig.scoringWeight
      );

      return {
        processed: true,
        session: updatedSession
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          processed: false,
          session,
          error: error.message
        };
      }
      throw error;
    }
  }

  /**
   * Validate answer format and content
   */
  private static validateAnswer(
    answer: QualificationAnswer,
    questionConfig: any
  ): { valid: boolean; error?: string } {
    // Check if answer is provided
    if (answer.answer === undefined || answer.answer === null) {
      return {
        valid: false,
        error: 'Answer cannot be empty'
      };
    }

    // Check string answers
    if (typeof answer.answer === 'string') {
      if (answer.answer.trim().length === 0) {
        return {
          valid: false,
          error: 'Answer cannot be empty string'
        };
      }

      // Check maximum length
      if (answer.answer.length > 1000) {
        return {
          valid: false,
          error: 'Answer exceeds maximum length of 1000 characters'
        };
      }
    }

    // Check array answers
    if (Array.isArray(answer.answer)) {
      if (answer.answer.length === 0) {
        return {
          valid: false,
          error: 'Answer array cannot be empty'
        };
      }

      // Check each item in array
      for (const item of answer.answer) {
        if (typeof item !== 'string' || item.trim().length === 0) {
          return {
            valid: false,
            error: 'All answer array items must be non-empty strings'
          };
        }
      }

      // Check maximum array length
      if (answer.answer.length > 10) {
        return {
          valid: false,
          error: 'Answer array cannot exceed 10 items'
        };
      }
    }

    // Validate against question type if specified
    if (questionConfig.type) {
      const typeValidation = this.validateAnswerType(answer.answer, questionConfig.type);
      if (!typeValidation.valid) {
        return typeValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Validate answer against question type
   */
  private static validateAnswerType(
    answer: string | string[],
    questionType: string
  ): { valid: boolean; error?: string } {
    switch (questionType) {
      case 'single_choice':
        if (Array.isArray(answer)) {
          return {
            valid: false,
            error: 'Single choice questions require a single string answer'
          };
        }
        break;

      case 'multiple_choice':
        if (!Array.isArray(answer)) {
          return {
            valid: false,
            error: 'Multiple choice questions require an array answer'
          };
        }
        break;

      case 'text':
        if (Array.isArray(answer)) {
          return {
            valid: false,
            error: 'Text questions require a single string answer'
          };
        }
        break;

      case 'number':
        if (Array.isArray(answer)) {
          return {
            valid: false,
            error: 'Number questions require a single string answer'
          };
        }
        
        const numValue = parseFloat(answer as string);
        if (isNaN(numValue)) {
          return {
            valid: false,
            error: 'Number questions require a valid numeric answer'
          };
        }
        break;

      default:
        // Unknown question type, allow any format
        break;
    }

    return { valid: true };
  }

  /**
   * Get processing statistics
   */
  static getProcessingStats(result: QualificationProcessingResult): {
    totalAnswers: number;
    successRate: number;
    hasErrors: boolean;
  } {
    const totalAnswers = result.processedAnswers + result.skippedAnswers;
    const successRate = totalAnswers > 0 ? (result.processedAnswers / totalAnswers) * 100 : 0;

    return {
      totalAnswers,
      successRate,
      hasErrors: result.validationErrors.length > 0
    };
  }
} 