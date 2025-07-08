import { ConversationAnalysis } from './ConversationAnalysisService';

/**
 * Business Guidance Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Generate business guidance based on conversation analysis
 * - Maintain single responsibility for business guidance generation
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Delegate phase-specific guidance to separate methods
 * - Always provide conversation management guidance
 */
export class BusinessGuidanceService {

  /** Business guidance injection (always-on conversation management) */
  generateBusinessGuidance(analysis: ConversationAnalysis, leadScore?: number): string {
    let guidance = '\n## Conversation Management\n';

    switch (analysis.phase) {
      case 'greeting':
        guidance += this.generateGreetingPhaseGuidance();
        break;
      case 'discovery':
        guidance += this.generateDiscoveryPhaseGuidance();
        break;
      case 'exploration':
        guidance += this.generateExplorationPhaseGuidance();
        break;
      case 'qualification':
        guidance += this.generateQualificationPhaseGuidance();
        break;
    }

    return guidance;
  }

  /** Generate greeting phase guidance */
  private generateGreetingPhaseGuidance(): string {
    return `
### Greeting Phase Guidelines  
- Provide warm, professional introduction with company context
- Highlight 2-3 key company strengths immediately
- Ask one engaging discovery question to understand needs
`;
  }

  /** Generate discovery phase guidance */
  private generateDiscoveryPhaseGuidance(): string {
    return `
### Discovery Phase Guidelines
- Ask open-ended questions about business context
- Listen for challenges and objectives
- Identify decision-making criteria and timeline
`;
  }

  /** Generate exploration phase guidance */
  private generateExplorationPhaseGuidance(): string {
    return `
### Exploration Phase Guidelines
- Deep-dive into specific business requirements
- Assess current solutions and gaps
- Explore budget and decision authority
`;
  }

  /** Generate qualification phase guidance */
  private generateQualificationPhaseGuidance(): string {
    return `
### Qualification Phase Guidelines
- Confirm business fit and value alignment
- Assess decision timeline and next steps
- Position strategic partnership opportunities
`;
  }
} 