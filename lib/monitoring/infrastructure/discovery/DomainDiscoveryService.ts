import { PageContext } from '../../domain/repositories/PageContextRepository';
import fs from 'fs';
import path from 'path';

export class DomainDiscoveryService {
  /**
   * Auto-discover ALL domains by scanning lib/* directories + global components
   * Zero manual configuration required
   */
  static async discoverDomains(): Promise<PageContext[]> {
    const libPath = path.join(process.cwd(), 'lib');
    const domains: PageContext[] = [];
    
    try {
      const domainDirs = fs.readdirSync(libPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('_') && name !== 'monitoring'); // Exclude private dirs
      
      for (const domain of domainDirs) {
        const context = await this.analyzeDomainStructure(domain);
        if (context) {
          domains.push(context);
        }
      }

      // Also discover domains from global components directory (e.g., TTS)
      const globalDomains = await this.discoverGlobalComponentDomains();
      domains.push(...globalDomains);
      
    } catch (error) {
      // Graceful fallback in development
    }
    
    return domains;
  }

  /**
   * Analyze actual domain structure from filesystem
   */
  private static async analyzeDomainStructure(domain: string): Promise<PageContext | null> {
    try {
      const domainPath = path.join(process.cwd(), 'lib', domain);
      
      // Check if it's a valid domain (has presentation layer)
      const presentationPath = path.join(domainPath, 'presentation');
      if (!fs.existsSync(presentationPath)) {
        return null;
      }

      // Discover all aspects from actual files
      const [components, files, queryKeys, endpoints, pages] = await Promise.all([
        this.discoverComponents(domain),
        this.discoverFiles(domain),
        this.discoverQueryKeys(domain),
        this.discoverEndpoints(domain),
        this.discoverPages(domain)
      ]);

      // Include pages in files list
      const allFiles = [...files, ...pages];

      return {
        domain,
        components,
        files: allFiles,
        queryKeys,
        endpoints,
        optimizationTargets: this.generateOptimizationTargets(components, endpoints, pages),
        cacheableEndpoints: this.identifyCacheableEndpoints(endpoints)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Comprehensive page discovery - finds ALL page patterns
   */
  private static async discoverPages(domain: string): Promise<string[]> {
    const pages = new Set<string>();
    
    // Pattern 1: Direct domain pages - app/(protected)/{domain}/page.tsx
    await this.discoverDirectPages(domain, pages);
    
    // Pattern 2: Nested/grouped pages - app/(protected)/ai-playground/{domain}/
    await this.discoverGroupedPages(domain, pages);
    
    // Pattern 3: Kebab-case variations - marketing-automation, image-generator
    await this.discoverKebabCasePages(domain, pages);
    
    // Pattern 4: Multi-level nested pages - settings/profile, dam/upload
    await this.discoverNestedPages(domain, pages);
    
    // Pattern 5: Dynamic routes - [id], [slug], etc.
    await this.discoverDynamicPages(domain, pages);

    return Array.from(pages);
  }

  /**
   * Pattern 1: app/(protected)/{domain}/page.tsx
   */
  private static async discoverDirectPages(domain: string, pages: Set<string>): Promise<void> {
    const directPath = path.join(process.cwd(), 'app', '(protected)', domain);
    
    if (fs.existsSync(directPath)) {
      const pageFile = path.join(directPath, 'page.tsx');
      const layoutFile = path.join(directPath, 'layout.tsx');
      
      if (fs.existsSync(pageFile)) {
        pages.add(`app/(protected)/${domain}/page.tsx`);
      }
      if (fs.existsSync(layoutFile)) {
        pages.add(`app/(protected)/${domain}/layout.tsx`);
      }

      // Find all nested pages in this directory
      await this.scanPagesInDirectory(directPath, `app/(protected)/${domain}`, pages);
    }
  }

  /**
   * Pattern 2: app/(protected)/ai-playground/{domain}/, marketing-automation/{domain}/
   */
  private static async discoverGroupedPages(domain: string, pages: Set<string>): Promise<void> {
    const protectedPath = path.join(process.cwd(), 'app', '(protected)');
    
    if (!fs.existsSync(protectedPath)) return;

    try {
      const groups = fs.readdirSync(protectedPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const group of groups) {
        const groupPath = path.join(protectedPath, group, domain);
        if (fs.existsSync(groupPath)) {
          await this.scanPagesInDirectory(groupPath, `app/(protected)/${group}/${domain}`, pages);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
  }

  /**
   * Pattern 3: Handle kebab-case domain names (image-generator, marketing-automation)
   */
  private static async discoverKebabCasePages(domain: string, pages: Set<string>): Promise<void> {
    // Convert camelCase to kebab-case
    const kebabDomain = domain.replace(/([A-Z])/g, '-$1').toLowerCase();
    
    if (kebabDomain !== domain) {
      // Try kebab-case version
      await this.discoverDirectPages(kebabDomain, pages);
      await this.discoverGroupedPages(kebabDomain, pages);
    }

    // Also try other common variations
    const variations = [
      domain.replace(/([A-Z])/g, '-$1').toLowerCase(), // camelCase -> kebab-case
      domain.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), // kebab-case -> camelCase
      domain.toLowerCase(),
      domain.replace(/-/g, '')
    ];

    for (const variation of variations) {
      if (variation !== domain) {
        await this.discoverDirectPages(variation, pages);
        await this.discoverGroupedPages(variation, pages);
      }
    }
  }

  /**
   * Pattern 4: Multi-level nested pages
   */
  private static async discoverNestedPages(domain: string, pages: Set<string>): Promise<void> {
    const protectedPath = path.join(process.cwd(), 'app', '(protected)');
    
    // Look for domain-related pages in any nested structure
    await this.searchDomainPagesRecursively(protectedPath, domain, 'app/(protected)', pages);
  }

  /**
   * Pattern 5: Dynamic routes with [id], [slug], etc.
   */
  private static async discoverDynamicPages(domain: string, pages: Set<string>): Promise<void> {
    const apiPath = path.join(process.cwd(), 'app', 'api', domain);
    
    if (fs.existsSync(apiPath)) {
      await this.scanPagesInDirectory(apiPath, `app/api/${domain}`, pages);
    }
  }

  /**
   * Recursively scan directory for page files
   */
  private static async scanPagesInDirectory(
    dir: string, 
    relativePath: string, 
    pages: Set<string>
  ): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const entryRelativePath = `${relativePath}/${entry.name}`;
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanPagesInDirectory(fullPath, entryRelativePath, pages);
        } else if (this.isPageFile(entry.name)) {
          pages.add(entryRelativePath);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
  }

  /**
   * Search for domain-related pages recursively
   */
  private static async searchDomainPagesRecursively(
    dir: string,
    domain: string,
    currentPath: string,
    pages: Set<string>,
    depth: number = 0
  ): Promise<void> {
    // Prevent infinite recursion
    if (depth > 5) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const entryPath = `${currentPath}/${entry.name}`;
        
        if (entry.isDirectory()) {
          // Check if directory name relates to domain
          if (this.isDomainRelated(entry.name, domain)) {
            await this.scanPagesInDirectory(fullPath, entryPath, pages);
          } else {
            // Continue searching deeper
            await this.searchDomainPagesRecursively(fullPath, domain, entryPath, pages, depth + 1);
          }
        } else if (this.isPageFile(entry.name) && this.isDomainRelated(currentPath, domain)) {
          pages.add(entryPath);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
  }

  /**
   * Check if a filename is a Next.js page file
   */
  private static isPageFile(filename: string): boolean {
    return filename === 'page.tsx' || 
           filename === 'page.ts' || 
           filename === 'page.js' || 
           filename === 'page.jsx' ||
           filename === 'layout.tsx' ||
           filename === 'layout.ts' ||
           filename === 'layout.js' ||
           filename === 'layout.jsx' ||
           filename === 'route.ts' ||
           filename === 'route.js';
  }

  /**
   * Check if a path/name is related to the domain
   */
  private static isDomainRelated(pathOrName: string, domain: string): boolean {
    const lowerPath = pathOrName.toLowerCase();
    const lowerDomain = domain.toLowerCase();
    
    // Direct match
    if (lowerPath.includes(lowerDomain)) return true;
    
    // Kebab-case variations
    const kebabDomain = domain.replace(/([A-Z])/g, '-$1').toLowerCase();
    if (lowerPath.includes(kebabDomain)) return true;
    
    // CamelCase variations
    const camelDomain = domain.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (lowerPath.includes(camelDomain.toLowerCase())) return true;
    
    // Partial matches for compound domains
    const domainParts = domain.split(/[-_]|(?=[A-Z])/);
    return domainParts.some(part => part.length > 2 && lowerPath.includes(part.toLowerCase()));
  }

  /**
   * Discover domains from global components directory (e.g., components/tts/)
   */
  private static async discoverGlobalComponentDomains(): Promise<PageContext[]> {
    const globalComponentsPath = path.join(process.cwd(), 'components');
    const domains: PageContext[] = [];
    
    if (!fs.existsSync(globalComponentsPath)) {
      return domains;
    }

    try {
      const domainDirs = fs.readdirSync(globalComponentsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const domainName of domainDirs) {
        const components = await this.discoverGlobalComponents(domainName);
        const pages = await this.discoverPages(domainName);
        const endpoints: string[] = []; // Global components typically don't have their own API routes
        const queryKeys = await this.discoverGlobalQueryKeys(domainName);

        if (components.length > 0) {
          domains.push({
            domain: domainName,
            components,
            files: [
              `components/${domainName}/`,
              ...pages
            ],
            queryKeys,
            endpoints,
            optimizationTargets: this.generateOptimizationTargets(components, endpoints, pages),
            cacheableEndpoints: this.identifyCacheableEndpoints(endpoints)
          });
        }
      }
    } catch (error) {
      // Continue if can't read global components
    }

    return domains;
  }

  /**
   * Scan for React components in global components directory
   */
  private static async discoverGlobalComponents(domain: string): Promise<string[]> {
    const componentsPath = path.join(process.cwd(), 'components', domain);
    
    if (!fs.existsSync(componentsPath)) {
      return [];
    }

    const components = new Set<string>();
    
    try {
      const files = this.getAllTsxFiles(componentsPath);
      
      for (const filePath of files) {
        const fileName = path.basename(filePath, '.tsx');
        
        // Skip internal/private components
        if (!fileName.startsWith('_') && !fileName.includes('.test') && !fileName.includes('.spec')) {
          components.add(fileName);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
    
    return Array.from(components);
  }

  /**
   * Scan for React Query keys in global components directory
   */
  private static async discoverGlobalQueryKeys(domain: string): Promise<string[]> {
    const componentsPath = path.join(process.cwd(), 'components', domain);
    const queryKeys = new Set<string>();
    
    if (!fs.existsSync(componentsPath)) {
      return [];
    }

    try {
      const hookFiles = this.getAllTsFiles(componentsPath);
      
      for (const filePath of hookFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract query keys from useQuery calls
        const queryKeyMatches = content.match(/queryKey:\s*\[['"`]([^'"`]+)['"`]/g);
        if (queryKeyMatches) {
          queryKeyMatches.forEach(match => {
            const key = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (key) {
              queryKeys.add(key);
            }
          });
        }

        // Extract from queryKey arrays and domain-related keys
        const arrayMatches = content.match(/\[['"`]([^'"`]+)['"`](?:,\s*[^,\]]+)*\]/g);
        if (arrayMatches) {
          arrayMatches.forEach(match => {
            const key = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (key && (key.includes(domain) || key.includes('tts') || key.includes('speech'))) {
              queryKeys.add(key);
            }
          });
        }
      }
    } catch (error) {
      // Continue if can't read hooks
    }
    
    return Array.from(queryKeys);
  }

  /**
   * Scan for actual React components in DDD structure
   */
  private static async discoverComponents(domain: string): Promise<string[]> {
    const componentsPath = path.join(process.cwd(), 'lib', domain, 'presentation', 'components');
    
    if (!fs.existsSync(componentsPath)) {
      return [];
    }

    const components = new Set<string>();
    
    try {
      const files = this.getAllTsxFiles(componentsPath);
      
      for (const filePath of files) {
        const fileName = path.basename(filePath, '.tsx');
        
        // Skip internal/private components
        if (!fileName.startsWith('_') && !fileName.includes('.test') && !fileName.includes('.spec')) {
          components.add(fileName);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
    
    return Array.from(components);
  }

  /**
   * Scan for actual API endpoints
   */
  private static async discoverEndpoints(domain: string): Promise<string[]> {
    const apiPath = path.join(process.cwd(), 'app', 'api', domain);
    const endpoints = new Set<string>();
    
    if (!fs.existsSync(apiPath)) {
      return [];
    }

    try {
      const routes = this.scanApiDirectory(apiPath, domain);
      routes.forEach(route => endpoints.add(route));
    } catch (error) {
      // Continue if can't scan API directory
    }
    
    return Array.from(endpoints);
  }

  /**
   * Scan for actual React Query keys in hooks
   */
  private static async discoverQueryKeys(domain: string): Promise<string[]> {
    const hooksPath = path.join(process.cwd(), 'lib', domain, 'presentation', 'hooks');
    const queryKeys = new Set<string>();
    
    if (!fs.existsSync(hooksPath)) {
      return [];
    }

    try {
      const hookFiles = this.getAllTsFiles(hooksPath);
      
      for (const filePath of hookFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract query keys from useQuery calls
        const queryKeyMatches = content.match(/queryKey:\s*\[['"`]([^'"`]+)['"`]/g);
        if (queryKeyMatches) {
          queryKeyMatches.forEach(match => {
            const key = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (key) {
              queryKeys.add(key);
            }
          });
        }

        // Extract from queryKey arrays
        const arrayMatches = content.match(/\[['"`]([^'"`]+)['"`](?:,\s*[^,\]]+)*\]/g);
        if (arrayMatches) {
          arrayMatches.forEach(match => {
            const key = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
            if (key && key.includes(domain)) {
              queryKeys.add(key);
            }
          });
        }
      }
    } catch (error) {
      // Continue if can't read hooks
    }
    
    return Array.from(queryKeys);
  }

  /**
   * Discover all relevant files in domain
   */
  private static async discoverFiles(domain: string): Promise<string[]> {
    const files = new Set<string>();
    const domainPath = path.join(process.cwd(), 'lib', domain);
    
    // Key directories to include
    const keyPaths = [
      'presentation/components',
      'presentation/hooks',
      'application/actions',
      'application/services',
      'domain/entities'
    ];

    for (const keyPath of keyPaths) {
      const fullPath = path.join(domainPath, keyPath);
      if (fs.existsSync(fullPath)) {
        files.add(`lib/${domain}/${keyPath}/`);
      }
    }

    return Array.from(files);
  }

  /**
   * Recursively scan API directory for route files
   */
  private static scanApiDirectory(dir: string, baseDomain: string, currentPath: string = ''): string[] {
    const routes: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Handle dynamic routes like [id], [assetId], etc.
          const routeSegment = entry.name.startsWith('[') && entry.name.endsWith(']')
            ? entry.name  // Keep [id] as is
            : entry.name;
            
          const newPath = currentPath ? `${currentPath}/${routeSegment}` : routeSegment;
          routes.push(...this.scanApiDirectory(fullPath, baseDomain, newPath));
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          // Found an API route
          const endpoint = currentPath 
            ? `/api/${baseDomain}/${currentPath}`
            : `/api/${baseDomain}`;
          routes.push(endpoint);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
    
    return routes;
  }

  /**
   * Generate optimization targets based on discovered components, endpoints, and pages
   */
  private static generateOptimizationTargets(
    components: string[], 
    endpoints: string[], 
    pages: string[]
  ): string[] {
    const targets = new Set<string>();
    
    // Component-based targets
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
    });

    // Endpoint-based targets  
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
      if (endpoint.includes('[id]') || endpoint.includes('[') && endpoint.includes(']')) {
        targets.add('Detail view caching');
      }
    });

    // Page-based targets
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
    });

    // Default targets if none found
    if (targets.size === 0) {
      targets.add('Data loading optimization');
      targets.add('Component rendering optimization');
      targets.add('Page load optimization');
    }
    
    return Array.from(targets);
  }

  /**
   * Identify which endpoints are cacheable (GET endpoints typically)
   */
  private static identifyCacheableEndpoints(endpoints: string[]): string[] {
    return endpoints.filter(endpoint => {
      // Heuristics for cacheable endpoints
      return endpoint.includes('[id]') ||      // Detail endpoints
             endpoint.includes('list') ||      // List endpoints  
             endpoint.includes('search') ||    // Search endpoints
             endpoint.includes('tree') ||      // Tree/navigation endpoints
             (!endpoint.includes('upload') &&  // Not upload endpoints
              !endpoint.includes('delete') &&  // Not delete endpoints
              !endpoint.includes('create'));   // Not create endpoints
    });
  }

  /**
   * Get all .tsx files recursively
   */
  private static getAllTsxFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.getAllTsxFiles(fullPath));
        } else if (entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permission
    }
    
    return files;
  }

  /**
   * Get all .ts files recursively
   */
  private static getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          files.push(...this.getAllTsFiles(fullPath));
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist or no permission
    }
    
    return files;
  }
} 