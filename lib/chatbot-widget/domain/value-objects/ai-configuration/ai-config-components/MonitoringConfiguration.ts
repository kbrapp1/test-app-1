/**
 * Monitoring Configuration Value Object
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Manage monitoring and analytics configuration
 * - Handle performance logging and analytics settings
 * - Keep under 200-250 lines
 * - Focus on monitoring configuration only
 * - Follow @golden-rule patterns exactly
 */

export interface MonitoringConfigurationProps {
  enablePerformanceLogging: boolean;
  enableIntentAnalytics: boolean;
  enablePersonaAnalytics: boolean;
  responseTimeThresholdMs: number;
}

export class MonitoringConfiguration {
  private constructor(private readonly props: MonitoringConfigurationProps) {
    this.validateProps(props);
  }

  static create(props: MonitoringConfigurationProps): MonitoringConfiguration {
    return new MonitoringConfiguration(props);
  }

  static createDefault(): MonitoringConfiguration {
    return new MonitoringConfiguration({
      enablePerformanceLogging: true,
      enableIntentAnalytics: true,
      enablePersonaAnalytics: true,
      responseTimeThresholdMs: 2000
    });
  }

  private validateProps(props: MonitoringConfigurationProps): void {
    if (props.responseTimeThresholdMs < 100) {
      throw new Error('Response time threshold must be at least 100ms');
    }
    
    if (props.responseTimeThresholdMs > 30000) {
      throw new Error('Response time threshold cannot exceed 30 seconds');
    }
  }

  // Getters
  get enablePerformanceLogging(): boolean { return this.props.enablePerformanceLogging; }
  get enableIntentAnalytics(): boolean { return this.props.enableIntentAnalytics; }
  get enablePersonaAnalytics(): boolean { return this.props.enablePersonaAnalytics; }
  get responseTimeThresholdMs(): number { return this.props.responseTimeThresholdMs; }

  // Business methods
  update(updates: Partial<MonitoringConfigurationProps>): MonitoringConfiguration {
    return new MonitoringConfiguration({
      ...this.props,
      ...updates
    });
  }

  enablePerformance(): MonitoringConfiguration {
    return this.update({ enablePerformanceLogging: true });
  }

  disablePerformance(): MonitoringConfiguration {
    return this.update({ enablePerformanceLogging: false });
  }

  enableIntent(): MonitoringConfiguration {
    return this.update({ enableIntentAnalytics: true });
  }

  disableIntent(): MonitoringConfiguration {
    return this.update({ enableIntentAnalytics: false });
  }

  enablePersona(): MonitoringConfiguration {
    return this.update({ enablePersonaAnalytics: true });
  }

  disablePersona(): MonitoringConfiguration {
    return this.update({ enablePersonaAnalytics: false });
  }

  updateResponseThreshold(thresholdMs: number): MonitoringConfiguration {
    return this.update({ responseTimeThresholdMs: thresholdMs });
  }

  enableAllAnalytics(): MonitoringConfiguration {
    return this.update({
      enablePerformanceLogging: true,
      enableIntentAnalytics: true,
      enablePersonaAnalytics: true
    });
  }

  disableAllAnalytics(): MonitoringConfiguration {
    return this.update({
      enablePerformanceLogging: false,
      enableIntentAnalytics: false,
      enablePersonaAnalytics: false
    });
  }

  isResponseTimeSlow(responseTimeMs: number): boolean {
    return responseTimeMs > this.props.responseTimeThresholdMs;
  }

  getResponseTimeThresholdSeconds(): number {
    return this.props.responseTimeThresholdMs / 1000;
  }

  isFullMonitoring(): boolean {
    return this.props.enablePerformanceLogging && 
           this.props.enableIntentAnalytics && 
           this.props.enablePersonaAnalytics;
  }

  isMinimalMonitoring(): boolean {
    return !this.props.enablePerformanceLogging && 
           !this.props.enableIntentAnalytics && 
           !this.props.enablePersonaAnalytics;
  }

  getEnabledAnalyticsCount(): number {
    let count = 0;
    if (this.props.enablePerformanceLogging) count++;
    if (this.props.enableIntentAnalytics) count++;
    if (this.props.enablePersonaAnalytics) count++;
    return count;
  }

  getMonitoringLevel(): 'none' | 'basic' | 'standard' | 'comprehensive' {
    const enabledCount = this.getEnabledAnalyticsCount();
    
    if (enabledCount === 0) return 'none';
    if (enabledCount === 1) return 'basic';
    if (enabledCount === 2) return 'standard';
    return 'comprehensive';
  }

  isStrictPerformance(): boolean {
    return this.props.responseTimeThresholdMs <= 1000;
  }

  isRelaxedPerformance(): boolean {
    return this.props.responseTimeThresholdMs >= 5000;
  }

  toPlainObject(): MonitoringConfigurationProps {
    return { ...this.props };
  }
} 