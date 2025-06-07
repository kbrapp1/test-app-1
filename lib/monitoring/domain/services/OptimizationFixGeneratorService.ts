import { OptimizationGap } from '../value-objects/OptimizationGap';

/**
 * Domain Service: Optimization Fix Generator for Frontend Performance
 * Responsibility: Generate context-specific optimization recommendations
 * Bounded Context: Frontend Performance Optimization
 * 
 * Single Responsibility: Focus solely on generating actionable fix recommendations
 */
export class OptimizationFixGeneratorService {
  
  /**
   * Business Rule: Generate context-specific optimization recommendations
   */
  generateSpecificFix(issueType: string, pageContext: string): string {
    const contextualFixes = {
      'caching': this.generateCachingFix(pageContext),
      'memoization': this.generateMemoizationFix(pageContext),
      'debouncing': this.generateDebouncingFix(pageContext),
      'lazy-loading': this.generateLazyLoadingFix(pageContext),
      'batching': this.generateBatchingFix(pageContext)
    };

    return contextualFixes[issueType as keyof typeof contextualFixes] || 
           `Optimize ${issueType} patterns in ${pageContext}`;
  }

  /**
   * Business Rule: Context-specific caching recommendations
   */
  private generateCachingFix(pageContext: string): string {
    const pageFixes = {
      'dashboard': 'Implement React Query for dashboard metrics and user data',
      'image-generator': 'Cache generation history and provider configurations',
      'dam': 'Cache asset metadata and folder structures',
      'team': 'Cache team member data and organization settings'
    };
    
    return pageFixes[pageContext as keyof typeof pageFixes] || 
           `Implement React Query caching for ${pageContext} API calls`;
  }

  /**
   * Business Rule: Context-specific memoization recommendations  
   */
  private generateMemoizationFix(pageContext: string): string {
    const pageFixes = {
      'dashboard': 'Memoize chart components and metric calculations',
      'image-generator': 'Memoize generation cards and image preview components',
      'dam': 'Memoize asset grid items and thumbnail components',
      'team': 'Memoize member cards and permission matrices'
    };
    
    return pageFixes[pageContext as keyof typeof pageFixes] || 
           `Add React.memo and useCallback to ${pageContext} components`;
  }

  /**
   * Business Rule: Context-specific debouncing recommendations
   */
  private generateDebouncingFix(pageContext: string): string {
    return `Add debouncing to search/filter inputs in ${pageContext} (300ms delay)`;
  }

  /**
   * Business Rule: Context-specific lazy loading recommendations
   */
  private generateLazyLoadingFix(pageContext: string): string {
    const pageFixes = {
      'dashboard': 'Lazy load heavy chart libraries and widgets',
      'image-generator': 'Lazy load image editing tools and style selectors',
      'dam': 'Lazy load asset previews and metadata panels',
      'team': 'Lazy load member management modals and role editors'
    };
    
    return pageFixes[pageContext as keyof typeof pageFixes] || 
           `Implement code splitting for heavy ${pageContext} components`;
  }

  /**
   * Business Rule: Context-specific batching recommendations
   */
  private generateBatchingFix(pageContext: string): string {
    return `Batch mutations together in ${pageContext} operations (use React Query mutations)`;
  }
} 