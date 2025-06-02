// ImageDimensions Value Object - DDD Domain Layer
// Single Responsibility: Handle image dimensions and aspect ratio calculations
// Pure value object with immutability and validation

export class ImageDimensions {
  private readonly _width: number;
  private readonly _height: number;
  private readonly _aspectRatio: string;

  private constructor(width: number, height: number, aspectRatio?: string) {
    this.validateDimensions(width, height);
    
    this._width = width;
    this._height = height;
    this._aspectRatio = aspectRatio || ImageDimensions.calculateAspectRatio(width, height);
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get aspectRatio(): string { return this._aspectRatio; }

  static create(width: number, height: number, aspectRatio?: string): ImageDimensions {
    return new ImageDimensions(width, height, aspectRatio);
  }

  static fromAspectRatio(aspectRatio: string, defaultSize: number = 1024): ImageDimensions {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
    if (!widthRatio || !heightRatio) {
      throw new Error(`Invalid aspect ratio format: ${aspectRatio}`);
    }

    const gcd = ImageDimensions.calculateGCD(widthRatio, heightRatio);
    const normalizedWidth = widthRatio / gcd;
    const normalizedHeight = heightRatio / gcd;

    // Scale to target size while maintaining ratio
    const scale = defaultSize / Math.max(normalizedWidth, normalizedHeight);
    const width = Math.round(normalizedWidth * scale);
    const height = Math.round(normalizedHeight * scale);

    return new ImageDimensions(width, height, aspectRatio);
  }

  equals(other: ImageDimensions): boolean {
    return this._width === other._width && 
           this._height === other._height && 
           this._aspectRatio === other._aspectRatio;
  }

  getTotalPixels(): number {
    return this._width * this._height;
  }

  isSquare(): boolean {
    return this._width === this._height;
  }

  isLandscape(): boolean {
    return this._width > this._height;
  }

  isPortrait(): boolean {
    return this._height > this._width;
  }

  private validateDimensions(width: number, height: number): void {
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      throw new Error('Dimensions must be integers');
    }
    if (width <= 0 || height <= 0) {
      throw new Error('Dimensions must be positive');
    }
    if (width > 4096 || height > 4096) {
      throw new Error('Dimensions cannot exceed 4096 pixels');
    }
    if (width < 256 || height < 256) {
      throw new Error('Dimensions cannot be less than 256 pixels');
    }
  }

  private static calculateAspectRatio(width: number, height: number): string {
    const gcd = ImageDimensions.calculateGCD(width, height);
    return `${width / gcd}:${height / gcd}`;
  }

  private static calculateGCD(a: number, b: number): number {
    return b === 0 ? a : ImageDimensions.calculateGCD(b, a % b);
  }
} 