/**
 * Message Content Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Handle content extraction from messages (topics, interests, needs, pain points)
 * - Focus on pattern matching and keyword analysis
 * - Keep under 200 lines following @golden-rule patterns
 * - Use domain-specific patterns for content extraction
 * - Maintain single responsibility for content analysis
 */

import { ChatMessage } from '../../entities/ChatMessage';

export class MessageContentAnalysisService {
  /**
   * Extract topics from user messages
   */
  extractTopics(userMessages: ChatMessage[]): string[] {
    const topics = new Set<string>();
    const topicKeywords = {
      'pricing': ['price', 'cost', 'pricing', 'budget', 'expensive', 'cheap', 'affordable'],
      'features': ['feature', 'functionality', 'capability', 'can it', 'does it'],
      'integration': ['integrate', 'api', 'connect', 'sync', 'import', 'export'],
      'support': ['help', 'support', 'assistance', 'documentation', 'training'],
      'security': ['secure', 'security', 'privacy', 'data', 'compliance', 'gdpr'],
      'performance': ['fast', 'slow', 'performance', 'speed', 'scalability'],
      'mobile': ['mobile', 'phone', 'app', 'android', 'ios'],
      'trial': ['trial', 'demo', 'test', 'try', 'free'],
      'implementation': ['implement', 'setup', 'install', 'deployment', 'onboarding'],
      'migration': ['migrate', 'switch', 'move', 'transfer', 'import'],
    };

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      Object.entries(topicKeywords).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          topics.add(topic);
        }
      });
    });

    return Array.from(topics);
  }

  /**
   * Extract interests from user messages
   */
  extractInterests(userMessages: ChatMessage[]): string[] {
    const interests = new Set<string>();
    const interestPatterns = [
      /interested in ([\w\s]+)/gi,
      /looking for ([\w\s]+)/gi,
      /need ([\w\s]+)/gi,
      /want ([\w\s]+)/gi,
      /considering ([\w\s]+)/gi,
    ];

    userMessages.forEach(message => {
      const content = message.content;
      
      interestPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const interest = match.split(' ').slice(2).join(' ').trim();
            if (interest.length > 2 && interest.length < 50) {
              interests.add(interest);
            }
          });
        }
      });
    });

    return Array.from(interests).slice(0, 10); // Limit to 10 interests
  }

  /**
   * Extract user needs from messages
   */
  extractUserNeeds(userMessages: ChatMessage[]): string[] {
    const needs: string[] = [];
    const needPatterns = [
      /I need ([\w\s]+)/gi,
      /We need ([\w\s]+)/gi,
      /Looking for ([\w\s]+)/gi,
      /Want to ([\w\s]+)/gi,
    ];

    userMessages.forEach(message => {
      needPatterns.forEach(pattern => {
        const matches = message.content.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const need = match.split(' ').slice(2).join(' ').trim();
            if (need.length > 2 && need.length < 100) {
              needs.push(need);
            }
          });
        }
      });
    });

    return needs.slice(0, 5); // Limit to 5 needs
  }

  /**
   * Extract pain points from messages
   */
  extractPainPoints(userMessages: ChatMessage[]): string[] {
    const painPoints: string[] = [];
    const painKeywords = [
      'problem', 'issue', 'difficulty', 'challenge', 'struggle', 'frustrated',
      'pain', 'hard', 'difficult', 'slow', 'expensive', 'complicated'
    ];

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      painKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          // Extract sentence containing the pain point
          const sentences = message.content.split(/[.!?]/);
          sentences.forEach(sentence => {
            if (sentence.toLowerCase().includes(keyword)) {
              painPoints.push(sentence.trim());
            }
          });
        }
      });
    });

    return painPoints.slice(0, 3); // Limit to 3 pain points
  }

  /**
   * Extract content patterns from messages
   */
  extractContentPatterns(userMessages: ChatMessage[]): {
    topics: string[];
    interests: string[];
    needs: string[];
    painPoints: string[];
  } {
    return {
      topics: this.extractTopics(userMessages),
      interests: this.extractInterests(userMessages),
      needs: this.extractUserNeeds(userMessages),
      painPoints: this.extractPainPoints(userMessages)
    };
  }
} 