/**
 * SearchInputHandler Service
 * Follows Single Responsibility Principle - handles search input validation and processing
 */
export class SearchInputHandler {
  /**
   * Process and validate search term
   */
  static processSearchTerm(term: string): string {
    return term.trim();
  }

  /**
   * Check if search term is valid
   */
  static isValidSearchTerm(term: string): boolean {
    return term.trim().length > 0;
  }

  /**
   * Clear search input element focus
   */
  static clearInputFocus(containerRef: React.RefObject<HTMLDivElement | null>): void {
    const inputElement = containerRef.current?.querySelector('input[type="search"]');
    if (inputElement) {
      (inputElement as HTMLInputElement).blur();
    }
  }

  /**
   * Check if search should trigger dropdown
   */
  static shouldShowDropdown(
    searchTerm: string, 
    hasResults: boolean, 
    isLoading: boolean,
    inputFocused: boolean
  ): boolean {
    return inputFocused && searchTerm.trim() !== '' && (hasResults || isLoading);
  }
} 
