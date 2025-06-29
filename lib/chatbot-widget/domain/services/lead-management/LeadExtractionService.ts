/**
 * Lead Extraction Domain Service
 * 
 * Pure domain service for extracting lead information from conversation text.
 * Contains business rules for identifying and parsing contact information.
 * Following @golden-rule.mdc: Single responsibility, pure domain logic
 */

import { ChatMessage } from '../../entities/ChatMessage';

export interface ExtractedLeadInfo {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  interests: string[];
  confidence: number;
}

export class LeadExtractionService {
  private readonly emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  private readonly phoneRegex = /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
  
  private readonly namePatterns = [
    /my name is (\w+(?:\s+\w+)*)/gi,
    /i'm (\w+(?:\s+\w+)*)/gi,
    /this is (\w+(?:\s+\w+)*)/gi,
    /i am (\w+(?:\s+\w+)*)/gi,
    /call me (\w+(?:\s+\w+)*)/gi
  ];

  private readonly companyPatterns = [
    // Explicit company mentions
    /(?:i work at|i'm from|i represent|my company is|company:)\s*([^,.!?]+)/gi,
    
    // CEO/Title + Company patterns
    /(?:ceo|president|founder|owner|director|manager)\s+(?:of|at)\s+([^,.!?]+)/gi,
    /(?:i'm|i am)\s+(?:the\s+)?(?:ceo|president|founder|owner|director|manager)\s+(?:of|at)\s+([^,.!?]+)/gi,
    
    // "Company Name + company/corp/inc" patterns
    /([A-Z][a-zA-Z\s]+(?:company|corp|corporation|inc|incorporated|llc|ltd|limited))/gi,
    
    // Formal company suffixes
    /([A-Z][a-z]+ (?:Inc|LLC|Corp|Ltd|Company|Co\.?))/g,
    
    // Informal "at Company" or "Company Name" patterns (when mentioned with professional context)
    /(?:work(?:ing)?\s+(?:at|for)|employed\s+(?:at|by))\s+([A-Z][a-zA-Z\s]{1,40})/gi
  ];

  private readonly interestKeywords = [
    'pricing', 'demo', 'trial', 'features', 'integration', 'support', 
    'consultation', 'service', 'product', 'solution', 'plan'
  ];

  /**
   * Extract lead information from conversation history
   */
  extractLeadInformation(messageHistory: ChatMessage[]): ExtractedLeadInfo {
    const userMessages = messageHistory.filter(msg => msg.isFromUser());
    const allText = userMessages.map(msg => msg.content).join(' ');
    
    const extractedInfo: ExtractedLeadInfo = {
      interests: [],
      confidence: 0
    };

    // Extract email
    const emailMatches = Array.from(allText.matchAll(this.emailRegex));
    if (emailMatches.length > 0) {
      extractedInfo.email = emailMatches[0][0].toLowerCase();
    }

    // Extract phone
    const phoneMatches = Array.from(allText.matchAll(this.phoneRegex));
    if (phoneMatches.length > 0) {
      extractedInfo.phone = this.normalizePhoneNumber(phoneMatches[0][0]);
    }

    // Extract name
    extractedInfo.name = this.extractName(allText);

    // Extract company
    extractedInfo.company = this.extractCompany(allText);

    // Extract interests
    extractedInfo.interests = this.extractInterests(allText);

    // Calculate confidence
    extractedInfo.confidence = this.calculateExtractionConfidence(extractedInfo);

    return extractedInfo;
  }

  /**
   * Check if message contains contact information patterns
   */
  containsContactInfo(message: string): boolean {
    const text = message.toLowerCase();
    
    const contactIndicators = [
      'my email', 'email me', 'my phone', 'call me', 'contact me',
      'reach me', 'my number', '@', 'phone number', 'email address'
    ];

    return contactIndicators.some(indicator => text.includes(indicator)) ||
           this.emailRegex.test(message) ||
           this.phoneRegex.test(message);
  }

  /**
   * Extract person's name from text using various patterns
   */
  private extractName(text: string): string | undefined {
    for (const pattern of this.namePatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const name = match[1].trim();
        // Basic validation - should be 2-50 characters, letters and spaces only
        if (name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name)) {
          return this.capitalizeName(name);
        }
      }
    }
    return undefined;
  }

  /**
   * Extract company name from text
   */
  private extractCompany(text: string): string | undefined {
    for (const pattern of this.companyPatterns) {
      const match = pattern.exec(text);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length >= 2 && company.length <= 100) {
          return company;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract interests and topics discussed
   */
  private extractInterests(text: string): string[] {
    const lowerText = text.toLowerCase();
    const foundInterests: string[] = [];

    this.interestKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        foundInterests.push(keyword);
      }
    });

    // Remove duplicates and return
    return Array.from(new Set(foundInterests));
  }

  /**
   * Normalize phone number format
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return cleaned;
  }

  /**
   * Capitalize name properly
   */
  private capitalizeName(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Calculate confidence score for extracted information
   */
  private calculateExtractionConfidence(info: ExtractedLeadInfo): number {
    let score = 0;
    
    // Email is most reliable identifier
    if (info.email) score += 0.4;
    
    // Phone adds significant confidence
    if (info.phone) score += 0.3;
    
    // Name adds moderate confidence
    if (info.name) score += 0.2;
    
    // Company adds some confidence
    if (info.company) score += 0.1;
    
    // Interests show engagement
    if (info.interests.length > 0) {
      score += Math.min(info.interests.length * 0.05, 0.2);
    }

    return Math.min(score, 0.95);
  }
} 