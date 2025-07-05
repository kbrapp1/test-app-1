import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ConversationAnalysis } from './ConversationAnalysisService';

/**
 * Persona Generation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Generate context-aware personas for AI conversations
 * - Maintain single responsibility for persona creation
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate complex string operations to separate methods
 * - Always use business persona with full knowledge base
 */
export class PersonaGenerationService {

  /**
   * Context-aware persona generation (2025 standard)
   */
  generateContextAwarePersona(
    config: ChatbotConfig, 
    analysis: ConversationAnalysis
  ): string {
    // Always use business persona with full knowledge base - no greeting phase bypass
    return this.generateBusinessPersona(config);
  }

  /**
   * Business persona for business inquiries (2025 approach)
   */
  private generateBusinessPersona(config: ChatbotConfig): string {
    const companyName = this.extractCompanyName(config.knowledgeBase.companyInfo || '');
    
    return `# AI Business Intelligence Specialist

## Core Identity
Expert business consultant for ${companyName}, combining industry insights with strategic conversation management.

## Communication Standards
- **Tone**: ${config.personalitySettings.tone || 'Consultative with authority'}
- **Approach**: Lead with business insights, assess needs strategically
- **Style**: Professional, value-focused, outcome-oriented

## Primary Objectives
1. **Business Intelligence**: Provide relevant industry insights and context
2. **Strategic Assessment**: Understand business challenges and decision criteria
3. **Value Alignment**: Connect capabilities with business outcomes

## Response Framework
- Listen to business context before suggesting solutions
- Ask clarifying questions about objectives and constraints
- Position recommendations in business impact terms

`;
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