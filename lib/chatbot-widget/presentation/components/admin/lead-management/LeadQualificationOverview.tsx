/**
 * Lead Qualification Overview Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display lead qualification questions overview
 * - Read-only display with edit trigger
 * - Keep under 200-250 lines
 * - Use composition for question items
 * - Follow @golden-rule patterns exactly
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeadQualificationQuestionDto } from '../../../../application/dto/ChatbotConfigDto';
import { LeadQualificationQuestionItem } from './LeadQualificationQuestionItem';

interface LeadQualificationOverviewProps {
  questions: LeadQualificationQuestionDto[];
  isEditing: boolean;
  onEdit: () => void;
}

export function LeadQualificationOverview({
  questions,
  isEditing,
  onEdit,
}: LeadQualificationOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={questions.length > 0 ? 'default' : 'secondary'}>
          {questions.length} Questions Configured
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isEditing}
        >
          Edit
        </Button>
      </div>

      {questions.length > 0 && (
        <div className="space-y-3">
          {questions
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <LeadQualificationQuestionItem
                key={question.id}
                question={question}
                isEditing={false}
              />
            ))}
        </div>
      )}
    </div>
  );
} 