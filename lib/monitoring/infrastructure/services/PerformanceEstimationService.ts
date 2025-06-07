import { NetworkStats } from '../../domain/network-efficiency/entities/NetworkCall';

export class PerformanceEstimationService {
  static estimateBandwidthSavings(stats: NetworkStats): string {
    const avgRequestSize = 2048; // Average 2KB per request
    const wastedBytes = stats.redundantCalls * avgRequestSize;
    
    if (wastedBytes > 1024 * 1024) {
      return `${(wastedBytes / (1024 * 1024)).toFixed(1)}MB saved`;
    } else if (wastedBytes > 1024) {
      return `${(wastedBytes / 1024).toFixed(1)}KB saved`;
    }
    return `${wastedBytes}B saved`;
  }

  static estimateTimeSavings(stats: NetworkStats): string {
    const avgResponseTime = 200; // Average 200ms per request
    const wastedTime = stats.redundantCalls * avgResponseTime;
    
    if (wastedTime > 1000) {
      return `${(wastedTime / 1000).toFixed(1)}s faster loading`;
    }
    return `${wastedTime}ms faster loading`;
  }

  static calculatePotentialSavings(stats: NetworkStats): {
    wastedRequests: number;
    potentialSavings: string;
    bandwidthSavings: string;
    timeSavings: string;
  } {
    const wastedRequests = stats.redundantCalls;
    const potentialSavings = ((wastedRequests / stats.totalCalls) * 100).toFixed(1);
    
    return {
      wastedRequests,
      potentialSavings,
      bandwidthSavings: this.estimateBandwidthSavings(stats),
      timeSavings: this.estimateTimeSavings(stats)
    };
  }
} 