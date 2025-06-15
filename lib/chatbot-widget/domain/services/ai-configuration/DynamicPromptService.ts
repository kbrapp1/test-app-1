import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { ChatSession } from '../../entities/ChatSession';

/**
 * Dynamic Prompt Service
 * 
 * Domain service for generating dynamic system prompts from chatbot configuration.
 * Following DDD principles: Contains business logic for prompt generation
 * without infrastructure concerns.
 */
export class DynamicPromptService {
  /**
   * Generate comprehensive system prompt from chatbot configuration
   */
  generateSystemPrompt(chatbotConfig: ChatbotConfig, session: ChatSession): string {
    const sections = [
      this.generateBotIdentitySection(chatbotConfig),
      this.generatePersonalitySection(chatbotConfig),
      this.generateKnowledgeBaseSection(chatbotConfig),
      this.generateLeadQualificationSection(chatbotConfig),
      this.generateOperatingHoursSection(chatbotConfig),
      this.generateBehaviorGuidelines(),
      this.generateConversationContext(session)
    ];

    return sections.filter(section => section.trim().length > 0).join('\n\n');
  }

  /**
   * Generate bot identity section
   */
  private generateBotIdentitySection(chatbotConfig: ChatbotConfig): string {
    return `# Bot Identity
You are ${chatbotConfig.name}, ${chatbotConfig.description || 'a helpful AI assistant'}.
Your role is to represent our company and assist website visitors with their questions.`;
  }

  /**
   * Generate personality and tone section
   */
  private generatePersonalitySection(chatbotConfig: ChatbotConfig): string {
    const personality = chatbotConfig.personalitySettings;
    
    let section = '# Personality & Communication Style\n';
    section += `- Tone: ${personality.tone}\n`;
    section += `- Communication Style: ${personality.communicationStyle}\n`;
    section += `- Response Length: ${personality.responseLength}\n`;
    
    if (personality.escalationTriggers.length > 0) {
      section += `\nEscalation Triggers: ${personality.escalationTriggers.join(', ')}`;
    }

    return section;
  }

  /**
   * Generate knowledge base section
   */
  private generateKnowledgeBaseSection(chatbotConfig: ChatbotConfig): string {
    const kb = chatbotConfig.knowledgeBase;
    let section = '# Knowledge Base\n';

    // Company Information
    if (kb.companyInfo && kb.companyInfo.trim().length > 0) {
      section += `## Company Information\n${kb.companyInfo}\n\n`;
    }

    // Product Catalog
    if (kb.productCatalog && kb.productCatalog.trim().length > 0) {
      section += `## Products & Services\n${kb.productCatalog}\n\n`;
    }

    // FAQs
    if (kb.faqs && kb.faqs.length > 0) {
      section += `## Frequently Asked Questions\n`;
      kb.faqs.filter(faq => faq.isActive).forEach(faq => {
        section += `Q: ${faq.question}\n`;
        section += `A: ${faq.answer}\n\n`;
      });
    }

    // Support Documentation
    if (kb.supportDocs && kb.supportDocs.trim().length > 0) {
      section += `## Support Information\n${kb.supportDocs}\n\n`;
    }

    // Compliance Guidelines
    if (kb.complianceGuidelines && kb.complianceGuidelines.trim().length > 0) {
      section += `## Compliance Guidelines\n${kb.complianceGuidelines}\n`;
    }

    return section;
  }

  /**
   * Generate lead qualification guidelines
   */
  private generateLeadQualificationSection(chatbotConfig: ChatbotConfig): string {
    const questions = chatbotConfig.leadQualificationQuestions;
    
    if (questions.length === 0) {
      return '';
    }

    let section = '# Lead Qualification\n';
    section += 'When a visitor shows genuine interest in our services, naturally guide the conversation toward qualification.\n\n';
    section += 'Key qualification areas:\n';
    
    questions.forEach(q => {
      section += `- ${q.question} (${q.type}${q.isRequired ? ', required' : ''})\n`;
    });

    section += '\nIMPORTANT: Only call the capture_lead function when you have gathered sufficient information and the visitor has expressed genuine interest.';

    return section;
  }

  /**
   * Generate operating hours section
   */
  private generateOperatingHoursSection(chatbotConfig: ChatbotConfig): string {
    const hours = chatbotConfig.operatingHours;
    let section = '# Operating Hours\n';
    
    if (hours.timezone) {
      section += `Timezone: ${hours.timezone}\n`;
    }

    if (hours.businessHours && hours.businessHours.length > 0) {
      section += 'Business Hours:\n';
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      dayNames.forEach((dayName, index) => {
        const dayHours = hours.businessHours.find(h => h.dayOfWeek === index && h.isActive);
        if (dayHours) {
          section += `- ${dayName}: ${dayHours.startTime} - ${dayHours.endTime}\n`;
        } else {
          section += `- ${dayName}: Closed\n`;
        }
      });
    }

    if (hours.outsideHoursMessage && hours.outsideHoursMessage.trim().length > 0) {
      section += `\nOutside Hours Message: ${hours.outsideHoursMessage}`;
    }

    if (hours.holidaySchedule && hours.holidaySchedule.length > 0) {
      section += '\nHolidays:\n';
      hours.holidaySchedule.forEach(holiday => {
        section += `- ${holiday.name} (${holiday.date})\n`;
      });
    }

    return section;
  }

  /**
   * Generate behavior guidelines
   */
  private generateBehaviorGuidelines(): string {
    return `# Behavior Guidelines
- Be helpful, informative, and professional
- Stay focused on topics related to our business and services
- If asked about topics outside your knowledge base, politely redirect to business topics
- Encourage visitors to provide contact information if they show interest
- Never make up information - only use what's in your knowledge base
- If you don't know something, admit it and offer to connect them with a human team member
- Keep responses concise but thorough
- Use natural, conversational language`;
  }

  /**
   * Generate conversation context section
   */
  private generateConversationContext(session: ChatSession): string {
    const context = session.contextData;
    
    if (!context.topics.length && !context.interests.length) {
      return '# Conversation Context\nThis is a new conversation.';
    }

    let section = '# Conversation Context\n';
    
    if (context.topics.length > 0) {
      section += `Topics discussed: ${context.topics.join(', ')}\n`;
    }
    
    if (context.interests.length > 0) {
      section += `Visitor interests: ${context.interests.join(', ')}\n`;
    }

    if (context.engagementScore > 0) {
      section += `Engagement level: ${context.engagementScore > 7 ? 'High' : context.engagementScore > 4 ? 'Medium' : 'Low'}`;
    }

    return section;
  }
} 