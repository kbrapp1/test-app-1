/**
 * Lead Qualification Editor Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Edit lead qualification questions
 * - Handle form state for adding/editing questions
 * - Keep under 200-250 lines by extracting sub-components
 * - Use composition for complex forms
 * - Follow @golden-rule patterns exactly
 */

import { Button } from '@/components/ui/button';
import { LeadQualificationQuestionDto } from '../../../../application/dto/ChatbotConfigDto';
import { LeadQualificationQuestionItem } from './LeadQualificationQuestionItem';
import { AddQuestionForm } from './AddQuestionForm';

interface LeadQualificationEditorProps {
  formData: {
    leadQualificationQuestions: LeadQualificationQuestionDto[];
  };
  onSave: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  onAddQuestion: (question: Omit<LeadQualificationQuestionDto, 'id' | 'order'>) => void;
  onMoveQuestion: (questionId: string, direction: 'up' | 'down') => void;
  onRemoveQuestion: (questionId: string) => void;
}

export function LeadQualificationEditor({
  formData,
  onSave,
  onCancel,
  isLoading,
  onAddQuestion,
  onMoveQuestion,
  onRemoveQuestion,
}: LeadQualificationEditorProps) {
  return (
    <div className="space-y-6">
      {/* Existing Questions in Edit Mode */}
      {formData.leadQualificationQuestions.length > 0 && (
        <div className="space-y-3">
          {formData.leadQualificationQuestions
            .sort((a, b) => a.order - b.order)
            .map((question, index) => (
              <LeadQualificationQuestionItem
                key={question.id}
                question={question}
                isEditing={true}
                index={index}
                totalQuestions={formData.leadQualificationQuestions.length}
                onMoveUp={(id) => onMoveQuestion(id, 'up')}
                onMoveDown={(id) => onMoveQuestion(id, 'down')}
                onRemove={onRemoveQuestion}
              />
            ))}
        </div>
      )}

      {/* Add New Question Form */}
      <AddQuestionForm onAddQuestion={onAddQuestion} />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onSave}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
} 