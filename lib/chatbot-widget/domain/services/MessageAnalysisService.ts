/**
 * Message Analysis Service
 * 
 * Domain service for analyzing message content and extracting insights.
 * Single responsibility: Analyze message patterns, sentiment, and extract topics/interests.
 */

import { ChatMessage } from '../entities/ChatMessage';

export class MessageAnalysisService {
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
   * Analyze sentiment of user messages
   */
  analyzeSentiment(userMessages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
    if (userMessages.length === 0) return 'neutral';

    const positiveWords = [
      'great', 'good', 'excellent', 'amazing', 'love', 'like', 'perfect',
      'awesome', 'fantastic', 'wonderful', 'yes', 'definitely', 'absolutely'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'no',
      'never', 'disappointed', 'frustrated', 'angry', 'problem', 'issue'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate engagement level
   */
  calculateEngagementLevel(
    userMessages: ChatMessage[],
    totalMessages: number
  ): 'low' | 'medium' | 'high' {
    if (userMessages.length === 0) return 'low';

    const avgMessageLength = userMessages.reduce((sum, msg) => 
      sum + msg.content.length, 0) / userMessages.length;
    
    const responseRate = userMessages.length / (totalMessages / 2);
    
    // High engagement: long messages, high response rate
    if (avgMessageLength > 50 && responseRate > 0.8 && userMessages.length > 5) {
      return 'high';
    }
    
    // Medium engagement: decent length and response rate
    if (avgMessageLength > 20 && responseRate > 0.5 && userMessages.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Detect user intent
   */
  detectUserIntent(userMessages: ChatMessage[]): string {
    const intentKeywords = {
      'purchase': ['buy', 'purchase', 'order', 'payment', 'checkout'],
      'information': ['info', 'information', 'learn', 'tell me', 'what is'],
      'demo': ['demo', 'demonstration', 'show me', 'see it'],
      'trial': ['trial', 'test', 'try'],
      'support': ['help', 'problem', 'issue', 'support'],
      'pricing': ['price', 'cost', 'pricing', 'how much'],
      'comparison': ['compare', 'vs', 'versus', 'alternative'],
    };

    const intentCounts: Record<string, number> = {};
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      Object.entries(intentKeywords).forEach(([intent, keywords]) => {
        const matches = keywords.filter(keyword => content.includes(keyword));
        intentCounts[intent] = (intentCounts[intent] || 0) + matches.length;
      });
    });

    const topIntent = Object.entries(intentCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topIntent ? topIntent[0] : 'general_inquiry';
  }

  /**
   * Assess urgency level
   */
  assessUrgency(userMessages: ChatMessage[]): 'low' | 'medium' | 'high' {
    const urgencyKeywords = {
      high: ['urgent', 'asap', 'immediately', 'now', 'today', 'emergency'],
      medium: ['soon', 'quickly', 'fast', 'this week', 'this month'],
      low: ['eventually', 'later', 'sometime', 'future', 'considering'],
    };

    let urgencyScore = 0;
    
    userMessages.forEach(message => {
      const content = message.content.toLowerCase();
      
      urgencyKeywords.high.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore += 3;
      });
      
      urgencyKeywords.medium.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore += 2;
      });
      
      urgencyKeywords.low.forEach(keyword => {
        if (content.includes(keyword)) urgencyScore -= 1;
      });
    });

    if (urgencyScore >= 5) return 'high';
    if (urgencyScore >= 2) return 'medium';
    return 'low';
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
} 