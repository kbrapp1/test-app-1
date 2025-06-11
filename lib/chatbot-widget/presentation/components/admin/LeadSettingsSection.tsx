'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Target, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { getChatbotConfigByOrganization, updateChatbotConfig } from '../../actions/configActions';
import { UpdateChatbotConfigDto, LeadQualificationQuestionDto } from '../../../application/dto/ChatbotConfigDto';

export function LeadSettingsSection() {
  const { activeOrganizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Query for existing chatbot config
  const { data: configResult, isLoading, error } = useQuery({
    queryKey: ['chatbot-config', activeOrganizationId],
    queryFn: () => activeOrganizationId ? getChatbotConfigByOrganization(activeOrganizationId) : null,
    enabled: !!activeOrganizationId,
  });

  const existingConfig = configResult?.success ? configResult.data : null;

  // Form state
  const [formData, setFormData] = useState({
    leadQualificationQuestions: existingConfig?.leadQualificationQuestions || [],
  });

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'text',
    isRequired: false,
    options: [''],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChatbotConfigDto }) =>
      updateChatbotConfig(id, data, activeOrganizationId || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot-config', activeOrganizationId] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (!activeOrganizationId || !existingConfig) return;

    updateMutation.mutate({
      id: existingConfig.id,
      data: {
        leadQualificationQuestions: formData.leadQualificationQuestions,
      },
    });
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const question: LeadQualificationQuestionDto = {
      id: `question_${Date.now()}`,
      question: newQuestion.question,
      type: newQuestion.type,
      isRequired: newQuestion.isRequired,
      order: formData.leadQualificationQuestions.length + 1,
      options: newQuestion.type === 'select' ? newQuestion.options.filter(opt => opt.trim()) : undefined,
      scoringWeight: 1,
    };

    setFormData({
      ...formData,
      leadQualificationQuestions: [...formData.leadQualificationQuestions, question],
    });

    setNewQuestion({
      question: '',
      type: 'text',
      isRequired: false,
      options: [''],
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

    // Update order values by creating new objects
    const updatedQuestions = questions.map((q, idx) => ({
      ...q,
      order: idx + 1,
    }));

    setFormData({ ...formData, leadQualificationQuestions: updatedQuestions });
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
      {/* Lead Qualification Overview */}
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
          <div className="flex items-center justify-between">
            <Badge variant={formData.leadQualificationQuestions.length > 0 ? 'default' : 'secondary'}>
              {formData.leadQualificationQuestions.length} Questions Configured
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          {/* Existing Questions */}
          {formData.leadQualificationQuestions.length > 0 && (
            <div className="space-y-3">
              {formData.leadQualificationQuestions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
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
                            onClick={() => moveQuestion(question.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => moveQuestion(question.id, 'down')}
                            disabled={index === formData.leadQualificationQuestions.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(question.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Add new question */}
          {isEditing && (
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
          )}

          {formData.leadQualificationQuestions.length === 0 && !isEditing && (
            <div className="text-center py-8 text-muted-foreground">
              No qualification questions configured yet. Click Edit to add some.
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
} 