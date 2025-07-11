/**
 * AI INSTRUCTIONS:
 * - Hook for knowledge base form state coordination
 * - Delegate to application services via server actions
 * - Handle React state and cache invalidation
 * - @golden-rule: presentation layer only, no business logic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatbotConfig, updateKnowledgeBase } from '../actions/configActions';
import { UpdateChatbotConfigDto, FaqDto, ChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';
import { 
  KnowledgeBaseFormDto, 
  FaqFormDto,
  KnowledgeBaseUpdateRequestDto,
  FaqOperationDto 
} from '../../application/dto/KnowledgeBaseFormDto';

export interface KnowledgeBaseFormData {
  companyInfo: string;
  productCatalog: string;
  supportDocs: string;
  complianceGuidelines: string;
  faqs: FaqDto[];
}

// Map legacy FAQ DTO to form DTO
function mapFaqToFormDto(faq: FaqDto): FaqFormDto {
  return {
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category || 'general',
    keywords: faq.keywords || [],
    priority: faq.priority || 1,
    isActive: true
  };
}

// Map form data to knowledge base DTO
function mapFormDataToDto(formData: KnowledgeBaseFormData): KnowledgeBaseFormDto {
  return {
    companyInfo: formData.companyInfo,
    productCatalog: formData.productCatalog,
    supportDocs: formData.supportDocs,
    complianceGuidelines: formData.complianceGuidelines,
    faqs: formData.faqs.map(mapFaqToFormDto)
  };
}

export function useKnowledgeBaseSettings(
  existingConfig: ChatbotConfigDto | null,
  organizationId: string | null
) {
  // AI: Security validation - organizationId must be provided
  if (!organizationId) {
    throw new Error('Organization ID is required for knowledge base settings management');
  }

  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<KnowledgeBaseFormData>({
    companyInfo: '',
    productCatalog: '',
    supportDocs: '',
    complianceGuidelines: '',
    faqs: [],
  });

  // Ref for accessing latest formData in callbacks
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Update form state when existingConfig changes
  useEffect(() => {
    if (existingConfig?.knowledgeBase) {
      setFormData({
        companyInfo: existingConfig.knowledgeBase.companyInfo || '',
        productCatalog: existingConfig.knowledgeBase.productCatalog || '',
        supportDocs: existingConfig.knowledgeBase.supportDocs || '',
        complianceGuidelines: existingConfig.knowledgeBase.complianceGuidelines || '',
        faqs: existingConfig.knowledgeBase.faqs || [],
      });
    }
  }, [existingConfig]);

  const handleSave = useCallback(async () => {
    if (!organizationId || !existingConfig) return;

    // Get the current form data from ref to avoid stale closure
    const currentFormData = formDataRef.current;

    // Prepare update request
    const updateRequest: KnowledgeBaseUpdateRequestDto = {
      configId: existingConfig.id,
      organizationId,
      formData: mapFormDataToDto(currentFormData),
      generateVectors: true,
      preserveExisting: false
    };

    // Update knowledge base using server action
    const result = await updateKnowledgeBase(updateRequest);
    
    if (!result.success) {
      throw new Error(result.error || 'Knowledge base update failed');
    }

    // Invalidate React Query cache to refresh data
    queryClient.invalidateQueries({ queryKey: ['chatbot-config', organizationId] });
    
    return { success: true, data: result.data };
  }, [organizationId, existingConfig, queryClient]);

  const updateMutation = useMutation({
    mutationFn: handleSave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', organizationId] });
    },
  });

  const resetForm = () => {
    if (existingConfig?.knowledgeBase) {
      setFormData({
        companyInfo: existingConfig.knowledgeBase.companyInfo || '',
        productCatalog: existingConfig.knowledgeBase.productCatalog || '',
        supportDocs: existingConfig.knowledgeBase.supportDocs || '',
        complianceGuidelines: existingConfig.knowledgeBase.complianceGuidelines || '',
        faqs: existingConfig.knowledgeBase.faqs || [],
      });
    }
  };

  const updateFormData = (updates: Partial<KnowledgeBaseFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const addFaq = useCallback((faq: Omit<FaqDto, 'id'>) => {
    const newFaq: FaqDto = {
      id: `faq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...faq,
      keywords: faq.keywords || [],
      priority: faq.priority || 1,
    };

    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq],
    }));
  }, []);

  const removeFaq = (faqId: string) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter(faq => faq.id !== faqId),
    }));
  };

  const updateFaq = (faqId: string, updates: Partial<FaqDto>) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.map(faq => 
        faq.id === faqId ? { ...faq, ...updates } : faq
      ),
    }));
  };

  const validateForm = async () => {
    const hasContent = !!(
      formData.companyInfo?.trim() ||
      formData.productCatalog?.trim() ||
      formData.supportDocs?.trim() ||
      formData.complianceGuidelines?.trim() ||
      formData.faqs.some(faq => faq.question?.trim() && faq.answer?.trim())
    );

    if (!hasContent) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          message: 'At least one knowledge base section must have content',
          code: 'NO_CONTENT',
          severity: 'high' as const
        }],
        warnings: [],
        suggestions: []
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };
  };

  return {
    formData,
    updateMutation,
    handleSave,
    resetForm,
    updateFormData,
    addFaq,
    removeFaq,
    updateFaq,
    validateForm,
  };
} 