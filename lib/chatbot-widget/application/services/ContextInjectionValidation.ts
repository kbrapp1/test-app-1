/**
 * Context Injection Validation
 * 
 * Simple input validation functions for context injection operations.
 * Basic checks only - no complex business logic.
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { ContextSelectionCriteria } from '../../domain/services/interfaces/ContextInjectionTypes';
import { BusinessRuleViolationError, DataValidationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

type UseCase = 'greeting' | 'qualification' | 'demonstration' | 'closing';

/** Validate basic inputs for context injection */
export const validateInputs = (
  session: ChatSession, 
  chatbotConfig: ChatbotConfig, 
  availableTokens: number
): void => {
  if (!session) {
    throw new DataValidationError('session', 'is required for context injection');
  }
  
  if (!chatbotConfig) {
    throw new DataValidationError('chatbotConfig', 'is required for context injection');
  }
  
  if (availableTokens <= 0) {
    throw new BusinessRuleViolationError('Available tokens must be greater than 0', { availableTokens });
  }
  
  if (availableTokens > 10000) {
    throw new BusinessRuleViolationError('Available tokens exceed maximum limit', { availableTokens, limit: 10000 });
  }
};

/** Validate selection criteria */
export const validateCriteria = (criteria: ContextSelectionCriteria): void => {
  if (!criteria) {
    throw new DataValidationError('criteria', 'is required');
  }
};

/** Validate use case parameter */
export const validateUseCase = (useCase: UseCase): void => {
  const validUseCases: UseCase[] = ['greeting', 'qualification', 'demonstration', 'closing'];
  if (!validUseCases.includes(useCase)) {
    throw new DataValidationError('useCase', `must be one of: ${validUseCases.join(', ')}`, { provided: useCase });
  }
};

/** Validate analysis inputs */
export const validateAnalysisInputs = (result: any, criteria: ContextSelectionCriteria): void => {
  if (!result) {
    throw new DataValidationError('result', 'is required for analysis');
  }
  
  if (!criteria) {
    throw new DataValidationError('criteria', 'is required for analysis');
  }
};