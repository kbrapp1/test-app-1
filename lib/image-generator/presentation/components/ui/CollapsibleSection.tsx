import React from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  onClear?: () => void;
  clearText?: string;
  onRandomize?: () => void;
  randomizeText?: string;
}

/**
 * CollapsibleSection Component
 * Single Responsibility: Reusable collapsible section with card-style design and smooth animations
 * Presentation Layer - Pure UI component with no business logic
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  onClear,
  clearText = "Clear all",
  onRandomize,
  randomizeText = "Randomize all"
}) => (
  <div className="space-y-3">
    <div className={`w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 border border-border/60 transition-all duration-200 ${
      isOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
    }`}>
      {/* Main toggle area */}
      <button
        onClick={onToggle}
        className="flex-1 flex items-center p-3"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
      </button>
      
      {/* Action buttons area - separate from toggle */}
      {isOpen && (onClear || onRandomize) && (
        <div className="flex items-center gap-3 px-3">
          {onRandomize && (
            <button
              onClick={onRandomize}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {randomizeText}
            </button>
          )}
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {clearText}
            </button>
          )}
        </div>
      )}
      
      {/* Chevron on far right */}
      <button
        onClick={onToggle}
        className="p-3"
      >
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </div>
      </button>
    </div>
    
    <div 
      className={`overflow-hidden transition-all duration-300 ease-in-out -mt-3 ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}
    >
      <div className="border border-border/60 border-t-0 rounded-b-lg p-3">
        {children}
      </div>
    </div>
  </div>
); 