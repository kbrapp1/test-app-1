export class OptimizationTargetGenerationService {
  static generateTargets(
    components: string[], 
    endpoints: string[], 
    pages: string[]
  ): string[] {
    const targets = new Set<string>();
    
    // Component-based targets
    this.addComponentBasedTargets(components, targets);
    
    // Endpoint-based targets  
    this.addEndpointBasedTargets(endpoints, targets);
    
    // Page-based targets
    this.addPageBasedTargets(pages, targets);

    // Default targets if none found
    if (targets.size === 0) {
      this.addDefaultTargets(targets);
    }
    
    return Array.from(targets);
  }

  private static addComponentBasedTargets(components: string[], targets: Set<string>): void {
    components.forEach(comp => {
      const lowerComp = comp.toLowerCase();
      
      if (lowerComp.includes('list') || lowerComp.includes('gallery')) {
        targets.add('List rendering optimization');
      }
      if (lowerComp.includes('card') || lowerComp.includes('item')) {
        targets.add('Card component memoization');
      }
      if (lowerComp.includes('dialog') || lowerComp.includes('modal')) {
        targets.add('Modal lazy loading');
      }
      if (lowerComp.includes('form')) {
        targets.add('Form validation optimization');
      }
      if (lowerComp.includes('tree') || lowerComp.includes('navigation')) {
        targets.add('Navigation tree optimization');
      }
      if (lowerComp.includes('table') || lowerComp.includes('grid')) {
        targets.add('Table virtualization');
      }
      if (lowerComp.includes('search') || lowerComp.includes('filter')) {
        targets.add('Search debouncing optimization');
      }
    });
  }

  private static addEndpointBasedTargets(endpoints: string[], targets: Set<string>): void {
    endpoints.forEach(endpoint => {
      if (endpoint.includes('search')) {
        targets.add('Search performance');
      }
      if (endpoint.includes('upload')) {
        targets.add('Upload optimization');
      }
      if (endpoint.includes('bulk')) {
        targets.add('Bulk operations optimization');
      }
      if (endpoint.includes('[id]') || (endpoint.includes('[') && endpoint.includes(']'))) {
        targets.add('Detail view caching');
      }
      if (endpoint.includes('list') || endpoint.includes('all')) {
        targets.add('List data caching');
      }
    });
  }

  private static addPageBasedTargets(pages: string[], targets: Set<string>): void {
    pages.forEach(page => {
      if (page.includes('layout')) {
        targets.add('Layout component optimization');
      }
      if (page.includes('[') && page.includes(']')) {
        targets.add('Dynamic route optimization');
      }
      if (page.includes('/settings/') || page.includes('/profile/')) {
        targets.add('Settings page optimization');
      }
      if (page.includes('/dashboard/')) {
        targets.add('Dashboard loading optimization');
      }
      if (page.includes('/upload/')) {
        targets.add('Upload page optimization');
      }
    });
  }

  private static addDefaultTargets(targets: Set<string>): void {
    targets.add('Data loading optimization');
    targets.add('Component rendering optimization');
    targets.add('Page load optimization');
  }
} 