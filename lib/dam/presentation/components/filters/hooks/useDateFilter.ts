import { useState, useEffect, useRef } from 'react';
import { DateFilterService } from '../services/DateFilterService';

interface UseDateFilterProps {
  selectedOption: string | undefined;
  selectedStartDate?: string | undefined;
  selectedEndDate?: string | undefined;
  onOptionChange: (option: string | undefined, startDate?: string, endDate?: string) => void;
}

interface UseDateFilterReturn {
  isOpen: boolean;
  pickerMode: 'list' | 'custom';
  tempStartDate: Date | undefined;
  tempEndDate: Date | undefined;
  isStartDatePopoverOpen: boolean;
  isEndDatePopoverOpen: boolean;
  buttonLabel: string;
  setIsOpen: (open: boolean) => void;
  setPickerMode: (mode: 'list' | 'custom') => void;
  setTempStartDate: (date: Date | undefined) => void;
  setTempEndDate: (date: Date | undefined) => void;
  setIsStartDatePopoverOpen: (open: boolean) => void;
  setIsEndDatePopoverOpen: (open: boolean) => void;
  handlePredefinedOptionSelect: (value: string) => void;
  handleCustomRangeMenuItemSelect: () => void;
  handleApplyCustomDate: () => void;
  handleClearFilter: () => void;
  handleBackToList: () => void;
}

/**
 * useDateFilter Hook
 * Follows Single Responsibility Principle - manages date filter state and business logic
 */
export const useDateFilter = ({
  selectedOption,
  selectedStartDate,
  selectedEndDate,
  onOptionChange,
}: UseDateFilterProps): UseDateFilterReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'list' | 'custom'>('list');
  
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    selectedStartDate ? DateFilterService.parseDate(selectedStartDate) : undefined
  );
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(
    selectedEndDate ? DateFilterService.parseDate(selectedEndDate) : undefined
  );

  const [isStartDatePopoverOpen, setIsStartDatePopoverOpen] = useState(false);
  const [isEndDatePopoverOpen, setIsEndDatePopoverOpen] = useState(false);
  const isTransitioningToCustom = useRef(false);

  // Update picker mode and temp dates when props change
  useEffect(() => {
    if (selectedOption === DateFilterService.CUSTOM_RANGE_VALUE) {
      setPickerMode('custom');
      setTempStartDate(selectedStartDate ? DateFilterService.parseDate(selectedStartDate) : undefined);
      setTempEndDate(selectedEndDate ? DateFilterService.parseDate(selectedEndDate) : undefined);
    } else {
      if (!isTransitioningToCustom.current) {
        setPickerMode('list');
      }
    }
    
    if (isTransitioningToCustom.current && selectedOption === DateFilterService.CUSTOM_RANGE_VALUE) {
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
    setTempStartDate(selectedStartDate ? DateFilterService.parseDate(selectedStartDate) : undefined);
    setTempEndDate(selectedEndDate ? DateFilterService.parseDate(selectedEndDate) : undefined);
    
    if (selectedOption !== DateFilterService.CUSTOM_RANGE_VALUE) {
      onOptionChange(DateFilterService.CUSTOM_RANGE_VALUE);
    }
  };

  const handleApplyCustomDate = () => {
    const start = tempStartDate ? DateFilterService.formatDateForApi(tempStartDate) : undefined;
    const end = tempEndDate ? DateFilterService.formatDateForApi(tempEndDate) : undefined;
    
    onOptionChange(DateFilterService.CUSTOM_RANGE_VALUE, start, end);
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
    
    if (selectedOption === DateFilterService.CUSTOM_RANGE_VALUE) {
      if (selectedStartDate || selectedEndDate || tempStartDate || tempEndDate) {
        onOptionChange(undefined); 
      } else if (selectedOption === DateFilterService.CUSTOM_RANGE_VALUE) {
        onOptionChange(undefined);
      }
    }
  };

  const buttonLabel = DateFilterService.generateButtonLabel(
    selectedOption,
    selectedStartDate,
    selectedEndDate
  );

  return {
    isOpen,
    pickerMode,
    tempStartDate,
    tempEndDate,
    isStartDatePopoverOpen,
    isEndDatePopoverOpen,
    buttonLabel,
    setIsOpen,
    setPickerMode,
    setTempStartDate,
    setTempEndDate,
    setIsStartDatePopoverOpen,
    setIsEndDatePopoverOpen,
    handlePredefinedOptionSelect,
    handleCustomRangeMenuItemSelect,
    handleApplyCustomDate,
    handleClearFilter,
    handleBackToList,
  };
}; 
