/**
 * Lead Qualification Question Item Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display individual question item
 * - Support both read-only and edit modes
 * - Keep under 200-250 lines
 * - Handle question actions (move, remove)
 * - Follow @golden-rule patterns exactly
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, X } from 'lucide-react';
import { LeadQualificationQuestionDto } from '../../../../application/dto/ChatbotConfigDto';

interface LeadQualificationQuestionItemProps {
  question: LeadQualificationQuestionDto;
  isEditing: boolean;
  index?: number;
  totalQuestions?: number;
  onMoveUp?: (questionId: string) => void;
  onMoveDown?: (questionId: string) => void;
  onRemove?: (questionId: string) => void;
}

export function LeadQualificationQuestionItem({
  question,
  isEditing,
  index = 0,
  totalQuestions = 1,
  onMoveUp,
  onMoveDown,
  onRemove,
}: LeadQualificationQuestionItemProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="font-medium">{question.question}</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {question.type}
            </Badge>
            {question.isRequired && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              Order: {question.order}
            </span>
          </div>
          {question.options && question.options.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Options: {question.options.join(', ')}
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveUp?.(question.id)}
              disabled={index === 0}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMoveDown?.(question.id)}
              disabled={index === totalQuestions - 1}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove?.(question.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 