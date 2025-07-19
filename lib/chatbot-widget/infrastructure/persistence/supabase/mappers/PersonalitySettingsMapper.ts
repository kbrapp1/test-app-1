/**
 * Personality Settings Infrastructure Mapper
 * 
 * Infrastructure layer mapper for PersonalitySettings value object.
 * Handles JSONB transformation between database and domain representation.
 */

import { PersonalitySettings } from '../../../../domain/value-objects/ai-configuration/PersonalitySettings';

/**
 * Infrastructure mapper for PersonalitySettings JSONB data
 * Handles complex nested object mapping with proper defaults
 */
export class PersonalitySettingsMapper {
  
  /**
   * Map JSONB personality settings data to domain value object
   * Infrastructure operation: JSONB to domain object transformation
   */
  static fromJsonb(data: unknown): PersonalitySettings {
    const settings = data as Record<string, unknown> | null | undefined;
    
    return PersonalitySettings.create({
      tone: (settings?.tone as 'professional' | 'friendly' | 'casual' | 'formal') || 'professional',
      communicationStyle: (settings?.communicationStyle as 'helpful' | 'direct' | 'conversational' | 'sales-focused') || 'helpful',
      responseLength: (settings?.responseLength as 'adaptive' | 'brief' | 'detailed') || 'adaptive',
      escalationTriggers: (settings?.escalationTriggers as string[]) || [],
      responseBehavior: this.mapResponseBehavior(settings?.responseBehavior),
      conversationFlow: this.mapConversationFlow(settings?.conversationFlow),
      customInstructions: (settings?.customInstructions as string) || '',
    });
  }

  /**
   * Map domain PersonalitySettings to JSONB data
   * Infrastructure operation: domain object to JSONB transformation
   */
  static toJsonb(personalitySettings: PersonalitySettings): unknown {
    return personalitySettings.toPlainObject();
  }

  /**
   * Map response behavior settings with defaults
   * Infrastructure operation: nested object mapping
   */
  private static mapResponseBehavior(data: unknown): {
    useEmojis: boolean;
    askFollowUpQuestions: boolean;
    proactiveOffering: boolean;
    personalizeResponses: boolean;
    acknowledgePreviousInteractions: boolean;
  } {
    const behavior = data as Record<string, unknown> | null | undefined;
    
    return {
      useEmojis: (behavior?.useEmojis as boolean) || false,
      askFollowUpQuestions: (behavior?.askFollowUpQuestions as boolean) !== false, // Default true
      proactiveOffering: (behavior?.proactiveOffering as boolean) !== false, // Default true
      personalizeResponses: (behavior?.personalizeResponses as boolean) !== false, // Default true
      acknowledgePreviousInteractions: (behavior?.acknowledgePreviousInteractions as boolean) !== false, // Default true
    };
  }

  /**
   * Map conversation flow settings with defaults
   * Infrastructure operation: nested object mapping with message defaults
   */
  private static mapConversationFlow(data: unknown): {
    greetingMessage: string;
    fallbackMessage: string;
    escalationMessage: string;
    endConversationMessage: string;
    leadCapturePrompt: string;
    maxConversationTurns: number;
    inactivityTimeout: number;
  } {
    const flow = data as Record<string, unknown> | null | undefined;
    
    return {
      greetingMessage: (flow?.greetingMessage as string) || 'Hello! How can I help you today?',
      fallbackMessage: (flow?.fallbackMessage as string) || 'I\'m not sure about that. Could you rephrase your question?',
      escalationMessage: (flow?.escalationMessage as string) || 'Let me connect you with a team member.',
      endConversationMessage: (flow?.endConversationMessage as string) || 'Thank you for chatting with us!',
      leadCapturePrompt: (flow?.leadCapturePrompt as string) || 'Can I get your contact information to follow up?',
      maxConversationTurns: (flow?.maxConversationTurns as number) || 20,
      inactivityTimeout: (flow?.inactivityTimeout as number) || 300,
    };
  }
}