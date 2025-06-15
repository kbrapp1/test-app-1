/**
 * Knowledge Base Settings Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge base form state and operations
 * - Encapsulate form logic and mutation handling
 * - Provide clean interface for knowledge base management
 * - Handle optimistic updates and error states
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatbotConfig } from '../actions/configActions';
import { UpdateChatbotConfigDto, FaqDto, ChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';

export interface KnowledgeBaseFormData {
  companyInfo: string;
  productCatalog: string;
  supportDocs: string;
  complianceGuidelines: string;
  faqs: FaqDto[];
}

export function useKnowledgeBaseSettings(
  existingConfig: ChatbotConfigDto | null,
  organizationId: string | null
) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<KnowledgeBaseFormData>({
    companyInfo: '',
    productCatalog: '',
    supportDocs: '',
    complianceGuidelines: '',
    faqs: [],
  });

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, organizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', organizationId] });
    },
  });

  const handleSave = async () => {
    if (!organizationId || !existingConfig) return;

    return updateMutation.mutateAsync({
      id: existingConfig.id,
      data: {
        knowledgeBase: {
          companyInfo: formData.companyInfo,
          productCatalog: formData.productCatalog,
          supportDocs: formData.supportDocs,
          complianceGuidelines: formData.complianceGuidelines,
          faqs: formData.faqs,
        },
      },
    });
  };

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

  const addFaq = (faq: Omit<FaqDto, 'id'>) => {
    const newFaq: FaqDto = {
      id: `faq_${Date.now()}`,
      ...faq,
      keywords: faq.keywords || [],
      priority: faq.priority || 1,
    };

    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq],
    }));
  };

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

  return {
    formData,
    updateMutation,
    handleSave,
    resetForm,
    updateFormData,
    addFaq,
    removeFaq,
    updateFaq,
  };
} 