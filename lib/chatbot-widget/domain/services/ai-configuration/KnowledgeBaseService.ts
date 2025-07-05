/**
 * Knowledge Base Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Handle minimal knowledge base injection for RAG optimization
 * - Maintain single responsibility for knowledge base operations
 * - Keep business logic pure, no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Use vector search for specific content, minimal base context
 * - Delegate complex string operations to separate methods
 */
export class KnowledgeBaseService {

  /**
   * Minimal knowledge base injection (2025 RAG best practice - vector-first)
   * Uses only essential context, relies on vector search for specific content
   */
  buildMinimalKnowledgeBase(knowledgeBase: any): string {
    const companyName = this.extractCompanyName(knowledgeBase.companyInfo || '');
    const hasContent = this.hasKnowledgeBaseContent(knowledgeBase);
    
    if (!hasContent) {
      return this.buildEmptyKnowledgeBaseMessage();
    }

    // Extract brief company overview (first 200 chars)
    const companyOverview = this.extractCompanyOverview(knowledgeBase.companyInfo);

    let knowledgeContent = this.buildCoreBusinessContext(companyName);

    // Include brief company overview only
    if (companyOverview) {
      knowledgeContent += this.buildCompanyOverviewSection(companyOverview);
    }

    // Critical compliance guidelines only (if they exist and are short)
    const complianceSection = this.buildComplianceSection(knowledgeBase.complianceGuidelines);
    if (complianceSection) {
      knowledgeContent += complianceSection;
    }

    knowledgeContent += this.buildCapabilitiesSection();
    knowledgeContent += this.buildConversationGuidelines();

    return knowledgeContent;
  }

  /**
   * Check if knowledge base has any content
   */
  private hasKnowledgeBaseContent(knowledgeBase: any): boolean {
    return knowledgeBase.companyInfo?.trim() || 
           knowledgeBase.productCatalog?.trim() || 
           knowledgeBase.supportDocs?.trim() || 
           knowledgeBase.complianceGuidelines?.trim() || 
           (knowledgeBase.faqs && knowledgeBase.faqs.length > 0);
  }

  /**
   * Build empty knowledge base message
   */
  private buildEmptyKnowledgeBaseMessage(): string {
    return `
## Knowledge Base Status
**Notice**: Knowledge base is not configured. Please inform users that you can provide general assistance but recommend connecting with a team member for specific company information.

### Conversation Guidelines
- Acknowledge that detailed company information is not available
- Offer to connect users with a human team member
- Provide general business assistance where appropriate
- Maintain professional and helpful tone

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

  /**
   * Extract brief company overview
   */
  private extractCompanyOverview(companyInfo?: string): string {
    if (!companyInfo) return '';
    
    return companyInfo.substring(0, 200).trim() + (companyInfo.length > 200 ? '...' : '');
  }

  /**
   * Build core business context section
   */
  private buildCoreBusinessContext(companyName: string): string {
    return `
## Core Business Context
**Company**: ${companyName}
**Role**: Professional business consultant and sales assistant

`;
  }

  /**
   * Build company overview section
   */
  private buildCompanyOverviewSection(companyOverview: string): string {
    return `### Company Overview
${companyOverview}

`;
  }

  /**
   * Build compliance section if applicable
   */
  private buildComplianceSection(complianceGuidelines?: string): string | null {
    if (!complianceGuidelines?.trim()) return null;
    
    const compliancePreview = complianceGuidelines.substring(0, 150).trim();
    if (compliancePreview.toLowerCase().includes('legal') || 
        compliancePreview.toLowerCase().includes('compliance') ||
        compliancePreview.toLowerCase().includes('regulation')) {
      return `### Critical Compliance
${compliancePreview}${complianceGuidelines.length > 150 ? '... (full guidelines available via search)' : ''}

`;
    }
    
    return null;
  }

  /**
   * Build capabilities section
   */
  private buildCapabilitiesSection(): string {
    return `### My Capabilities
- Access to comprehensive product and service information
- Real-time knowledge base search for specific questions  
- Lead qualification and business consultation
- Technical support and documentation access
- Detailed FAQ and pricing information

### Approach
- I will search my knowledge base when you ask specific questions
- I focus on understanding your business needs first
- I provide relevant, accurate information based on your interests
- I can connect you with specialists for detailed discussions

*I have access to detailed product catalogs, pricing, FAQs, and technical documentation. I'll retrieve specific information when relevant to your questions.*

`;
  }

  /**
   * Build conversation guidelines section
   */
  private buildConversationGuidelines(): string {
    return `### Conversation Guidelines
- Maintain professional tone aligned with company values
- Search knowledge base for specific product, pricing, or technical questions
- Focus on understanding business needs and qualifying opportunities
- Escalate to human specialists when appropriate
- Always provide accurate, up-to-date information from knowledge base

`;
  }
} 