'use server';

import { NextRequest, NextResponse } from 'next/server';
import { AppStartupService } from '@/lib/chatbot-widget/infrastructure/startup/AppStartupService';

/**
 * Startup Status Monitoring API
 * 
 * AI INSTRUCTIONS:
 * - Provide real-time startup and cache warming status
 * - Enable monitoring of background initialization progress
 * - Support debugging of startup performance issues
 * - Include detailed warming results for each configuration
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Check if details requested for potential future detailed status
    const detailsRequested = searchParams.get('details') === 'true';
    
    // Currently all responses include basic status
    // Future: Use detailsRequested for detailed status when needed
    if (detailsRequested) {
      // Placeholder for future detailed status implementation
    }

    // Get startup status
    const startupStatus = AppStartupService.getStartupStatus();
    
    if (!startupStatus) {
      return NextResponse.json({
        status: 'not-started',
        message: 'Application startup has not been initiated yet',
        timestamp: new Date().toISOString()
      });
    }

    const response = {
      status: startupStatus.isInitialized ? 'completed' : 'in-progress',
      initialization: {
        completed: startupStatus.isInitialized,
        timestamp: startupStatus.timestamp
      },
      featureCheck: {
        enabled: startupStatus.featureCheck.enabled,
        error: startupStatus.featureCheck.error,
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Startup status check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 