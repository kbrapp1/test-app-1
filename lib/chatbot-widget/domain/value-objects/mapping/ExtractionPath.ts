/**
 * Extraction Path Value Object
 * 
 * AI INSTRUCTIONS:
 * - Domain value object for JSON path extraction
 * - Encapsulates extraction logic for complex nested objects
 * - Contains business rules for fallback paths
 * - No external dependencies
 */

export class ExtractionPath {
  private constructor(private readonly paths: string[][]) {}

  public static single(path: string[]): ExtractionPath {
    return new ExtractionPath([path]);
  }

  public static multiple(paths: string[][]): ExtractionPath {
    return new ExtractionPath(paths);
  }

  public static content(): ExtractionPath {
    return new ExtractionPath([
      ['response', 'content'],
      ['analysis', 'response', 'content'],
      ['choices', '0', 'message', 'function_call', 'arguments', 'response', 'content']
    ]);
  }

  public static confidence(): ExtractionPath {
    return new ExtractionPath([
      ['analysis', 'primaryConfidence'],
      ['choices', '0', 'message', 'function_call', 'arguments', 'analysis', 'primaryConfidence']
    ]);
  }

  public static tokenUsage(): ExtractionPath {
    return new ExtractionPath([
      ['usage']
    ]);
  }

  public extract(obj: Record<string, unknown>): unknown {
    for (const path of this.paths) {
      const result = this.extractSinglePath(obj, path);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  private extractSinglePath(obj: Record<string, unknown>, path: string[]): unknown {
    let current: unknown = obj;
    
    for (const segment of path) {
      // Handle array index access
      if (this.isArrayIndex(segment)) {
        const index = parseInt(segment, 10);
        if (!Array.isArray(current) || index >= current.length) {
          return undefined;
        }
        current = current[index];
      } else {
        if (!this.isObject(current)) {
          return undefined;
        }
        current = current[segment];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isArrayIndex(segment: string): boolean {
    return /^\d+$/.test(segment);
  }
}