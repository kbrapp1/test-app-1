import * as path from 'path';
import { FileSystemScannerService } from '../filesystem/FileSystemScannerService';

export class EndpointDiscoveryService {
  static async discoverDomainEndpoints(domain: string): Promise<string[]> {
    const apiPath = FileSystemScannerService.getApiPath(domain);
    const endpoints = new Set<string>();
    
    if (!FileSystemScannerService.directoryExists(apiPath)) {
      return [];
    }

    const routes = this.scanApiDirectory(apiPath, domain);
    routes.forEach(route => endpoints.add(route));
    
    return Array.from(endpoints);
  }

  static identifyCacheableEndpoints(endpoints: string[]): string[] {
    return endpoints.filter(endpoint => {
      // Heuristics for cacheable endpoints (typically GET endpoints)
      return endpoint.includes('[id]') ||      // Detail endpoints
             endpoint.includes('list') ||      // List endpoints  
             endpoint.includes('search') ||    // Search endpoints
             endpoint.includes('tree') ||      // Tree/navigation endpoints
             (!endpoint.includes('upload') &&  // Not upload endpoints
              !endpoint.includes('delete') &&  // Not delete endpoints
              !endpoint.includes('create'));   // Not create endpoints
    });
  }

  private static scanApiDirectory(dir: string, baseDomain: string, currentPath: string = ''): string[] {
    const routes: string[] = [];
    
    try {
      const entries = FileSystemScannerService.getDirectoryNames(dir);
      
      // Also check for route files in current directory
      const routeFiles = ['route.ts', 'route.js'];
      for (const routeFile of routeFiles) {
        const routePath = path.join(dir, routeFile);
        if (FileSystemScannerService.directoryExists(routePath)) {
          const endpoint = currentPath 
            ? `/api/${baseDomain}/${currentPath}`
            : `/api/${baseDomain}`;
          routes.push(endpoint);
          break; // Only need one route file
        }
      }
      
      // Scan subdirectories
      for (const entryName of entries) {
        const fullPath = path.join(dir, entryName);
        
        // Handle dynamic routes like [id], [assetId], etc.
        const routeSegment = entryName.startsWith('[') && entryName.endsWith(']')
          ? entryName  // Keep [id] as is
          : entryName;
          
        const newPath = currentPath ? `${currentPath}/${routeSegment}` : routeSegment;
        routes.push(...this.scanApiDirectory(fullPath, baseDomain, newPath));
      }
    } catch {
      // Continue if can't read directory
    }
    
    return routes;
  }
} 