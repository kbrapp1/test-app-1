import { ChatSession, SessionContext } from '../entities/ChatSession';
import { ChatMessage } from '../entities/ChatMessage';

export interface ContextAnalysis {
  topics: string[];
  interests: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementLevel: 'low' | 'medium' | 'high';
  userIntent: string;
  urgency: 'low' | 'medium' | 'high';
  conversationStage: 'greeting' | 'discovery' | 'qualification' | 'closing' | 'support';
}

export interface ConversationSummary {
  overview: string;
  keyTopics: string[];
  userNeeds: string[];
  painPoints: string[];
  nextSteps: string[];
  qualificationStatus: string;
}

export class ConversationContextService {
  /**
   * Analyze conversation context from messages
   */
  analyzeContext(messages: ChatMessage[]): ContextAnalysis {
    const userMessages = messages.filter(m => m.isFromUser());
    const totalMessages = messages.length;
    
    if (userMessages.length === 0) {
      return this.getDefaultContext();
    }

    const topics = this.extractTopics(userMessages);
    const interests = this.extractInterests(userMessages);
    const sentiment = this.analyzeSentiment(userMessages);
    const engagementLevel = this.calculateEngagementLevel(userMessages, totalMessages);
    const userIntent = this.detectUserIntent(userMessages);
    const urgency = this.assessUrgency(userMessages);
    const conversationStage = this.determineConversationStage(messages);

    return {
      topics,
      interests,
      sentiment,
      engagementLevel,
      userIntent,
      urgency,
      conversationStage,
    };
  }

  /**
   * Generate conversation summary
   */
  generateConversationSummary(
    messages: ChatMessage[],
    session: ChatSession
  ): ConversationSummary {
    const userMessages = messages.filter(m => m.isFromUser());
    const context = session.contextData;
    
    const overview = this.createOverview(messages, context);
    const keyTopics = this.identifyKeyTopics(userMessages, context.topics);
    const userNeeds = this.extractUserNeeds(userMessages);
    const painPoints = this.extractPainPoints(userMessages);
    const nextSteps = this.suggestNextSteps(session, messages);
    const qualificationStatus = this.assessQualificationStatus(session);

    return {
      overview,
      keyTopics,
      userNeeds,
      painPoints,
      nextSteps,
      qualificationStatus,
    };
  }

  /**
   * Update session context with new message
   */
  updateSessionContext(
    session: ChatSession,
    message: ChatMessage,
    allMessages: ChatMessage[]
  ): ChatSession {
    const analysis = this.analyzeContext([...allMessages, message]);
    
    let updatedSession = session
      .updateEngagementScore(this.calculateEngagementScore(analysis))
      .updateConversationSummary(this.createConversationSummary(allMessages));

    // Add new topics
    analysis.topics.forEach(topic => {
      updatedSession = updatedSession.addTopic(topic);
    });

    // Add new interests
    analysis.interests.forEach(interest => {
      updatedSession = updatedSession.addInterest(interest);
    });

    return updatedSession;
  }

