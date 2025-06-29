'use client';

/**
 * Lead Settings Section Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Lead qualification settings management UI
 * - Delegate business logic to hooks and services
 * - Keep under 200-250 lines by extracting sub-components
 * - Use composition pattern for complex UI sections
 * - Follow @golden-rule patterns exactly
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target } from 'lucide-react';
import { useChatbotConfiguration } from '../../../hooks/useChatbotConfiguration';
import { useLeadQualificationSettings } from '../../../hooks/useLeadQualificationSettings';
import { LeadQualificationOverview } from './LeadQualificationOverview';
import { LeadQualificationEditor } from './LeadQualificationEditor';

export function LeadSettingsSection() {
  const [isEditing, setIsEditing] = useState(false);

  const { 
    config: existingConfig, 
    isLoading, 
    error 
  } = useChatbotConfiguration({ 
    enableFormState: false 
  });

  const {
    formData,
    updateMutation,
    handleSave: saveSettings,
    resetForm,
    addQuestion,
    removeQuestion,
    moveQuestion
  } = useLeadQualificationSettings(existingConfig || null, existingConfig?.organizationId || null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetForm();
  };

  const handleSave = async () => {
    await saveSettings();
    setIsEditing(false);
  };

  if (isLoading) {
    return <div>Loading lead settings...</div>;
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load lead settings. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!existingConfig) {
    return (
      <Alert>
        <AlertDescription>
          Please configure your chatbot first before setting up lead qualification.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <CardTitle>Lead Qualification</CardTitle>
          </div>
          <CardDescription>
            Configure questions to qualify and score potential leads during conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LeadQualificationOverview
            questions={formData.leadQualificationQuestions}
            isEditing={isEditing}
            onEdit={handleEdit}
          />

          {isEditing ? (
            <LeadQualificationEditor
              formData={formData}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={updateMutation.isPending}
              onAddQuestion={addQuestion}
              onMoveQuestion={moveQuestion}
              onRemoveQuestion={removeQuestion}
            />
          ) : (
            formData.leadQualificationQuestions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No qualification questions configured yet. Click Edit to add some.
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
} 