/**
 * Chatbot System Prompt Service
 * 
 * Domain service responsible for generating system prompts for chatbot configurations.
 * Single responsibility: Transform chatbot configuration into AI system prompts.
 */

import { PersonalitySettings } from '../value-objects/PersonalitySettings';
import { KnowledgeBase } from '../value-objects/KnowledgeBase';

export class ChatbotSystemPromptService {
  static generateSystemPrompt(
    chatbotName: string,
    personalitySettings: PersonalitySettings,
    knowledgeBase: KnowledgeBase
  ): string {
    let prompt = `You are ${chatbotName}, a helpful assistant for this organization. `;
    
    // Add personality tone
    prompt += this.generateToneInstructions(personalitySettings.tone);
    
    // Add communication style
    prompt += this.generateCommunicationStyleInstructions(personalitySettings.communicationStyle);
    
    // Add company knowledge
    if (knowledgeBase.companyInfo) {
      prompt += `\n\nCompany Information:\n${knowledgeBase.companyInfo}\n`;
    }
    
    // Add FAQs
    const activeFAQs = knowledgeBase.getActiveFAQs();
    if (activeFAQs.length > 0) {
      prompt += '\n\nFrequently Asked Questions:\n';
      activeFAQs.forEach(faq => {
        prompt += `Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      });
    }
    
    // Add compliance guidelines
    if (knowledgeBase.complianceGuidelines) {
      prompt += `\n\nCompliance Guidelines:\n${knowledgeBase.complianceGuidelines}\n`;
    }
    
    // Add lead qualification guidance
    prompt += '\n\nLead Qualification: When appropriate, ask qualifying questions to help identify potential customers. ';
    prompt += 'Be natural about gathering contact information when the visitor shows interest in products or services.';
    
    // Add custom instructions
    if (personalitySettings.customInstructions) {
      prompt += `\n\nAdditional Instructions:\n${personalitySettings.customInstructions}`;
    }
    
    return prompt;
  }

  private static generateToneInstructions(tone: string): string {
    switch (tone) {
      case 'professional':
        return 'Maintain a professional and courteous tone. ';
      case 'friendly':
        return 'Be warm, friendly, and approachable. ';
      case 'casual':
        return 'Keep the conversation casual and relaxed. ';
      case 'formal':
        return 'Use formal language and maintain business etiquette. ';
      default:
        return 'Maintain an appropriate tone for the conversation. ';
    }
  }

  private static generateCommunicationStyleInstructions(style: string): string {
    switch (style) {
      case 'direct':
        return 'Be direct and concise in your responses. ';
      case 'conversational':
        return 'Engage in natural, conversational dialogue. ';
      case 'helpful':
        return 'Focus on being helpful and providing value. ';
      case 'sales-focused':
        return 'Guide conversations toward sales opportunities while being helpful. ';
      default:
        return 'Communicate effectively based on the context. ';
    }
  }

  static generateGreetingMessage(personalitySettings: PersonalitySettings): string {
    const baseGreeting = personalitySettings.conversationFlow.greetingMessage;
    
    if (!baseGreeting || baseGreeting.trim() === '') {
      // Generate default greeting based on tone
      switch (personalitySettings.tone) {
        case 'professional':
          return 'Good day! How may I assist you today?';
        case 'friendly':
          return 'Hello there! How can I help you today? 😊';
        case 'casual':
          return 'Hey! What can I do for you?';
        case 'formal':
          return 'Good day. How may I be of service to you today?';
        default:
          return 'Hello! How can I help you today?';
      }
    }
    
    return baseGreeting;
  }

  static generateFallbackMessage(personalitySettings: PersonalitySettings): string {
    const baseFallback = personalitySettings.conversationFlow.fallbackMessage;
    
    if (!baseFallback || baseFallback.trim() === '') {
      // Generate default fallback based on tone
      switch (personalitySettings.tone) {
        case 'professional':
          return "I apologize, but I don't quite understand. Could you please rephrase your question?";
        case 'friendly':
          return "I'm not sure I understand. Could you help me out by rephrasing that?";
        case 'casual':
          return "Sorry, I didn't catch that. Can you try saying it differently?";
        case 'formal':
          return "I regret that I do not comprehend your inquiry. Might you rephrase it, please?";
        default:
          return "I'm not sure I understand. Could you please rephrase that?";
      }
    }
    
    return baseFallback;
  }

  static generateEscalationMessage(personalitySettings: PersonalitySettings): string {
    const baseEscalation = personalitySettings.conversationFlow.escalationMessage;
    
    if (!baseEscalation || baseEscalation.trim() === '') {
      // Generate default escalation based on tone
      switch (personalitySettings.tone) {
        case 'professional':
          return 'I will connect you with a human agent who can provide more specialized assistance.';
        case 'friendly':
          return 'Let me get you connected with one of our team members who can help you better!';
        case 'casual':
          return "I'll get you connected with someone from our team who can help you out.";
        case 'formal':
          return 'Allow me to transfer you to a human representative for further assistance.';
        default:
          return 'Let me connect you with a human agent who can better assist you.';
      }
    }
    
    return baseEscalation;
  }

  static shouldUseEmojis(personalitySettings: PersonalitySettings): boolean {
    return personalitySettings.responseBehavior.useEmojis && 
           (personalitySettings.tone === 'friendly' || personalitySettings.tone === 'casual');
  }

  static shouldAskFollowUpQuestions(personalitySettings: PersonalitySettings): boolean {
    return personalitySettings.responseBehavior.askFollowUpQuestions;
  }

  static shouldPersonalizeResponses(personalitySettings: PersonalitySettings): boolean {
    return personalitySettings.responseBehavior.personalizeResponses;
  }
} 