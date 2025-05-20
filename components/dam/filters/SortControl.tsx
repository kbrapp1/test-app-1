"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, ArrowDownAZ, ArrowUpAZ, ArrowDownWideNarrow, ArrowUpWideNarrow, FileText, CalendarClock, Combine, ToyBrick } from 'lucide-react'; // Example icons

type SortByValue = 'name' | 'updated_at' | 'size' | 'mime_type';
type SortOrderValue = 'asc' | 'desc';

interface SortControlProps {
  currentSortBy: SortByValue | null;
  currentSortOrder: SortOrderValue | null;
  onSortChange: (sortBy: SortByValue, sortOrder: SortOrderValue) => void;
}

const sortOptions: Array<{
  label: string;
  sortBy: SortByValue;
  sortOrder: SortOrderValue;
  icon?: React.ElementType; // Optional icon for the menu item
}> = [
  { label: "Name (A-Z)", sortBy: "name", sortOrder: "asc", icon: ArrowDownAZ },
  { label: "Name (Z-A)", sortBy: "name", sortOrder: "desc", icon: ArrowUpAZ },
  { label: "Last Modified (Newest)", sortBy: "updated_at", sortOrder: "desc", icon: CalendarClock },
  { label: "Last Modified (Oldest)", sortBy: "updated_at", sortOrder: "asc", icon: CalendarClock }, // Consider different icon or none
  { label: "Size (Largest first)", sortBy: "size", sortOrder: "desc", icon: ArrowDownWideNarrow },
  { label: "Size (Smallest first)", sortBy: "size", sortOrder: "asc", icon: ArrowUpWideNarrow },
  { label: "Type (A-Z)", sortBy: "mime_type", sortOrder: "asc", icon: FileText }, // Using FileText for type
  { label: "Type (Z-A)", sortBy: "mime_type", sortOrder: "desc", icon: FileText }, // Using FileText for type
];

export function SortControl({ currentSortBy, currentSortOrder, onSortChange }: SortControlProps) {
  const getButtonLabel = () => {
    if (!currentSortBy || !currentSortOrder) {
      return "Sort by...";
    }
    const selectedOption = sortOptions.find(
      (option) => option.sortBy === currentSortBy && option.sortOrder === currentSortOrder
    );
    return selectedOption ? `Sort: ${selectedOption.label}` : "Sort by...";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto justify-between focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary">
          {getButtonLabel()}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={`${option.sortBy}-${option.sortOrder}`}
              onClick={() => onSortChange(option.sortBy, option.sortOrder)}
              className={
                currentSortBy === option.sortBy && currentSortOrder === option.sortOrder
                  ? "bg-accent" // Highlight active sort
                  : ""
              }
            >
              {option.icon && <option.icon className="mr-2 h-4 w-4" />}
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 