import { isChatbotWidgetEnabled } from '../../application/services/ChatbotWidgetFeatureFlagService';

/**
 * App Startup Service
 * 
 * AI INSTRUCTIONS:
 * - Initialize critical services on application startup
 * - Handle startup failures gracefully without blocking app
 * - Provide startup status monitoring
 * - Support both development and production environments
 * - Optimized for serverless architecture (no background processes)
 */
export class AppStartupService {
  private static isInitialized = false;
  private static initializationPromise: Promise<void> | null = null;
  private static startupResults: {
    featureCheck: { enabled: boolean; error?: string };
    timestamp: string;
  } | null = null;

  /**
   * Initialize the application on startup
   * Should be called once when the app starts
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /** Get startup status
 */
  static getStartupStatus(): {
    isInitialized: boolean;
    featureCheck: { enabled: boolean; error?: string };
    timestamp: string;
  } | null {
    if (!this.startupResults) {
      return null;
    }

    return {
      isInitialized: this.isInitialized,
      ...this.startupResults
    };
  }

  /** Perform application initialization
 */
  private static async performInitialization(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Check feature flags
      const featureCheckResult = await this.checkFeatureFlags();
      
      this.startupResults = {
        featureCheck: featureCheckResult,
        timestamp: new Date().toISOString()
      };
      
      const totalTime = Date.now() - startTime;
      // AI: Removed console.log - use proper logging service in production
      
      this.isInitialized = true;
      
    } catch (error) {
      const totalTime = Date.now() - startTime;
      // AI: Removed console.error - use proper logging service in production
      
      this.startupResults = {
        featureCheck: { 
          enabled: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        timestamp: new Date().toISOString()
      };
      
      // Don't throw - allow app to start even if initialization fails
      this.isInitialized = true;
    }
  }

  /** Check feature flags
 */
  private static async checkFeatureFlags(): Promise<{ enabled: boolean; error?: string }> {
    try {
      // AI: Removed console.log - use proper logging service in production
      
      // Check if chatbot widget feature is enabled
      const isChatbotEnabled = await isChatbotWidgetEnabled();
      
      if (!isChatbotEnabled) {
        // AI: Removed console.log - use proper logging service in production
        return { enabled: false };
      }

      // AI: Removed console.log - use proper logging service in production
      return { enabled: true };
      
    } catch (error) {
      // AI: Removed console.error - use proper logging service in production
      return { 
        enabled: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /** Reset for testing
 */
  static resetForTesting(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.startupResults = null;
  }
} 