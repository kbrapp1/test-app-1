import { useCallback } from 'react';

/**
 * usePromptEnhancement Hook
 * Single Responsibility: Handle prompt enhancement with style qualifiers
 * Presentation Layer - Style integration coordination only
 */
export const usePromptEnhancement = () => {
  // Function to strip style qualifiers from prompt
  const stripStyleQualifiers = useCallback((prompt: string) => {
    // Remove style parameters like "vibe=sketch, lighting=neon, shot=close-up, colors=vibrant"
    return prompt.replace(/,\s*(vibe|lighting|shot|colors)=[^,]+/g, '').trim();
  }, []);

  // Prompt enhancement with style values
  const enhancePromptWithStyles = useCallback((basePrompt: string, styleValues: {
    vibe: string;
    lighting: string;
    shotType: string;
    colorTheme: string;
  }) => {
    const styleAdditions: string[] = [];
    
    // Add vibe/style with parameter name
    if (styleValues.vibe && styleValues.vibe !== 'none') {
      styleAdditions.push(`vibe=${styleValues.vibe}`);
    }
    
    // Add lighting with parameter name
    if (styleValues.lighting && styleValues.lighting !== 'none') {
      styleAdditions.push(`lighting=${styleValues.lighting}`);
    }
    
    // Add shot type with parameter name
    if (styleValues.shotType && styleValues.shotType !== 'none') {
      styleAdditions.push(`shot=${styleValues.shotType}`);
    }
    
    // Add color theme with parameter name
    if (styleValues.colorTheme && styleValues.colorTheme !== 'none') {
      styleAdditions.push(`colors=${styleValues.colorTheme}`);
    }
    
    // Combine base prompt with style additions
    if (styleAdditions.length > 0) {
      return `${basePrompt}, ${styleAdditions.join(', ')}`;
    }
    
    return basePrompt;
  }, []);

  return {
    stripStyleQualifiers,
    enhancePromptWithStyles,
  };
}; 