import React from 'react';
import { PlainTag } from '../../../application/dto/DamApiRequestDto';
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSuggestionListProps {
  displaySuggestions: PlainTag[];
  allOrgTags: PlainTag[];
  availableActiveTags: PlainTag[];
  currentTags: PlainTag[];
  onSelectSuggestion: (tag: PlainTag) => Promise<void>;
}

/**
 * TagSuggestionList - Domain-Focused Tag Display Component
 * 
 * Responsible for rendering existing tag suggestions.
 * Separated from business logic for better maintainability.
 */
export const TagSuggestionList: React.FC<TagSuggestionListProps> = ({
  displaySuggestions,
  allOrgTags,
  availableActiveTags,
  currentTags,
  onSelectSuggestion,
}) => {
  if (displaySuggestions.length === 0) {
    return null;
  }

  return (
    <div className="p-2">
      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
        Existing Tags
      </div>
      <div className="space-y-1">
        {displaySuggestions.map((tag) => {
          const isReused = allOrgTags.find(t => t.id === tag.id) && 
                          !availableActiveTags.find(at => at.id === tag.id) && 
                          !currentTags.find(ct => ct.id === tag.id);
          
          return (
            <button
              key={tag.id}
              onClick={() => onSelectSuggestion(tag)}
              className={cn(
                "w-full cursor-pointer rounded-md px-3 py-2.5 transition-all duration-150",
                "bg-white text-gray-700 text-left",
                "hover:bg-blue-100 hover:text-blue-900",
                "focus:bg-blue-100 focus:text-blue-900 focus:outline-none",
                "group relative"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "text-xs px-2 py-1 transition-colors duration-150",
                      "bg-white text-gray-700 border-gray-300",
                      "group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500",
                      "group-focus:bg-blue-600 group-focus:text-white group-focus:border-blue-500"
                    )}
                  >
                    {tag.name}
                  </Badge>
                  {isReused && (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Previously used
                    </span>
                  )}
                </div>
                <Plus className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-150" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 
