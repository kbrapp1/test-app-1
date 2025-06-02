/**
 * Network Monitor Configuration
 * 
 * Update these patterns when DAM API URLs change
 * This keeps the monitoring working across refactors
 */

export interface ActionPattern {
  name: string;
  urlPatterns: (string | RegExp)[];
  methods?: string[];
  description: string;
}

export const DAM_ACTION_PATTERNS: ActionPattern[] = [
  {
    name: 'Upload Asset',
    urlPatterns: [
      'upload',
      '/dam/asset',
      /\/api\/v\d+\/assets\/(create|upload)/,
      /asset.*POST/ // method-specific pattern
    ],
    methods: ['POST', 'PUT'],
    description: 'File upload operations'
  },
  {
    name: 'Save Search',
    urlPatterns: [
      'save-search',
      'saved-search',
      /\/api\/.*\/saved-searches/
    ],
    methods: ['POST', 'PUT'],
    description: 'Saving search criteria'
  },
  {
    name: 'Search',
    urlPatterns: [
      /\/search(?!-)/,  // search but not search-
      'query',
      '/dam/search',
      /\/api\/.*\/search(?!ed)/  // search but not searched
    ],
    description: 'Asset search and filtering'
  },
  {
    name: 'Navigate Folder',
    urlPatterns: [
      'folder',
      '/dam/folders',
      'navigation',
      /\/api\/.*\/folders/
    ],
    description: 'Folder navigation and browsing'
  },
  {
    name: 'Filter',
    urlPatterns: [
      'filter',
      'tag',
      '/dam/tags',
      /\/api\/.*\/(tags|filters)/
    ],
    description: 'Content filtering by tags or metadata'
  },
  {
    name: 'Download',
    urlPatterns: [
      'download',
      '/dam/download',
      /\/api\/.*\/download/
    ],
    description: 'Asset download operations'
  },

  {
    name: 'Bulk Operations',
    urlPatterns: [
      'bulk',
      'batch',
      /\/api\/.*\/bulk/
    ],
    methods: ['POST', 'PUT', 'DELETE'],
    description: 'Bulk asset operations'
  },
  {
    name: 'Metadata Edit',
    urlPatterns: [
      'metadata',
      'properties',
      /\/api\/.*\/assets\/.*\/metadata/
    ],
    methods: ['PUT', 'PATCH'],
    description: 'Asset metadata editing'
  }
];

/**
 * Helper function to detect action based on configurable patterns
 */
export function detectActionFromPatterns(url: string, method: string): string | null {
  // Safety check - ensure url is a string
  if (typeof url !== 'string') {
    console.warn('detectActionFromPatterns: url is not a string:', typeof url, url);
    return null;
  }

  for (const pattern of DAM_ACTION_PATTERNS) {
    // Check method filter if specified
    if (pattern.methods && !pattern.methods.includes(method)) {
      continue;
    }

    // Check URL patterns
    for (const urlPattern of pattern.urlPatterns) {
      if (typeof urlPattern === 'string') {
        if (url.includes(urlPattern)) {
          return pattern.name;
        }
      } else if (urlPattern instanceof RegExp) {
        if (urlPattern.test(url) || urlPattern.test(`${url}.*${method}`)) {
          return pattern.name;
        }
      }
    }
  }

  return null;
}

/**
 * Add custom patterns for new DAM features
 */
export function addCustomActionPattern(pattern: ActionPattern) {
  DAM_ACTION_PATTERNS.push(pattern);
}

/**
 * Update existing pattern (useful for API migrations)
 */
export function updateActionPattern(actionName: string, newPatterns: (string | RegExp)[]) {
  const pattern = DAM_ACTION_PATTERNS.find(p => p.name === actionName);
  if (pattern) {
    pattern.urlPatterns = newPatterns;
  }
} 