import { NextRequest, NextResponse } from 'next/server';
import { getReplicatePrediction } from '@/lib/tts/infrastructure/providers/ttsService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get('id');
  
  if (!predictionId) {
    return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 });
  }
  
  try {
    const result = await getReplicatePrediction(predictionId);
    return NextResponse.json({
      predictionId,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message,
      predictionId,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 