'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Target,
  User,
  Bot,
  Lightbulb,
  FileText,
  Heart,
  TrendingUp
} from 'lucide-react';

// Domain-aligned interfaces matching existing patterns
interface TestScenario {
  id: string;
  name: string;
  description: string;
  category: 'knowledge_validation' | 'lead_capture' | 'conversation_flow' | 'edge_cases';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedDuration: number; // minutes
  testSteps: TestStep[];
  successCriteria: string[];
  userProfile: {
    intent: 'browsing' | 'shopping' | 'support' | 'lead_qualification';
    engagementLevel: 'low' | 'medium' | 'high';
    leadReadiness: 'cold' | 'warm' | 'hot';
  };
  tags: string[];
}

interface TestStep {
  id: string;
  type: 'user_message' | 'expected_response' | 'validation_check';
  content: string;
  notes?: string;
  expectedKeywords?: string[];
  timeout?: number;
}

interface ScenarioResult {
  scenarioId: string;
  status: 'passed' | 'failed' | 'running' | 'not_started';
  startedAt?: Date;
  completedAt?: Date;
  actualSteps: number;
  expectedSteps: number;
  passedCriteria: string[];
  failedCriteria: string[];
  notes?: string;
}

interface TestScenariosProps {
  chatbotConfigId: string;
  onRunScenario?: (scenario: TestScenario) => void;
  onScenarioComplete?: (result: ScenarioResult) => void;
}

// Predefined test scenarios based on common chatbot use cases
const DEFAULT_TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'faq-pricing',
    name: 'FAQ: Pricing Inquiry',
    description: 'Test basic FAQ response about pricing information',
    category: 'knowledge_validation',
    difficulty: 'easy',
    expectedDuration: 3,
    userProfile: {
      intent: 'browsing',
      engagementLevel: 'medium',
      leadReadiness: 'warm',
    },
    testSteps: [
      {
        id: 'step-1',
        type: 'user_message',
        content: 'What are your pricing plans?',
        expectedKeywords: ['pricing', 'plans', 'cost'],
      },
      {
        id: 'step-2',
        type: 'expected_response',
        content: 'Should provide pricing information from knowledge base',
        expectedKeywords: ['plan', '$', 'price', 'month'],
      },
      {
        id: 'step-3',
        type: 'validation_check',
        content: 'Response contains specific pricing details',
      },
    ],
    successCriteria: [
      'Provides accurate pricing information',
      'Response is professional and helpful',
      'Includes relevant pricing tiers or options',
    ],
    tags: ['pricing', 'faq', 'basic'],
  },
  {
    id: 'lead-demo-request',
    name: 'Lead: Demo Request Flow',
    description: 'Test lead capture when user requests a product demo',
    category: 'lead_capture',
    difficulty: 'medium',
    expectedDuration: 5,
    userProfile: {
      intent: 'lead_qualification',
      engagementLevel: 'high',
      leadReadiness: 'hot',
    },
    testSteps: [
      {
        id: 'step-1',
        type: 'user_message',
        content: 'I\'d like to see a demo of your product',
        expectedKeywords: ['demo', 'trial', 'try'],
      },
      {
        id: 'step-2',
        type: 'expected_response',
        content: 'Should offer to set up demo and ask for contact information',
        expectedKeywords: ['demo', 'contact', 'email', 'schedule'],
      },
      {
        id: 'step-3',
        type: 'user_message',
        content: 'john.doe@example.com, ABC Company',
        expectedKeywords: ['email', 'company'],
      },
      {
        id: 'step-4',
        type: 'validation_check',
        content: 'Lead information should be captured',
      },
    ],
    successCriteria: [
      'Identifies demo request intent',
      'Captures email and company information',
      'Provides clear next steps',
      'Maintains professional tone',
    ],
    tags: ['demo', 'lead-capture', 'email'],
  },
  {
    id: 'conversation-flow',
    name: 'Natural Conversation Flow',
    description: 'Test ability to maintain context in multi-turn conversation',
    category: 'conversation_flow',
    difficulty: 'medium',
    expectedDuration: 7,
    userProfile: {
      intent: 'shopping',
      engagementLevel: 'high',
      leadReadiness: 'warm',
    },
    testSteps: [
      {
        id: 'step-1',
        type: 'user_message',
        content: 'Tell me about your products',
      },
      {
        id: 'step-2',
        type: 'user_message',
        content: 'Which one would be best for a small business?',
      },
      {
        id: 'step-3',
        type: 'user_message',
        content: 'How much does that cost?',
      },
      {
        id: 'step-4',
        type: 'validation_check',
        content: 'Maintains context throughout conversation',
      },
    ],
    successCriteria: [
      'Maintains conversation context',
      'Provides relevant follow-up responses',
      'References previous messages appropriately',
      'Shows understanding of user intent progression',
    ],
    tags: ['context', 'multi-turn', 'conversation'],
  },
  {
    id: 'edge-case-off-topic',
    name: 'Edge Case: Off-Topic Question',
    description: 'Test handling of questions outside the knowledge base',
    category: 'edge_cases',
    difficulty: 'hard',
    expectedDuration: 4,
    userProfile: {
      intent: 'browsing',
      engagementLevel: 'low',
      leadReadiness: 'cold',
    },
    testSteps: [
      {
        id: 'step-1',
        type: 'user_message',
        content: 'What\'s the weather like today?',
      },
      {
        id: 'step-2',
        type: 'expected_response',
        content: 'Should politely redirect to relevant topics',
        expectedKeywords: ['help', 'assist', 'about'],
      },
      {
        id: 'step-3',
        type: 'validation_check',
        content: 'Gracefully handles off-topic questions',
      },
    ],
    successCriteria: [
      'Politely acknowledges the question',
      'Redirects to relevant business topics',
      'Maintains helpful tone',
      'Doesn\'t hallucinate information',
    ],
    tags: ['off-topic', 'edge-case', 'redirect'],
  },
  {
    id: 'support-technical-question',
    name: 'Support: Technical Question',
    description: 'Test handling of technical support inquiries',
    category: 'knowledge_validation',
    difficulty: 'medium',
    expectedDuration: 5,
    userProfile: {
      intent: 'support',
      engagementLevel: 'medium',
      leadReadiness: 'warm',
    },
    testSteps: [
      {
        id: 'step-1',
        type: 'user_message',
        content: 'I\'m having trouble setting up my account',
      },
      {
        id: 'step-2',
        type: 'expected_response',
        content: 'Should provide helpful troubleshooting steps or escalate to support',
        expectedKeywords: ['help', 'support', 'steps', 'guide'],
      },
      {
        id: 'step-3',
        type: 'validation_check',
        content: 'Provides useful support guidance',
      },
    ],
    successCriteria: [
      'Recognizes support request',
      'Provides helpful guidance or escalation',
      'Shows empathy for user\'s problem',
      'Offers clear next steps',
    ],
    tags: ['support', 'technical', 'troubleshooting'],
  },
];

