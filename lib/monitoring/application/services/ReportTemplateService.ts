/**
 * Application Layer Service - Shared report templating logic
 * Single Responsibility: Generate consistent report structures
 * DDD Compliance: Pure application logic, no presentation concerns
 */
export class ReportTemplateService {
  /**
   * Generate standard report header
   */
  static generateStandardHeader(
    title: string,
    context?: string,
    issueCount?: number
  ): string[] {
    const timestamp = new Date().toISOString();
    return [
      `# ${title}`,
      `Generated: ${timestamp}`,
      `**Context**: ${context || 'unknown'} | **Status**: PRODUCTION READY`,
      ``,
      `## 📊 Summary`,
      issueCount !== undefined ? `- **Issues Found**: ${issueCount}` : '',
      `- **Analysis Type**: Real-time network performance monitoring`,
      ``,
    ].filter(line => line !== '');
  }

  /**
   * Generate standard implementation checklist
   */
  static generateStandardChecklist(): string[] {
    return [
      ``,
      `## ✅ Implementation Checklist`,
      `- [ ] Review all critical/high priority issues above`,
      `- [ ] Implement React Query for redundant API calls`,
      `- [ ] Add request deduplication middleware`,
      `- [ ] Optimize slow database queries and API endpoints`,
      `- [ ] Add proper caching headers and strategies`,
      `- [ ] Monitor network performance metrics in production`,
      `- [ ] Schedule follow-up performance review`
    ];
  }

  /**
   * Generate code example section
   */
  static generateCodeExampleSection(
    title: string,
    problem: string,
    solution: string,
    codeExample: string
  ): string[] {
    return [
      ``,
      `#### 🛠️ ${title}:`,
      `**Problem**: ${problem}`,
      `**Solution**: ${solution}`,
      ``,
      `**Code Example:**`,
      '```typescript',
      codeExample,
      '```'
    ];
  }

  /**
   * Generate action plan section
   */
  static generateActionPlanSection(
    context: string,
    criticalCount: number,
    redundancyCount: number
  ): string[] {
    const reportLines = [
      ``,
      `## 🎯 Production Action Plan`,
      `### Optimization Strategy for ${context}:`
    ];
    
    if (criticalCount > 0) {
      reportLines.push(`- **CRITICAL**: Address ${criticalCount} critical issues immediately`);
    }

    if (redundancyCount > 0) {
      reportLines.push(`- **REDUNDANCY**: Eliminate ${redundancyCount} redundant patterns`);
      reportLines.push(`  - Implement request deduplication`);
      reportLines.push(`  - Add React Query for automatic caching`);
    }

    return reportLines;
  }

  /**
   * Generate React Query code examples
   */
  static generateReactQueryExample(pattern: string, queryKey?: string): string {
    const key = queryKey || 'endpoint-name';
    
    if (pattern === 'rapid-fire') {
      return `// Add debouncing
const debouncedFunction = useMemo(
  () => debounce(originalFunction, 300),
  [dependencies]
);

// Or optimize with useCallback
const optimizedCallback = useCallback(() => {
  // your logic here
}, [specificDependencies]); // Only include necessary deps`;
    }
    
    if (pattern === 'identical') {
      return `// Replace manual fetch
const { data, isLoading } = useQuery({
  queryKey: ['${key}'],
  queryFn: () => fetchData(),
  staleTime: 5 * 60 * 1000, // 5 minutes
});`;
    }
    
    if (pattern === 'burst') {
      return `// Check for multiple component instances
// or useEffect dependency issues
useEffect(() => {
  // your logic here
}, [specificDependency]); // Avoid empty deps if not needed`;
    }
    
    return `// Add request deduplication
const { data, isLoading } = useQuery({
  queryKey: ['${key}'],
  queryFn: () => fetchData(),
  staleTime: 2 * 60 * 1000, // 2 minutes for repeated calls
});

// Or debounce for user interactions
const debouncedAction = useMemo(
  () => debounce(action, 500),
  [dependency]
);`;
  }

  /**
   * Generate React Query implementation guide
   */
  static generateReactQueryImplementationGuide(): string[] {
    return [
      `### 📚 React Query Implementation Guide:`,
      `1. **Install dependencies** (if not already installed):`,
      '```bash',
      'pnpm add @tanstack/react-query',
      '```',
      ``,
      `2. **Common patterns to implement**:`,
      '```typescript',
      '// Replace manual fetch with useQuery',
      'const { data, isLoading, error } = useQuery({',
      '  queryKey: ["endpoint-name", userId],',
      '  queryFn: () => fetchData(userId),',
      '  staleTime: 5 * 60 * 1000, // 5 minutes',
      '});',
      '',
      '// Replace manual mutations with useMutation',
      'const mutation = useMutation({',
      '  mutationFn: updateData,',
      '  onSuccess: () => {',
      '    queryClient.invalidateQueries(["endpoint-name"]);',
      '  }',
      '});',
      '```'
    ];
  }
} 