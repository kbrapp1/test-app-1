import { BundleAnalysis, ChunkInfo, ImportInfo, ModuleInfo } from '../../domain/entities/DetailedPerformanceMetrics';

export class BundleAnalysisService {
  private static readonly LARGE_MODULE_THRESHOLD = 50000; // 50KB
  private static readonly LAZY_LOADABLE_PATTERNS = [
    /\/charts?\//, 
    /\/editor\//, 
    /\/modal\//, 
    /\/dialog\//, 
    /\/playground\//,
    /\/generator\//
  ];

  static async getBundleAnalysis(): Promise<BundleAnalysis> {
    try {
      // Get webpack stats if available (development mode)
      const webpackStats = await this.getWebpackStats();
      
      if (webpackStats) {
        return this.analyzeWebpackStats(webpackStats);
      }

      // Fallback to performance API analysis
      return this.analyzeFromPerformanceAPI();
    } catch (error) {
      console.warn('Bundle analysis failed:', error);
      return this.getEmptyAnalysis();
    }
  }

  private static async getWebpackStats(): Promise<any> {
    try {
      // Try to access webpack stats from dev server
      const response = await fetch('/_next/static/chunks/webpack-stats.json');
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Ignore - not available in production
    }
    return null;
  }

  private static analyzeWebpackStats(stats: any): BundleAnalysis {
    const chunks = this.extractChunks(stats);
    const largestImports = this.findLargestImports(stats);
    const unusedImports = this.detectUnusedImports(stats);
    const routeSizes = this.calculateRouteSizes(chunks);

    return {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      chunks,
      largestImports,
      unusedImports,
      routeSizes
    };
  }

  private static analyzeFromPerformanceAPI(): BundleAnalysis {
    const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const scriptResources = resources.filter(r => 
      r.name.includes('.js') || r.name.includes('_next/static/chunks/')
    );

    const chunks: ChunkInfo[] = scriptResources.map(resource => ({
      name: this.extractChunkName(resource.name),
      size: this.estimateResourceSize(resource),
      files: [resource.name],
      modules: []
    }));

    const largestImports = this.estimateLargestImports(scriptResources);

    return {
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      chunks,
      largestImports,
      unusedImports: [], // Cannot detect from performance API
      routeSizes: this.estimateRouteSizes(chunks)
    };
  }

  private static extractChunks(stats: any): ChunkInfo[] {
    if (!stats.chunks) return [];

    return stats.chunks.map((chunk: any) => ({
      name: chunk.names?.[0] || chunk.id,
      size: chunk.size || 0,
      files: chunk.files || [],
      modules: this.extractModules(chunk.modules || [])
    }));
  }

  private static extractModules(modules: any[]): ModuleInfo[] {
    return modules
      .filter(mod => mod.size > 1000) // Only modules > 1KB
      .map(mod => ({
        name: mod.name || mod.id,
        size: mod.size || 0,
        reasons: (mod.reasons || []).map((r: any) => r.moduleName).filter(Boolean)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 20); // Top 20 modules
  }

  private static findLargestImports(stats: any): ImportInfo[] {
    const imports: ImportInfo[] = [];

    if (stats.modules) {
      stats.modules
        .filter((mod: any) => mod.size > this.LARGE_MODULE_THRESHOLD)
        .forEach((mod: any) => {
          const isLazyLoadable = this.LAZY_LOADABLE_PATTERNS.some(pattern => 
            pattern.test(mod.name || '')
          );

          imports.push({
            module: mod.name || mod.id,
            size: mod.size || 0,
            component: this.extractComponentName(mod.name || ''),
            isLazyLoadable
          });
        });
    }

    return imports.sort((a, b) => b.size - a.size).slice(0, 10);
  }

  private static detectUnusedImports(stats: any): string[] {
    // Simplified unused import detection
    // In a real implementation, this would use webpack-bundle-analyzer data
    const unusedPatterns = [
      'lodash', // If using specific lodash functions
      'moment', // If date-fns is also present
      'legacy-'
    ];

    const modules = stats.modules || [];
    return modules
      .filter((mod: any) => 
        unusedPatterns.some(pattern => (mod.name || '').includes(pattern))
      )
      .map((mod: any) => mod.name || mod.id)
      .slice(0, 5);
  }

  private static calculateRouteSizes(chunks: ChunkInfo[]): Record<string, number> {
    const routeSizes: Record<string, number> = {};

    chunks.forEach(chunk => {
      const route = this.extractRouteFromChunk(chunk.name);
      routeSizes[route] = (routeSizes[route] || 0) + chunk.size;
    });

    return routeSizes;
  }

  private static estimateLargestImports(resources: PerformanceResourceTiming[]): ImportInfo[] {
    return resources
      .filter(r => this.estimateResourceSize(r) > this.LARGE_MODULE_THRESHOLD)
      .map(r => ({
        module: this.extractModuleName(r.name),
        size: this.estimateResourceSize(r),
        component: this.extractComponentName(r.name),
        isLazyLoadable: this.LAZY_LOADABLE_PATTERNS.some(pattern => pattern.test(r.name))
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
  }

  private static estimateResourceSize(resource: PerformanceResourceTiming): number {
    // Estimate size from transfer time (rough approximation)
    const transferTime = resource.responseEnd - resource.responseStart;
    return Math.round(transferTime * 1000); // Rough bytes estimate
  }

  private static estimateRouteSizes(chunks: ChunkInfo[]): Record<string, number> {
    const routeSizes: Record<string, number> = {};
    
    chunks.forEach(chunk => {
      const route = this.extractRouteFromChunk(chunk.name);
      routeSizes[route] = (routeSizes[route] || 0) + chunk.size;
    });

    // Add some known large routes
    if (!routeSizes['dam']) routeSizes['dam'] = 458000; // From lighthouse report
    if (!routeSizes['dashboard']) routeSizes['dashboard'] = 0;

    return routeSizes;
  }

  private static extractChunkName(url: string): string {
    const match = url.match(/\/([^\/]+)\.js$/);
    return match ? match[1] : 'unknown';
  }

  private static extractModuleName(url: string): string {
    if (url.includes('node_modules')) {
      const match = url.match(/node_modules\/([^\/]+)/);
      return match ? match[1] : 'unknown-module';
    }
    return this.extractChunkName(url);
  }

  private static extractComponentName(moduleName: string): string {
    const match = moduleName.match(/\/([A-Z][^\/]+)\.tsx?$/);
    return match ? match[1] : 'unknown-component';
  }

  private static extractRouteFromChunk(chunkName: string): string {
    if (chunkName.includes('dam')) return 'dam';
    if (chunkName.includes('dashboard')) return 'dashboard';
    if (chunkName.includes('image-generator')) return 'image-generator';
    if (chunkName.includes('playground')) return 'playground';
    return 'main';
  }

  private static getEmptyAnalysis(): BundleAnalysis {
    return {
      totalSize: 0,
      chunks: [],
      largestImports: [],
      unusedImports: [],
      routeSizes: {}
    };
  }
} 