const getCategoryIcon = (category: TestScenario['category']) => {
  switch (category) {
    case 'knowledge_validation':
      return <FileText className="h-4 w-4" />;
    case 'lead_capture':
      return <Target className="h-4 w-4" />;
    case 'conversation_flow':
      return <MessageSquare className="h-4 w-4" />;
    case 'edge_cases':
      return <Lightbulb className="h-4 w-4" />;
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
};

const getDifficultyColor = (difficulty: TestScenario['difficulty']) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'hard':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: ScenarioResult['status']) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

export function TestScenarios({ chatbotConfigId, onRunScenario, onScenarioComplete }: TestScenariosProps) {
  const [scenarios] = useState<TestScenario[]>(DEFAULT_TEST_SCENARIOS);
  const [scenarioResults, setScenarioResults] = useState<Map<string, ScenarioResult>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runningScenario, setRunningScenario] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories', icon: <Target className="h-4 w-4" /> },
    { value: 'knowledge_validation', label: 'Knowledge Validation', icon: <FileText className="h-4 w-4" /> },
    { value: 'lead_capture', label: 'Lead Capture', icon: <Heart className="h-4 w-4" /> },
    { value: 'conversation_flow', label: 'Conversation Flow', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'edge_cases', label: 'Edge Cases', icon: <Lightbulb className="h-4 w-4" /> },
  ];

  const filteredScenarios = selectedCategory === 'all' 
    ? scenarios 
    : scenarios.filter(scenario => scenario.category === selectedCategory);

  const handleRunScenario = async (scenario: TestScenario) => {
    setRunningScenario(scenario.id);
    
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      status: 'running',
      startedAt: new Date(),
      actualSteps: 0,
      expectedSteps: scenario.testSteps.length,
      passedCriteria: [],
      failedCriteria: [],
    };

    setScenarioResults(prev => new Map(prev.set(scenario.id, result)));
    onRunScenario?.(scenario);

    // Mock scenario execution for demonstration
    setTimeout(() => {
      const mockSuccess = Math.random() > 0.3;
      
      const finalResult: ScenarioResult = {
        ...result,
        status: mockSuccess ? 'passed' : 'failed',
        completedAt: new Date(),
        actualSteps: scenario.testSteps.length,
        passedCriteria: mockSuccess 
          ? scenario.successCriteria 
          : scenario.successCriteria.slice(0, Math.floor(scenario.successCriteria.length * 0.6)),
        failedCriteria: mockSuccess 
          ? []
          : scenario.successCriteria.slice(Math.floor(scenario.successCriteria.length * 0.6)),
        notes: mockSuccess 
          ? 'All test steps completed successfully'
          : 'Some validation criteria were not met',
      };

      setScenarioResults(prev => new Map(prev.set(scenario.id, finalResult)));
      setRunningScenario(null);
      onScenarioComplete?.(finalResult);
    }, 3000 + Math.random() * 2000);
  };

  const handleRunAllScenarios = () => {
    filteredScenarios.forEach((scenario, index) => {
      setTimeout(() => {
        handleRunScenario(scenario);
      }, index * 1000);
    });
  };

  const getOverallProgress = () => {
    const totalScenarios = filteredScenarios.length;
    const completedScenarios = filteredScenarios.filter(scenario => {
      const result = scenarioResults.get(scenario.id);
      return result && (result.status === 'passed' || result.status === 'failed');
    }).length;
    
    return { completed: completedScenarios, total: totalScenarios };
  };

  const progress = getOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Test Scenarios</h3>
          <p className="text-sm text-muted-foreground">
            Run predefined scenarios to validate your chatbot's performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRunAllScenarios}
            disabled={runningScenario !== null}
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Run All
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      {progress.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Testing Progress</span>
              <span className="text-sm text-muted-foreground">
                {progress.completed} of {progress.total} scenarios
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="flex items-center gap-2"
          >
            {category.icon}
            {category.label}
          </Button>
        ))}
      </div>

      {/* Scenarios List */}
      <div className="space-y-4">
        {filteredScenarios.map((scenario) => {
          const result = scenarioResults.get(scenario.id);
          const isRunning = runningScenario === scenario.id;

          return (
            <Card key={scenario.id} className={isRunning ? "ring-2 ring-blue-500" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(scenario.category)}
                    <div>
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {scenario.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {result && getStatusIcon(result.status)}
                    <Badge className={getDifficultyColor(scenario.difficulty)}>
                      {scenario.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Scenario Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {scenario.expectedDuration} min
                    </div>
                    <div>
                      <span className="font-medium">Steps:</span> {scenario.testSteps.length}
                    </div>
                    <div>
                      <span className="font-medium">User Intent:</span> {scenario.userProfile.intent}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {scenario.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Test Steps Preview */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      View Test Steps ({scenario.testSteps.length})
                    </summary>
                    <div className="mt-2 space-y-2">
                      {scenario.testSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-2 text-sm">
                          <span className="font-mono text-xs bg-muted px-1 rounded">
                            {index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              {step.type === 'user_message' && <User className="h-3 w-3" />}
                              {step.type === 'expected_response' && <Bot className="h-3 w-3" />}
                              {step.type === 'validation_check' && <CheckCircle className="h-3 w-3" />}
                              <span className="font-medium capitalize">
                                {step.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1">{step.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Success Criteria */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      Success Criteria ({scenario.successCriteria.length})
                    </summary>
                    <div className="mt-2">
                      <ul className="text-sm space-y-1">
                        {scenario.successCriteria.map((criteria, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>

                  {/* Results */}
                  {result && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test Results</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="text-sm capitalize">{result.status}</span>
                        </div>
                      </div>
                      
                      {result.status !== 'running' && (
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-green-600 font-medium">
                                Passed: {result.passedCriteria.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-red-600 font-medium">
                                Failed: {result.failedCriteria.length}
                              </span>
                            </div>
                          </div>
                          
                          {result.notes && (
                            <p className="text-muted-foreground">{result.notes}</p>
                          )}
                          
                          {result.completedAt && (
                            <p className="text-xs text-muted-foreground">
                              Completed at {result.completedAt.toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleRunScenario(scenario)}
                      disabled={isRunning || runningScenario !== null}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      {isRunning ? 'Running...' : 'Run Test'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredScenarios.length === 0 && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            No test scenarios found for the selected category. Try selecting a different category or create custom scenarios.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 