import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ChatbotWidgetCompositionRoot } from '@/lib/chatbot-widget/infrastructure/composition/ChatbotWidgetCompositionRoot';

interface RouteContext {
  params: Promise<{
    configId: string;
  }>;
}

/**
 * GET /api/chatbot-widget/config/[configId]
 * Retrieve public chatbot configuration for widget embedding
 * No authentication required since this is called by embedded widgets
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { configId } = await params;

    if (!configId) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      );
    }

    // Set up composition root with server client
    const supabase = createClient();
    ChatbotWidgetCompositionRoot.configureWithSupabaseClient(supabase);

    // Get configuration repository
    const configRepository = ChatbotWidgetCompositionRoot.getChatbotConfigRepository();

    // Load configuration
    const config = await configRepository.findById(configId);

    if (!config) {
      return NextResponse.json(
        { error: 'Chatbot configuration not found' },
        { status: 404 }
      );
    }

    if (!config.isActive) {
      return NextResponse.json(
        { error: 'Chatbot is currently inactive' },
        { status: 403 }
      );
    }

    // Check operating hours
    if (!config.isWithinOperatingHours()) {
      return NextResponse.json({
        id: config.id,
        name: config.name,
        description: config.description,
        isActive: false,
        outsideHours: true,
        outsideHoursMessage: config.operatingHours.outsideHoursMessage || 'We are currently outside business hours.',
        operatingHours: config.operatingHours
      });
    }

    // Return public configuration (safe for client exposure)
    return NextResponse.json({
      id: config.id,
      name: config.name,
      description: config.description,
      isActive: config.isActive,
      outsideHours: false,
      personalitySettings: {
        tone: config.personalitySettings.tone,
        communicationStyle: config.personalitySettings.communicationStyle,
        responseLength: config.personalitySettings.responseLength
      },
      operatingHours: config.operatingHours,
      leadQualificationQuestions: config.leadQualificationQuestions.filter(q => q.isRequired)
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to retrieve chatbot configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 