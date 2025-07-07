/**
 * AI INSTRUCTIONS: (Only need AI instruction at the top of the file ONCE)
 * - Implements both ISessionLogger and IOperationLogger interfaces
 * - Prevents errors when logging is disabled
 * - Minimal implementation following single responsibility
 * - All methods are no-ops for performance
 */

import { 
  ISessionLogger, 
  IOperationLogger, 
  LogContext, 
  LogLevel, 
  LogMetrics 
} from '../../../domain/services/interfaces/IChatbotLoggingService';

export class NoOpLogger implements ISessionLogger, IOperationLogger {
  logHeader(): void {}
  logSeparator(): void {}
  logRaw(): void {}
  logMessage(): void {}
  logMessageSync(): void {}
  logStep(): void {}
  logError(): void {}
  logMetrics(): void {}
  logApiCall(): void {}
  logCache(): void {}
  logDomainEvent(): void {}
  async flush(): Promise<void> {}
  getCorrelationId(): string { return 'disabled'; }
  start(): void {}
  complete(): void {}
  fail(): void {}
  addContext(): void {}
  getDuration(): number { return 0; }
} 