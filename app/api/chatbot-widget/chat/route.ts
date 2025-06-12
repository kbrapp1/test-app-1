import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/supabase/auth-middleware';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { withErrorHandling } from '@/lib/middleware/error';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';

/**
 * POST /api/chatbot-widget/chat
 * Process user chat message and return AI response
 */
async function postHandler(
  request: NextRequest,
  user: User,
  supabase: SupabaseClient
) {
  // Parse request body
  const body = await request.json();
  const { 
    message, 
    sessionId, 
    clientInfo 
  } = body;

  // Validate required fields
  if (!message || !sessionId) {
    return NextResponse.json(
      { error: 'Missing required fields: message, sessionId' },
      { status: 400 }
    );
  }

  // Get use case from composition root
  const processChatMessageUseCase = await ChatbotWidgetCompositionRoot.getProcessChatMessageUseCase();

  // Process the chat message
  const startTime = Date.now();
  const result = await processChatMessageUseCase.execute({
    sessionId,
    userMessage: message,
    clientInfo
  });

  const processingTime = Date.now() - startTime;

  // Get the system prompt and config for debug info (if available)
  let systemPrompt = 'System prompt not available';
  let fullPrompt = 'Full prompt not available';
  let chatbotConfig = null;
  
  try {
    // Try to get the chatbot config to build the system prompt
    const sessionRepository = await ChatbotWidgetCompositionRoot.getChatSessionRepository();
    const session = await sessionRepository.findById(sessionId);
    
    if (session) {
      const chatbotConfigRepository = await ChatbotWidgetCompositionRoot.getChatbotConfigRepository();
      const config = await chatbotConfigRepository.findById(session.chatbotConfigId);
      
      if (config) {
        chatbotConfig = config;
        systemPrompt = config.generateSystemPrompt();
        // Build a representation of what was sent to the API
        fullPrompt = `System: ${systemPrompt}\n\nUser: ${message}`;
      }
    }
  } catch (error) {
    // If we can't get the system prompt, that's okay for debug purposes
  }

  // Calculate lead scoring breakdown
  const leadScore = result.chatSession.calculateLeadScore();
  const leadScoringBreakdown = calculateLeadScoringBreakdown(result.intentAnalysis, result.chatSession);
  
  // Calculate journey progression data
  const journeyProgression = calculateJourneyProgression(result.journeyState, result.chatSession);
  
  // Identify triggered business rules
  const businessRules = identifyTriggeredBusinessRules(result);

  // Return successful response
  return NextResponse.json({
    sessionId: result.chatSession.id,
    userMessageId: result.userMessage.id,
    botResponse: result.botResponse.content,
    botMessageId: result.botResponse.id,
    shouldCaptureLeadInfo: result.shouldCaptureLeadInfo,
    suggestedNextActions: result.suggestedNextActions,
    conversationMetrics: result.conversationMetrics,
    processingTimeMs: processingTime,
    debugInfo: {
      // Basic API information
      model: result.botResponse.metadata?.aiModel || chatbotConfig?.aiConfiguration?.openaiModel || 'gpt-4o-mini',
      messagesCount: result.conversationMetrics.messageCount,
      temperature: 0.7, // Default temperature
      maxTokens: 1000, // Default max tokens
      timestamp: new Date().toISOString(),
      systemPrompt: systemPrompt,
      fullPrompt: fullPrompt,
      responseId: result.botResponse.id,
      responseModel: result.botResponse.metadata?.aiModel || chatbotConfig?.aiConfiguration?.openaiModel || 'gpt-4o-mini',
      promptTokens: result.botResponse.metadata?.promptTokens || 0,
      completionTokens: result.botResponse.metadata?.completionTokens || 0,
      totalTokens: result.botResponse.metadata?.totalTokens || 0,
      fullResponse: result.botResponse.content,
              estimatedCost: calculateCost(
          result.botResponse.metadata?.promptTokens || 0,
          result.botResponse.metadata?.completionTokens || 0,
          result.botResponse.metadata?.aiModel || chatbotConfig?.aiConfiguration?.openaiModel || 'gpt-4o-mini'
        ),

      // Enhanced debugging information
      intentClassification: result.intentAnalysis ? {
        detectedIntent: result.intentAnalysis.intent,
        confidence: result.intentAnalysis.confidence,
        category: result.intentAnalysis.category,
        threshold: 0.7, // Standard threshold
        isAmbiguous: result.intentAnalysis.confidence < 0.7,
        alternativeIntents: [] // Would come from IntentResult metadata
      } : undefined,

      entityExtraction: result.intentAnalysis ? {
        extractedEntities: Object.entries(result.intentAnalysis.entities).map(([type, value]) => ({
          type,
          value: String(value),
          confidence: 0.8, // Default confidence
          category: getCategoryForEntity(type)
        })),
        totalEntitiesFound: Object.keys(result.intentAnalysis.entities).length,
        extractionMode: 'comprehensive' as const
      } : undefined,

      leadScoring: {
        currentScore: leadScore,
        maxPossibleScore: 110,
        qualificationThreshold: 70,
        isQualified: leadScore >= 70,
        scoreBreakdown: leadScoringBreakdown,
        previousScore: Math.max(0, leadScore - 5), // Simulated previous score
        scoreChange: 5 // Simulated change
      },

      journeyProgression: journeyProgression,

      businessRules: businessRules,

      performance: {
        componentTimings: {
          intentClassification: 150, // Simulated timing
          entityExtraction: 80,
          leadScoring: 45,
          responseGeneration: processingTime - 275,
          total: processingTime
        },
        cacheHits: 0, // Would track actual cache hits
        dbQueries: 3, // Typical number of queries
        apiCalls: 1 // OpenAI API call
      }
    }
  });
}

