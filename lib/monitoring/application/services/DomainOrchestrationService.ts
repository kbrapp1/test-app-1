import { PageContext } from '../../domain/repositories/PageContextRepository';
import { FileSystemScannerService } from '../../infrastructure/filesystem/FileSystemScannerService';
import { PageDiscoveryService } from '../../infrastructure/discovery/PageDiscoveryService';
import { ComponentDiscoveryService } from '../../infrastructure/discovery/ComponentDiscoveryService';
import { EndpointDiscoveryService } from '../../infrastructure/discovery/EndpointDiscoveryService';
import { QueryKeyDiscoveryService } from '../../infrastructure/discovery/QueryKeyDiscoveryService';
import { OptimizationTargetGenerationService } from '../../domain/services/optimization/OptimizationTargetGenerationService';

export class DomainOrchestrationService {
  static async orchestrateLibDomainDiscovery(): Promise<PageContext[]> {
    const libPath = FileSystemScannerService.getLibDomainPath('');
    const domains: PageContext[] = [];
    
    try {
      const domainDirs = FileSystemScannerService.getDirectoryNames(libPath)
        .filter(name => name !== 'monitoring'); // Exclude monitoring domain
      
      for (const domain of domainDirs) {
        const context = await this.analyzeLibDomain(domain);
        if (context) {
          domains.push(context);
        }
      }
    } catch {
      // Graceful fallback in development
    }
    
    return domains;
  }

  static async orchestrateGlobalComponentDiscovery(): Promise<PageContext[]> {
    const domains: PageContext[] = [];
    
    try {
      const domainDirs = await ComponentDiscoveryService.discoverAllGlobalComponentDomains();

      for (const domainName of domainDirs) {
        const context = await this.analyzeGlobalComponentDomain(domainName);
        if (context) {
          domains.push(context);
        }
      }
    } catch {
      // Continue if can't read global components
    }

    return domains;
  }

  private static async analyzeLibDomain(domain: string): Promise<PageContext | null> {
    try {
      // Check if it's a valid domain (has presentation layer)
      const presentationPath = `${FileSystemScannerService.getLibDomainPath(domain)}/presentation`;
      if (!FileSystemScannerService.directoryExists(presentationPath)) {
        return null;
      }

      // Discover all aspects from actual files
      const [components, files, queryKeys, endpoints, pages] = await Promise.all([
        ComponentDiscoveryService.discoverDomainComponents(domain),
        this.discoverDomainFiles(domain),
        QueryKeyDiscoveryService.discoverDomainQueryKeys(domain),
        EndpointDiscoveryService.discoverDomainEndpoints(domain),
        PageDiscoveryService.discoverAllPages(domain)
      ]);

      // Include pages in files list
      const allFiles = [...files, ...pages];

      return {
        domain,
        components,
        files: allFiles,
        queryKeys,
        endpoints,
        optimizationTargets: OptimizationTargetGenerationService.generateTargets(components, endpoints, pages),
        cacheableEndpoints: EndpointDiscoveryService.identifyCacheableEndpoints(endpoints)
      };
    } catch {
      return null;
    }
  }

  private static async analyzeGlobalComponentDomain(domainName: string): Promise<PageContext | null> {
    try {
      const components = await ComponentDiscoveryService.discoverGlobalComponents(domainName);
      const pages = await PageDiscoveryService.discoverAllPages(domainName);
      const queryKeys = await QueryKeyDiscoveryService.discoverGlobalQueryKeys(domainName);
      const endpoints: string[] = []; // Global components typically don't have their own API routes

      if (components.length > 0) {
        return {
          domain: domainName,
          components,
          files: [
            `components/${domainName}/`,
            ...pages
          ],
          queryKeys,
          endpoints,
          optimizationTargets: OptimizationTargetGenerationService.generateTargets(components, endpoints, pages),
          cacheableEndpoints: EndpointDiscoveryService.identifyCacheableEndpoints(endpoints)
        };
      }
    } catch {
      // Continue if can't analyze domain
    }

    return null;
  }

  private static async discoverDomainFiles(domain: string): Promise<string[]> {
    const files = new Set<string>();
    const domainPath = FileSystemScannerService.getLibDomainPath(domain);
    
    // Key directories to include
    const keyPaths = [
      'presentation/components',
      'presentation/hooks',
      'application/actions',
      'application/services',
      'domain/entities'
    ];

    for (const keyPath of keyPaths) {
      const fullPath = `${domainPath}/${keyPath}`;
      if (FileSystemScannerService.directoryExists(fullPath)) {
        files.add(`lib/${domain}/${keyPath}/`);
      }
    }

    return Array.from(files);
  }
} 