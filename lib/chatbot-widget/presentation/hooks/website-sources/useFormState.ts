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

/** Validate Form Data
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

/** Create Initial Form Data
 */
function createInitialFormData(): WebsiteSourceFormData {
  return {
    url: '',
    name: '',
    description: '',
    maxPages: 5,
    maxDepth: 3,
    respectRobotsTxt: true
  };
}

/** Form State Hook
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