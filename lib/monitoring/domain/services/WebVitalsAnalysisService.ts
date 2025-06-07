import { WebVitalsMetrics } from '../entities/PerformanceMetrics';

export type WebVitalRating = 'good' | 'needs-improvement' | 'poor' | 'unknown';

export class WebVitalsAnalysisService {
  static getWebVitalRating(metric: keyof WebVitalsMetrics, value?: number): WebVitalRating {
    if (!value) return 'unknown';
    
    switch (metric) {
      case 'LCP':
        return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
      case 'CLS':
        return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
      case 'FCP':
        return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
      case 'INP':
        return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
      case 'TTFB':
        return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
      default:
        return 'unknown';
    }
  }

  static formatWebVitalValue(metric: keyof WebVitalsMetrics, value?: number): string {
    if (!value) return '--';
    
    switch (metric) {
      case 'CLS':
        return value.toFixed(3);
      case 'LCP':
      case 'FCP':
      case 'TTFB':
      case 'INP':
        return `${Math.round(value)}ms`;
      default:
        return value.toString();
    }
  }

  static getRatingColor(rating: WebVitalRating): string {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  }
} 