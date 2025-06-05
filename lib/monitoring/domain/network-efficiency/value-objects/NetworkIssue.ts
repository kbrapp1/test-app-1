export type NetworkIssueType = 'redundancy' | 'slow-response' | 'failed-request' | 'high-volume';
export type NetworkIssueSeverity = 'high' | 'medium' | 'low';

export class NetworkIssue {
  public readonly timestamp: number;
  
  constructor(
    public readonly type: NetworkIssueType,
    public readonly title: string,
    public readonly description: string,
    public readonly severity: NetworkIssueSeverity,
    public readonly count: number,
    public readonly persistent: boolean = false
  ) {
    this.timestamp = Date.now();
  }

  static createRedundancyIssue(count: number): NetworkIssue {
    return new NetworkIssue(
      'redundancy',
      'Redundant API Calls',
      `${count} duplicate calls detected within time windows`,
      count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
      count,
      false
    );
  }

  static createSlowResponseIssue(avgTime: number): NetworkIssue {
    return new NetworkIssue(
      'slow-response',
      'Slow Network Responses',
      `Average response time: ${avgTime}ms`,
      avgTime > 2000 ? 'high' : avgTime > 1000 ? 'medium' : 'low',
      1,
      true
    );
  }

  static createFailedRequestIssue(count: number): NetworkIssue {
    return new NetworkIssue(
      'failed-request',
      'Failed Requests',
      `${count} requests returned errors`,
      count > 3 ? 'high' : count > 1 ? 'medium' : 'low',
      count,
      false
    );
  }

  static createHighVolumeIssue(count: number): NetworkIssue {
    return new NetworkIssue(
      'high-volume',
      'High Network Volume',
      `${count} calls in short timeframe`,
      count > 20 ? 'high' : count > 10 ? 'medium' : 'low',
      count,
      false
    );
  }
} 