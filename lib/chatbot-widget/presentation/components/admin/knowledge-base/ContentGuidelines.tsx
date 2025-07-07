/**
 * Content Guidelines Component
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Display content creation guidelines and best practices
 * - Provide contextual help for different content types
 * - Keep under 250 lines following @golden-rule patterns
 * - Include tooltips, examples, and validation hints
 * - Support different content types with specific guidance
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronRight,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { ContentType } from '../../../../domain/value-objects/content/ContentType';

interface ContentGuidelinesProps {
  contentType?: ContentType;
  isVisible?: boolean;
  onClose?: () => void;
}

interface GuidelineSection {
  title: string;
  icon: React.ReactNode;
  description: string;
  tips: string[];
  examples: {
    good: string;
    bad?: string;
  };
  limits: {
    recommended: number;
    maximum: number;
  };
}

export function ContentGuidelines({ 
  contentType = ContentType.CUSTOM, 
  isVisible = true,
  onClose 
}: ContentGuidelinesProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basics']);

  // AI: Get content-specific guidelines based on type
  const getGuidelines = (): GuidelineSection[] => {
    const baseGuidelines: GuidelineSection[] = [
      {
        title: 'Content Basics',
        icon: <BookOpen className="h-4 w-4" />,
        description: 'Fundamental principles for effective chatbot content',
        tips: [
          'Write in clear, conversational language',
          'Use active voice and present tense',
          'Break up long paragraphs into digestible chunks',
          'Include specific details and examples',
          'Avoid jargon unless necessary for your industry'
        ],
        examples: {
          good: 'We offer 24/7 customer support through live chat, email, and phone. Our average response time is under 2 hours.',
          bad: 'Customer service is available and we try to respond quickly to inquiries through various channels.'
        },
        limits: {
          recommended: 1500,
          maximum: 2000
        }
      },
      {
        title: 'Optimization Tips',
        icon: <Zap className="h-4 w-4" />,
        description: 'Best practices for chatbot performance',
        tips: [
          'Include relevant keywords naturally',
          'Structure information hierarchically',
          'Use bullet points for lists and features',
          'Include common variations of terms',
          'Add context for technical terms'
        ],
        examples: {
          good: 'Our CRM software helps you:\n• Track customer interactions\n• Manage sales pipelines\n• Generate detailed reports\n• Integrate with email marketing tools',
          bad: 'Our software has features for customer management and sales tracking and reporting capabilities.'
        },
        limits: {
          recommended: 2000,
          maximum: 3000
        }
      }
    ];

    // AI: Add content-type specific guidelines
    if (contentType === ContentType.COMPANY_INFO) {
      baseGuidelines.push({
        title: 'Company Information',
        icon: <Target className="h-4 w-4" />,
        description: 'Guidelines for company and product descriptions',
        tips: [
          'Include your company mission and values',
          'Describe your target audience clearly',
          'Mention key differentiators and unique selling points',
          'Include founding information and company size',
          'Add location and service area details'
        ],
        examples: {
          good: 'Founded in 2020, TechFlow Solutions is a B2B software company serving mid-market businesses across North America. We specialize in workflow automation tools that help teams save 40% of their time on repetitive tasks.',
          bad: 'We are a technology company that makes software for businesses.'
        },
        limits: {
          recommended: 1800,
          maximum: 2500
        }
      });
    }

    return baseGuidelines;
  };

  const guidelines = getGuidelines();

  // AI: Toggle section expansion
  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionTitle)
        ? prev.filter(s => s !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  if (!isVisible) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Content Guidelines</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
        <CardDescription className="text-blue-700">
          Follow these guidelines to create content that helps your chatbot provide accurate, helpful responses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI: Quick tips alert */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Quick Tip:</strong> Focus on the information your customers ask about most frequently. 
            The more specific and detailed your content, the better your chatbot can help users.
          </AlertDescription>
        </Alert>

        {/* AI: Guidelines sections */}
        <div className="space-y-3">
          {guidelines.map((section) => (
            <Collapsible 
              key={section.title}
              open={expandedSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-3 h-auto border border-gray-200 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span className="font-medium">{section.title}</span>
                  </div>
                  {expandedSections.includes(section.title) ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  
                  {/* AI: Character limits */}
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Recommended: {section.limits.recommended} chars
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Maximum: {section.limits.maximum} chars
                    </Badge>
                  </div>

                  {/* AI: Tips list */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Best Practices
                    </h4>
                    <ul className="text-sm space-y-1">
                      {section.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* AI: Examples */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Examples</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                        <div className="font-medium text-green-800 mb-1">✓ Good Example:</div>
                        <div className="text-green-700">{section.examples.good}</div>
                      </div>
                      {section.examples.bad && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                          <div className="font-medium text-red-800 mb-1">✗ Avoid:</div>
                          <div className="text-red-700">{section.examples.bad}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* AI: Additional resources */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Need Help?</strong> Contact our support team if you need assistance optimizing your content 
            for better chatbot performance. We can review your content and provide personalized recommendations.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// AI: Content type specific tooltip component
export function ContentTypeTooltip({ contentType }: { contentType: ContentType }) {
  const getTooltipContent = () => {
    switch (contentType) {
      case ContentType.COMPANY_INFO:
        return 'Include company background, mission, values, and key information that helps users understand your business.';
      case ContentType.CUSTOM:
        return 'Add any relevant information that will help your chatbot answer customer questions effectively.';
      default:
        return 'Provide clear, detailed information that your chatbot can use to help customers.';
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <Info className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{getTooltipContent()}</span>
    </div>
  );
} 