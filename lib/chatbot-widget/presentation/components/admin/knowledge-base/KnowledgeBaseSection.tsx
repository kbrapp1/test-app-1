'use client';

/**
 * AI INSTRUCTIONS:
 * - React component for knowledge base management UI coordination
 * - Delegate business logic to hooks and services
 * - Use composition pattern for complex UI sections
 * - Follow @golden-rule patterns - stay under 250 lines
 */

import { useState, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';
import { useKnowledgeBaseSettings } from '../../../hooks/useKnowledgeBaseSettings';
import { CompanyInformationCard } from './CompanyInformationCard';
import { FaqManagementCard, FaqManagementCardRef } from './FaqManagementCard';
import { KnowledgeBaseActions } from './KnowledgeBaseActions';

export function KnowledgeBaseSection() {
  const [isEditing, setIsEditing] = useState(false);
  const faqManagementCardRef = useRef<FaqManagementCardRef>(null);

  const { config: existingConfig, isLoading, error } = useChatbotConfiguration({ 
    enableFormState: false 
  });
  
  const {
    formData,
    updateMutation,
    handleSave: saveSettings,
    resetForm,
    updateFormData,
    addFaq,
    removeFaq
  } = useKnowledgeBaseSettings(existingConfig || null, existingConfig?.organizationId || null);

  const handleSave = async () => {
    // Check if there's a pending FAQ that needs to be added first
    const addedPendingFaq = faqManagementCardRef.current?.addPendingFaq();
    
    // Ensure state updates are processed if FAQ was added
    if (addedPendingFaq) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    await saveSettings();
    setIsEditing(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  if (isLoading) {
    return <div>Loading knowledge base...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load knowledge base. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!existingConfig) {
    return (
      <Alert>
        <AlertDescription>
          Please configure your chatbot first before setting up the knowledge base.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <CompanyInformationCard
        formData={formData}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        onUpdateFormData={updateFormData}
      />

      <FaqManagementCard
        ref={faqManagementCardRef}
        formData={formData}
        isEditing={isEditing}
        onAddFaq={addFaq}
        onRemoveFaq={removeFaq}
      />

      {isEditing && (
        <KnowledgeBaseActions
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
} 