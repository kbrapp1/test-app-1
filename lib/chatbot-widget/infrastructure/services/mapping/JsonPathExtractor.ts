/**
 * JSON Path Extractor Infrastructure Service
 * 
 * AI INSTRUCTIONS:
 * - Infrastructure service for complex JSON path extraction
 * - Handles OpenAI response formats and nested structures
 * - Single responsibility: JSON path navigation
 * - No business logic - pure technical utility
 */

import { ExtractionPath } from '../../../domain/value-objects/mapping/ExtractionPath';
import { MappingResult } from '../../../domain/value-objects/mapping/MappingResult';
import { SafeTypeExtractor } from './SafeTypeExtractor';

export class JsonPathExtractor {
  private readonly extractor: SafeTypeExtractor;

  constructor() {
    this.extractor = new SafeTypeExtractor();
  }

  /**
   * Extract content using multiple fallback paths
   */
  public extractContent(result: Record<string, unknown>): MappingResult<string> {
    const contentPath = ExtractionPath.content();
    const content = contentPath.extract(result);
    
    if (typeof content === 'string') {
      return MappingResult.success(content);
    }

    // Try function call parsing for OpenAI responses
    const functionCallContent = this.extractFromFunctionCall<string>(result, 'response.content');
    if (functionCallContent.isValid) {
      return functionCallContent;
    }

    return MappingResult.failure('No valid content found in any extraction path');
  }

  /**
   * Extract confidence using multiple fallback paths
   */
  public extractConfidence(result: Record<string, unknown>): MappingResult<number> {
    const confidencePath = ExtractionPath.confidence();
    const confidence = confidencePath.extract(result);
    
    if (typeof confidence === 'number') {
      return MappingResult.success(confidence);
    }

    // Try function call parsing for OpenAI responses
    const functionCallConfidence = this.extractFromFunctionCall<number>(result, 'analysis.primaryConfidence');
    if (functionCallConfidence.isValid) {
      return functionCallConfidence;
    }

    return MappingResult.failure('No valid confidence found in any extraction path');
  }

  /**
   * Extract token usage from standard or nested paths
   */
  public extractTokenUsage(result: Record<string, unknown>): MappingResult<{ promptTokens: number; completionTokens: number; totalTokens: number }> {
    const usagePath = ExtractionPath.tokenUsage();
    const usage = usagePath.extract(result);
    
    if (this.isValidUsageObject(usage)) {
      return MappingResult.success({
        promptTokens: this.getTokenValue(usage, 'prompt_tokens') || 0,
        completionTokens: this.getTokenValue(usage, 'completion_tokens') || 0,
        totalTokens: this.getTokenValue(usage, 'total_tokens') || 0
      });
    }

    return MappingResult.success({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    });
  }

  /**
   * Extract value from OpenAI function call arguments
   */
  private extractFromFunctionCall<T>(result: Record<string, unknown>, path: string): MappingResult<T> {
    const choices = this.extractor.getProperty(result, 'choices');
    
    if (!Array.isArray(choices) || choices.length === 0) {
      return MappingResult.failure('No choices array found');
    }

    const firstChoice = choices[0];
    if (!this.isObject(firstChoice)) {
      return MappingResult.failure('First choice is not an object');
    }

    const messageResult = this.extractor.getObject(firstChoice, 'message');
    if (!messageResult.isValid) {
      return MappingResult.failure('No message object found');
    }

    const functionCallResult = this.extractor.getObject(messageResult.value, 'function_call');
    if (!functionCallResult.isValid) {
      return MappingResult.failure('No function_call object found');
    }

    const argsResult = this.extractor.getString(functionCallResult.value, 'arguments');
    if (!argsResult.isValid) {
      return MappingResult.failure('No arguments string found');
    }

    try {
      const parsed = JSON.parse(argsResult.value);
      if (!this.isObject(parsed)) {
        return MappingResult.failure('Parsed arguments is not an object');
      }

      const value = this.extractByPath(parsed, path);
      if (value !== undefined) {
        return MappingResult.success(value as T);
      }

      return MappingResult.failure(`Path '${path}' not found in parsed arguments`);
    } catch (error) {
      return MappingResult.failure(`Failed to parse function call arguments: ${error}`);
    }
  }

  /**
   * Extract value by dot notation path
   */
  private extractByPath(obj: Record<string, unknown>, path: string): unknown {
    const segments = path.split('.');
    let current: unknown = obj;

    for (const segment of segments) {
      if (!this.isObject(current)) {
        return undefined;
      }
      current = current[segment];
      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Validate usage object structure
   */
  private isValidUsageObject(usage: unknown): usage is Record<string, unknown> {
    return this.isObject(usage) && (
      'prompt_tokens' in usage || 
      'completion_tokens' in usage || 
      'total_tokens' in usage
    );
  }

  /**
   * Get token value with fallback
   */
  private getTokenValue(usage: Record<string, unknown>, key: string): number | undefined {
    const value = usage[key];
    return typeof value === 'number' ? value : undefined;
  }

  /**
   * Type guard for object validation
   */
  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}