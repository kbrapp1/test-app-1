/**
 * Conversation Sentiment Domain Service
 * 
 * Pure domain service for sentiment analysis and emotional understanding.
 * Contains business rules for detecting user sentiment and emotional state.
 * Following @golden-rule.mdc: Single responsibility, pure domain logic
 */

export type SentimentScore = 'positive' | 'neutral' | 'negative';

export interface SentimentAnalysisResult {
  sentiment: SentimentScore;
  confidence: number;
  emotionalMarkers: string[];
}

export class ConversationSentimentService {
  private readonly positiveWords = [
    'great', 'good', 'excellent', 'amazing', 'love', 'like', 'perfect',
    'awesome', 'fantastic', 'wonderful', 'yes', 'definitely', 'absolutely',
    'interested', 'excited', 'impressed', 'satisfied', 'happy', 'pleased'
  ];

  private readonly negativeWords = [
    'bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'no',
    'never', 'disappointed', 'frustrated', 'angry', 'problem', 'issue',
    'expensive', 'complicated', 'difficult', 'worried', 'confused', 'upset'
  ];

  private readonly neutralWords = [
    'okay', 'fine', 'maybe', 'perhaps', 'possibly', 'considering',
    'thinking', 'evaluating', 'comparing', 'reviewing'
  ];

  /**
   * Analyze sentiment of user message
   */
  analyzeSentiment(userMessage: string): SentimentAnalysisResult {
    const message = userMessage.toLowerCase();
    const words = message.split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    const emotionalMarkers: string[] = [];

    // Count sentiment indicators
    this.positiveWords.forEach(word => {
      if (message.includes(word)) {
        positiveCount++;
        emotionalMarkers.push(`+${word}`);
      }
    });
    
    this.negativeWords.forEach(word => {
      if (message.includes(word)) {
        negativeCount++;
        emotionalMarkers.push(`-${word}`);
      }
    });

    this.neutralWords.forEach(word => {
      if (message.includes(word)) {
        neutralCount++;
        emotionalMarkers.push(`=${word}`);
      }
    });

    // Determine sentiment
    const sentiment = this.calculateSentiment(positiveCount, negativeCount, neutralCount);
    const confidence = this.calculateConfidence(positiveCount, negativeCount, neutralCount, words.length);

    return {
      sentiment,
      confidence,
      emotionalMarkers
    };
  }

  /**
   * Check if message indicates urgency or frustration
   */
  detectUrgency(userMessage: string): 'low' | 'medium' | 'high' {
    const message = userMessage.toLowerCase();
    
    const highUrgencyMarkers = [
      'urgent', 'asap', 'immediately', 'now', 'emergency', 'critical',
      'frustrated', 'angry', 'unacceptable'
    ];
    
    const mediumUrgencyMarkers = [
      'soon', 'quickly', 'fast', 'issue', 'problem', 'concern',
      'disappointed', 'worried'
    ];

    if (highUrgencyMarkers.some(marker => message.includes(marker))) {
      return 'high';
    }
    
    if (mediumUrgencyMarkers.some(marker => message.includes(marker))) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine overall sentiment based on word counts
   */
  private calculateSentiment(
    positiveCount: number, 
    negativeCount: number, 
    neutralCount: number
  ): SentimentScore {
    // Strong negative bias if negative words dominate
    if (negativeCount > positiveCount + neutralCount) {
      return 'negative';
    }
    
    // Strong positive bias if positive words dominate
    if (positiveCount > negativeCount + neutralCount) {
      return 'positive';
    }
    
    // Slight positive bias if positive outweighs negative
    if (positiveCount > negativeCount) {
      return 'positive';
    }
    
    // Negative if negative outweighs positive
    if (negativeCount > positiveCount) {
      return 'negative';
    }
    
    return 'neutral';
  }

  /**
   * Calculate confidence in sentiment analysis
   */
  private calculateConfidence(
    positiveCount: number, 
    negativeCount: number, 
    neutralCount: number,
    totalWords: number
  ): number {
    const totalSentimentWords = positiveCount + negativeCount + neutralCount;
    const sentimentRatio = totalSentimentWords / Math.max(totalWords, 1);
    
    // Base confidence from sentiment word density
    const baseConfidence = Math.min(sentimentRatio * 2, 0.8);
    
    // Boost confidence if there's a clear sentiment winner
    const maxCount = Math.max(positiveCount, negativeCount, neutralCount);
    const dominanceBoost = maxCount > 1 ? 0.2 : 0;
    
    return Math.min(baseConfidence + dominanceBoost, 0.95);
  }
} 