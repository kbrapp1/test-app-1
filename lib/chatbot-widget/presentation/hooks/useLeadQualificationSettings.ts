/**
 * Lead Qualification Settings Hook
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead qualification form state and operations
 * - Encapsulate form logic and mutation handling
 * - Provide clean interface for question management
 * - Handle optimistic updates and error states
 * - Follow @golden-rule patterns exactly
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateChatbotConfig } from '../actions/configActions';
import { UpdateChatbotConfigDto, LeadQualificationQuestionDto, ChatbotConfigDto } from '../../application/dto/ChatbotConfigDto';

interface LeadQualificationFormData {
  leadQualificationQuestions: LeadQualificationQuestionDto[];
}

export function useLeadQualificationSettings(
  existingConfig: ChatbotConfigDto | null,
  organizationId: string | null
) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<LeadQualificationFormData>({
    leadQualificationQuestions: [],
  });

  // Initialize form data when config loads
  useEffect(() => {
    if (existingConfig) {
      setFormData({
        leadQualificationQuestions: existingConfig.leadQualificationQuestions || [],
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
        leadQualificationQuestions: formData.leadQualificationQuestions,
      },
    });
  };

  const resetForm = () => {
    if (existingConfig) {
      setFormData({
        leadQualificationQuestions: existingConfig.leadQualificationQuestions || [],
      });
    }
  };

  const addQuestion = (question: Omit<LeadQualificationQuestionDto, 'id' | 'order'>) => {
    const newQuestion: LeadQualificationQuestionDto = {
      ...question,
      id: `question_${Date.now()}`,
      order: formData.leadQualificationQuestions.length + 1,
    };

    setFormData({
      ...formData,
      leadQualificationQuestions: [...formData.leadQualificationQuestions, newQuestion],
    });
  };

  const removeQuestion = (questionId: string) => {
    setFormData({
      ...formData,
      leadQualificationQuestions: formData.leadQualificationQuestions.filter(q => q.id !== questionId),
    });
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const questions = [...formData.leadQualificationQuestions];
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];

    // Update order values
    const updatedQuestions = questions.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));

    setFormData({ ...formData, leadQualificationQuestions: updatedQuestions });
  };

  return {
    formData,
    setFormData,
    updateMutation,
    handleSave,
    resetForm,
    addQuestion,
    removeQuestion,
    moveQuestion,
  };
} 