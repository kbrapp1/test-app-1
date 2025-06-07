import * as path from 'path';
import { FileSystemScannerService } from '../filesystem/FileSystemScannerService';

export class QueryKeyDiscoveryService {
  static async discoverDomainQueryKeys(domain: string): Promise<string[]> {
    const hooksPath = path.join(
      FileSystemScannerService.getLibDomainPath(domain), 
      'presentation', 
      'hooks'
    );
    
    if (!FileSystemScannerService.directoryExists(hooksPath)) {
      return [];
    }

    return this.extractQueryKeys(hooksPath, domain);
  }

  static async discoverGlobalQueryKeys(domain: string): Promise<string[]> {
    const componentsPath = FileSystemScannerService.getGlobalComponentsPath(domain);
    
    if (!FileSystemScannerService.directoryExists(componentsPath)) {
      return [];
    }

    return this.extractQueryKeys(componentsPath, domain);
  }

  private static extractQueryKeys(searchPath: string, domain: string): string[] {
    const queryKeys = new Set<string>();
    const hookFiles = FileSystemScannerService.getAllTsFiles(searchPath);
    
    for (const filePath of hookFiles) {
      const content = FileSystemScannerService.readFileContent(filePath);
      this.extractKeysFromContent(content, domain, queryKeys);
    }
    
    return Array.from(queryKeys);
  }

  private static extractKeysFromContent(content: string, domain: string, queryKeys: Set<string>): void {
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
        if (key && this.isRelevantQueryKey(key, domain)) {
          queryKeys.add(key);
        }
      });
    }

    // Extract direct string keys that might be query keys
    const stringMatches = content.match(/['"`]([a-zA-Z-]+(?:-[a-zA-Z]+)*)['"`]/g);
    if (stringMatches) {
      stringMatches.forEach(match => {
        const key = match.match(/['"`]([^'"`]+)['"`]/)?.[1];
        if (key && this.isRelevantQueryKey(key, domain)) {
          queryKeys.add(key);
        }
      });
    }
  }

  private static isRelevantQueryKey(key: string, domain: string): boolean {
    const lowerKey = key.toLowerCase();
    const lowerDomain = domain.toLowerCase();
    
    // Must contain domain name or common query patterns
    return lowerKey.includes(lowerDomain) || 
           lowerKey.includes('search') ||
           lowerKey.includes('list') ||
           lowerKey.includes('fetch') ||
           lowerKey.includes('get') ||
           (domain === 'tts' && (lowerKey.includes('tts') || lowerKey.includes('speech')));
  }
} 