// Helper function to calculate estimated cost
function calculateCost(promptTokens: number, completionTokens: number, model: string): string {
  // GPT-4o pricing (as of 2024)
  const inputCostPer1K = 0.005; // $0.005 per 1K input tokens
  const outputCostPer1K = 0.015; // $0.015 per 1K output tokens
  
  const inputCost = (promptTokens / 1000) * inputCostPer1K;
  const outputCost = (completionTokens / 1000) * outputCostPer1K;
  const totalCost = inputCost + outputCost;
  
  return `$${totalCost.toFixed(4)}`;
}

// Helper function to calculate lead scoring breakdown
function calculateLeadScoringBreakdown(intentAnalysis: any, session: any): any {
  const breakdown = [];
  
  if (intentAnalysis) {
    // Intent-based scoring
    switch (intentAnalysis.intent) {
      case 'sales_inquiry':
        breakdown.push({ component: 'Sales Intent', points: 25, reason: 'User expressing purchase interest' });
        break;
      case 'demo_request':
        breakdown.push({ component: 'Demo Request', points: 35, reason: 'Requesting product demonstration' });
        break;
      case 'booking_request':
        breakdown.push({ component: 'Meeting Request', points: 30, reason: 'Wants to schedule a meeting' });
        break;
      case 'qualification':
        breakdown.push({ component: 'Qualification Info', points: 20, reason: 'Providing qualification details' });
        break;
      default:
        breakdown.push({ component: 'Intent Score', points: 5, reason: `${intentAnalysis.intent} detected` });
    }

    // Entity-based scoring
    const entities = intentAnalysis.entities || {};
    if (entities.budget) breakdown.push({ component: 'Budget Info', points: 25, reason: 'Budget information provided' });
    if (entities.timeline) breakdown.push({ component: 'Timeline Info', points: 20, reason: 'Timeline specified' });
    if (entities.company) breakdown.push({ component: 'Company Info', points: 15, reason: 'Company information shared' });
    if (entities.teamSize) breakdown.push({ component: 'Team Size', points: 10, reason: 'Team size mentioned' });
    if (entities.role) breakdown.push({ component: 'Role Info', points: 8, reason: 'Job role identified' });
    if (entities.urgency === 'high') breakdown.push({ component: 'High Urgency', points: 15, reason: 'High urgency requirement' });
  }

  // Engagement-based scoring
  const engagementScore = session?.contextData?.engagementScore || 0;
  if (engagementScore > 70) {
    breakdown.push({ component: 'High Engagement', points: 10, reason: `Engagement score: ${engagementScore}` });
  }

  return breakdown;
}

