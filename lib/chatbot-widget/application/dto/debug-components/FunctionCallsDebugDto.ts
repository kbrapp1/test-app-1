/**
 * Function Calls Debug DTO
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Function calls debug information
 * - Handle function execution and context enhancement
 * - Keep under 200-250 lines
 * - Focus on function calls debugging only
 * - Follow @golden-rule patterns exactly
 */

export interface FunctionCallsDebugDto {
  firstApiCall?: {
    functions: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
      category?: string;
      version?: string;
    }>;
    functionCallsMade: Array<{
      name: string;
      arguments: Record<string, unknown>;
      result: unknown;
      executionTime: number;
      success: boolean;
      error?: string;
      retryAttempts?: number;
    }>;
    totalFunctionExecutionTime: number;
    functionMetrics?: {
      averageExecutionTime: number;
      successRate: number;
      errorRate: number;
      timeoutCount?: number;
    };
  };
  
  secondApiCall?: {
    contextFromFunctions: Record<string, unknown>;
    enhancedPrompt: string;
    additionalInstructions: string[];
    contextEnrichment?: {
      dataSourcesUsed: string[];
      enrichmentLevel: 'basic' | 'enhanced' | 'comprehensive';
      contextQuality: number;
      relevanceScore?: number;
    };
  };
  
  functionRegistry?: {
    availableFunctions: string[];
    registeredFunctions: number;
    activeFunctions: number;
    deprecatedFunctions?: string[];
    functionDependencies?: Record<string, string[]>;
  };
  
  executionFlow?: {
    callSequence: Array<{
      step: number;
      functionName: string;
      timestamp: string;
      duration: number;
      status: 'pending' | 'executing' | 'completed' | 'failed';
    }>;
    parallelExecutions?: number;
    sequentialExecutions?: number;
    totalFlowTime?: number;
  };
  
  errorHandling?: {
    errorsEncountered: Array<{
      functionName: string;
      errorType: string;
      errorMessage: string;
      timestamp: string;
      recoveryAction?: string;
    }>;
    fallbacksUsed?: string[];
    circuitBreakerStatus?: Record<string, 'open' | 'closed' | 'half-open'>;
  };
} 