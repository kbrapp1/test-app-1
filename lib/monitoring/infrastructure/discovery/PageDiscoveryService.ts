import * as path from 'path';
import { FileSystemScannerService } from '../filesystem/FileSystemScannerService';

export class PageDiscoveryService {
  static async discoverAllPages(domain: string): Promise<string[]> {
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

  private static async discoverDirectPages(domain: string, pages: Set<string>): Promise<void> {
    const directPath = path.join(FileSystemScannerService.getProtectedAppPath(), domain);
    
    if (FileSystemScannerService.directoryExists(directPath)) {
      const pageFile = path.join(directPath, 'page.tsx');
      const layoutFile = path.join(directPath, 'layout.tsx');
      
      if (FileSystemScannerService.directoryExists(pageFile)) {
        pages.add(`app/(protected)/${domain}/page.tsx`);
      }
      if (FileSystemScannerService.directoryExists(layoutFile)) {
        pages.add(`app/(protected)/${domain}/layout.tsx`);
      }

      // Find all nested pages in this directory
      FileSystemScannerService.scanDirectoryRecursively(
        directPath,
        `app/(protected)/${domain}`,
        this.isPageFile,
        pages
      );
    }
  }

  private static async discoverGroupedPages(domain: string, pages: Set<string>): Promise<void> {
    const protectedPath = FileSystemScannerService.getProtectedAppPath();
    
    if (!FileSystemScannerService.directoryExists(protectedPath)) return;

    const groups = FileSystemScannerService.getDirectoryNames(protectedPath);

    for (const group of groups) {
      const groupPath = path.join(protectedPath, group, domain);
      if (FileSystemScannerService.directoryExists(groupPath)) {
        FileSystemScannerService.scanDirectoryRecursively(
          groupPath,
          `app/(protected)/${group}/${domain}`,
          this.isPageFile,
          pages
        );
      }
    }
  }

  private static async discoverKebabCasePages(domain: string, pages: Set<string>): Promise<void> {
    const variations = this.generateDomainVariations(domain);

    for (const variation of variations) {
      if (variation !== domain) {
        await this.discoverDirectPages(variation, pages);
        await this.discoverGroupedPages(variation, pages);
      }
    }
  }

  private static async discoverNestedPages(domain: string, pages: Set<string>): Promise<void> {
    const protectedPath = FileSystemScannerService.getProtectedAppPath();
    await this.searchDomainPagesRecursively(protectedPath, domain, 'app/(protected)', pages);
  }

  private static async discoverDynamicPages(domain: string, pages: Set<string>): Promise<void> {
    const apiPath = FileSystemScannerService.getApiPath(domain);
    
    if (FileSystemScannerService.directoryExists(apiPath)) {
      FileSystemScannerService.scanDirectoryRecursively(
        apiPath,
        `app/api/${domain}`,
        this.isPageFile,
        pages
      );
    }
  }

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
      const entries = FileSystemScannerService.getDirectoryNames(dir);
      
      for (const entryName of entries) {
        const fullPath = path.join(dir, entryName);
        const entryPath = `${currentPath}/${entryName}`;
        
        // Check if directory name relates to domain
        if (this.isDomainRelated(entryName, domain)) {
          FileSystemScannerService.scanDirectoryRecursively(
            fullPath,
            entryPath,
            this.isPageFile,
            pages
          );
        } else {
          // Continue searching deeper
          await this.searchDomainPagesRecursively(fullPath, domain, entryPath, pages, depth + 1);
        }
      }
    } catch {
      // Continue if can't read directory
    }
  }

  private static generateDomainVariations(domain: string): string[] {
    return [
      domain.replace(/([A-Z])/g, '-$1').toLowerCase(), // camelCase -> kebab-case
      domain.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), // kebab-case -> camelCase
      domain.toLowerCase(),
      domain.replace(/-/g, '')
    ];
  }

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
} 