import { PageContext, PageContextRepository } from '../../repositories/PageContextRepository';
import { IContextDiscoveryService } from '../interfaces/IContextDiscoveryService';

export interface ContextUpdateResult {
  domain: string;
  added: {
    components: string[];
    files: string[];
    endpoints: string[];
    queryKeys: string[];
  };
  updated: boolean;
}

export class DynamicContextUpdateService {
  constructor(
    private repository: PageContextRepository,
    private contextDiscoveryService: IContextDiscoveryService
  ) {}

  /**
   * Update contexts for all domains by rescanning their structure
   */
  async updateAllContexts(): Promise<ContextUpdateResult[]> {
    const results: ContextUpdateResult[] = [];
    const domains = await this.repository.getAllContexts();

    for (const [domainName, currentContext] of Array.from(domains.entries())) {
      const result = await this.updateDomainContext(domainName, currentContext);
      if (result.updated) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Update context for a specific domain
   */
  async updateDomainContext(domain: string, currentContext: PageContext): Promise<ContextUpdateResult> {
    const discoveredContext = await this.discoverCurrentState(domain);
    const result: ContextUpdateResult = {
      domain,
      added: {
        components: [],
        files: [],
        endpoints: [],
        queryKeys: []
      },
      updated: false
    };

    if (!discoveredContext) {
      return result;
    }

    // Find new additions
    const newComponents = discoveredContext.components.filter(
      comp => !currentContext.components.includes(comp)
    );
    
    const newFiles = discoveredContext.files.filter(
      file => !currentContext.files.includes(file)
    );

    const newEndpoints = await this.discoverNewEndpoints(domain, currentContext.endpoints);
    const newQueryKeys = await this.discoverNewQueryKeys(domain, currentContext.queryKeys);

    // Update if new items found
    if (newComponents.length || newFiles.length || newEndpoints.length || newQueryKeys.length) {
      const updatedContext: PageContext = {
        ...currentContext,
        components: [...currentContext.components, ...newComponents],
        files: [...currentContext.files, ...newFiles],
        endpoints: [...currentContext.endpoints, ...newEndpoints],
        queryKeys: [...currentContext.queryKeys, ...newQueryKeys],
        optimizationTargets: this.updateOptimizationTargets(currentContext, newComponents, newEndpoints)
      };

      await this.repository.register(domain, updatedContext);

      result.added = {
        components: newComponents,
        files: newFiles,
        endpoints: newEndpoints,
        queryKeys: newQueryKeys
      };
      result.updated = true;
    }

    return result;
  }

  /**
   * Register new endpoint discovered at runtime
   */
  async registerNewEndpoint(domain: string, endpoint: string, isCacheable: boolean = false): Promise<boolean> {
    const context = await this.repository.getContext(domain);
    if (!context || context.endpoints.includes(endpoint)) {
      return false;
    }

    const updatedContext: PageContext = {
      ...context,
      endpoints: [...context.endpoints, endpoint],
      cacheableEndpoints: isCacheable 
        ? [...context.cacheableEndpoints, endpoint]
        : context.cacheableEndpoints
    };

    await this.repository.register(domain, updatedContext);
    return true;
  }

  /**
   * Register new query key discovered at runtime
   */
  async registerNewQueryKey(domain: string, queryKey: string): Promise<boolean> {
    const context = await this.repository.getContext(domain);
    if (!context || context.queryKeys.includes(queryKey)) {
      return false;
    }

    const updatedContext: PageContext = {
      ...context,
      queryKeys: [...context.queryKeys, queryKey]
    };

    await this.repository.register(domain, updatedContext);
    return true;
  }

  private async discoverCurrentState(domain: string): Promise<PageContext | null> {
    // Use injected discovery service to get current file system state
    return await this.contextDiscoveryService.discoverDomainContext(domain);
  }

  private async discoverNewEndpoints(domain: string, currentEndpoints: string[]): Promise<string[]> {
    // Scan API routes for new endpoints
    const apiPath = `app/api/${domain}`;
    const discoveredEndpoints = await this.scanApiRoutes(apiPath);
    
    return discoveredEndpoints.filter(endpoint => !currentEndpoints.includes(endpoint));
  }

  private async discoverNewQueryKeys(domain: string, currentKeys: string[]): Promise<string[]> {
    // Scan hooks and components for new query keys
    const hooksPath = `lib/${domain}/presentation/hooks`;
    const discoveredKeys = await this.scanForQueryKeys(hooksPath);
    
    return discoveredKeys.filter(key => !currentKeys.includes(key));
  }

  private async scanApiRoutes(apiPath: string): Promise<string[]> {
    // Implementation would scan API route files and extract endpoints
    // This is a simplified version
    const routes = [
      `/api/${apiPath.split('/').pop()}/list`,
      `/api/${apiPath.split('/').pop()}/[id]`,
      `/api/${apiPath.split('/').pop()}/search`
    ];
    
    return routes;
  }

  private async scanForQueryKeys(hooksPath: string): Promise<string[]> {
    // Implementation would scan hook files for useQuery calls
    // This is a simplified version
    const domain = hooksPath.split('/')[1];
    return [
      `${domain}-list`,
      `${domain}-details`,
      `${domain}-search`
    ];
  }

  private updateOptimizationTargets(
    context: PageContext, 
    newComponents: string[], 
    newEndpoints: string[]
  ): string[] {
    const targets = [...context.optimizationTargets];
    
    // Add optimization targets based on new components/endpoints
    if (newComponents.some(comp => comp.includes('List'))) {
      targets.push('List rendering optimization');
    }
    if (newComponents.some(comp => comp.includes('Dialog') || comp.includes('Modal'))) {
      targets.push('Modal lazy loading');
    }
    if (newEndpoints.some(endpoint => endpoint.includes('search'))) {
      targets.push('Search performance');
    }
    if (newEndpoints.some(endpoint => endpoint.includes('bulk'))) {
      targets.push('Bulk operations optimization');
    }

    return Array.from(new Set(targets)); // Remove duplicates
  }
} 