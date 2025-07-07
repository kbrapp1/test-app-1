import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ConversationAnalysis } from './ConversationAnalysisService';
import { TemplateVariable } from '../../../infrastructure/providers/templating/PromptTemplateEngine';

/**
 * Persona Generation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Generate context-aware personas using template engine
 * - Maintain single responsibility for persona creation
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Use template variables instead of hardcoded strings
 * - Always use business persona with full knowledge base
 */
export class PersonaGenerationService {

  /**
   * Context-aware persona generation (2025 standard)
   */
  generateContextAwarePersona(
    config: ChatbotConfig, 
    analysis: ConversationAnalysis
  ): TemplateVariable[] {
    // AI: Generate template variables for business persona
    return this.generateBusinessPersonaVariables(config, analysis);
  }

  /**
   * Business persona variables for template generation (2025 approach)
   */
  private generateBusinessPersonaVariables(
    config: ChatbotConfig, 
    analysis: ConversationAnalysis
  ): TemplateVariable[] {
    const companyName = this.extractCompanyName(config.knowledgeBase.companyInfo || '');
    
    return [
      {
        name: 'roleTitle',
        value: 'Lead Capture Specialist',
        isRequired: true
      },
      {
        name: 'companyName',
        value: companyName,
        isRequired: true
      },
      {
        name: 'primaryObjective',
        value: 'identifying qualified prospects',
        isRequired: true
      },
      {
        name: 'tone',
        value: config.personalitySettings.tone || 'Consultative with authority',
        isRequired: true
      },
      {
        name: 'approach',
        value: 'Lead with business insights, assess needs strategically',
        isRequired: true
      },
      {
        name: 'communicationStyle',
        value: 'Professional, value-focused, outcome-oriented',
        isRequired: true
      }
    ];
  }

  /**
   * Extract company name from knowledge base content
   */
  private extractCompanyName(companyInfo: string): string {
    if (!companyInfo.trim()) return 'the company';
    
    // Try to extract company name from first line or sentence
    const firstLine = companyInfo.split('\n')[0].trim();
    const firstSentence = firstLine.split('.')[0].trim();
    
    // Look for common patterns like "CompanyName is...", "We are CompanyName", etc.
    const patterns = [
      // Handle "For nearly X years, CompanyName has been..." pattern
      /^For\s+(?:nearly\s+)?\d+\s+years?,\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s+(?:has|have)/i,
      // Standard patterns
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s+(?:is|provides|offers|specializes)/i,
      /^(?:We are|We're)\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)/i,
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s*[,-]/,
      /^([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Co)?)\s+(?:was|has been)/i,
    ];
    
    for (const pattern of patterns) {
      const match = firstSentence.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // Fallback: use first few words if they look like a company name
    const words = firstSentence.split(' ');
    if (words.length > 0 && words[0].match(/^[A-Z]/)) {
      return words.slice(0, Math.min(3, words.length)).join(' ');
    }
    
    return 'the company';
  }
} 