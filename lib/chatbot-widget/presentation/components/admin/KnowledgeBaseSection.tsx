'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Book, FileText, HelpCircle, Plus, X } from 'lucide-react';
import { useOrganization } from '@/lib/organization/application/providers/OrganizationProvider';
import { getChatbotConfigByOrganization, updateChatbotConfig } from '../../actions/configActions';
import { UpdateChatbotConfigDto, FaqDto } from '../../../application/dto/ChatbotConfigDto';

export function KnowledgeBaseSection() {
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
    companyInfo: existingConfig?.knowledgeBase?.companyInfo || '',
    productCatalog: existingConfig?.knowledgeBase?.productCatalog || '',
    supportDocs: existingConfig?.knowledgeBase?.supportDocs || '',
    complianceGuidelines: existingConfig?.knowledgeBase?.complianceGuidelines || '',
    faqs: existingConfig?.knowledgeBase?.faqs || [],
  });

  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'general',
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
        knowledgeBase: {
          companyInfo: formData.companyInfo,
          productCatalog: formData.productCatalog,
          supportDocs: formData.supportDocs,
          complianceGuidelines: formData.complianceGuidelines,
          faqs: formData.faqs,
        },
      },
    });
  };

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;

    const faq: FaqDto = {
      id: `faq_${Date.now()}`,
      question: newFaq.question,
      answer: newFaq.answer,
      category: newFaq.category,
      keywords: [],
      priority: 1,
    };

    setFormData({
      ...formData,
      faqs: [...formData.faqs, faq],
    });

    setNewFaq({ question: '', answer: '', category: 'general' });
  };

  const removeFaq = (faqId: string) => {
    setFormData({
      ...formData,
      faqs: formData.faqs.filter(faq => faq.id !== faqId),
    });
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
      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            Basic information about your company that the chatbot can reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={formData.companyInfo ? 'default' : 'secondary'}>
              {formData.companyInfo ? 'Configured' : 'Not Configured'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-info">Company Information</Label>
              <Textarea
                id="company-info"
                value={formData.companyInfo}
                onChange={(e) => setFormData({ ...formData, companyInfo: e.target.value })}
                disabled={!isEditing}
                placeholder="Describe your company, what you do, your mission, etc."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-catalog">Product/Service Catalog</Label>
              <Textarea
                id="product-catalog"
                value={formData.productCatalog}
                onChange={(e) => setFormData({ ...formData, productCatalog: e.target.value })}
                disabled={!isEditing}
                placeholder="List your products or services with descriptions"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-docs">Support Documentation</Label>
              <Textarea
                id="support-docs"
                value={formData.supportDocs}
                onChange={(e) => setFormData({ ...formData, supportDocs: e.target.value })}
                disabled={!isEditing}
                placeholder="Common support procedures, troubleshooting guides, etc."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compliance">Compliance Guidelines</Label>
              <Textarea
                id="compliance"
                value={formData.complianceGuidelines}
                onChange={(e) => setFormData({ ...formData, complianceGuidelines: e.target.value })}
                disabled={!isEditing}
                placeholder="Any compliance or legal guidelines the bot should follow"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
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
                <div key={faq.id} className="border rounded-lg p-4">
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
                        onClick={() => removeFaq(faq.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add new FAQ */}
          {isEditing && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="font-medium">Add New FAQ</div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-question">Question</Label>
                  <Input
                    id="new-question"
                    value={newFaq.question}
                    onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                    placeholder="What question do customers often ask?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-answer">Answer</Label>
                  <Textarea
                    id="new-answer"
                    value={newFaq.answer}
                    onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                    placeholder="Provide a helpful answer"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-category">Category</Label>
                  <select
                    id="new-category"
                    value={newFaq.category}
                    onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="general">General</option>
                    <option value="product">Product</option>
                    <option value="support">Support</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <Button onClick={addFaq} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </div>
          )}

          {formData.faqs.length === 0 && !isEditing && (
            <div className="text-center py-8 text-muted-foreground">
              No FAQs configured yet. Click Edit to add some.
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