import { IDebugInformationService, ApiCallDebugInfo, ProcessingDebugInfo } from '../../domain/services/interfaces/IDebugInformationService';

export class DebugInformationService implements IDebugInformationService {
  private debugSessions = new Map<string, ProcessingDebugInfo>();

  captureApiCall(
    callType: 'first' | 'second',
    requestData: unknown,
    responseData: unknown,
    processingTime: number
  ): ApiCallDebugInfo {
    const req = requestData as Record<string, unknown>;
    const res = responseData as Record<string, unknown>;
    
    return {
      requestData: {
        endpoint: (req.endpoint as string) || 'https://api.openai.com/v1/chat/completions',
        method: (req.method as string) || 'POST',
        timestamp: (req.timestamp as string) || new Date().toISOString(),
        payload: req.payload,
        payloadSize: (req.payloadSize as string) || `${JSON.stringify(req.payload).length} characters`,
        messageCount: (req.messageCount as number) || 0,
        conversationHistoryLength: (req.conversationHistoryLength as number) || 0,
        userMessage: (req.userMessage as string) || ''
      },
      responseData: {
        timestamp: (res.timestamp as string) || new Date().toISOString(),
        processingTime: (res.processingTime as string) || `${processingTime}ms`,
        response: res.response,
        responseSize: (res.responseSize as string) || `${JSON.stringify(res.response).length} characters`
      }
    };
  }

  getProcessingDebugInfo(sessionId: string): ProcessingDebugInfo | null {
    return this.debugSessions.get(sessionId) || null;
  }

  clearDebugInfo(sessionId: string): void {
    this.debugSessions.delete(sessionId);
  }

  // Initialize debug session
  initializeSession(sessionId: string, userMessageId: string, botMessageId: string): void {
    const existingSession = this.debugSessions.get(sessionId);
    if (existingSession) {
      // Update existing session without losing data
      existingSession.userMessageId = userMessageId;
      existingSession.botMessageId = botMessageId;
      this.debugSessions.set(sessionId, existingSession);
    } else {
      // Create new session
      this.debugSessions.set(sessionId, {
        sessionId,
        userMessageId,
        botMessageId,
        totalProcessingTime: 0
      });
    }
  }

  /** Add API call debug info to session */
  addApiCallToSession(sessionId: string, callType: 'first' | 'second', apiCallInfo: ApiCallDebugInfo): void {
    const session = this.debugSessions.get(sessionId);
    if (session) {
      if (callType === 'first') {
        session.firstApiCall = apiCallInfo;
      } else {
        session.secondApiCall = apiCallInfo;
      }
      this.debugSessions.set(sessionId, session);
    }
  }

  /** Update total processing time for session */
  updateProcessingTime(sessionId: string, totalTime: number): void {
    const session = this.debugSessions.get(sessionId);
    if (session) {
      session.totalProcessingTime = totalTime;
      this.debugSessions.set(sessionId, session);
    }
  }
} 