/**
 * Aspect Ratio Utility Functions
 * Single Responsibility: Calculate CSS classes for aspect ratio containers
 * Location: Presentation layer utility (follows DDD guidelines)
 */

/**
 * Maps aspect ratio strings to Tailwind CSS aspect ratio classes
 * @param ratio - Aspect ratio string (e.g., "1:1", "16:9", "21:9")
 * @returns Tailwind CSS class for the aspect ratio
 */
export const getAspectRatioClasses = (ratio: string): string => {
  switch (ratio) {
    case '1:1': return 'aspect-square'; // True square
    case '3:4': return 'aspect-[3/4]'; // Portrait aspect ratio
    case '4:3': return 'aspect-[4/3]'; // Standard aspect ratio
    case '16:9': return 'aspect-video'; // Widescreen aspect ratio
    case '9:16': return 'aspect-[9/16]'; // Mobile aspect ratio
    default: {
      // Handle custom ratios like "21:9", "7:3", etc.
      if (ratio.includes(':')) {
        const [width, height] = ratio.split(':').map(Number);
        if (width && height) {
          return `aspect-[${width}/${height}]`;
        }
      }
      return 'aspect-[4/3]'; // Default fallback
    }
  }
}; 