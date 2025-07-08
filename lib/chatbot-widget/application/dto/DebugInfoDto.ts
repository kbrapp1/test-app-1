/**
 * Debug Info DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Coordinate debug information components
 * - Delegate specialized debug data to focused DTOs
 * - Keep under 200-250 lines by extracting debug sections
 * - Use composition pattern for complex debug information
 * - Follow @golden-rule patterns exactly
 */

import {
  SessionDebugDto,
  RequestDebugDto,
  IntentClassificationDebugDto,
  EntityExtractionDebugDto,
  LeadScoringDebugDto,
  JourneyProgressionDebugDto,
  BusinessRulesDebugDto,
  ApiCallDebugDto,
  FunctionCallsDebugDto
} from './debug-components';

export interface DebugInfoDto {
  // Core session information
  session?: SessionDebugDto;
  
  // Request processing information
  request?: RequestDebugDto;
  
  // AI processing components
  intentClassification?: IntentClassificationDebugDto;
  entityExtraction?: EntityExtractionDebugDto;
  leadScoring?: LeadScoringDebugDto;
  journeyProgression?: JourneyProgressionDebugDto;
  businessRules?: BusinessRulesDebugDto;
  
  // API call information
  firstApiCall?: ApiCallDebugDto;
  secondApiCall?: ApiCallDebugDto;
  functionCalls?: FunctionCallsDebugDto;
} 