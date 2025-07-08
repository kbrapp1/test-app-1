'use server';

import { NextRequest, NextResponse } from 'next/server';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeServiceCompositionService } from '@/lib/chatbot-widget/infrastructure/composition/core/KnowledgeServiceCompositionService';

/**
 * Cache Health Monitoring API
 * 
 * AI INSTRUCTIONS:
 * - Provide comprehensive cache health and metrics data
 * - Include performance thresholds and recommendations
 * - Support health status aggregation across all cache types
 * - Enable real-time monitoring and alerting
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const chatbotConfigId = searchParams.get('chatbotConfigId');
    const includeDetails = searchParams.get('details') === 'true';

    // Get overall health status
    const healthStatus = await ChatbotWidgetCompositionRoot.healthCheck();
    
    // Get cache-specific statistics
    const cacheStats = KnowledgeServiceCompositionService.getCacheStatistics();
    
    // Get vector cache health if org/config provided
    let vectorCacheHealth = null;
    if (organizationId && chatbotConfigId) {
      try {
        const knowledgeService = ChatbotWidgetCompositionRoot.getKnowledgeRetrievalService({
          id: chatbotConfigId,
          organizationId: organizationId
        });
        
        // Cast to concrete implementation to access additional methods
        const vectorService = knowledgeService as any;
        
        const vectorStats = vectorService.getVectorCacheStats();
        const isReady = vectorService.isVectorCacheReady();
        
        vectorCacheHealth = {
          isReady,
          stats: vectorStats,
          healthStatus: await vectorService.checkHealthStatus()
        };
      } catch (error) {
        vectorCacheHealth = {
          error: error instanceof Error ? error.message : 'Unknown error',
          isReady: false
        };
      }
    }

    // Aggregate health assessment
    const overallHealth = {
      status: healthStatus.overall ? 'healthy' : 'degraded',
      infrastructure: healthStatus.infrastructure?.overall ?? false,
      knowledge: healthStatus.knowledge ? 'healthy' : 'degraded',
      domain: healthStatus.domain?.overall ?? false,
      flow: healthStatus.flow?.overall ?? false
    };

    // Performance recommendations
    const recommendations = [];
    
    if (vectorCacheHealth?.stats) {
      const stats = vectorCacheHealth.stats;
      
      if (stats.memoryUtilization > 90) {
        recommendations.push({
          type: 'memory',
          severity: 'high',
          message: 'Vector cache memory utilization is high',
          action: 'Consider increasing memory limits or reducing cache size'
        });
      }
      
      if (stats.cacheHitRate < 0.8) {
        recommendations.push({
          type: 'performance',
          severity: 'medium',
          message: 'Vector cache hit rate is below optimal threshold',
          action: 'Review cache warming strategy and search patterns'
        });
      }
    }

    // Simple capacity check based on number of cached services
    if (cacheStats.knowledgeCacheSize > 50) {
      recommendations.push({
        type: 'capacity',
        severity: 'medium',
        message: 'Knowledge cache has many cached services',
        action: 'Consider periodic cache cleanup if memory usage is high'
      });
    }

    const response = {
      timestamp: new Date().toISOString(),
      overall: overallHealth,
      caches: {
        knowledge: {
          size: cacheStats.knowledgeCacheSize,
          memoryUsage: cacheStats.memoryUsage,
          keys: includeDetails ? cacheStats.cacheKeys : cacheStats.cacheKeys.length
        },
        vector: vectorCacheHealth
      },
      recommendations,
      ...(includeDetails && {
        details: {
          healthStatus
        }
      })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Cache health check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: { status: 'error' },
      error: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [{
        type: 'system',
        severity: 'critical',
        message: 'Cache health monitoring is unavailable',
        action: 'Check system logs and service availability'
      }]
    }, { status: 500 });
  }
} 