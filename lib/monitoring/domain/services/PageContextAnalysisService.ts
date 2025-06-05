import { PageContextRepository, PageContext } from '../repositories/PageContextRepository';

export interface PageContextAnalysis {
  likelyComponents: string[];
  likelyFiles: string[];
  likelyQueryKeys: string[];
  likelyEndpoints: string[];
  optimizationTargets: string[];
  cacheableEndpoints: string[];
}

export class PageContextAnalysisService {
  constructor(private pageContextRepository: PageContextRepository) {}

  async analyzeForCrossDomain(pageContext: string, issueType?: string): Promise<PageContextAnalysis> {
    const context = await this.getPageContext(pageContext);
    
    if (!context) {
      return {
        likelyComponents: [],
        likelyFiles: [],
        likelyQueryKeys: [],
        likelyEndpoints: [],
        optimizationTargets: [],
        cacheableEndpoints: []
      };
    }
    
    // Filter components based on cross-domain issue type for specificity
    const relevantComponents = this.filterComponentsByIssueType(context.components, issueType);
    const relevantFiles = this.filterFilesByIssueType(context.files, issueType);
    
    return {
      likelyComponents: relevantComponents,
      likelyFiles: relevantFiles,
      likelyQueryKeys: context.queryKeys.slice(0, 3), // Top 3 most relevant
      likelyEndpoints: context.endpoints.slice(0, 3), // Top 3 most relevant
      optimizationTargets: context.optimizationTargets,
      cacheableEndpoints: context.cacheableEndpoints
    };
  }

  async analyzeForNetwork(pageContext: string): Promise<PageContextAnalysis> {
    const context = await this.getPageContext(pageContext);
    
    if (!context) {
      return {
        likelyComponents: [],
        likelyFiles: [],
        likelyQueryKeys: [],
        likelyEndpoints: [],
        optimizationTargets: [],
        cacheableEndpoints: []
      };
    }
    
    return {
      likelyComponents: context.components,
      likelyFiles: context.files,
      likelyQueryKeys: context.queryKeys,
      likelyEndpoints: context.endpoints,
      optimizationTargets: context.optimizationTargets,
      cacheableEndpoints: context.cacheableEndpoints
    };
  }

  async getImplementationSteps(pageContext: string): Promise<string[]> {
    const baseSteps = [
      'Identify the root domain causing the issue (frontend vs network)',
      'Monitor cascade effects - ensure fixing one domain doesn\'t worsen the other',
      'Test holistically - verify both domains improve together'
    ];

    const context = await this.pageContextRepository.getContext(pageContext);
    if (!context) {
      return [
        `Unknown domain '${pageContext}' - no context auto-discovered`,
        'Check if domain follows DDD structure: lib/{domain}/presentation/',
        'Add domain-specific optimization steps',
        ...baseSteps
      ];
    }

    // Generate domain-specific steps based on auto-discovered context  
    const relevantComponents = this.filterComponentsByIssueType(context.components, 'optimization');
    const domainSteps = [
      `Implement React Query for ${context.domain} data loading`,
      `Add memoization to ${relevantComponents.slice(0, 2).join(' and ')} components`,
      `Coordinate caching between ${context.optimizationTargets[0]?.toLowerCase() || 'components'}`,
      `Optimize ${context.optimizationTargets.join(', ').toLowerCase()}`,
      ...baseSteps
    ];

    return domainSteps;
  }

  // Static factory method for backward compatibility
  static create(repository: PageContextRepository): PageContextAnalysisService {
    return new PageContextAnalysisService(repository);
  }

  // Register a new domain context
  registerContext(domain: string, context: Omit<PageContext, 'domain'>): void {
    this.pageContextRepository.register(domain, { domain, ...context });
  }

  // Check if a domain is auto-discovered
  async isSupported(domain: string): Promise<boolean> {
    return await this.pageContextRepository.hasContext(domain);
  }

  // Get all auto-discovered domains
  async getSupportedDomains(): Promise<string[]> {
    const contexts = await this.pageContextRepository.getAllContexts();
    return Array.from(contexts.keys());
  }

  private async getPageContext(pageContext: string): Promise<PageContext | null> {
    return await this.pageContextRepository.getContext(pageContext);
  }

  private filterComponentsByIssueType(components: string[], issueType?: string): string[] {
    if (!issueType || components.length <= 5) {
      return components.slice(0, 5); // Max 5 components for readability
    }

    // Filter by issue type for cross-domain specificity
    const filters: Record<string, string[]> = {
      'Missing Cache Strategy': ['Gallery', 'List', 'Data', 'Service', 'Provider'],
      'optimization': ['Gallery', 'List', 'Grid', 'Card', 'Item'],
      'correlation': ['Provider', 'Context', 'Service', 'Manager'],
      'cascade': ['Layout', 'Container', 'Wrapper', 'Section']
    };

    const keywords = filters[issueType] || ['Gallery', 'List', 'Data'];
    const filtered = components.filter(component => 
      keywords.some(keyword => component.includes(keyword))
    );

    return filtered.length > 0 ? filtered.slice(0, 5) : components.slice(0, 3);
  }

  private filterFilesByIssueType(files: string[], issueType?: string): string[] {
    if (!issueType || files.length <= 8) {
      return files.slice(0, 8); // Max 8 files for readability
    }

    // Prioritize files by relevance to issue type
    const priorities: Record<string, string[]> = {
      'Missing Cache Strategy': ['hooks', 'services', 'actions'],
      'optimization': ['components', 'hooks', 'services'], 
      'correlation': ['providers', 'services', 'actions'],
      'cascade': ['layout', 'components', 'pages']
    };

    const priorityKeywords = priorities[issueType] || ['components', 'hooks'];
    const prioritized = files.filter(file => 
      priorityKeywords.some(keyword => file.includes(keyword))
    );

    return prioritized.length > 0 ? prioritized.slice(0, 8) : files.slice(0, 5);
  }
} 