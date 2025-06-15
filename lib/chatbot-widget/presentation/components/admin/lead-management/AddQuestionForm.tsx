/**
 * Add Question Form Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Form for adding new qualification questions
 * - Handle form state and validation
 * - Keep under 200-250 lines
 * - Use controlled components pattern
 * - Follow @golden-rule patterns exactly
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X } from 'lucide-react';
import { LeadQualificationQuestionDto } from '../../../../application/dto/ChatbotConfigDto';

interface NewQuestionData {
  question: string;
  type: string;
  isRequired: boolean;
  options: string[];
}

interface AddQuestionFormProps {
  onAddQuestion?: (question: Omit<LeadQualificationQuestionDto, 'id' | 'order'>) => void;
}

export function AddQuestionForm({ onAddQuestion }: AddQuestionFormProps) {
  const [newQuestion, setNewQuestion] = useState<NewQuestionData>({
    question: '',
    type: 'text',
    isRequired: false,
    options: [''],
  });

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const questionData: Omit<LeadQualificationQuestionDto, 'id' | 'order'> = {
      question: newQuestion.question,
      type: newQuestion.type,
      isRequired: newQuestion.isRequired,
      options: newQuestion.type === 'select' ? newQuestion.options.filter(opt => opt.trim()) : undefined,
      scoringWeight: 1,
    };

    onAddQuestion?.(questionData);

    // Reset form
    setNewQuestion({
      question: '',
      type: 'text',
      isRequired: false,
      options: [''],
    });
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 1) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="font-medium">Add New Question</div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-question">Question</Label>
          <Input
            id="new-question"
            value={newQuestion.question}
            onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
            placeholder="What would you like to ask potential leads?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="question-type">Question Type</Label>
          <select
            id="question-type"
            value={newQuestion.type}
            onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="text">Text Input</option>
            <option value="email">Email</option>
            <option value="phone">Phone Number</option>
            <option value="select">Multiple Choice</option>
            <option value="number">Number</option>
          </select>
        </div>

        {newQuestion.type === 'select' && (
          <div className="space-y-2">
            <Label>Options</Label>
            {newQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  disabled={newQuestion.options.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Required Question</Label>
            <p className="text-sm text-muted-foreground">
              Visitors must answer this question
            </p>
          </div>
          <Switch
            checked={newQuestion.isRequired}
            onCheckedChange={(checked) => setNewQuestion({ ...newQuestion, isRequired: checked })}
          />
        </div>

        <Button onClick={addQuestion} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>
    </div>
  );
} 