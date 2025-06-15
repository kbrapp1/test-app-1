'use client';

/**
 * Knowledge Base Section Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Knowledge base management UI coordination
 * - Delegate business logic to hooks and services
 * - Keep under 200-250 lines by extracting sub-components
 * - Use composition pattern for complex UI sections
 * - Follow @golden-rule patterns exactly
 */

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { useChatbotConfig } from '../../../hooks/useChatbotConfig';
import { useKnowledgeBaseSettings } from '../../../hooks/useKnowledgeBaseSettings';
import { CompanyInformationCard } from './CompanyInformationCard';
import { FaqManagementCard } from './FaqManagementCard';
import { KnowledgeBaseActions } from './KnowledgeBaseActions';

export function KnowledgeBaseSection() {
  const { activeOrganizationId } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);

  const { existingConfig, isLoading, error } = useChatbotConfig(activeOrganizationId);
  
  const {
    formData,
    updateMutation,
    handleSave: saveSettings,
    resetForm,
    updateFormData,
    addFaq,
    removeFaq
  } = useKnowledgeBaseSettings(existingConfig || null, activeOrganizationId);

  const handleSave = async () => {
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