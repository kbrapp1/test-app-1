/**
 * Service responsible for categorizing entities
 * Following DDD principles: Single responsibility for entity categorization
 */
export class EntityCategorizationService {
  static getEntityCategory(entityType: string): 'core_business' | 'advanced' | 'contact' {
    const categoryMap: Record<string, 'core_business' | 'advanced' | 'contact'> = {
      'name': 'contact',
      'email': 'contact',
      'phone': 'contact',
      'company': 'core_business',
      'industry': 'core_business',
      'budget': 'core_business',
      'timeline': 'core_business',
      'pain_point': 'advanced',
      'use_case': 'advanced',
      'decision_maker': 'advanced'
    };
    return categoryMap[entityType] || 'core_business';
  }
} 