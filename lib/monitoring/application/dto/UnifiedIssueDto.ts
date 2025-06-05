export interface UnifiedIssueDto {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'Frontend' | 'Network' | 'Cross-Domain';
  icon: string;
  timestamp: number;
}

export interface CopyButtonStateDto {
  frontend: 'default' | 'success';
  crossDomain: 'default' | 'success';
  backend: 'default' | 'success';
} 