import * as path from 'path';
import { FileSystemScannerService } from '../filesystem/FileSystemScannerService';

export class ComponentDiscoveryService {
  static async discoverDomainComponents(domain: string): Promise<string[]> {
    const componentsPath = path.join(
      FileSystemScannerService.getLibDomainPath(domain), 
      'presentation', 
      'components'
    );
    
    if (!FileSystemScannerService.directoryExists(componentsPath)) {
      return [];
    }

    return this.extractComponentNames(componentsPath);
  }

  static async discoverGlobalComponents(domain: string): Promise<string[]> {
    const componentsPath = FileSystemScannerService.getGlobalComponentsPath(domain);
    
    if (!FileSystemScannerService.directoryExists(componentsPath)) {
      return [];
    }

    return this.extractComponentNames(componentsPath);
  }

  static async discoverAllGlobalComponentDomains(): Promise<string[]> {
    const globalComponentsPath = FileSystemScannerService.getGlobalComponentsPath();
    
    if (!FileSystemScannerService.directoryExists(globalComponentsPath)) {
      return [];
    }

    return FileSystemScannerService.getDirectoryNames(globalComponentsPath);
  }

  private static extractComponentNames(componentsPath: string): string[] {
    const components = new Set<string>();
    const files = FileSystemScannerService.getAllTsxFiles(componentsPath);
    
    for (const filePath of files) {
      const fileName = path.basename(filePath, '.tsx');
      
      // Skip internal/private components and test files
      if (this.isValidComponentName(fileName)) {
        components.add(fileName);
      }
    }
    
    return Array.from(components);
  }

  private static isValidComponentName(fileName: string): boolean {
    return !fileName.startsWith('_') && 
           !fileName.includes('.test') && 
           !fileName.includes('.spec') &&
           !fileName.includes('.stories');
  }
} 