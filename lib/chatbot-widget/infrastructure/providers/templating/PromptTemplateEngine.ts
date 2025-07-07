/**
 * PromptTemplateEngine Infrastructure Provider
 * 
 * AI INSTRUCTIONS:
 * - Abstract template complexity from domain layer
 * - Handle template loading, caching, and processing
 * - Implement variable substitution and conditional rendering
 * - Follow @golden-rule infrastructure layer patterns exactly
 * - Never exceed 250 lines - focus on template processing only
 * - Maintain separation between infrastructure and domain concerns
 * - Add proper error handling for template processing failures
 */

export interface TemplateVariable {
  readonly name: string;
  readonly value: string;
  readonly isRequired: boolean;
  readonly defaultValue?: string;
}

export interface ConditionalSection {
  readonly condition: string;
  readonly content: string;
  readonly fallbackContent?: string;
}

export interface TemplateContext {
  readonly variables: Record<string, string>;
  readonly conditionals: Record<string, boolean>;
  readonly metadata: Record<string, any>;
}

export interface ProcessedTemplate {
  readonly content: string;
  readonly variablesUsed: readonly string[];
  readonly conditionsEvaluated: readonly string[];
  readonly processedAt: Date;
  readonly templateId: string;
  readonly hasErrors: boolean;
  readonly errors: readonly string[];
}

export class PromptTemplateEngine {
  private readonly templateCache = new Map<string, string>();
  private readonly variablePattern = /\{\{([^}]+)\}\}/g;
  private readonly conditionalPattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  private readonly conditionalElsePattern = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;

  // AI: Process template with variable substitution and conditional rendering
  processTemplate(
    templateId: string,
    template: string,
    context: TemplateContext
  ): ProcessedTemplate {
    const errors: string[] = [];
    const variablesUsed: string[] = [];
    const conditionsEvaluated: string[] = [];

    try {
      // AI: First pass - handle conditional sections
      let processedContent = this.processConditionals(template, context, conditionsEvaluated, errors);
      
      // AI: Second pass - substitute variables
      processedContent = this.substituteVariables(processedContent, context, variablesUsed, errors);
      
      // AI: Third pass - clean up any remaining template syntax
      processedContent = this.cleanupTemplate(processedContent);

      return {
        content: processedContent,
        variablesUsed: Object.freeze(variablesUsed),
        conditionsEvaluated: Object.freeze(conditionsEvaluated),
        processedAt: new Date(),
        templateId,
        hasErrors: errors.length > 0,
        errors: Object.freeze(errors)
      };
    } catch (error) {
      errors.push(`Template processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        content: template, // Return original template on failure
        variablesUsed: Object.freeze(variablesUsed),
        conditionsEvaluated: Object.freeze(conditionsEvaluated),
        processedAt: new Date(),
        templateId,
        hasErrors: true,
        errors: Object.freeze(errors)
      };
    }
  }

  // AI: Validate template syntax before processing
  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // AI: Check for balanced conditional blocks
    const ifMatches = template.match(/\{\{#if/g) || [];
    const endifMatches = template.match(/\{\{\/if\}\}/g) || [];
    
    if (ifMatches.length !== endifMatches.length) {
      errors.push('Unbalanced conditional blocks: {{#if}} and {{/if}} count mismatch');
    }
    
    // AI: Check for valid variable syntax
    const invalidVariables = template.match(/\{\{[^}]*\{\{|\}\}[^{]*\}\}/g);
    if (invalidVariables) {
      errors.push(`Invalid variable syntax found: ${invalidVariables.join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // AI: Extract all variables from template for validation
  extractTemplateVariables(template: string): string[] {
    const variables = new Set<string>();
    let match;
    
    const variableRegex = new RegExp(this.variablePattern.source, 'g');
    while ((match = variableRegex.exec(template)) !== null) {
      const variableName = match[1].trim();
      if (!variableName.startsWith('#') && !variableName.startsWith('/')) {
        variables.add(variableName);
      }
    }
    
    return Array.from(variables);
  }

  // AI: Cache template for performance optimization
  cacheTemplate(templateId: string, template: string): void {
    this.templateCache.set(templateId, template);
  }

  // AI: Get cached template or return undefined
  getCachedTemplate(templateId: string): string | undefined {
    return this.templateCache.get(templateId);
  }

  // AI: Clear template cache for memory management
  clearCache(): void {
    this.templateCache.clear();
  }

  // AI: Process conditional sections with if/else logic
  private processConditionals(
    template: string,
    context: TemplateContext,
    conditionsEvaluated: string[],
    errors: string[]
  ): string {
    let processed = template;
    
    // AI: Handle {{#if condition}}content{{else}}fallback{{/if}} patterns
    processed = processed.replace(this.conditionalElsePattern, (match, condition, ifContent, elseContent) => {
      try {
        const conditionKey = condition.trim();
        conditionsEvaluated.push(conditionKey);
        
        const conditionValue = context.conditionals[conditionKey];
        return conditionValue ? ifContent : elseContent;
      } catch (error) {
        errors.push(`Failed to evaluate condition: ${condition}`);
        return match; // Return original on error
      }
    });
    
    // AI: Handle {{#if condition}}content{{/if}} patterns
    processed = processed.replace(this.conditionalPattern, (match, condition, content) => {
      try {
        const conditionKey = condition.trim();
        conditionsEvaluated.push(conditionKey);
        
        const conditionValue = context.conditionals[conditionKey];
        return conditionValue ? content : '';
      } catch (error) {
        errors.push(`Failed to evaluate condition: ${condition}`);
        return match; // Return original on error
      }
    });
    
    return processed;
  }

  // AI: Substitute variables with values from context
  private substituteVariables(
    template: string,
    context: TemplateContext,
    variablesUsed: string[],
    errors: string[]
  ): string {
    return template.replace(this.variablePattern, (match, variableName) => {
      try {
        const trimmedName = variableName.trim();
        variablesUsed.push(trimmedName);
        
        const value = context.variables[trimmedName];
        if (value !== undefined) {
          return value;
        }
        
        // AI: Handle missing variables gracefully
        errors.push(`Variable not found: ${trimmedName}`);
        return `[MISSING: ${trimmedName}]`;
      } catch (error) {
        errors.push(`Failed to substitute variable: ${variableName}`);
        return match; // Return original on error
      }
    });
  }

  // AI: Clean up any remaining template syntax and normalize whitespace
  private cleanupTemplate(content: string): string {
    return content
      .replace(/\{\{[^}]*\}\}/g, '') // Remove any remaining template syntax
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();
  }
} 