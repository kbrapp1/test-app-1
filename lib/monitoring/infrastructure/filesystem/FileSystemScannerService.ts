import * as fs from 'fs';
import * as path from 'path';

export class FileSystemScannerService {
  static getDirectoryNames(dirPath: string): string[] {
    try {
      return fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('_')); // Exclude private dirs
    } catch (error) {
      return [];
    }
  }

  static directoryExists(dirPath: string): boolean {
    return fs.existsSync(dirPath);
  }

  static getAllTsxFiles(dir: string): string[] {
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

  static getAllTsFiles(dir: string): string[] {
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

  static readFileContent(filePath: string): string {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      return '';
    }
  }

  static scanDirectoryRecursively(
    dir: string, 
    relativePath: string, 
    fileFilter: (filename: string) => boolean,
    results: Set<string>
  ): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const entryRelativePath = `${relativePath}/${entry.name}`;
        
        if (entry.isDirectory()) {
          this.scanDirectoryRecursively(fullPath, entryRelativePath, fileFilter, results);
        } else if (fileFilter(entry.name)) {
          results.add(entryRelativePath);
        }
      }
    } catch (error) {
      // Continue if can't read directory
    }
  }

  static getLibDomainPath(domain: string): string {
    return path.join(process.cwd(), 'lib', domain);
  }

  static getProtectedAppPath(): string {
    return path.join(process.cwd(), 'app', '(protected)');
  }

  static getApiPath(domain: string): string {
    return path.join(process.cwd(), 'app', 'api', domain);
  }

  static getGlobalComponentsPath(domain?: string): string {
    const basePath = path.join(process.cwd(), 'components');
    return domain ? path.join(basePath, domain) : basePath;
  }
} 