import { IDebugInformationService, ApiCallDebugInfo, ProcessingDebugInfo } from '../../domain/services/IDebugInformationService';

export class DebugInformationService implements IDebugInformationService {
  private debugSessions = new Map<string, ProcessingDebugInfo>();

  captureApiCall(
    callType: 'first' | 'second',
    requestData: any,
    responseData: any,
    processingTime: number
  ): ApiCallDebugInfo {
    return {
      requestData: {
        endpoint: requestData.endpoint || 'https://api.openai.com/v1/chat/completions',
        method: requestData.method || 'POST',
        timestamp: requestData.timestamp || new Date().toISOString(),
        payload: requestData.payload,
        payloadSize: requestData.payloadSize || `${JSON.stringify(requestData.payload).length} characters`,
        messageCount: requestData.messageCount || 0,
        conversationHistoryLength: requestData.conversationHistoryLength || 0,
        userMessage: requestData.userMessage || ''
      },
      responseData: {
        timestamp: responseData.timestamp || new Date().toISOString(),
        processingTime: responseData.processingTime || `${processingTime}ms`,
        response: responseData.response,
        responseSize: responseData.responseSize || `${JSON.stringify(responseData.response).length} characters`
      }
    };
  }

  getProcessingDebugInfo(sessionId: string): ProcessingDebugInfo | null {
    return this.debugSessions.get(sessionId) || null;
  }

  clearDebugInfo(sessionId: string): void {
    this.debugSessions.delete(sessionId);
  }

  /**
   * Initialize debug session
   */
  initializeSession(sessionId: string, userMessageId: string, botMessageId: string): void {
    const existingSession = this.debugSessions.get(sessionId);
    if (existingSession) {
      // Update existing session without losing API call data
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

  /**
   * Add API call debug info to session
   */
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

  /**
   * Update total processing time for session
   */
  updateProcessingTime(sessionId: string, totalTime: number): void {
    const session = this.debugSessions.get(sessionId);
    if (session) {
      session.totalProcessingTime = totalTime;
      this.debugSessions.set(sessionId, session);
    }
  }
} 