/**
 * AI INSTRUCTIONS: Component for FAQ display and management.
 * Handle FAQ editing with composition. @golden-rule: <250 lines.
 */

import { useState, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Plus, X } from 'lucide-react';
import { KnowledgeBaseFormData } from '../../../hooks/useKnowledgeBaseSettings';
import { FaqDto } from '../../../../application/dto/ChatbotConfigDto';

interface FaqManagementCardProps {
  formData: KnowledgeBaseFormData;
  isEditing: boolean;
  onAddFaq?: (faq: Omit<FaqDto, 'id'>) => void;
  onRemoveFaq?: (faqId: string) => void;
}

export interface FaqManagementCardRef {
  addPendingFaq: () => boolean;
}

export const FaqManagementCard = forwardRef<FaqManagementCardRef, FaqManagementCardProps>(({
  formData,
  isEditing,
  onAddFaq,
  onRemoveFaq,
}, ref) => {
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'general',
  });

  const handleAddFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;

    onAddFaq?.({
      question: newFaq.question,
      answer: newFaq.answer,
      category: newFaq.category,
      keywords: [],
      priority: 1,
    });

    setNewFaq({ question: '', answer: '', category: 'general' });
  };

  // Check if there's a pending FAQ that should be added before save
  const handleBeforeSave = () => {
    // If there's a filled-out FAQ form that hasn't been added yet, add it now
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      handleAddFaq();
      return true; // Indicate that we added a FAQ
    }
    return false; // No pending FAQ
  };

  // Expose the handleBeforeSave function through ref
  useImperativeHandle(ref, () => ({
    addPendingFaq: handleBeforeSave
  }), [newFaq]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          <CardTitle>Frequently Asked Questions</CardTitle>
        </div>
        <CardDescription>
          Add common questions and answers for your chatbot to reference.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing FAQs */}
        {formData.faqs.length > 0 && (
          <div className="space-y-3">
            {formData.faqs.map((faq) => (
              <FaqItem
                key={faq.id}
                faq={faq}
                isEditing={isEditing}
                onRemove={() => onRemoveFaq?.(faq.id)}
              />
            ))}
          </div>
        )}

        {/* Add new FAQ */}
        {isEditing && (
          <AddFaqForm
            newFaq={newFaq}
            onUpdateNewFaq={setNewFaq}
            onAddFaq={handleAddFaq}
          />
        )}

        {formData.faqs.length === 0 && !isEditing && (
          <div className="text-center py-8 text-muted-foreground">
            No FAQs configured yet. Click Edit to add some.
          </div>
        )}
      </CardContent>
    </Card>
  );
});

FaqManagementCard.displayName = 'FaqManagementCard';

interface FaqItemProps {
  faq: FaqDto;
  isEditing: boolean;
  onRemove: () => void;
}

function FaqItem({ faq, isEditing, onRemove }: FaqItemProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="font-medium">{faq.question}</div>
          <div className="text-sm text-muted-foreground">{faq.answer}</div>
          <Badge variant="outline" className="text-xs">
            {faq.category}
          </Badge>
        </div>
        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface AddFaqFormProps {
  newFaq: {
    question: string;
    answer: string;
    category: string;
  };
  onUpdateNewFaq: (faq: { question: string; answer: string; category: string }) => void;
  onAddFaq: () => void;
}

function AddFaqForm({ newFaq, onUpdateNewFaq, onAddFaq }: AddFaqFormProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="font-medium">Add New FAQ</div>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-question">Question</Label>
          <Input
            id="new-question"
            value={newFaq.question}
            onChange={(e) => onUpdateNewFaq({ ...newFaq, question: e.target.value })}
            placeholder="What question do customers often ask?"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-answer">Answer</Label>
          <Textarea
            id="new-answer"
            value={newFaq.answer}
            onChange={(e) => onUpdateNewFaq({ ...newFaq, answer: e.target.value })}
            placeholder="Provide a helpful answer"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-category">Category</Label>
          <select
            id="new-category"
            value={newFaq.category}
            onChange={(e) => onUpdateNewFaq({ ...newFaq, category: e.target.value })}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="general">General</option>
            <option value="product">Product</option>
            <option value="support">Support</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
          </select>
        </div>
        <Button onClick={onAddFaq} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>
    </div>
  );
}