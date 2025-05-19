'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ArchiveIcon, XIcon } from 'lucide-react';
import { SizeFilterListView } from './SizeFilterListView';
import { SizeFilterCustomView } from './SizeFilterCustomView';

interface SizeFilterProps {
  selectedOption: string | undefined;
  onOptionChange: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  selectedMinSize?: string | undefined; // Stored as string from URL, will be in bytes
  selectedMaxSize?: string | undefined; // Stored as string from URL, will be in bytes
}

export const SIZE_OPTIONS = [
  { value: '', label: 'Any Size' },
  { value: 'small', label: '< 1MB' },
  { value: 'medium', label: '1MB - 10MB' },
  { value: 'large', label: '10MB - 100MB' },
  { value: 'xlarge', label: '> 100MB' },
];

const CUSTOM_SIZE_VALUE = 'custom';
const MB_IN_BYTES = 1024 * 1024;

const formatMbForLabel = (bytesStr: string | undefined): string | null => {
  if (bytesStr === undefined || bytesStr === null) return null;
  const bytes = parseInt(bytesStr, 10);
  if (isNaN(bytes)) return null;

  const megabytes = bytes / MB_IN_BYTES;
  if (Number.isInteger(megabytes)) {
    return megabytes.toString();
  }
  // Format to max 2 decimal places, remove trailing .00 or .x0
  const formatted = megabytes.toFixed(2);
  if (formatted.endsWith('.00')) {
    return formatted.substring(0, formatted.length - 3);
  }
  if (formatted.endsWith('0')) {
    return formatted.substring(0, formatted.length - 1);
  }
  return formatted;
};

export function SizeFilter({ 
  selectedOption, 
  onOptionChange, 
  selectedMinSize, 
  selectedMaxSize 
}: SizeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'list' | 'custom'>('list');
  
  // Temp state for custom inputs in MB
  const [tempMinSizeMB, setTempMinSizeMB] = useState<string>('');
  const [tempMaxSizeMB, setTempMaxSizeMB] = useState<string>('');

  const isTransitioningToCustom = useRef(false);

  useEffect(() => {
    if (selectedOption === CUSTOM_SIZE_VALUE) {
      setInputMode('custom');
      setTempMinSizeMB(selectedMinSize ? (parseInt(selectedMinSize, 10) / MB_IN_BYTES).toString() : '');
      setTempMaxSizeMB(selectedMaxSize ? (parseInt(selectedMaxSize, 10) / MB_IN_BYTES).toString() : '');
    } else {
      if (!isTransitioningToCustom.current) {
        setInputMode('list');
      }
    }
    if (isTransitioningToCustom.current && selectedOption === CUSTOM_SIZE_VALUE) {
        isTransitioningToCustom.current = false;
    }
  }, [selectedOption, selectedMinSize, selectedMaxSize]);

  let buttonLabel = 'Any Size';
  if (selectedOption === CUSTOM_SIZE_VALUE) {
    const minMBLabel = formatMbForLabel(selectedMinSize);
    const maxMBLabel = formatMbForLabel(selectedMaxSize);

    if (minMBLabel !== null && maxMBLabel !== null) {
      buttonLabel = `${minMBLabel}MB - ${maxMBLabel}MB`;
    } else if (minMBLabel !== null) {
      buttonLabel = `> ${minMBLabel}MB`;
    } else if (maxMBLabel !== null) {
      buttonLabel = `< ${maxMBLabel}MB`;
    } else {
      buttonLabel = 'Custom Size';
    }
  } else {
    buttonLabel = SIZE_OPTIONS.find(opt => opt.value === (selectedOption || ''))?.label || 'Any Size';
  }

  const handlePredefinedOptionSelect = (value: string) => {
    onOptionChange(value === '' ? undefined : value);
    setInputMode('list');
    setIsOpen(false);
  };

  const handleNavigateToCustom = () => {
    isTransitioningToCustom.current = true;
    setInputMode('custom');
    setTempMinSizeMB(selectedMinSize ? (parseInt(selectedMinSize, 10) / MB_IN_BYTES).toString() : '');
    setTempMaxSizeMB(selectedMaxSize ? (parseInt(selectedMaxSize, 10) / MB_IN_BYTES).toString() : '');
    if (selectedOption !== CUSTOM_SIZE_VALUE) {
        onOptionChange(CUSTOM_SIZE_VALUE); 
    }
  };
  
  const handleApplyCustomSize = () => {
    const minBytes = tempMinSizeMB !== '' ? parseFloat(tempMinSizeMB) * MB_IN_BYTES : undefined;
    const maxBytes = tempMaxSizeMB !== '' ? parseFloat(tempMaxSizeMB) * MB_IN_BYTES : undefined;
    onOptionChange(CUSTOM_SIZE_VALUE, minBytes, maxBytes);
    setIsOpen(false);
  };

  const handleClearCustom = () => {
    setTempMinSizeMB('');
    setTempMaxSizeMB('');
    onOptionChange(undefined);
    setInputMode('list');
    setIsOpen(false);
  };

  const handleBackToList = () => {
    setInputMode('list');
    if (selectedOption === CUSTOM_SIZE_VALUE && !selectedMinSize && !selectedMaxSize && !tempMinSizeMB && !tempMaxSizeMB) {
        onOptionChange(undefined); 
    }
  };

  const isFilterActive = selectedOption && selectedOption !== '';

  return (
    <div className="flex items-center">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center justify-start gap-2 px-3 h-10 ${isFilterActive ? 'rounded-r-none border-r-0' : ''}`}
          >
              <ArchiveIcon size={16} />
              Size: {buttonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 p-0" align="start">
          {inputMode === 'list' ? (
            <SizeFilterListView 
              selectedOption={selectedOption}
              sizeOptions={SIZE_OPTIONS}
              onPredefinedOptionSelect={handlePredefinedOptionSelect}
              onNavigateToCustom={handleNavigateToCustom}
            />
          ) : (
            <SizeFilterCustomView 
              tempMinSizeMB={tempMinSizeMB}
              tempMaxSizeMB={tempMaxSizeMB}
              onTempMinChange={setTempMinSizeMB}
              onTempMaxChange={setTempMaxSizeMB}
              onApplyCustomSize={handleApplyCustomSize}
              onClearCustom={handleClearCustom}
              onBackToList={handleBackToList}
            />
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isFilterActive && (
        <Button
          variant="outline"
          className="h-10 w-10 p-0 rounded-l-none -ml-px flex items-center justify-center hover:bg-muted-foreground/10"
          onClick={(e) => {
            e.stopPropagation();
            handleClearCustom();
          }}
          aria-label="Clear size filter"
        >
          <XIcon size={16} className="text-muted-foreground" />
        </Button>
      )}
    </div>
  );
} 