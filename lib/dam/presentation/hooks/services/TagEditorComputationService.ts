import { PlainTag } from '../../../application/dto/DamApiRequestDto';

/**
 * Service responsible for tag editor computations and business logic
 * Handles display suggestions and validation logic
 */
export class TagEditorComputationService {
  /**
   * Calculates display suggestions based on input and available tags
   */
  getDisplaySuggestions(
    inputValue: string,
    availableActiveTags: PlainTag[],
    currentTags: PlainTag[],
    allOrgTags: PlainTag[]
  ): PlainTag[] {
    const activeTagsToShow = availableActiveTags.filter(orgTag => 
      !currentTags.some(ct => ct.id === orgTag.id)
    );

    if (inputValue.trim() !== '') {
      let filtered = activeTagsToShow.filter(tag =>
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      );

      // Add exact match from all org tags if exists and not already current
      const exactMatchInAllOrgTags = allOrgTags.find(t => 
        t.name.toLowerCase() === inputValue.trim().toLowerCase()
      );
      const exactMatchInCurrentTags = currentTags.find(t => 
        t.name.toLowerCase() === inputValue.trim().toLowerCase()
      );

      if (exactMatchInAllOrgTags && !exactMatchInCurrentTags) {
        const isAlreadySuggested = filtered.some(s => s.id === exactMatchInAllOrgTags.id);
        if (!isAlreadySuggested) {
          filtered = [exactMatchInAllOrgTags, ...filtered];
        }
      }

      return filtered;
    }

    return activeTagsToShow;
  }

  /**
   * Determines if a new tag can be created based on input and existing tags
   */
  getCanCreateNew(
    inputValue: string,
    allOrgTags: PlainTag[],
    currentTags: PlainTag[]
  ): boolean {
    const exactMatchInAllOrgTags = allOrgTags.find(t => 
      t.name.toLowerCase() === inputValue.trim().toLowerCase()
    );
    const exactMatchInCurrentTags = currentTags.find(t => 
      t.name.toLowerCase() === inputValue.trim().toLowerCase()
    );
    
    return inputValue.trim() !== '' && !exactMatchInAllOrgTags && !exactMatchInCurrentTags;
  }

  /**
   * Checks if a tag already exists on the asset
   */
  isTagAlreadyOnAsset(tagName: string, currentTags: PlainTag[]): boolean {
    return currentTags.some(ct => ct.name.toLowerCase() === tagName.toLowerCase());
  }

  /**
   * Finds an existing tag by name in the organization
   */
  findExistingTag(tagName: string, allOrgTags: PlainTag[]): PlainTag | undefined {
    return allOrgTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
  }
} 
