export class FilePathResolutionService {
  static guessFilePath(name: string, type: 'component' | 'hook'): string | null {
    if (!name) return null;
    
    // Clean the name
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '');
    
    if (type === 'component') {
      return this.guessComponentPath(cleanName, name);
    } else {
      return this.guessHookPath(cleanName, name);
    }
  }

  private static guessComponentPath(cleanName: string, originalName: string): string | null {
    // Common component patterns
    if (originalName.includes('Provider')) {
      return `lib/*/providers/${cleanName}.tsx`;
    }
    if (originalName.includes('Dialog') || originalName.includes('Modal')) {
      return `components/ui/${cleanName}.tsx`;
    }
    if (originalName.includes('Dam') || originalName.includes('Asset')) {
      return `lib/dam/presentation/components/**/${cleanName}.tsx`;
    }
    if (originalName.includes('Image') || originalName.includes('Generation')) {
      return `lib/image-generator/presentation/components/**/${cleanName}.tsx`;
    }
    return `components/**/${cleanName}.tsx`;
  }

  private static guessHookPath(cleanName: string, originalName: string): string | null {
    // Hook patterns
    if (originalName.startsWith('use')) {
      if (originalName.includes('Dam') || originalName.includes('Asset')) {
        return `lib/dam/presentation/hooks/**/${cleanName}.ts`;
      }
      if (originalName.includes('Image') || originalName.includes('Generation')) {
        return `lib/image-generator/presentation/hooks/**/${cleanName}.ts`;
      }
      return `hooks/**/${cleanName}.ts`;
    }
    
    return null;
  }

  static extractRelevantStackTrace(stack: string): string[] {
    return stack.split('\n')
      .filter(line => line.trim().length > 0)
      .filter(line => !line.includes('node_modules'))
      .filter(line => !line.includes('webpack'))
      .slice(0, 5)
      .map(line => line.trim());
  }
} 