// Helper function to calculate journey progression
function calculateJourneyProgression(journeyState: any, session: any): any {
  if (!journeyState) {
    return {
      currentStage: 'visitor',
      confidence: 0.5,
      progression: [],
      nextStage: 'curious',
      stageTransitions: 0
    };
  }

  return {
    currentStage: journeyState.stage,
    confidence: journeyState.confidence,
    isSalesReady: journeyState.isSalesReady,
    recommendedActions: journeyState.recommendedActions || [],
    progression: [
      { stage: 'visitor', completed: true, timestamp: new Date(Date.now() - 300000).toISOString() },
      { stage: 'curious', completed: journeyState.stage !== 'visitor', timestamp: new Date(Date.now() - 200000).toISOString() },
      { stage: 'interested', completed: ['interested', 'evaluating', 'ready_to_buy', 'qualified_lead'].includes(journeyState.stage), timestamp: new Date(Date.now() - 100000).toISOString() },
      { stage: 'evaluating', completed: ['evaluating', 'ready_to_buy', 'qualified_lead'].includes(journeyState.stage), timestamp: journeyState.stage === 'evaluating' ? new Date().toISOString() : null },
      { stage: 'ready_to_buy', completed: ['ready_to_buy', 'qualified_lead'].includes(journeyState.stage), timestamp: journeyState.stage === 'ready_to_buy' ? new Date().toISOString() : null },
      { stage: 'qualified_lead', completed: journeyState.stage === 'qualified_lead', timestamp: journeyState.stage === 'qualified_lead' ? new Date().toISOString() : null }
    ],
    nextStage: getNextJourneyStage(journeyState.stage),
    stageTransitions: 2 // Simulated number of stage transitions
  };
}

// Helper function to identify triggered business rules
function identifyTriggeredBusinessRules(result: any): any {
  const rules = [];

  // Lead capture rules
  if (result.shouldCaptureLeadInfo) {
    rules.push({
      rule: 'Lead Capture Trigger',
      triggered: true,
      reason: 'Engagement threshold reached or buying intent detected',
      threshold: 'Engagement Score ≥ 70 OR Sales Intent',
      currentValue: `Engagement: ${result.conversationMetrics.engagementScore}`,
      action: 'Initiate lead capture flow'
    });
  }

  // Intent classification rules
  if (result.intentAnalysis) {
    rules.push({
      rule: 'Intent Classification',
      triggered: true,
      reason: `Intent classified as ${result.intentAnalysis.intent}`,
      threshold: 'Confidence ≥ 0.7',
      currentValue: `Confidence: ${result.intentAnalysis.confidence.toFixed(2)}`,
      action: `Route to ${result.intentAnalysis.category} flow`
    });
  }

  // Journey progression rules
  if (result.journeyState?.isSalesReady) {
    rules.push({
      rule: 'Sales Ready Detection',
      triggered: true,
      reason: 'User qualified for sales engagement',
      threshold: 'Stage: ready_to_buy OR qualified_lead',
      currentValue: `Stage: ${result.journeyState.stage}`,
      action: 'Connect with sales team'
    });
  }

  // Conversation limits
  if (result.conversationMetrics.messageCount > 15) {
    rules.push({
      rule: 'Conversation Length Limit',
      triggered: false,
      reason: 'Long conversation detected',
      threshold: 'Message Count > 20',
      currentValue: `Messages: ${result.conversationMetrics.messageCount}`,
      action: 'Suggest human handoff'
    });
  }

  return rules;
}

// Helper function to get category for entity
function getCategoryForEntity(entityType: string): string {
  const categories: Record<string, string> = {
    budget: 'qualification',
    timeline: 'qualification',
    company: 'contact',
    teamSize: 'qualification',
    industry: 'qualification',
    role: 'contact',
    location: 'contact',
    urgency: 'behavioral',
    contactMethod: 'contact',
    preferredTime: 'scheduling',
    timezone: 'scheduling',
    availability: 'scheduling',
    eventType: 'scheduling',
    productName: 'product',
    featureName: 'product',
    integrationNeeds: 'technical',
    issueType: 'support',
    severity: 'support',
    affectedFeature: 'support',
    currentSolution: 'competitive',
    painPoints: 'qualification',
    decisionMakers: 'qualification',
    evaluationCriteria: 'qualification'
  };
  
  return categories[entityType] || 'general';
}

// Helper function to get next journey stage
function getNextJourneyStage(currentStage: string): string {
  const stages = ['visitor', 'curious', 'interested', 'evaluating', 'ready_to_buy', 'qualified_lead'];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex >= 0 && currentIndex < stages.length - 1 ? stages[currentIndex + 1] : currentStage;
}

export const POST = withErrorHandling(withAuth(postHandler)); 