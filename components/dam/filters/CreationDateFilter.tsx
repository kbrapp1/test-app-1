'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input'; // For displaying dates
import { CalendarDaysIcon, ChevronLeftIcon, XIcon } from 'lucide-react';
import { format, isValid, parseISO, set } from 'date-fns';

interface CreationDateFilterProps {
  selectedOption: string | undefined;
  onOptionChange: (option: string | undefined, startDate?: string, endDate?: string) => void;
  selectedStartDate?: string | undefined;
  selectedEndDate?: string | undefined;
}

export const DATE_OPTIONS = [
  { value: '', label: 'Anytime' },
  { value: 'today', label: 'Today' },
  { value: 'last7days', label: 'Last 7 days' },
  { value: 'last30days', label: 'Last 30 days' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
];

const CUSTOM_RANGE_VALUE = 'custom';

export function CreationDateFilter({
  selectedOption,
  onOptionChange,
  selectedStartDate,
  selectedEndDate,
}: CreationDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'list' | 'custom'>('list');
  
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    selectedStartDate ? parseISO(selectedStartDate) : undefined
  );
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(
    selectedEndDate ? parseISO(selectedEndDate) : undefined
  );

  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const isTransitioningToCustom = useRef(false);

  useEffect(() => {
    if (selectedOption === CUSTOM_RANGE_VALUE) {
      setPickerMode('custom');
      setTempStartDate(selectedStartDate ? parseISO(selectedStartDate) : undefined);
      setTempEndDate(selectedEndDate ? parseISO(selectedEndDate) : undefined);
    } else {
      if (!isTransitioningToCustom.current) {
          setPickerMode('list');
      }
    }
    if (isTransitioningToCustom.current && selectedOption === CUSTOM_RANGE_VALUE) {
        isTransitioningToCustom.current = false;
    }

  }, [selectedOption, selectedStartDate, selectedEndDate]);

  const handlePredefinedOptionSelect = (value: string) => {
    onOptionChange(value === '' ? undefined : value);
    setPickerMode('list');
    setIsOpen(false);
  };

  const handleCustomRangeMenuItemSelect = () => {
    isTransitioningToCustom.current = true;
    setPickerMode('custom');
    setTempStartDate(selectedStartDate ? parseISO(selectedStartDate) : undefined);
    setTempEndDate(selectedEndDate ? parseISO(selectedEndDate) : undefined);
    if (selectedOption !== CUSTOM_RANGE_VALUE) {
        onOptionChange(CUSTOM_RANGE_VALUE);
    }
  };

  const handleApplyCustomDate = () => {
    const start = tempStartDate ? format(tempStartDate, 'yyyy-MM-dd') : undefined;
    const end = tempEndDate ? format(tempEndDate, 'yyyy-MM-dd') : undefined;
    onOptionChange(CUSTOM_RANGE_VALUE, start, end);
    setPickerMode('custom');
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onOptionChange(undefined);
    setPickerMode('list');
    setIsOpen(false);
  };

  const handleBackToList = () => {
    setPickerMode('list');
    if (selectedOption === CUSTOM_RANGE_VALUE) {
      if (selectedStartDate || selectedEndDate || tempStartDate || tempEndDate) {
         onOptionChange(undefined); 
      }
      else if (selectedOption === CUSTOM_RANGE_VALUE) {
        onOptionChange(undefined);
      }
    }
  };
  
  let buttonLabel = 'Anytime';
  if (selectedOption === CUSTOM_RANGE_VALUE) {
    if (selectedStartDate && selectedEndDate && isValid(parseISO(selectedStartDate)) && isValid(parseISO(selectedEndDate))) {
      buttonLabel = `${format(parseISO(selectedStartDate), 'MMM d, yy')} - ${format(parseISO(selectedEndDate), 'MMM d, yy')}`;
    } else if (selectedStartDate && isValid(parseISO(selectedStartDate))) {
      buttonLabel = `After ${format(parseISO(selectedStartDate), 'MMM d, yy')}`;
    } else if (selectedEndDate && isValid(parseISO(selectedEndDate))) {
      buttonLabel = `Before ${format(parseISO(selectedEndDate), 'MMM d, yy')}`;
    } else {
      buttonLabel = 'Custom Range';
    }
  } else {
    buttonLabel = DATE_OPTIONS.find(opt => opt.value === (selectedOption || ''))?.label || 'Anytime';
  }

  const displayFormat = 'MMM d, yyyy';

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setTempStartDate(date);
    }
  }, [setTempStartDate]);

  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setTempEndDate(date);
    }
  }, [setTempEndDate]);

  return (
    <div className="flex items-center group">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className={`flex items-center justify-start gap-2 px-3 h-10 ${selectedOption && selectedOption !== '' ? 'rounded-r-none border-r-0' : ''} group-focus-within:border-primary focus-visible:ring-0 focus-visible:ring-offset-0`}
          >
            <CalendarDaysIcon size={16} />
            Date: {buttonLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-0" align="start" onInteractOutside={(e) => {
            if (isStartDatePopoverOpen || isEndDatePopoverOpen) {
                e.preventDefault();
            }
        }}>
          {pickerMode === 'list' ? (
            <DropdownMenuRadioGroup 
              value={selectedOption || ''} 
              onValueChange={handlePredefinedOptionSelect}
              className="p-1"
            >
              {DATE_OPTIONS.map(option => (
                <DropdownMenuRadioItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  handleCustomRangeMenuItemSelect();
                }}
                className="text-sm justify-between cursor-pointer"
              >
                Custom date range
                <ChevronLeftIcon className="h-4 w-4 rotate-180 text-muted-foreground" />
              </DropdownMenuItem>
            </DropdownMenuRadioGroup>
          ) : (
            <div className="p-2">
              <Button variant="ghost" size="sm" onClick={handleBackToList} className="mb-2 w-full justify-start text-sm h-8">
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                Back
              </Button>
              <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">Start date</DropdownMenuLabel>
              <Popover open={isStartDatePopoverOpen} onOpenChange={setIsStartDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-9 mb-2">
                    {tempStartDate ? format(tempStartDate, displayFormat) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempStartDate}
                    onSelect={handleStartDateSelect}
                    disabled={(date) => tempEndDate ? date > tempEndDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <DropdownMenuLabel className="px-1 text-xs font-normal text-muted-foreground">End date</DropdownMenuLabel>
              <Popover open={isEndDatePopoverOpen} onOpenChange={setIsEndDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-9 mb-2">
                    {tempEndDate ? format(tempEndDate, displayFormat) : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tempEndDate}
                    onSelect={handleEndDateSelect}
                    disabled={(date) => tempStartDate ? date < tempStartDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <DropdownMenuSeparator className="my-2" />
              <div className="flex justify-end gap-2 px-1">
                <Button variant="ghost" size="sm" onClick={handleClearFilter} className="text-sm h-8">Clear</Button>
                <Button size="sm" onClick={handleApplyCustomDate} className="text-sm h-8">Apply</Button>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {(selectedOption && selectedOption !== '') && (
        <Button
          variant="outline"
          className="h-10 w-10 p-0 rounded-l-none -ml-px flex items-center justify-center hover:bg-muted-foreground/10 group-focus-within:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={handleClearFilter}
          aria-label="Clear date filter"
        >
          <XIcon size={16} className="text-muted-foreground group-focus-within:text-primary" />
        </Button>
      )}
    </div>
  );
} 