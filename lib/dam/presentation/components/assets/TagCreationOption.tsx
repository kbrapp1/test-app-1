import React from 'react';
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagCreationOptionProps {
  canCreateNew: boolean;
  inputValue: string;
  hasExistingSuggestions: boolean;
  onCreateOrAddTag: (tagName: string) => Promise<void>;
}

/**
 * TagCreationOption - Domain-Focused Tag Creation Component
 * 
 * Responsible for rendering the "create new tag" option.
 * Separated from business logic for better maintainability.
 */
export const TagCreationOption: React.FC<TagCreationOptionProps> = ({
  canCreateNew,
  inputValue,
  hasExistingSuggestions,
  onCreateOrAddTag,
}) => {
  if (!canCreateNew) {
    return null;
  }

  return (
    <div className="p-2">
      {hasExistingSuggestions && (
        <div className="border-t border-gray-100 my-2" />
      )}
      <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
        Create New
      </div>
      <button
        onClick={() => onCreateOrAddTag(inputValue.trim())}
        className={cn(
          "w-full cursor-pointer rounded-md px-3 py-2.5 transition-all duration-150 text-left",
          "hover:bg-green-50 hover:text-green-900 focus:bg-green-100 focus:text-green-900 focus:outline-none",
          "group relative border border-dashed border-green-200 hover:border-green-300"
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <PlusCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium">Create &ldquo;{inputValue.trim()}&rdquo;</span>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs border-green-200 text-green-700 group-hover:border-green-300 group-hover:bg-green-50"
          >
            New
          </Badge>
        </div>
      </button>
    </div>
  );
}; 
