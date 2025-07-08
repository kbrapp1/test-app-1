import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ConversationAnalysis } from './ConversationAnalysisService';
// AI: Template variable type definition moved inline since template engine removed
export interface TemplateVariable {
  name: string;
  value: string;
  isRequired?: boolean;
}

/**
 * Persona Generation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Generate context-aware personas using template engine - maintain single responsibility
 * - Keep business logic pure with no external dependencies
 * - Follow @golden-rule patterns exactly - use template variables instead of hardcoded strings
 * - Always use business persona with full knowledge base for consistent brand representation
 */
export class PersonaGenerationService {

  // Context-aware persona generation
  generateContextAwarePersona(
    config: ChatbotConfig, 
    analysis: ConversationAnalysis
  ): TemplateVariable[] {
    // Generate template variables for business persona
    return this.generateBusinessPersonaVariables(config, analysis);
  }

  // Business persona variables for template generation
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
        name: 'roleDescription',
        value: 'professional marketing consultant specializing in lead generation and business development',
        isRequired: true
      },
      {
        name: 'companyName',
        value: companyName,
        isRequired: true
      },
      {
        name: 'objectives',
        value: 'identifying qualified prospects and nurturing them through strategic conversations',
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
      },
      {
        name: 'businessContext',
        value: `Operating as a lead capture specialist for ${companyName}, focusing on qualifying prospects and building relationships through strategic conversations.`,
        isRequired: true
      },
      {
        name: 'constraints',
        value: 'Always maintain professionalism, respect privacy, and focus on providing value before asking for information.',
        isRequired: true
      }
    ];
  }

  // Extract company name from knowledge base content
  private extractCompanyName(companyInfo: string): string {
    if (!companyInfo.trim()) return 'the company';
    
    // Extract company name from first line or sentence
    const firstLine = companyInfo.split('\n')[0].trim();
    const firstSentence = firstLine.split('.')[0].trim();
    
    // Look for common patterns
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