/**
 * Source Tracker Service (Infrastructure Layer)
 * 
 * Single Responsibility: Capture browser stack traces and React context
 * Part of Infrastructure layer - handles browser-specific external concerns
 */

export interface CallSource {
  stack?: string;
  component?: string;
  hook?: string;
  file?: string;
  line?: number;
  trigger?: 'mount' | 'state-change' | 'user-action' | 'navigation' | 'unknown';
}

export class SourceTracker {
  private static readonly REACT_HOOK_PATTERNS = [
    /use[A-Z]\w*/g,  // useAuth, useUserProfile, etc.
    /use\w+/g        // generic use* patterns
  ];

  private static readonly REACT_COMPONENT_PATTERNS = [
    /at ([A-Z]\w*)\s*\(/g,  // React components (PascalCase)
    /(\w+\.tsx?):\d+:\d+/g   // File references
  ];

  /**
   * Capture current call source information
   */
  static captureSource(): CallSource {
    const source: CallSource = {};

    try {
      // Capture call stack
      const error = new Error();
      const stack = error.stack;
      
      if (stack) {

        
        source.stack = this.cleanStack(stack);
        source.component = this.extractReactComponent(stack);
        source.hook = this.extractReactHook(stack);
        
        const fileInfo = this.extractFileInfo(stack);
        if (fileInfo) {
          source.file = fileInfo.file;
          source.line = fileInfo.line;
        }

        source.trigger = this.inferTriggerType(stack);
        

      }
    } catch (error) {
      // Silent fail - don't break the app for monitoring
    }

    return source;
  }

  /**
   * Clean and filter stack trace for relevance
   */
  private static cleanStack(stack: string): string {
    const lines = stack.split('\n');
    
    // Very permissive filtering - keep almost everything useful
    const relevantLines = lines.filter(line => {
      // Only exclude the most obvious noise
      const isNoise = line.includes('node_modules') ||
                     line.includes('webpack') ||
                     line.includes('(native)') ||
                     line.includes('SourceTracker.captureSource');
      
      // Keep anything that looks like it has location info
      const hasLocation = line.includes('at ') && (
                         line.includes('.js') ||
                         line.includes('Provider') ||
                         line.includes('Component') ||
                         line.includes('use') ||
                         line.includes('fetch') ||
                         line.includes('Members') ||
                         line.includes('callback') ||
                         line.includes('async') ||
                         line.includes('http://localhost')
                         );

      return !isNoise && hasLocation;
    });



    return relevantLines.slice(0, 15).join('\n'); // Keep top 15 relevant lines
  }

  /**
   * Extract React component name from stack trace
   */
  private static extractReactComponent(stack: string): string | undefined {
    // Look for component patterns in the raw stack - handle bundled code
    const patterns = [
      // Direct component references (bundled code)
      /([A-Z][a-zA-Z0-9]*Provider)\.use/g,          // TeamMembersProvider.use...
      /([A-Z][a-zA-Z0-9]*Provider)\[/g,             // TeamMembersProvider[...
      /([A-Z][a-zA-Z0-9]*Component)\.use/g,         // UserComponent.use...
      /([A-Z][a-zA-Z0-9]*Page)\.use/g,              // DashboardPage.use...
      
      // Standard patterns
      /at ([A-Z][a-zA-Z0-9]*Provider)/g,            // at TeamMembersProvider
      /at ([A-Z][a-zA-Z0-9]*Component)/g,           // at UserComponent
      /at ([A-Z][a-zA-Z0-9]*Page)/g,                // at DashboardPage
      /at ([A-Z][a-zA-Z0-9]*)/g,                    // Any PascalCase
    ];
    
    for (const pattern of patterns) {
      let match;
      const matches = [];
      pattern.lastIndex = 0; // Reset regex
      while ((match = pattern.exec(stack)) !== null) {
        matches.push(match);
        if (!pattern.global) break;
      }
      
      for (const match of matches) {
        const componentName = match[1];
        
        // Skip monitoring and common non-components
        const isMonitoringRelated = [
          'Object', 'Function', 'Promise', 'Array', 'Error', 'XMLHttpRequest',
          'SourceTracker', 'NetworkCallTracker', 'RedundancyDetector',
          'NetworkMonitoringService', 'GlobalNetworkMonitor', 'NetworkInterceptors'
        ].includes(componentName);
        
        if (!isMonitoringRelated) {
          return componentName;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract React hook name from stack trace
   */
  private static extractReactHook(stack: string): string | undefined {
    // Look for use* patterns in the stack
    const hookMatches = stack.match(/use[A-Z]\w*/g);
    
    if (hookMatches) {
      // Return the most specific hook (longest name usually)
      return hookMatches.sort((a, b) => b.length - a.length)[0];
    }

    return undefined;
  }

  /**
   * Extract file and line information
   */
  private static extractFileInfo(stack: string): { file: string; line: number } | undefined {
    // Look for file patterns like "file.tsx:123:45"
    const fileMatch = stack.match(/([^\/\\]+\.tsx?):\d+:\d+/);
    
    if (fileMatch) {
      const parts = fileMatch[0].split(':');
      return {
        file: parts[0],
        line: parseInt(parts[1], 10)
      };
    }

    return undefined;
  }

  /**
   * Infer what triggered this network call
   */
  private static inferTriggerType(stack: string): CallSource['trigger'] {
    // Look for common patterns in the stack
    if (stack.includes('useEffect') || stack.includes('componentDidMount')) {
      return 'mount';
    }
    
    if (stack.includes('useState') || stack.includes('useReducer') || stack.includes('setState')) {
      return 'state-change';
    }
    
    if (stack.includes('onClick') || stack.includes('onSubmit') || stack.includes('handleClick')) {
      return 'user-action';
    }
    
    if (stack.includes('useRouter') || stack.includes('navigate') || stack.includes('router')) {
      return 'navigation';
    }

    return 'unknown';
  }

  /**
   * Get enhanced context about the current React state
   */
  static getReactContext(): { 
    renderCount?: number; 
    isHydrating?: boolean;
    routePath?: string;
  } {
    const context: any = {};

    try {
      // Try to get current route if possible
      if (typeof window !== 'undefined') {
        context.routePath = window.location.pathname;
        context.isHydrating = !(window as any).__NEXT_HYDRATED;
      }

      // Try to detect render count (very basic)
      const renderCounter = (window as any).__REACT_RENDER_COUNT || 0;
      context.renderCount = renderCounter;

    } catch (error) {
      // Silent fail
    }

    return context;
  }
} 