  /**
   * Extract topics from user messages
   */
  private extractTopics(userMessages: ChatMessage[]): string[] {
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
  private extractInterests(userMessages: ChatMessage[]): string[] {
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
  private analyzeSentiment(userMessages: ChatMessage[]): 'positive' | 'neutral' | 'negative' {
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
  private calculateEngagementLevel(
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
  private detectUserIntent(userMessages: ChatMessage[]): string {
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
  private assessUrgency(userMessages: ChatMessage[]): 'low' | 'medium' | 'high' {
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
   * Determine conversation stage
   */
  private determineConversationStage(
    messages: ChatMessage[]
  ): 'greeting' | 'discovery' | 'qualification' | 'closing' | 'support' {
    if (messages.length <= 2) return 'greeting';
    
    const hasQualificationMessages = messages.some(m => 
      m.messageType === 'qualification' || m.messageType === 'lead_capture'
    );
    
    if (hasQualificationMessages) return 'qualification';
    
    const userMessages = messages.filter(m => m.isFromUser());
    const hasDetailedQuestions = userMessages.some(m => m.content.length > 100);
    
    if (hasDetailedQuestions) return 'discovery';
    
    const hasClosingKeywords = userMessages.some(m => {
      const content = m.content.toLowerCase();
      return ['buy', 'purchase', 'sign up', 'get started', 'contact'].some(keyword => 
        content.includes(keyword)
      );
    });
    
    if (hasClosingKeywords) return 'closing';
    
    return 'discovery';
  }

  /**
   * Create conversation overview
   */
  private createOverview(messages: ChatMessage[], context: SessionContext): string {
    const userMessages = messages.filter(m => m.isFromUser());
    const messageCount = messages.length;
    const duration = this.getConversationDuration(messages);
    
    if (userMessages.length === 0) {
      return 'No user interaction recorded.';
    }

    const overview = `Conversation with ${userMessages.length} user messages over ${duration}. `;
    const topicsText = context.topics.length > 0 ? 
      `Discussed: ${context.topics.slice(0, 3).join(', ')}.` : '';
    
    return overview + topicsText;
  }

  /**
   * Get conversation duration in friendly format
   */
  private getConversationDuration(messages: ChatMessage[]): string {
    if (messages.length < 2) return '0 minutes';
    
    const firstMessage = messages[0];
    const lastMessage = messages[messages.length - 1];
    const durationMs = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
    const minutes = Math.floor(durationMs / 60000);
    
    if (minutes < 1) return 'less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }

  /**
   * Create conversation summary
   */
  private createConversationSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.isFromUser());
    
    if (userMessages.length === 0) {
      return 'No conversation yet.';
    }

    const recentMessages = userMessages.slice(-3);
    const summary = recentMessages
      .map(m => m.content)
      .join(' ')
      .substring(0, 200);
    
    return summary + (summary.length === 200 ? '...' : '');
  }

  /**
   * Calculate engagement score from analysis
   */
  private calculateEngagementScore(analysis: ContextAnalysis): number {
    let score = 50; // Base score
    
    // Engagement level
    if (analysis.engagementLevel === 'high') score += 30;
    else if (analysis.engagementLevel === 'medium') score += 15;
    else score -= 10;
    
    // Sentiment
    if (analysis.sentiment === 'positive') score += 20;
    else if (analysis.sentiment === 'negative') score -= 15;
    
    // Topics diversity
    score += Math.min(15, analysis.topics.length * 3);
    
    // Interests
    score += Math.min(10, analysis.interests.length * 2);
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get default context for empty conversations
   */
  private getDefaultContext(): ContextAnalysis {
    return {
      topics: [],
      interests: [],
      sentiment: 'neutral',
      engagementLevel: 'low',
      userIntent: 'general_inquiry',
      urgency: 'low',
      conversationStage: 'greeting',
    };
  }

  /**
   * Identify key topics from context
   */
  private identifyKeyTopics(userMessages: ChatMessage[], contextTopics: string[]): string[] {
    const messageTopics = this.extractTopics(userMessages);
    const allTopics = [...new Set([...contextTopics, ...messageTopics])];
    return allTopics.slice(0, 5); // Top 5 topics
  }

  /**
   * Extract user needs from messages
   */
  private extractUserNeeds(userMessages: ChatMessage[]): string[] {
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
  private extractPainPoints(userMessages: ChatMessage[]): string[] {
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
   * Suggest next steps based on conversation
   */
  private suggestNextSteps(session: ChatSession, messages: ChatMessage[]): string[] {
    const steps: string[] = [];
    const context = session.contextData;
    const analysis = this.analyzeContext(messages);

    if (!context.email && !context.phone) {
      steps.push('Capture contact information');
    }

    if (analysis.conversationStage === 'discovery') {
      steps.push('Qualify budget and timeline');
    }

    if (analysis.userIntent === 'demo') {
      steps.push('Schedule product demonstration');
    }

    if (analysis.urgency === 'high') {
      steps.push('Prioritize immediate follow-up');
    }

    if (steps.length === 0) {
      steps.push('Continue conversation and build rapport');
    }

    return steps;
  }

  /**
   * Assess qualification status
   */
  private assessQualificationStatus(session: ChatSession): string {
    const state = session.leadQualificationState;
    
    if (state.qualificationStatus === 'completed' && state.isQualified) {
      return `Qualified (Score: ${state.leadScore}/100)`;
    }
    
    if (state.qualificationStatus === 'in_progress') {
      return `In Progress (${state.currentStep} questions answered)`;
    }
    
    if (state.qualificationStatus === 'not_started') {
      return 'Not started';
    }
    
    return 'Not qualified';
  }
} 