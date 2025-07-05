/**
 * Form State Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage form data and validation
 * - Handle form reset and updates
 * - Keep form logic isolated
 * - Follow domain validation rules
 */

import { useState } from 'react';
import { WebsiteSourceFormData } from '../../actions/websiteSourcesActions';

/**
 * Validate Form Data
 * 
 * AI INSTRUCTIONS:
 * - Validate required fields
 * - Return array of validation errors
 * - Keep validation rules simple and clear
 */
function validateFormData(formData: WebsiteSourceFormData): string[] {
  const errors: string[] = [];
  
  if (!formData.url.trim()) {
    errors.push('URL is required');
  }
  
  if (!formData.name.trim()) {
    errors.push('Name is required');
  }
  
  return errors;
}

/**
 * Create Initial Form Data
 * 
 * AI INSTRUCTIONS:
 * - Provide sensible defaults for form fields
 * - Follow domain business rules for defaults
 * - Return immutable data structure
 */
function createInitialFormData(): WebsiteSourceFormData {
  return {
    url: '',
    name: '',
    description: '',
    maxPages: 50,
    maxDepth: 3,
    respectRobotsTxt: true
  };
}

/**
 * Form State Hook
 * 
 * AI INSTRUCTIONS:
 * - Manage form data and validation
 * - Handle form reset and updates
 * - Keep form logic isolated
 */
export function useFormState() {
  const [formData, setFormData] = useState<WebsiteSourceFormData>(createInitialFormData());
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const updateFormData = (updates: Partial<WebsiteSourceFormData>) => {
    setFormData((prev: WebsiteSourceFormData) => ({ ...prev, ...updates }));
  };

  const resetForm = () => {
    setFormData(createInitialFormData());
    setFormErrors([]);
  };

  const validateForm = (): boolean => {
    const errors = validateFormData(formData);
    setFormErrors(errors);
    return errors.length === 0;
  };

  return {
    formData,
    formErrors,
    updateFormData,
    resetForm,
    validateForm,
    setFormErrors
  };
} 