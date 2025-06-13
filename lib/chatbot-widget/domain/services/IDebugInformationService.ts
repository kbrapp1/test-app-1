export interface ApiCallDebugInfo {
  requestData: {
    endpoint: string;
    method: string;
    timestamp: string;
    payload: any;
    payloadSize: string;
    messageCount: number;
    conversationHistoryLength: number;
    userMessage: string;
  };
  responseData: {
    timestamp: string;
    processingTime: string;
    response: any;
    responseSize: string;
  };
}

export interface ProcessingDebugInfo {
  firstApiCall?: ApiCallDebugInfo;
  secondApiCall?: ApiCallDebugInfo;
  totalProcessingTime: number;
  sessionId: string;
  userMessageId: string;
  botMessageId: string;
}

export interface IDebugInformationService {
  /**
   * Capture API call debug information
   */
  captureApiCall(
    callType: 'first' | 'second',
    requestData: any,
    responseData: any,
    processingTime: number
  ): ApiCallDebugInfo;

  /**
   * Get complete debug information for a processing session
   */
  getProcessingDebugInfo(sessionId: string): ProcessingDebugInfo | null;

  /**
   * Clear debug information for a session
   */
  clearDebugInfo(sessionId: string): void;

  /**
   * Initialize debug session
   */
  initializeSession(sessionId: string, userMessageId: string, botMessageId: string): void;

  /**
   * Add API call debug info to session
   */
  addApiCallToSession(sessionId: string, callType: 'first' | 'second', apiCallInfo: ApiCallDebugInfo): void;

  /**
   * Update total processing time for session
   */
  updateProcessingTime(sessionId: string, totalTime: number): void;
} 